import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPlayerName(name: string): string {
  if (!name) return ''
  
  const aliases: Record<string, string> = {
    'Praggnanandhaa': 'Pragg',
    'Rameshbabu Praggnanandhaa': 'Pragg',
    'Alireza Firouzja': 'Alireza',
    'Alireza Dharia': 'Alireza',
    'Ian Nepomniachtchi': 'Nepo',
    'Ding Liren': 'Ding',
    'Hikaru Nakamura': 'Hikaru',
    'Anish Giri': 'Giri',
    'Wesley So': 'Wesley',
    'Levon Aronian': 'Levon',
    'Maxime Vachier-Lagrave': 'MVL',
    'Fabiano Caruana': 'Fabiano',
    'Viswanathan Anand': 'Anand',
    'Arjun Erigaisi': 'Arjun',
    'Gukesh D': 'Gukesh',
    'Vidit Gujrathi': 'Vidit',
    'Praveen Balakrishnan': 'Praveen',
  }

  const lastName = name.split(/[,\s]+/).pop() || name
  return aliases[name] || lastName
}

export function formatClock(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function getEvalBarWidth(evaluation: number | null, result: string | null): string {
  if (result) return '0%'
  if (evaluation === null) return '50%'
  
  const clamped = Math.max(-10, Math.min(10, evaluation))
  const percent = 50 + (clamped * 5)
  return `${Math.max(5, Math.min(95, percent))}%`
}

export function formatEvaluation(evaluation: number | null): string {
  if (evaluation === null) return ''
  if (evaluation > 0) return `+${evaluation.toFixed(1)}`
  if (evaluation < 0) return evaluation.toFixed(1)
  return '0.0'
}

export function clockToSeconds(clock: string): number {
  const time = clock.split(':')
  const hours = Number(time[0])
  const minutes = Number(time[1])
  const seconds = Number(time[2])
  return (hours * 3600) + (minutes * 60) + seconds
}

export function decodeStateData(data: string): {
  tournamentId?: string
  roundId: string
  gameIDs: string[]
  customStyles?: Record<string, unknown>
  backgroundMode?: string
} | null {
  try {
    let decoded = data.replace(/-/g, '+').replace(/_/g, '/')
    while (decoded.length % 4) decoded += '='
    
    try {
      decoded = atob(decoded)
    } catch {
      decoded = atob(data)
    }

    if (decoded.includes('|') && !decoded.startsWith('{')) {
      const [roundId, gamesStr, bgChar] = decoded.split('|')
      return {
        roundId,
        gameIDs: gamesStr ? gamesStr.split(',').map(g => {
          const [w, b] = g.split('~')
          return `${w}-vs-${b}`
        }) : [],
        backgroundMode: bgChar === 'c' ? 'chroma' : bgChar === 't' ? 'transparent' : 'dark',
      }
    }

    const parsed = JSON.parse(decoded)
    return {
      tournamentId: parsed.tournamentId,
      roundId: parsed.roundId,
      gameIDs: parsed.gameIDs || [],
      customStyles: parsed.customStyles,
      backgroundMode: parsed.backgroundMode,
    }
  } catch {
    return null
  }
}

export function generateShareUrl(
  tournamentId: string,
  roundId: string,
  games: Array<{ whitePlayer: string; blackPlayer: string }>,
  backgroundMode: string,
  customStyles: Record<string, unknown>
): string {
  const gameStr = games.map(g => {
    const w = g.whitePlayer.split(/[,\s]+/).pop() || g.whitePlayer
    const b = g.blackPlayer.split(/[,\s]+/).pop() || g.blackPlayer
    return `${w}~${b}`
  }).join(',')
  
  const bgChar = backgroundMode === 'chroma' ? 'c' : backgroundMode === 'transparent' ? 't' : 'd'
  const shortData = `${roundId}|${gameStr}|${bgChar}`
  const encoded = btoa(shortData).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  
  return encoded
}
