import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEvalStore } from '@/stores/evalStore'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Copy, Check, ArrowLeft } from 'lucide-react'

interface GameSelectorProps {
  onBack: () => void
}

export function GameSelector({ onBack }: GameSelectorProps) {
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  const {
    currentTournament,
    currentRoundId,
    availableGames,
    games,
    addGame,
    removeGame,
    clearGames,
    generateShareUrl,
    setRoundId,
  } = useEvalStore()

  const handleToggleGame = (game: string) => {
    setSelectedGames(prev =>
      prev.includes(game)
        ? prev.filter(g => g !== game)
        : [...prev, game]
    )
  }

  const handleAddSelected = () => {
    selectedGames.forEach(game => {
      const [white, black] = game.split(' - ')
      if (white && black) {
        addGame(white, black)
      }
    })
    setSelectedGames([])
  }

  const handleAddAll = () => {
    availableGames.forEach(game => {
      const [white, black] = game.split(' - ')
      if (white && black) {
        addGame(white, black)
      }
    })
  }

  const handleCopyLink = () => {
    if (games.length === 0) {
      alert('Please add at least one game to the queue first!')
      return
    }
    const shareData = generateShareUrl()
    if (shareData) {
      const url = `${window.location.origin}/broadcast/${shareData}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const rounds = currentTournament?.rounds || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{currentTournament?.tour.name}</h2>
            <p className="text-muted-foreground text-sm">Select games to display</p>
          </div>
        </div>
        <Button 
          onClick={handleCopyLink} 
          variant={games.length > 0 ? "default" : "secondary"}
          className={games.length > 0 ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : games.length > 0 ? `Copy OBS Link (${games.length} games)` : 'Add games first'}
        </Button>
      </div>

      {/* Round selector */}
      {rounds.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {rounds.map(round => (
            <Button
              key={round.id}
              variant={round.id === currentRoundId ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRoundId(round.id)}
              className={cn(round.ongoing && 'ring-2 ring-red-500')}
            >
              {round.name}
              {round.ongoing && <span className="ml-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Games */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Available Games
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddSelected}
                  disabled={selectedGames.length === 0}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Selected
                </Button>
                <Button size="sm" onClick={handleAddAll}>
                  Add All
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableGames.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Loading games...
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
                {availableGames.map((game) => {
                  const isSelected = selectedGames.includes(game)
                  const isAdded = games.some(g => 
                    `${g.whitePlayer} - ${g.blackPlayer}` === game
                  )
                  
                  return (
                    <Button
                      key={game}
                      variant={isSelected ? 'default' : isAdded ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => !isAdded && handleToggleGame(game)}
                      disabled={isAdded}
                      className={cn(
                        'transition-all',
                        isSelected && 'ring-2 ring-primary'
                      )}
                    >
                      {game}
                      {isAdded && <Check className="w-3 h-3 ml-1" />}
                    </Button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected Games */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              Display Queue ({games.length})
              {games.length > 0 && (
                <Button size="sm" variant="destructive" onClick={clearGames}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {games.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No games selected. Click on games to add them.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {games.map((game, index) => (
                  <div
                    key={`${game.whitePlayer}-${game.blackPlayer}`}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-medium">{game.whitePlayer}</span>
                      <span className="text-muted-foreground mx-2">vs</span>
                      <span className="font-medium">{game.blackPlayer}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {game.evaluation !== null && (
                        <span className={cn(
                          'text-sm font-mono',
                          game.evaluation > 0 ? 'text-green-500' : game.evaluation < 0 ? 'text-red-500' : ''
                        )}>
                          {game.evaluation > 0 ? '+' : ''}{game.evaluation?.toFixed(1)}
                        </span>
                      )}
                      {game.result && (
                        <span className="text-sm font-bold">{game.result}</span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeGame(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
