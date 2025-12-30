'use client'

import { useEvalStore } from '@/lib/store'
import { EvalBar } from './EvalBar'

interface EvalBarsDisplayProps {
  showRemoveButtons?: boolean
  compact?: boolean
}

export function EvalBarsDisplay({ showRemoveButtons = false, compact = false }: EvalBarsDisplayProps) {
  const games = useEvalStore(state => state.games)
  const customStyles = useEvalStore(state => state.customStyles)
  const removeGame = useEvalStore(state => state.removeGame)
  const columns = useEvalStore(state => state.columns)

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        No games selected. Select games from the Games tab.
      </div>
    )
  }

  return (
    <div 
      className="w-full grid gap-2"
      style={{
        gridTemplateColumns: `repeat(min(${columns}, ${games.length}), 1fr)`,
      }}
    >
      {games.map((game, index) => (
        <EvalBar
          key={`${game.whitePlayer}-${game.blackPlayer}`}
          game={game}
          styles={customStyles}
          showRemoveButton={showRemoveButtons}
          onRemove={() => showRemoveButtons && removeGame(index)}
          compact={compact}
        />
      ))}
    </div>
  )
}
