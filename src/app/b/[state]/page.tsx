'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useEvalStore } from '@/lib/store'
import { EvalBar } from '@/app/_components/EvalBar'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{ state: string }>
}

export default function BroadcastPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const stateData = resolvedParams.state
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFromUrl = useEvalStore(state => state.loadFromUrl)
  const backgroundMode = useEvalStore(state => state.backgroundMode)
  const setBroadcastMode = useEvalStore(state => state.setBroadcastMode)
  const games = useEvalStore(state => state.games)
  const customStyles = useEvalStore(state => state.customStyles)
  const stopPolling = useEvalStore(state => state.stopPolling)

  useEffect(() => {
    if (!stateData) {
      router.push('/')
      return
    }

    setBroadcastMode(true)
    
    loadFromUrl(stateData)
      .then((success) => {
        if (!success) {
          setError('Failed to load broadcast data')
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load broadcast:', err)
        setError('Failed to load broadcast data')
        setLoading(false)
      })

    return () => {
      stopPolling()
    }
  }, [stateData, router, loadFromUrl, setBroadcastMode, stopPolling])

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
          <button onClick={() => router.push('/')} className="underline">Go back</button>
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
        {games.map((game) => (
          <EvalBar
            key={`${game.whitePlayer}-${game.blackPlayer}`}
            game={game}
            styles={customStyles}
            showRemoveButton={false}
          />
        ))}
      </div>
    </div>
  )
}
