import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fetchBroadcasts } from '@/lib/lichess'
import type { Tournament } from '@/lib/lichess'
import { useEvalStore } from '@/stores/evalStore'
import { Search, Radio, ExternalLink } from 'lucide-react'

export function TournamentSelector() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const setTournament = useEvalStore(state => state.setTournament)

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchBroadcasts(50)
      const ongoing = data.filter(t => 
        t.rounds?.some(r => r.ongoing)
      )
      setTournaments(ongoing)
      setFilteredTournaments(ongoing)
    } catch (err) {
      setError('Failed to load tournaments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const term = searchTerm.toLowerCase()
    const filtered = tournaments.filter(t =>
      t.tour.name.toLowerCase().includes(term)
    )
    setFilteredTournaments(filtered)
  }

  const handleSelectTournament = (tournament: Tournament) => {
    const ongoingRound = tournament.rounds?.find(r => r.ongoing) || tournament.rounds?.[0]
    if (ongoingRound) {
      setTournament(tournament, ongoingRound.id)
    }
  }

  const handleCustomUrl = () => {
    if (!customUrl) return
    const parts = customUrl.split('/')
    const id = parts[parts.length - 1] || parts[parts.length - 2]
    if (id) {
      const fakeTournament: Tournament = {
        tour: { id, name: 'Custom Broadcast', slug: id },
        rounds: [{ id, name: 'Round', slug: id, ongoing: true }]
      }
      setTournament(fakeTournament, id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primary mb-2">Live Broadcasts</h1>
        <p className="text-muted-foreground">Select a tournament to display evaluation bars</p>
      </div>

      {/* Search and Custom URL */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Paste Lichess broadcast URL..."
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
          <Button onClick={handleCustomUrl}>Go</Button>
        </div>
      </div>

      {error && (
        <div className="text-center text-destructive p-4">{error}</div>
      )}

      {filteredTournaments.length === 0 && !loading && (
        <div className="text-center text-muted-foreground p-8">
          No live broadcasts found. Try a custom URL or check back later.
        </div>
      )}

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTournaments.map((tournament) => {
          const ongoingRound = tournament.rounds?.find(r => r.ongoing)
          
          return (
            <Card
              key={tournament.tour.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleSelectTournament(tournament)}
            >
              {tournament.image && (
                <img
                  src={tournament.image}
                  alt={tournament.tour.name}
                  className="w-full h-32 object-cover rounded-t-xl"
                />
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {ongoingRound && (
                    <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                  )}
                  {tournament.tour.name}
                </CardTitle>
                {tournament.tour.description && (
                  <CardDescription className="line-clamp-2">
                    {tournament.tour.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {tournament.rounds?.length || 0} rounds
                  </span>
                  {tournament.tour.url && (
                    <a
                      href={tournament.tour.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-3 h-3" />
                      Lichess
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
