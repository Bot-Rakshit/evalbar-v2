import { useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEvalStore, defaultStyles } from '@/stores/evalStore'
import type { CustomStyles } from '@/stores/evalStore'
import { Download, Upload, RotateCcw, Monitor } from 'lucide-react'

interface ColorPickerProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <label className="text-sm">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 h-8 text-xs"
        />
      </div>
    </div>
  )
}

interface SliderControlProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}

function SliderControl({ label, value, min, max, step = 1, onChange }: SliderControlProps) {
  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center justify-between">
        <label className="text-sm">{label}</label>
        <span className="text-sm text-muted-foreground">{value}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}

export function CustomizationPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    customStyles,
    setCustomStyles,
    resetStyles,
    backgroundMode,
    setBackgroundMode,
    columns,
    setColumns,
  } = useEvalStore()

  const handleExport = () => {
    const data = JSON.stringify(customStyles, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'evalbar-theme.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string) as Partial<CustomStyles>
        setCustomStyles(imported)
      } catch {
        alert('Invalid theme file')
      }
    }
    reader.readAsText(file)
  }

  const presets = [
    { name: 'Default', styles: defaultStyles },
    {
      name: 'ChessBase',
      styles: {
        ...defaultStyles,
        evalContainerBg: '#1a1a2e',
        blackBarColor: '#E79D29',
        whiteBarColor: '#ffffff',
        blackPlayerNameColor: '#E79D29',
      }
    },
    {
      name: 'Minimal',
      styles: {
        ...defaultStyles,
        evalContainerBg: '#000000',
        evalContainerBorderColor: '#333333',
        blackBarColor: '#666666',
        whiteBarColor: '#ffffff',
        whitePlayerNameColor: '#ffffff',
        blackPlayerNameColor: '#aaaaaa',
      }
    },
    {
      name: 'Vibrant',
      styles: {
        ...defaultStyles,
        evalContainerBg: '#1e1e3f',
        blackBarColor: '#ff6b6b',
        whiteBarColor: '#4ecdc4',
        whitePlayerNameColor: '#4ecdc4',
        blackPlayerNameColor: '#ff6b6b',
        moveIndicatorColor: '#ffe66d',
      }
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Customization
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={resetStyles}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-1 mt-4">
            <ColorPicker
              label="Container Background"
              value={customStyles.evalContainerBg}
              onChange={(v) => setCustomStyles({ evalContainerBg: v })}
            />
            <ColorPicker
              label="Container Border"
              value={customStyles.evalContainerBorderColor}
              onChange={(v) => setCustomStyles({ evalContainerBorderColor: v })}
            />
            <ColorPicker
              label="White Bar Color"
              value={customStyles.whiteBarColor}
              onChange={(v) => setCustomStyles({ whiteBarColor: v })}
            />
            <ColorPicker
              label="Black Bar Color"
              value={customStyles.blackBarColor}
              onChange={(v) => setCustomStyles({ blackBarColor: v })}
            />
            <ColorPicker
              label="White Player Name"
              value={customStyles.whitePlayerNameColor}
              onChange={(v) => setCustomStyles({ whitePlayerNameColor: v })}
            />
            <ColorPicker
              label="Black Player Name"
              value={customStyles.blackPlayerNameColor}
              onChange={(v) => setCustomStyles({ blackPlayerNameColor: v })}
            />
            <ColorPicker
              label="White Player Background"
              value={customStyles.whitePlayerColor}
              onChange={(v) => setCustomStyles({ whitePlayerColor: v })}
            />
            <ColorPicker
              label="Black Player Background"
              value={customStyles.blackPlayerColor}
              onChange={(v) => setCustomStyles({ blackPlayerColor: v })}
            />
            <ColorPicker
              label="Move Indicator"
              value={customStyles.moveIndicatorColor}
              onChange={(v) => setCustomStyles({ moveIndicatorColor: v })}
            />
          </TabsContent>

          <TabsContent value="layout" className="space-y-4 mt-4">
            <SliderControl
              label="Columns"
              value={columns}
              min={1}
              max={8}
              onChange={setColumns}
            />
            <SliderControl
              label="Bar Height"
              value={customStyles.barHeight}
              min={10}
              max={40}
              onChange={(v) => setCustomStyles({ barHeight: v })}
            />
            <SliderControl
              label="Bar Border Radius"
              value={customStyles.barBorderRadius}
              min={0}
              max={20}
              onChange={(v) => setCustomStyles({ barBorderRadius: v })}
            />
            <SliderControl
              label="Font Size"
              value={customStyles.fontSize}
              min={12}
              max={24}
              onChange={(v) => setCustomStyles({ fontSize: v })}
            />
          </TabsContent>

          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="flex items-center justify-between py-2">
              <label className="text-sm">Show Clocks</label>
              <Switch
                checked={customStyles.showClocks}
                onCheckedChange={(v) => setCustomStyles({ showClocks: v })}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <label className="text-sm">Show Move Number</label>
              <Switch
                checked={customStyles.showMoveNumber}
                onCheckedChange={(v) => setCustomStyles({ showMoveNumber: v })}
              />
            </div>
            
            <div className="space-y-2 pt-4">
              <label className="text-sm flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Background Mode (for OBS)
              </label>
              <div className="flex gap-2">
                {(['dark', 'chroma', 'transparent'] as const).map((mode) => (
                  <Button
                    key={mode}
                    variant={backgroundMode === mode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBackgroundMode(mode)}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-auto py-4 flex flex-col"
                  onClick={() => setCustomStyles(preset.styles)}
                >
                  <div
                    className="w-full h-4 rounded mb-2"
                    style={{
                      background: `linear-gradient(to right, ${preset.styles.whiteBarColor} 50%, ${preset.styles.blackBarColor} 50%)`,
                    }}
                  />
                  {preset.name}
                </Button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
