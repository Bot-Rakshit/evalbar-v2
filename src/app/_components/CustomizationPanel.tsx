'use client'

import { useEvalStore, defaultStyles } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Palette, RotateCcw, Monitor, Clock, Hash } from 'lucide-react'

const PRESETS = {
  default: {
    name: 'Default',
    styles: defaultStyles,
  },
  minimal: {
    name: 'Minimal',
    styles: {
      ...defaultStyles,
      evalContainerBg: '#000000',
      evalContainerBorderColor: '#333333',
    },
  },
  chessbase: {
    name: 'ChessBase',
    styles: {
      ...defaultStyles,
      evalContainerBg: '#1a1a1a',
      blackBarColor: '#C0C0C0',
      whiteBarColor: '#FFFFFF',
      evalContainerBorderColor: '#333333',
    },
  },
  vibrant: {
    name: 'Vibrant',
    styles: {
      ...defaultStyles,
      evalContainerBg: '#0f172a',
      blackBarColor: '#22d3ee',
      whiteBarColor: '#f472b6',
      evalContainerBorderColor: '#334155',
    },
  },
}

export function CustomizationPanel() {
  const customStyles = useEvalStore(state => state.customStyles)
  const setCustomStyles = useEvalStore(state => state.setCustomStyles)
  const resetStyles = useEvalStore(state => state.resetStyles)
  const backgroundMode = useEvalStore(state => state.backgroundMode)
  const setBackgroundMode = useEvalStore(state => state.setBackgroundMode)
  const columns = useEvalStore(state => state.columns)
  const setColumns = useEvalStore(state => state.setColumns)

  const updateStyle = (key: string, value: string | number | boolean) => {
    setCustomStyles({ [key]: value })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Presets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                onClick={() => setCustomStyles(preset.styles)}
                className="justify-start"
              >
                {preset.name}
              </Button>
            ))}
          </div>
          <Button variant="ghost" onClick={resetStyles} className="w-full mt-2">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Default
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Background
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(['chroma', 'transparent', 'dark'] as const).map((mode) => (
              <Button
                key={mode}
                variant={backgroundMode === mode ? 'default' : 'outline'}
                onClick={() => setBackgroundMode(mode)}
                className="flex-1"
              >
                {mode === 'chroma' ? 'Chroma Key' : mode === 'transparent' ? 'Transparent' : 'Dark'}
              </Button>
            ))}
          </div>
          
          <div className="space-y-2">
            <Label>Columns: {columns}</Label>
            <Slider
              value={[columns]}
              onValueChange={([value]) => setColumns(value)}
              min={1}
              max={12}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bar (White)</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customStyles.whiteBarColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('whiteBarColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={customStyles.whiteBarColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('whiteBarColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Bar (Black)</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customStyles.blackBarColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('blackBarColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={customStyles.blackBarColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('blackBarColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Name (White)</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customStyles.whitePlayerNameColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('whitePlayerNameColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={customStyles.whitePlayerNameColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('whitePlayerNameColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Name (Black)</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customStyles.blackPlayerNameColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('blackPlayerNameColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={customStyles.blackPlayerNameColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('blackPlayerNameColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Background</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customStyles.evalContainerBg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('evalContainerBg', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={customStyles.evalContainerBg}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('evalContainerBg', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Border</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customStyles.evalContainerBorderColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('evalContainerBorderColor', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <Input
                  value={customStyles.evalContainerBorderColor}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStyle('evalContainerBorderColor', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Show Clocks
              </Label>
              <Switch
                checked={customStyles.showClocks}
                onCheckedChange={(checked) => updateStyle('showClocks', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Show Move Number
              </Label>
              <Switch
                checked={customStyles.showMoveNumber}
                onCheckedChange={(checked) => updateStyle('showMoveNumber', checked)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Bar Height: {customStyles.barHeight}px</Label>
            <Slider
              value={[customStyles.barHeight]}
              onValueChange={([value]) => updateStyle('barHeight', value)}
              min={8}
              max={30}
              step={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Border Radius: {customStyles.barBorderRadius}px</Label>
            <Slider
              value={[customStyles.barBorderRadius]}
              onValueChange={([value]) => updateStyle('barBorderRadius', value)}
              min={0}
              max={12}
              step={1}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Font Size: {customStyles.fontSize}px</Label>
            <Slider
              value={[customStyles.fontSize]}
              onValueChange={([value]) => updateStyle('fontSize', value)}
              min={10}
              max={20}
              step={1}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
