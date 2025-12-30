'use client'

import { useEvalStore } from '@/lib/store'
import { TournamentSelector } from './_components/TournamentSelector'
import { GameSelector } from './_components/GameSelector'
import { CustomizationPanel } from './_components/CustomizationPanel'
import { EvalBarsDisplay } from './_components/EvalBarsDisplay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function HomePage() {
  const currentTournament = useEvalStore(state => state.currentTournament)
  const games = useEvalStore(state => state.games)
  const stopPolling = useEvalStore(state => state.stopPolling)

  if (!currentTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-8 px-4">
          <header className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Chess Eval Bar</h1>
            <p className="text-muted-foreground">Real-time evaluation bars for tournament broadcasts</p>
          </header>
          <TournamentSelector />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold">{currentTournament.name}</h1>
        </header>
        
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="games">Games</TabsTrigger>
            <TabsTrigger value="preview">Preview ({games.length})</TabsTrigger>
            <TabsTrigger value="customize">Customize</TabsTrigger>
          </TabsList>

          <TabsContent value="games">
            <GameSelector onBack={() => stopPolling()} />
          </TabsContent>

          <TabsContent value="preview">
            <EvalBarsDisplay showRemoveButtons />
          </TabsContent>

          <TabsContent value="customize">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CustomizationPanel />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Live Preview</h3>
                <EvalBarsDisplay compact />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
