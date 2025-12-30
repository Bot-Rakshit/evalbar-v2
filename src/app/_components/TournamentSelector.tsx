'use client'

import { useState, useEffect, useCallback } from 'react'
import { useEvalStore, TournamentData } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, RefreshCw, Radio, Clock } from 'lucide-react'

interface RoundInfo {
  id: string
  name: string
  slug: string
  ongoing?: boolean
  finished?: boolean
  startsAt?: number
}

interface TournamentInfo {
  tour: {
    id: string
    name: string
    slug: string
  }
  rounds: RoundInfo[]
}

type FilterType = 'all' | 'live' | 'upcoming'

export function TournamentSelector() {
  const [tournaments, setTournaments] = useState<TournamentInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('live')
  
  const setTournament = useEvalStore(state => state.setTournament)

  const fetchTournaments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('https://lichess.org/api/broadcast?nb=50')
      if (!res.ok) throw new Error('Failed to fetch tournaments')
      
      const text = await res.text()
      const lines = text.trim().split('\n')
      const parsed: TournamentInfo[] = []
      
      for (const line of lines) {
        try {
          if (line.trim()) {
            const data = JSON.parse(line)
            if (data.tour && data.rounds) {
              parsed.push(data)
            }
          }
        } catch {
          console.warn('Failed to parse tournament:', line)
        }
      }
      
      setTournaments(parsed)
    } catch (err) {
      setError('Failed to load tournaments. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  // Determine tournament status
  const getTournamentStatus = (tournament: TournamentInfo) => {
    const hasOngoingRound = tournament.rounds.some(r => r.ongoing)
    const allFinished = tournament.rounds.length > 0 && tournament.rounds.every(r => r.finished)
    const hasUpcomingRound = tournament.rounds.some(r => !r.ongoing && !r.finished)
    
    if (hasOngoingRound) {
      return 'live'
    } else if (allFinished) {
      return 'finished'
    } else if (hasUpcomingRound) {
      return 'upcoming'
    }
    return 'unknown'
  }

  // Filter tournaments based on selected filter
  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.tour.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    const status = getTournamentStatus(t)
    
    if (filter === 'all') return status !== 'finished'
    if (filter === 'live') return status === 'live'
    if (filter === 'upcoming') return status === 'upcoming'
    
    return true
  })

  const convertToTournamentData = (tournament: TournamentInfo): TournamentData => {
    return {
      id: tournament.tour.id,
      name: tournament.tour.name,
      slug: tournament.tour.slug,
      rounds: tournament.rounds.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        ongoing: r.ongoing,
        finished: r.finished,
      })),
    }
  }

  const handleSelectTournament = (tournament: TournamentInfo) => {
    const tournamentData = convertToTournamentData(tournament)
    // Prefer ongoing round, otherwise first non-finished round
    const ongoingRound = tournament.rounds.find(r => r.ongoing)
    const upcomingRound = tournament.rounds.find(r => !r.ongoing && !r.finished)
    const targetRound = ongoingRound || upcomingRound || tournament.rounds[0]
    
    if (targetRound) {
      setTournament(tournamentData, targetRound.id)
    }
  }

  const handleCustomUrl = () => {
    if (!customUrl) return
    
    // Try to extract round ID from various URL formats
    // Format: https://lichess.org/broadcast/tournament-slug/round-slug/roundId
    const match = customUrl.match(/broadcast\/[^\/]+\/[^\/]+\/([a-zA-Z0-9]+)/)
    if (match) {
      const roundId = match[1]
      setTournament(
        { id: roundId, name: 'Custom Broadcast', slug: 'custom', rounds: [] },
        roundId
      )
      return
    }
    
    // Try simple round ID
    const simpleMatch = customUrl.match(/([a-zA-Z0-9]{8})/)
    if (simpleMatch) {
      const roundId = simpleMatch[1]
      setTournament(
        { id: roundId, name: 'Custom Broadcast', slug: 'custom', rounds: [] },
        roundId
      )
      return
    }
    
    setError('Invalid broadcast URL format. Please paste a Lichess broadcast URL.')
  }

  const getStatusBadge = (tournament: TournamentInfo) => {
    const status = getTournamentStatus(tournament)
    const ongoingRound = tournament.rounds.find(r => r.ongoing)
    
    if (status === 'live') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-green-500">Live</span>
          {ongoingRound && (
            <span className="text-xs text-muted-foreground">({ongoingRound.name})</span>
          )}
        </div>
      )
    }
    
    if (status === 'upcoming') {
      const upcomingRound = tournament.rounds.find(r => !r.ongoing && !r.finished && r.startsAt)
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-500">Upcoming</span>
          {upcomingRound?.startsAt && (
            <span className="text-xs text-muted-foreground">
              ({new Date(upcomingRound.startsAt).toLocaleDateString()})
            </span>
          )}
        </div>
      )
    }
    
    return (
      <span className="text-sm text-gray-500">Finished</span>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Find Tournament
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter buttons */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'live' ? 'default' : 'outline'}
              onClick={() => setFilter('live')}
              className="flex-1"
              size="sm"
            >
              <Radio className="w-4 h-4 mr-1" />
              Live
            </Button>
            <Button
              variant={filter === 'upcoming' ? 'default' : 'outline'}
              onClick={() => setFilter('upcoming')}
              className="flex-1"
              size="sm"
            >
              <Clock className="w-4 h-4 mr-1" />
              Upcoming
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="flex-1"
              size="sm"
            >
              All
            </Button>
          </div>

          <div className="relative">
            <Input
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Or paste Lichess broadcast URL..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <Button onClick={handleCustomUrl}>
              Load
            </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={fetchTournaments}
            className="w-full"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Tournaments
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTournaments.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              {filter === 'live' 
                ? 'No live tournaments at the moment' 
                : filter === 'upcoming'
                  ? 'No upcoming tournaments found'
                  : 'No tournaments found'}
            </div>
          )}
          
          {filteredTournaments.map((tournament) => {
            const ongoingRound = tournament.rounds.find(r => r.ongoing)
            
            return (
              <Card 
                key={tournament.tour.id}
                className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                onClick={() => handleSelectTournament(tournament)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{tournament.tour.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tournament.rounds.length} round{tournament.rounds.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {getStatusBadge(tournament)}
                      {ongoingRound && (
                        <a
                          href={`https://lichess.org/broadcast/${tournament.tour.slug}/${ongoingRound.slug}/${ongoingRound.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-muted rounded-full"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
