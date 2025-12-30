import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { decodeStateData } from './utils'
import { parsePgn, startingPosition, type PgnNodeData } from 'chessops/pgn'
import { parseSan } from 'chessops/san'
import { makeFen } from 'chessops/fen'

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

export interface TournamentData {
  id: string
  name: string
  slug: string
  rounds: Array<{
    id: string
    name: string
    slug: string
    ongoing?: boolean
    finished?: boolean
  }>
}

export interface CustomStyles {
  evalContainerBg: string
  blackBarColor: string
  whiteBarColor: string
  whitePlayerColor: string
  blackPlayerColor: string
  whitePlayerNameColor: string
  blackPlayerNameColor: string
  evalContainerBorderColor: string
  moveIndicatorColor: string
  barHeight: number
  barBorderRadius: number
  fontSize: number
  showClocks: boolean
  showMoveNumber: boolean
}

export const defaultStyles: CustomStyles = {
  evalContainerBg: '#1a1a2e',
  blackBarColor: '#E79D29',
  whiteBarColor: '#ffffff',
  whitePlayerColor: 'transparent',
  blackPlayerColor: 'transparent',
  whitePlayerNameColor: '#ffffff',
  blackPlayerNameColor: '#E79D29',
  evalContainerBorderColor: '#3a3a5e',
  moveIndicatorColor: '#FFA500',
  barHeight: 14,
  barBorderRadius: 4,
  fontSize: 14,
  showClocks: true,
  showMoveNumber: true,
}

interface LichessGame {
  name: string
  fen?: string
  status?: string
  lastMove?: string
  players?: Array<{
    name: string
    clock?: number
    rating?: number
  }>
}

interface EvalStore {
  currentTournament: TournamentData | null
  currentRoundId: string | null
  availableGames: string[]
  games: GameData[]
  customStyles: CustomStyles
  isBroadcastMode: boolean
  backgroundMode: 'chroma' | 'transparent' | 'dark'
  columns: number
  pollingInterval: ReturnType<typeof setInterval> | null
  streamReader: ReadableStreamDefaultReader<Uint8Array> | null
  
  setTournament: (tournament: TournamentData, roundId: string) => void
  setRoundId: (roundId: string) => void
  addGame: (whitePlayer: string, blackPlayer: string) => void
  removeGame: (index: number) => void
  clearGames: () => void
  setCustomStyles: (styles: Partial<CustomStyles>) => void
  resetStyles: () => void
  setBroadcastMode: (mode: boolean) => void
  setBackgroundMode: (mode: 'chroma' | 'transparent' | 'dark') => void
  setColumns: (cols: number) => void
  startPolling: () => void
  stopPolling: () => void
  loadFromUrl: (data: string) => Promise<boolean>
  generateShareUrl: () => string
}

export const useEvalStore = create<EvalStore>()(
  persist(
    (set, get) => ({
      currentTournament: null,
      currentRoundId: null,
      availableGames: [],
      games: [],
      customStyles: defaultStyles,
      isBroadcastMode: false,
      backgroundMode: 'chroma',
      columns: 6,
      pollingInterval: null,
      streamReader: null,

      setTournament: (tournament, roundId) => {
        get().stopPolling()
        set({
          currentTournament: tournament,
          currentRoundId: roundId,
          games: [],
          availableGames: [],
          isBroadcastMode: false,
        })
        get().startPolling()
      },

      setRoundId: (roundId) => {
        get().stopPolling()
        set({ currentRoundId: roundId, games: [], availableGames: [] })
        get().startPolling()
      },

      addGame: (whitePlayer, blackPlayer) => {
        const { games } = get()
        if (games.some(g => g.whitePlayer === whitePlayer && g.blackPlayer === blackPlayer)) {
          return
        }

        const newGame: GameData = {
          whitePlayer,
          blackPlayer,
          evaluation: null,
          lastFEN: '',
          result: null,
          whiteTime: 0,
          blackTime: 0,
          turn: '',
          moveNumber: 0,
        }

        set({ games: [...games, newGame] })
      },

      removeGame: (index) => {
        set({ games: get().games.filter((_, i) => i !== index) })
      },

      clearGames: () => {
        set({ games: [] })
      },

      setCustomStyles: (styles) => {
        set({ customStyles: { ...get().customStyles, ...styles } })
      },

      resetStyles: () => {
        set({ customStyles: defaultStyles })
      },

      setBroadcastMode: (mode) => {
        set({ isBroadcastMode: mode })
      },

      setBackgroundMode: (mode) => {
        set({ backgroundMode: mode })
      },

      setColumns: (cols) => {
        set({ columns: cols })
      },

      startPolling: () => {
        const { currentRoundId, pollingInterval } = get()
        if (!currentRoundId) return
        
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }

        // Start streaming connection
        startStream(currentRoundId, get, set)
      },

      stopPolling: () => {
        const { pollingInterval, streamReader } = get()
        if (pollingInterval) {
          clearInterval(pollingInterval)
        }
        if (streamReader) {
          streamReader.cancel().catch(() => {})
        }
        set({ pollingInterval: null, streamReader: null })
      },

      loadFromUrl: async (data) => {
        const decoded = decodeStateData(data)
        if (!decoded || !decoded.roundId) {
          return false
        }

        const customStylesFromUrl = decoded.customStyles 
          ? { ...defaultStyles, ...decoded.customStyles } as CustomStyles
          : defaultStyles

        set({
          currentTournament: decoded.tournamentId
            ? { id: decoded.tournamentId, name: 'Broadcast', slug: decoded.tournamentId, rounds: [] }
            : { id: decoded.roundId, name: 'Broadcast', slug: decoded.roundId, rounds: [] },
          currentRoundId: decoded.roundId,
          customStyles: customStylesFromUrl,
          isBroadcastMode: true,
          backgroundMode: (decoded.backgroundMode as 'chroma' | 'transparent' | 'dark') || 'chroma',
          games: [],
          availableGames: [],
        })

        get().startPolling()

        // Add games after data is loaded
        if (decoded.gameIDs && decoded.gameIDs.length > 0) {
          setTimeout(() => {
            const { availableGames } = get()
            decoded.gameIDs.forEach(gameId => {
              const [white, black] = gameId.split('-vs-')
              if (white && black) {
                const match = availableGames.find(g => {
                  const lower = g.toLowerCase()
                  return lower.includes(white.toLowerCase()) && lower.includes(black.toLowerCase())
                })
                if (match) {
                  const [fullWhite, fullBlack] = match.split(' - ')
                  get().addGame(fullWhite, fullBlack)
                } else {
                  get().addGame(white, black)
                }
              }
            })
          }, 2000)
        }

        return true
      },

      generateShareUrl: () => {
        const { currentTournament, currentRoundId, games, backgroundMode } = get()
        if (!currentTournament || !currentRoundId) return ''
        
        const gameStr = games.map(g => {
          const w = g.whitePlayer.split(/[,\s]+/).pop() || g.whitePlayer
          const b = g.blackPlayer.split(/[,\s]+/).pop() || g.blackPlayer
          return `${w}~${b}`
        }).join(',')
        
        const bgChar = backgroundMode === 'chroma' ? 'c' : backgroundMode === 'transparent' ? 't' : 'd'
        const shortData = `${currentRoundId}|${gameStr}|${bgChar}`
        const encoded = btoa(shortData).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
        
        return encoded
      },
    }),
    {
      name: 'eval-bar-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        customStyles: state.customStyles,
        columns: state.columns,
        backgroundMode: state.backgroundMode,
      }),
    }
  )
)

// Start streaming from Lichess
async function startStream(
  roundId: string,
  get: () => EvalStore,
  set: (partial: Partial<EvalStore>) => void,
  isNewRound: boolean = true
) {
  // Reset the games map when starting a new round
  if (isNewRound) {
    allGamesMap = new Map<string, string>()
  }
  
  const streamUrl = `https://lichess.org/api/stream/broadcast/round/${roundId}.pgn`
  
  try {
    const response = await fetch(streamUrl)
    
    if (!response.ok) {
      console.log(`Stream returned ${response.status}, falling back to polling`)
      startPollingFallback(roundId, get, set)
      return
    }

    if (!response.body) {
      console.log('No response body, falling back to polling')
      startPollingFallback(roundId, get, set)
      return
    }

    const reader = response.body.getReader()
    set({ streamReader: reader })
    
    let buffer = ''
    const decoder = new TextDecoder()
    let isFirstChunk = true
    
    const processStream = async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            // Process any remaining data in buffer
            if (buffer.trim()) {
              processPgnData(buffer, get, set, false)
            }
            console.log('Stream ended, restarting...')
            setTimeout(() => startStream(roundId, get, set, false), 1000)
            return
          }
          
          buffer += decoder.decode(value, { stream: true })
          
          // Process complete PGN games (separated by double newlines)
          const games = buffer.split('\n\n\n')
          
          // Keep the last incomplete game in the buffer
          if (games.length > 1) {
            buffer = games.pop() || ''
            
            // Process all complete games
            const pgnText = games.join('\n\n\n')
            if (pgnText.trim()) {
              processPgnData(pgnText, get, set, isFirstChunk)
              isFirstChunk = false
            }
          }
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Stream error:', error)
          setTimeout(() => startStream(roundId, get, set, false), 3000)
        }
      }
    }
    
    processStream()
    
  } catch (error) {
    console.error('Failed to start stream:', error)
    startPollingFallback(roundId, get, set)
  }
}

// Fallback to polling JSON API
function startPollingFallback(
  roundId: string,
  get: () => EvalStore,
  set: (partial: Partial<EvalStore>) => void
) {
  console.log('Starting JSON API polling fallback')
  
  const poll = async () => {
    try {
      const res = await fetch(`/api/broadcast?roundId=${roundId}`)
      if (!res.ok) return
      
      const data = await res.json()
      if (data.games && Array.isArray(data.games)) {
        processJsonData(data.games, get, set)
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }
  
  poll()
  const interval = setInterval(poll, 5000)
  set({ pollingInterval: interval })
}

// Module-level map to accumulate all games from stream
let allGamesMap = new Map<string, string>()

// Process PGN data from stream
function processPgnData(
  pgnText: string,
  get: () => EvalStore,
  set: (partial: Partial<EvalStore>) => void,
  isNewRound: boolean = false
) {
  // Reset map if this is a new round
  if (isNewRound) {
    allGamesMap = new Map<string, string>()
  }
  
  const pgnGames = pgnText.split('\n\n\n').filter(g => g.trim())
  
  for (const pgn of pgnGames) {
    const whiteMatch = pgn.match(/\[White "(.+?)"\]/)
    const blackMatch = pgn.match(/\[Black "(.+?)"\]/)
    if (whiteMatch && blackMatch) {
      const name = `${whiteMatch[1]} - ${blackMatch[1]}`
      // Always update with latest PGN for this game
      allGamesMap.set(name, pgn)
    }
  }
  
  // Get all game names from accumulated map
  const gameNames = Array.from(allGamesMap.keys())
  
  // Only update if we have games
  if (gameNames.length > 0) {
    set({ availableGames: gameNames })
  }
  
  // Update selected games with latest data
  const currentGames = get().games
  currentGames.forEach(async (game, index) => {
    const gameName = `${game.whitePlayer} - ${game.blackPlayer}`
    const pgn = allGamesMap.get(gameName)
    if (!pgn) return
    
    const gameData = extractGameDataFromPgn(pgn)
    if (gameData && gameData.lastFEN && gameData.lastFEN !== game.lastFEN) {
      let evaluation = game.evaluation
      try {
        const evalData = await fetchEvaluation(gameData.lastFEN)
        evaluation = evalData.evaluation
      } catch {}
      
      set({
        games: get().games.map((g, i) =>
          i === index ? { ...g, ...gameData, evaluation } : g
        )
      })
    }
  })
}

// Process JSON data (fallback)
function processJsonData(
  games: LichessGame[],
  get: () => EvalStore,
  set: (partial: Partial<EvalStore>) => void
) {
  const gameNames = games.map(g => g.name).filter(Boolean)
  set({ availableGames: gameNames })
  
  const currentGames = get().games
  currentGames.forEach(async (game, index) => {
    const matchingGame = games.find(g => 
      g.name === `${game.whitePlayer} - ${game.blackPlayer}`
    )
    
    if (!matchingGame?.fen || matchingGame.fen === game.lastFEN) return
    
    let whiteTime = 0, blackTime = 0
    if (matchingGame.players?.length && matchingGame.players.length >= 2) {
      whiteTime = matchingGame.players[0].clock ? Math.floor(matchingGame.players[0].clock / 100) : 0
      blackTime = matchingGame.players[1].clock ? Math.floor(matchingGame.players[1].clock / 100) : 0
    }
    
    const fenParts = matchingGame.fen.split(' ')
    const turn = fenParts[1] === 'w' ? 'white' : 'black'
    
    let result: string | null = null
    if (matchingGame.status && matchingGame.status !== '*') {
      result = matchingGame.status === '½-½' ? 'Draw' : matchingGame.status
    }
    
    let evaluation = game.evaluation
    try {
      const evalData = await fetchEvaluation(matchingGame.fen)
      evaluation = evalData.evaluation
    } catch {}
    
    set({
      games: get().games.map((g, i) =>
        i === index ? {
          ...g,
          lastFEN: matchingGame.fen!,
          whiteTime,
          blackTime,
          turn: turn as 'white' | 'black',
          result,
          evaluation,
          moveNumber: parseInt(fenParts[5]) || 1,
        } : g
      )
    })
  })
}

// Extract game data from PGN using chessops for proper FEN calculation
function extractGameDataFromPgn(pgnText: string): Partial<GameData> | null {
  try {
    // Parse PGN using chessops
    const games = parsePgn(pgnText)
    if (games.length === 0) return null
    
    const game = games[0]
    
    // Get starting position
    const posResult = startingPosition(game.headers)
    if (posResult.isErr) return null
    
    const pos = posResult.value
    let moveCount = 0
    
    // Replay all moves to get final position
    for (const node of game.moves.mainline()) {
      const move = parseSan(pos, node.san)
      if (!move) break // Illegal move, stop here
      pos.play(move)
      moveCount++
    }
    
    // Get final FEN
    const lastFEN = makeFen(pos.toSetup())
    
    // Extract clocks from PGN comments
    const clocks = pgnText.match(/\[%clk (\d+:\d+:\d+)\]/g)
    const clocksList = clocks?.map(c => c.match(/(\d+:\d+:\d+)/)?.[1] || '0:00:00') || []
    
    // Extract result
    let result: string | null = null
    const resultHeader = game.headers.get('Result')
    if (resultHeader && resultHeader !== '*') {
      result = resultHeader === '1/2-1/2' ? 'Draw' : resultHeader
    }
    
    // Calculate times from clocks
    let whiteTime = 0, blackTime = 0
    let turn: 'white' | 'black' | '' = pos.turn
    
    if (clocksList.length >= 1) {
      const parseClock = (c: string) => {
        const parts = c.split(':').map(Number)
        if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2]
        }
        return 0
      }
      
      // Clocks alternate: white, black, white, black...
      // Last clock is from the player who just moved
      if (clocksList.length >= 2) {
        if (clocksList.length % 2 === 0) {
          // Last move was black
          whiteTime = parseClock(clocksList[clocksList.length - 2])
          blackTime = parseClock(clocksList[clocksList.length - 1])
        } else {
          // Last move was white
          whiteTime = parseClock(clocksList[clocksList.length - 1])
          blackTime = parseClock(clocksList[clocksList.length - 2])
        }
      } else if (clocksList.length === 1) {
        whiteTime = parseClock(clocksList[0])
      }
    }
    
    return {
      lastFEN,
      result,
      whiteTime,
      blackTime,
      turn,
      moveNumber: Math.floor(moveCount / 2) + 1,
    }
  } catch (error) {
    console.error('PGN parsing error:', error)
    return null
  }
}

async function fetchEvaluation(fen: string): Promise<{ evaluation: number }> {
  const res = await fetch(`/api/eval?fen=${encodeURIComponent(fen)}`)
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
