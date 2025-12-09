import { useEffect, useState, useRef } from 'react'
import { cn, formatPlayerName, formatClock, getEvalBarWidth, formatEvaluation } from '@/lib/utils'
import type { GameData, CustomStyles } from '@/stores/evalStore'

interface EvalBarProps {
  game: GameData
  styles: CustomStyles
  onRemove?: () => void
  showRemoveButton?: boolean
}

export function EvalBar({ game, styles, onRemove, showRemoveButton = false }: EvalBarProps) {
  const [timePassed, setTimePassed] = useState(0)
  const [isBlundering, setIsBlundering] = useState(false)
  const prevEvalRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    if (prevEvalRef.current !== null && game.evaluation !== null) {
      const prevEval = prevEvalRef.current
      const evalDiff = Math.abs(game.evaluation - prevEval)
      if (evalDiff >= 2 && prevEval >= -4 && prevEval <= 4) {
        setIsBlundering(true)
        setTimeout(() => setIsBlundering(false), 3000)
      }
    }
    prevEvalRef.current = game.evaluation
  }, [game.evaluation])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    if (game.turn && !game.result) {
      setTimePassed(0)
      intervalRef.current = window.setInterval(() => {
        setTimePassed(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [game.turn, game.result])

  const whiteTime = game.turn === 'white' ? Math.max(0, game.whiteTime - timePassed) : game.whiteTime
  const blackTime = game.turn === 'black' ? Math.max(0, game.blackTime - timePassed) : game.blackTime
  const isWhiteLowTime = whiteTime <= 30
  const isBlackLowTime = blackTime <= 30

  return (
    <div
      className={cn(
        "relative flex flex-col p-1 rounded transition-all duration-300",
        isBlundering && "ring-2 ring-red-500"
      )}
      style={{
        backgroundColor: styles.evalContainerBg,
        border: `1px solid ${styles.evalContainerBorderColor}`,
      }}
    >
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full text-white text-[10px] flex items-center justify-center z-10"
        >
          ×
        </button>
      )}

      {/* Row 1: Player Names */}
      <div className="flex justify-between items-center mb-0.5">
        <span
          className="font-bold truncate text-[12px] leading-tight px-1"
          style={{ color: styles.whitePlayerNameColor, maxWidth: '45%' }}
        >
          {formatPlayerName(game.whitePlayer)}
        </span>
        <span
          className="font-bold truncate text-[12px] leading-tight px-1 text-right"
          style={{ color: styles.blackPlayerNameColor, maxWidth: '45%' }}
        >
          {formatPlayerName(game.blackPlayer)}
        </span>
      </div>

      {/* Row 2: Clocks + Move indicators */}
      {styles.showClocks && (
        <div className="flex justify-between items-center mb-0.5">
          <span
            className={cn("font-mono text-[10px] leading-none tabular-nums px-1", isWhiteLowTime && "text-red-500 font-bold")}
            style={{ color: isWhiteLowTime ? undefined : styles.whitePlayerNameColor }}
          >
            {formatClock(whiteTime)}
          </span>
          
          {/* Turn indicators + Move number */}
          <div className="flex items-center gap-1">
            <div
              className="w-0 h-0 border-y-[5px] border-y-transparent border-r-[7px]"
              style={{
                borderRightColor: styles.moveIndicatorColor,
                opacity: game.turn === 'white' ? 1 : 0.3,
              }}
            />
            
            {styles.showMoveNumber && (
              <span className="text-white text-[11px] font-bold min-w-[16px] text-center">
                {game.moveNumber || '-'}
              </span>
            )}
            
            <div
              className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px]"
              style={{
                borderLeftColor: styles.moveIndicatorColor,
                opacity: game.turn === 'black' ? 1 : 0.3,
              }}
            />
          </div>
          
          <span
            className={cn("font-mono text-[10px] leading-none tabular-nums px-1", isBlackLowTime && "text-red-500 font-bold")}
            style={{ color: isBlackLowTime ? undefined : styles.blackPlayerNameColor }}
          >
            {formatClock(blackTime)}
          </span>
        </div>
      )}

      {/* Row 3: Eval bar with eval value ON it */}
      <div
        className="w-full overflow-hidden relative flex items-center justify-center"
        style={{
          height: `${styles.barHeight}px`,
          borderRadius: `${styles.barBorderRadius}px`,
          backgroundColor: styles.blackBarColor,
        }}
      >
        {/* The moving white bar */}
        {!game.result && (
          <div
            className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
            style={{
              width: getEvalBarWidth(game.evaluation, game.result),
              backgroundColor: styles.whiteBarColor,
            }}
          />
        )}
        
        {/* Center line marker */}
        <div
          className="absolute top-0 bottom-0 w-px bg-black/40"
          style={{ left: '50%' }}
        />
        
        {/* Eval value displayed ON the bar */}
        <span 
          className="relative z-10 font-bold text-[13px] tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
          style={{ 
            color: game.result ? '#fff' : '#000',
            textShadow: '0 0 4px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,1)'
          }}
        >
          {game.result ? game.result : formatEvaluation(game.evaluation)}
        </span>
      </div>

      {/* Blunder badge */}
      {isBlundering && (
        <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 rounded animate-pulse">
          ??
        </div>
      )}
    </div>
  )
}
