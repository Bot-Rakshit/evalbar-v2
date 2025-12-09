import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEvalStore } from '@/stores/evalStore'
import { EvalBar } from '@/components/EvalBar'
import { cn } from '@/lib/utils'

export function BroadcastPage() {
  const { stateData } = useParams<{ stateData: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { 
    loadFromUrl, 
    backgroundMode, 
    setBroadcastMode, 
    games, 
    customStyles,
    removeGame 
  } = useEvalStore()

  useEffect(() => {
    if (!stateData) {
      navigate('/')
      return
    }

    setBroadcastMode(true)
    
    loadFromUrl(stateData)
      .then(() => setLoading(false))
      .catch((err) => {
        console.error('Failed to load broadcast:', err)
        setError('Failed to load broadcast data')
        setLoading(false)
      })

    return () => {
      useEvalStore.getState().stopPolling()
    }
  }, [stateData, navigate, loadFromUrl, setBroadcastMode])

  const bgClass = cn(
    backgroundMode === 'chroma' && 'bg-[#00ff00]',
    backgroundMode === 'transparent' && 'bg-transparent',
    backgroundMode === 'dark' && 'bg-[#0a0a0a]'
  )

  if (loading) {
    return (
      <div className={cn("min-h-screen w-full flex items-center justify-center", bgClass)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn("min-h-screen w-full flex items-center justify-center", bgClass)}>
        <div className="text-white text-center">
          <p className="text-xl mb-2">{error}</p>
          <button onClick={() => navigate('/')} className="underline">Go back</button>
        </div>
      </div>
    )
  }

  if (games.length === 0) {
    return (
      <div className={cn("min-h-screen w-full flex items-center justify-center", bgClass)}>
        <div className="text-white/50 text-sm">Waiting for games...</div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen w-full p-2", bgClass)}>
      <div 
        className="w-full grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${games.length}, 1fr)`,
        }}
      >
        {games.map((game, index) => (
          <EvalBar
            key={`${game.whitePlayer}-${game.blackPlayer}`}
            game={game}
            styles={customStyles}
            showRemoveButton={false}
            onRemove={() => removeGame(index)}
          />
        ))}
      </div>
    </div>
  )
}
