import { useEvalStore } from '@/stores/evalStore'
import { TournamentSelector } from '@/components/TournamentSelector'
import { GameSelector } from '@/components/GameSelector'
import { CustomizationPanel } from '@/components/CustomizationPanel'
import { EvalBarsDisplay } from '@/components/EvalBarsDisplay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function HomePage() {
  const currentTournament = useEvalStore(state => state.currentTournament)
  const games = useEvalStore(state => state.games)

  if (!currentTournament) {
    return (
      <div className="container mx-auto py-8 px-4">
        <TournamentSelector />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="games" className="space-y-6">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="preview">Preview ({games.length})</TabsTrigger>
          <TabsTrigger value="customize">Customize</TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <GameSelector onBack={() => useEvalStore.getState().stopPolling()} />
        </TabsContent>

        <TabsContent value="preview">
          <EvalBarsDisplay showRemoveButtons />
        </TabsContent>

        <TabsContent value="customize">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CustomizationPanel />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Live Preview</h3>
              <EvalBarsDisplay />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
