import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PGNPoller, parseGames, extractGameData, fetchEvaluation, fetchTournament } from '../lib/lichess'
import type { GameData, Tournament } from '../lib/lichess'

export type { GameData, Tournament } from '../lib/lichess'

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

interface EvalStore {
  // Tournament state
  currentTournament: Tournament | null
  currentRoundId: string | null
  availableGames: string[]
  
  // Game state
  games: GameData[]
  pgnData: string
  
  // UI state
  customStyles: CustomStyles
  isBroadcastMode: boolean
  backgroundMode: 'chroma' | 'transparent' | 'dark'
  columns: number
  
  // Polling
  poller: PGNPoller | null
  
  // Actions
  setTournament: (tournament: Tournament, roundId: string) => void
  setRoundId: (roundId: string) => void
  addGame: (whitePlayer: string, blackPlayer: string) => void
  removeGame: (index: number) => void
  clearGames: () => void
  updatePGN: (pgn: string) => void
  updateGameEvaluation: (index: number, evaluation: number, fen: string) => void
  setCustomStyles: (styles: Partial<CustomStyles>) => void
  resetStyles: () => void
  setBroadcastMode: (mode: boolean) => void
  setBackgroundMode: (mode: 'chroma' | 'transparent' | 'dark') => void
  setColumns: (cols: number) => void
  startPolling: () => void
  stopPolling: () => void
  loadFromUrl: (data: string) => Promise<void>
  generateShareUrl: () => string
}

export const useEvalStore = create<EvalStore>()(
  persist(
    (set, get) => ({
      currentTournament: null,
      currentRoundId: null,
      availableGames: [],
      games: [],
      pgnData: '',
      customStyles: defaultStyles,
      isBroadcastMode: false,
      backgroundMode: 'chroma',
      columns: 6,
      poller: null,

      setTournament: (tournament, roundId) => {
        get().stopPolling()
        set({
          currentTournament: tournament,
          currentRoundId: roundId,
          games: [],
          pgnData: '',
          availableGames: [],
        })
        get().startPolling()
      },

      setRoundId: (roundId) => {
        get().stopPolling()
        set({ currentRoundId: roundId, games: [], pgnData: '', availableGames: [] })
        get().startPolling()
      },

      addGame: (whitePlayer, blackPlayer) => {
        const { games, pgnData } = get()
        if (games.some(g => g.whitePlayer === whitePlayer && g.blackPlayer === blackPlayer)) {
          return
        }
        
        const gameData = extractGameData(pgnData, whitePlayer, blackPlayer)
        const newGame: GameData = {
          whitePlayer,
          blackPlayer,
          evaluation: null,
          lastFEN: gameData?.lastFEN || '',
          result: gameData?.result || null,
          whiteTime: gameData?.whiteTime || 0,
          blackTime: gameData?.blackTime || 0,
          turn: gameData?.turn || '',
          moveNumber: gameData?.moveNumber || 0,
        }
        
        set({ games: [...games, newGame] })

        if (newGame.lastFEN) {
          fetchEvaluation(newGame.lastFEN)
            .then(data => {
              const index = get().games.findIndex(
                g => g.whitePlayer === whitePlayer && g.blackPlayer === blackPlayer
              )
              if (index !== -1) {
                get().updateGameEvaluation(index, data.evaluation, newGame.lastFEN)
              }
            })
            .catch(console.error)
        }
      },

      removeGame: (index) => {
        set({ games: get().games.filter((_, i) => i !== index) })
      },

      clearGames: () => {
        set({ games: [] })
      },

      updatePGN: (pgn) => {
        const availableGames = parseGames(pgn)
        set({ pgnData: pgn, availableGames })

        const { games } = get()
        games.forEach(async (game, index) => {
          const gameData = extractGameData(pgn, game.whitePlayer, game.blackPlayer)
          if (gameData && gameData.lastFEN && gameData.lastFEN !== game.lastFEN) {
            try {
              const evalData = await fetchEvaluation(gameData.lastFEN)
              set({
                games: get().games.map((g, i) => 
                  i === index 
                    ? { ...g, ...gameData, evaluation: evalData.evaluation }
                    : g
                )
              })
            } catch (error) {
              console.error('Failed to fetch evaluation:', error)
              set({
                games: get().games.map((g, i) => 
                  i === index ? { ...g, ...gameData } : g
                )
              })
            }
          }
        })
      },

      updateGameEvaluation: (index, evaluation, fen) => {
        set({
          games: get().games.map((g, i) =>
            i === index ? { ...g, evaluation, lastFEN: fen } : g
          )
        })
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
        const { currentRoundId, poller } = get()
        if (!currentRoundId) return
        
        if (poller) {
          poller.stop()
        }

        const newPoller = new PGNPoller(currentRoundId, (pgn) => {
          get().updatePGN(pgn)
        })
        newPoller.start(3000)
        set({ poller: newPoller })
      },

      stopPolling: () => {
        const { poller } = get()
        if (poller) {
          poller.stop()
          set({ poller: null })
        }
      },

      loadFromUrl: async (data) => {
        try {
          const decoded = JSON.parse(atob(data))
          const { tournamentId, roundId, gameIDs, customStyles: styles, backgroundMode: bgMode } = decoded

          if (!tournamentId || !roundId) {
            throw new Error('Invalid URL data')
          }

          const tournament = await fetchTournament(tournamentId)
          if (tournament) {
            set({
              currentTournament: tournament,
              currentRoundId: roundId,
              customStyles: styles || defaultStyles,
              isBroadcastMode: true,
              backgroundMode: bgMode || 'chroma',
              games: [],
              pgnData: '',
              availableGames: [],
            })

            get().startPolling()

            if (Array.isArray(gameIDs)) {
              setTimeout(() => {
                gameIDs.forEach((gameId: string) => {
                  const [white, black] = gameId.split('-vs-')
                  if (white && black) {
                    get().addGame(white, black)
                  }
                })
              }, 2000)
            }
          }
        } catch (error) {
          console.error('Failed to load from URL:', error)
          throw error
        }
      },

      generateShareUrl: () => {
        const { currentTournament, currentRoundId, games, customStyles, backgroundMode } = get()
        if (!currentTournament || !currentRoundId) return ''

        const data = {
          tournamentId: currentTournament.tour.id,
          roundId: currentRoundId,
          gameIDs: games.map(g => `${g.whitePlayer}-vs-${g.blackPlayer}`),
          customStyles,
          backgroundMode,
        }

        return btoa(JSON.stringify(data))
      },
    }),
    {
      name: 'eval-bar-storage',
      partialize: (state) => ({
        customStyles: state.customStyles,
        columns: state.columns,
        backgroundMode: state.backgroundMode,
      }),
    }
  )
)
