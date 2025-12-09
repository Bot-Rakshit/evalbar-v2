import { useEvalStore } from '@/stores/evalStore'
import { EvalBar } from './EvalBar'
import { cn } from '@/lib/utils'

interface EvalBarsDisplayProps {
  showRemoveButtons?: boolean
}

export function EvalBarsDisplay({ showRemoveButtons = false }: EvalBarsDisplayProps) {
  const { games, customStyles, removeGame, isBroadcastMode } = useEvalStore()

  if (games.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px] text-muted-foreground">
        No games selected. Add games from the selector above.
      </div>
    )
  }

  return (
    <div
      className={cn(
        "w-full h-full p-2",
        isBroadcastMode && "flex items-end"
      )}
    >
      <div
        className="w-full grid gap-2"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, 200px), 1fr))`,
        }}
      >
        {games.map((game, index) => (
          <EvalBar
            key={`${game.whitePlayer}-${game.blackPlayer}`}
            game={game}
            styles={customStyles}
            showRemoveButton={showRemoveButtons}
            onRemove={() => removeGame(index)}
          />
        ))}
      </div>
    </div>
  )
}
