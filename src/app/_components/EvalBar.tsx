'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { cn, formatPlayerName, formatClock, getEvalBarWidth, formatEvaluation } from '@/lib/utils'
import type { GameData, CustomStyles } from '@/lib/store'

interface EvalBarProps {
  game: GameData
  styles: CustomStyles
  onRemove?: () => void
  showRemoveButton?: boolean
  compact?: boolean
}

export function EvalBar({ game, styles, onRemove, showRemoveButton = false, compact = false }: EvalBarProps) {
  const [timePassed, setTimePassed] = useState(0)
  const [isBlundering, setIsBlundering] = useState(false)
  const [showResultFlash, setShowResultFlash] = useState(false)
  const prevEvalRef = useRef<number | null>(null)
  const prevResultRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkZWTi4J8eX6Fjo+NiIF4c3V9h46SkI2GfXh1eoKLkZOQi4N7dnR5goySlJCKgnp0dHmDjZSUkImAeHN0eYONk5KPiH95dHZ7hI6TkY2FfHd0eH2Gj5KQjIR7d3V5f4iRk5GMg3t2dXmAiZOTkYuCenV1eYGKk5ORioF5dXV5gomTk5GKgHl1dXqCipOTkYp/eHV1eoKLk5ORiX54dXZ6g4yTkpCIf3h1dnqDjJOSkIh+eHV2eoSMk5KQh3')
  }, [])

  // Blunder detection
  const handleBlunderCheck = useCallback(() => {
    if (prevEvalRef.current !== null && game.evaluation !== null) {
      const prevEval = prevEvalRef.current
      const evalDiff = Math.abs(game.evaluation - prevEval)
      if (evalDiff >= 2 && prevEval >= -4 && prevEval <= 4) {
        setIsBlundering(true)
        audioRef.current?.play().catch(() => {})
        setTimeout(() => setIsBlundering(false), 5000)
      }
    }
    prevEvalRef.current = game.evaluation
  }, [game.evaluation])

  useEffect(() => {
    handleBlunderCheck()
  }, [handleBlunderCheck])

  // Result detection
  const handleResultCheck = useCallback(() => {
    if (prevResultRef.current === null && game.result !== null) {
      setShowResultFlash(true)
      audioRef.current?.play().catch(() => {})
      setTimeout(() => setShowResultFlash(false), 5000)
    }
    prevResultRef.current = game.result
  }, [game.result])

  useEffect(() => {
    handleResultCheck()
  }, [handleResultCheck])

  // Clock countdown
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (game.turn && !game.result) {
      setTimePassed(0)
      intervalRef.current = setInterval(() => {
        setTimePassed(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [game.turn, game.result, game.whiteTime, game.blackTime])

  const whiteTime = game.turn === 'white' ? Math.max(0, game.whiteTime - timePassed) : game.whiteTime
  const blackTime = game.turn === 'black' ? Math.max(0, game.blackTime - timePassed) : game.blackTime
  const isWhiteLowTime = whiteTime <= 30
  const isBlackLowTime = blackTime <= 30

  const hasResult = game.result !== null

  const getResultDisplay = () => {
    if (!game.result) return null
    if (game.result === '1-0') return { text: '1-0', color: '#ffffff', label: 'White wins' }
    if (game.result === '0-1') return { text: '0-1', color: '#E79D29', label: 'Black wins' }
    if (game.result === 'Draw' || game.result === '1/2-1/2') return { text: '½-½', color: '#888888', label: 'Draw' }
    return { text: game.result, color: '#ffffff', label: '' }
  }

  const resultInfo = getResultDisplay()
  const barHeight = compact ? Math.max(8, styles.barHeight - 4) : styles.barHeight
  const fontSize = compact ? Math.max(10, styles.fontSize - 2) : styles.fontSize

  return (
    <div
      className={cn(
        "relative flex flex-col p-1.5 rounded transition-all duration-300",
        isBlundering && "ring-2 ring-red-500 animate-pulse",
        showResultFlash && "ring-2 ring-yellow-400 animate-pulse"
      )}
      style={{
        backgroundColor: styles.evalContainerBg,
        border: `1px solid ${styles.evalContainerBorderColor}`,
        minWidth: compact ? '120px' : '180px',
        maxWidth: compact ? '200px' : '280px',
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

      <div className="flex justify-between items-center mb-0.5">
        <span
          className="font-bold truncate text-xs leading-tight px-1"
          style={{ 
            color: styles.whitePlayerNameColor, 
            maxWidth: '45%',
            fontSize: `${fontSize}px`
          }}
        >
          {formatPlayerName(game.whitePlayer)}
        </span>
        <span
          className="font-bold truncate text-xs leading-tight px-1 text-right"
          style={{ 
            color: styles.blackPlayerNameColor, 
            maxWidth: '45%',
            fontSize: `${fontSize}px`
          }}
        >
          {formatPlayerName(game.blackPlayer)}
        </span>
      </div>

      {styles.showClocks && !hasResult && (
        <div className="flex justify-between items-center mb-0.5">
          <span
            className={cn("font-mono text-[10px] leading-none tabular-nums px-1", isWhiteLowTime && "text-red-500 font-bold")}
            style={{ 
              color: isWhiteLowTime ? undefined : styles.whitePlayerNameColor,
              fontSize: `${fontSize - 2}px`
            }}
          >
            {formatClock(whiteTime)}
          </span>
          
          <div className="flex items-center gap-1">
            <div
              className="w-0 h-0 border-y-[4px] border-y-transparent border-r-[6px]"
              style={{
                borderRightColor: styles.moveIndicatorColor,
                opacity: game.turn === 'white' ? 1 : 0.3,
              }}
            />
            
            {styles.showMoveNumber && (
              <span 
                className="text-white text-[10px] font-bold min-w-[14px] text-center"
                style={{ fontSize: `${fontSize - 2}px` }}
              >
                {game.moveNumber || '-'}
              </span>
            )}
            
            <div
              className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px]"
              style={{
                borderLeftColor: styles.moveIndicatorColor,
                opacity: game.turn === 'black' ? 1 : 0.3,
              }}
            />
          </div>
          
          <span
            className={cn("font-mono text-[10px] leading-none tabular-nums px-1", isBlackLowTime && "text-red-500 font-bold")}
            style={{ 
              color: isBlackLowTime ? undefined : styles.blackPlayerNameColor,
              fontSize: `${fontSize - 2}px`
            }}
          >
            {formatClock(blackTime)}
          </span>
        </div>
      )}

      {hasResult ? (
        <div 
          className="flex items-center justify-center py-1 rounded"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
        >
          <span 
            className="font-bold tracking-wider"
            style={{ 
              color: resultInfo?.color,
              fontSize: `${fontSize + 2}px`
            }}
          >
            {resultInfo?.text}
          </span>
        </div>
      ) : (
        <div
          className="w-full overflow-hidden relative flex items-center justify-center"
          style={{
            height: `${barHeight}px`,
            borderRadius: `${styles.barBorderRadius}px`,
            backgroundColor: styles.blackBarColor,
          }}
        >
          <div
            className="absolute left-0 top-0 h-full transition-all duration-700 ease-out"
            style={{
              width: getEvalBarWidth(game.evaluation, game.result),
              backgroundColor: styles.whiteBarColor,
            }}
          />
          
          <div
            className="absolute top-0 bottom-0 w-px bg-black/40"
            style={{ left: '50%' }}
          />
          
          <span 
            className="relative z-10 font-bold tabular-nums"
            style={{ 
              color: '#000',
              fontSize: `${fontSize}px`,
              textShadow: '0 0 4px rgba(255,255,255,0.9), 0 0 2px rgba(255,255,255,1)'
            }}
          >
            {formatEvaluation(game.evaluation)}
          </span>
        </div>
      )}

      {isBlundering && (
        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded animate-bounce">
          ??
        </div>
      )}
    </div>
  )
}
