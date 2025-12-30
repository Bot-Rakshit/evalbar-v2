'use client'

import { useState } from 'react'
import { useEvalStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Link, Copy, Check } from 'lucide-react'

interface GameSelectorProps {
  onBack?: () => void
}

export function GameSelector({ onBack }: GameSelectorProps) {
  const availableGames = useEvalStore(state => state.availableGames)
  const games = useEvalStore(state => state.games)
  const addGame = useEvalStore(state => state.addGame)
  const removeGame = useEvalStore(state => state.removeGame)
  const clearGames = useEvalStore(state => state.clearGames)
  const generateShareUrl = useEvalStore(state => state.generateShareUrl)
  const backgroundMode = useEvalStore(state => state.backgroundMode)
  const customStyles = useEvalStore(state => state.customStyles)
  
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)

  const toggleGame = (game: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(game)) {
      newSelected.delete(game)
    } else {
      newSelected.add(game)
    }
    setSelectedGames(newSelected)
  }

  const addSelectedGames = () => {
    selectedGames.forEach(game => {
      const [whitePlayer, blackPlayer] = game.split(' - ')
      if (whitePlayer && blackPlayer) {
        addGame(whitePlayer, blackPlayer)
      }
    })
    setSelectedGames(new Set())
  }

  const copyShareUrl = async () => {
    const url = generateShareUrl()
    if (url) {
      const fullUrl = `${window.location.origin}/b/${url}`
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <h2 className="text-xl font-semibold flex-1 text-center">
          Select Games ({games.length} selected)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Available Games ({availableGames.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
              {availableGames.map((game) => (
                <button
                  key={game}
                  onClick={() => toggleGame(game)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    selectedGames.has(game)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {game}
                </button>
              ))}
              {availableGames.length === 0 && (
                <p className="text-sm text-muted-foreground">No games available yet</p>
              )}
            </div>
            
            {selectedGames.size > 0 && (
              <Button onClick={addSelectedGames} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add {selectedGames.size} Game{selectedGames.size !== 1 ? 's' : ''}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Display Queue ({games.length})</CardTitle>
            {games.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearGames}>
                Clear All
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {games.map((game, index) => (
                <div
                  key={`${game.whitePlayer}-${game.blackPlayer}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted"
                >
                  <span className="text-sm">
                    {game.whitePlayer} vs {game.blackPlayer}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGame(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    ×
                  </Button>
                </div>
              ))}
              {games.length === 0 && (
                <p className="text-sm text-muted-foreground">No games selected</p>
              )}
            </div>

            {games.length > 0 && (
              <Button onClick={copyShareUrl} className="w-full mt-4" variant="secondary">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Broadcast Link
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
