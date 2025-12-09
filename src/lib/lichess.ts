import { makeFen } from 'chessops/fen'
import { PgnParser, startingPosition, walk } from 'chessops/pgn'
import { parseSan } from 'chessops/san'
import { clockToSeconds } from './utils'

export interface Tournament {
  tour: {
    id: string
    name: string
    slug: string
    description?: string
    url?: string
  }
  rounds: Round[]
  image?: string
}

export interface Round {
  id: string
  name: string
  slug: string
  ongoing?: boolean
  finished?: boolean
}

export interface GameData {
  whitePlayer: string
  blackPlayer: string
  evaluation: number | null
  lastFEN: string
  result: string | null
  whiteTime: number
  blackTime: number
  turn: 'white' | 'black' | ''
  moveNumber: number
}

export async function fetchBroadcasts(limit = 50): Promise<Tournament[]> {
  const res = await fetch(`https://lichess.org/api/broadcast?nb=${limit}`)
  if (!res.ok) throw new Error(`Failed to fetch broadcasts: ${res.status}`)
  
  const text = await res.text()
  const lines = text.trim().split('\n')
  const tournaments: Tournament[] = []
  
  for (const line of lines) {
    try {
      if (line.trim()) {
        tournaments.push(JSON.parse(line))
      }
    } catch (e) {
      console.warn('Failed to parse broadcast line:', e)
    }
  }
  
  return tournaments
}

export async function fetchTournament(tournamentId: string): Promise<Tournament | null> {
  const res = await fetch(`https://lichess.org/api/broadcast/${tournamentId}`, {
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) return null
  return res.json()
}

export async function fetchPGN(roundId: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(`https://lichess.org/broadcast/-/-/${roundId}.pgn`, {
    signal,
    cache: 'no-store'
  })
  if (!res.ok) throw new Error(`Failed to fetch PGN: ${res.status}`)
  return res.text()
}

export async function fetchEvaluation(fen: string): Promise<{ evaluation: number }> {
  const encodedFen = encodeURIComponent(fen)
  const res = await fetch(`https://eval.plc.hadron43.in/eval-bars/?fen=${encodedFen}`)
  if (!res.ok) throw new Error(`Failed to fetch evaluation: ${res.status}`)
  return res.json()
}

export function parseGames(pgnData: string): string[] {
  const games = pgnData.split('\n\n\n').filter(Boolean)
  const gameNames: string[] = []
  
  for (const game of games) {
    const whiteMatch = game.match(/\[White "(.+?)"\]/)
    const blackMatch = game.match(/\[Black "(.+?)"\]/)
    if (whiteMatch && blackMatch) {
      const name = `${whiteMatch[1]} - ${blackMatch[1]}`
      if (!gameNames.includes(name)) {
        gameNames.push(name)
      }
    }
  }
  
  return gameNames
}

export function extractGameData(pgnData: string, whitePlayer: string, blackPlayer: string): Partial<GameData> | null {
  const games = pgnData.split('\n\n\n')
  const specificGame = games.reverse().find((game) => {
    const whiteMatch = game.match(/\[White "(.+?)"\]/)
    const blackMatch = game.match(/\[Black "(.+?)"\]/)
    return whiteMatch?.[1] === whitePlayer && blackMatch?.[1] === blackPlayer
  })

  if (!specificGame) return null

  const clocks = specificGame.match(/\[%clk (.+?)\]/g)
  const clocksList = clocks ? clocks.map(c => c.split(' ')[1].split(']')[0]) : []

  let gameResult: string | null = null
  const resultMatch = specificGame.match(/(1-0|0-1|1\/2-1\/2)$/)
  if (resultMatch) {
    gameResult = resultMatch[1] === '1/2-1/2' ? 'Draw' : resultMatch[1]
  }

  try {
    let finalFen: string | null = null
    const parser = new PgnParser((parsedGame) => {
      startingPosition(parsedGame.headers).unwrap(
        (pos) => {
          walk(parsedGame.moves, pos, (position, node) => {
            const move = parseSan(position, node.san)
            if (move) {
              position.play(move)
              finalFen = makeFen(position.toSetup())
              return true
            }
            return false
          })
        },
        (err) => console.error('Position error:', err)
      )
    })
    parser.parse(specificGame)

    let whiteTime = 0, blackTime = 0, turn: 'white' | 'black' | '' = ''
    if (clocksList.length >= 2) {
      if (clocksList.length % 2) {
        whiteTime = clockToSeconds(clocksList[clocksList.length - 1])
        blackTime = clockToSeconds(clocksList[clocksList.length - 2])
        turn = 'black'
      } else {
        blackTime = clockToSeconds(clocksList[clocksList.length - 1])
        whiteTime = clockToSeconds(clocksList[clocksList.length - 2])
        turn = 'white'
      }
    }

    return {
      lastFEN: finalFen || '',
      result: gameResult,
      whiteTime,
      blackTime,
      turn,
      moveNumber: Math.floor(clocksList.length / 2) + 1,
    }
  } catch (error) {
    console.error('Error parsing game:', error)
    return null
  }
}

export class PGNPoller {
  private roundId: string
  private intervalId: number | null = null
  private abortController: AbortController | null = null
  private onUpdate: (pgn: string) => void

  constructor(roundId: string, onUpdate: (pgn: string) => void) {
    this.roundId = roundId
    this.onUpdate = onUpdate
  }

  start(intervalMs = 3000) {
    this.abortController = new AbortController()
    
    const poll = async () => {
      try {
        const pgn = await fetchPGN(this.roundId, this.abortController?.signal)
        this.onUpdate(pgn)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Polling error:', error)
        }
      }
    }

    poll()
    this.intervalId = window.setInterval(poll, intervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}
