'use client'

import { Check, Eye, Focus, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  accentColors,
  appearanceThemes,
  fontModes,
  letterSpacings,
  lineSpacings,
  motionModes,
  readingWidths,
  textSizes,
  type AccentColor,
  type AppearanceTheme,
  type DisplayPreferences,
} from '@/lib/display-preferences/types'
import { cn } from '@/lib/utils'
import { useDisplayPreferences } from './display-preferences-provider'

const themeLabels: Record<AppearanceTheme, { title: string; description: string; swatches: string[] }> = {
  'phonics-classic': {
    title: 'Phonics Classic',
    description: 'Bright, friendly Phonics Club brand styling.',
    swatches: ['#FFFFFF', '#D30000', '#1D4ED8', '#FBBF24'],
  },
  'neon-learning': {
    title: 'Neon Learning',
    description: 'Futuristic dark study interface with subtle glow.',
    swatches: ['#09090B', '#2E6BFF', '#00D4FF', '#00E58B'],
  },
  'midnight-focus': {
    title: 'Midnight Focus',
    description: 'Low-distraction navy surfaces for study time.',
    swatches: ['#07142B', '#132342', '#7DD3FC', '#F8FAFC'],
  },
  'minimal-white': {
    title: 'Minimal White',
    description: 'Clean academic look with reduced decoration.',
    swatches: ['#FFFFFF', '#F4F7FB', '#111827', '#1D4ED8'],
  },
  'high-contrast': {
    title: 'High Contrast',
    description: 'Strong outlines and high readability.',
    swatches: ['#FFFFFF', '#000000', '#0047FF', '#FFD400'],
  },
}

const accentLabels: Record<AccentColor, { label: string; color: string }> = {
  'phonics-red': { label: 'Phonics Red', color: '#D30000' },
  'royal-blue': { label: 'Royal Blue', color: '#1D4ED8' },
  'golden-yellow': { label: 'Golden Yellow', color: '#FBBF24' },
  cyan: { label: 'Cyan', color: '#00D4FF' },
  purple: { label: 'Purple', color: '#8A2EFF' },
  'emerald-green': { label: 'Emerald Green', color: '#00A86B' },
}

const toggleGroups: {
  title: string
  description: string
  items: { key: keyof DisplayPreferences; label: string; description: string }[]
}[] = [
  {
    title: 'Contrast and Color Accessibility',
    description: 'Improve clarity without damaging images, videos, logos, or QR codes.',
    items: [
      { key: 'greyscaleEnabled', label: 'Greyscale', description: 'Convert interface surfaces and controls to greyscale.' },
      { key: 'highVisibilityEnabled', label: 'High Visibility', description: 'Increase borders, contrast, and button separation.' },
      { key: 'negativeContrastEnabled', label: 'Negative Contrast', description: 'Use a dark contrast mode while preserving media.' },
      { key: 'lightBackgroundEnabled', label: 'Light Background', description: 'Force readable light content surfaces.' },
      { key: 'highlightLinksEnabled', label: 'Highlight Links', description: 'Add visible backgrounds around text links.' },
      { key: 'underlineLinksEnabled', label: 'Underline Links', description: 'Underline text links where appropriate.' },
      { key: 'strongFocusEnabled', label: 'Strong Focus Indicators', description: 'Show a clear keyboard focus ring.' },
    ],
  },
  {
    title: 'Interaction',
    description: 'Make controls easier to use and reduce visual noise.',
    items: [
      { key: 'largerButtonsEnabled', label: 'Larger Buttons', description: 'Increase button height and spacing.' },
      { key: 'largerTargetsEnabled', label: 'Larger Click Areas', description: 'Keep interactive targets comfortably sized.' },
      { key: 'simplifiedInterfaceEnabled', label: 'Simplified Interface', description: 'Reduce decorative density while preserving features.' },
      { key: 'reduceDecorationsEnabled', label: 'Reduce Decorative Effects', description: 'Tone down shadows, gradients, glows, and motion.' },
      { key: 'readingFocusEnabled', label: 'Reading Focus', description: 'Emphasize lesson, article, and policy content.' },
      { key: 'childrenModeEnabled', label: "Children's Learning Mode", description: 'Use friendlier spacing and slightly larger controls.' },
    ],
  },
]

function labelize(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function PreferenceSelect<T extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string
  value: T
  values: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {values.map((item) => (
          <option key={item} value={item}>
            {labelize(item)}
          </option>
        ))}
      </select>
    </label>
  )
}

export function AppearanceAccessibilityPanel() {
  const { open, setOpen, preferences, settings, updatePreferences, resetPreferences, saveStatus } = useDisplayPreferences()
  const availableThemes = appearanceThemes.filter((theme) => {
    if (theme === 'neon-learning' && !settings.neonLearningEnabled) return false
    return settings.enabledThemes.includes(theme)
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex h-dvh w-full flex-col gap-0 overflow-hidden border-l bg-background p-0 sm:max-w-[460px]"
      >
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-5 py-4 text-left backdrop-blur">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Appearance & Accessibility
          </SheetTitle>
          <SheetDescription>
            Personalize colors, contrast, text, motion, and reading preferences.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Website Theme</h3>
              <p className="mt-1 text-sm text-muted-foreground">Choose a complete look. Phonics Classic remains the default.</p>
            </div>
            <div className="grid gap-3">
              {availableThemes.map((theme) => {
                const meta = themeLabels[theme]
                const active = preferences.theme === theme
                return (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => updatePreferences({ theme })}
                    aria-pressed={active}
                    className={cn(
                      'rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span>
                        <span className="block font-semibold">{meta.title}</span>
                        <span className="mt-1 block text-sm text-muted-foreground">{meta.description}</span>
                      </span>
                      {active && <Check className="h-5 w-5 text-primary" aria-hidden="true" />}
                    </span>
                    <span className="mt-3 grid grid-cols-4 overflow-hidden rounded-xl border border-border">
                      {meta.swatches.map((color) => (
                        <span key={color} className="h-8" style={{ background: color }} />
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Accent Color</h3>
            <div className="grid grid-cols-2 gap-2">
              {accentColors.map((accent) => {
                const active = preferences.accentColor === accent
                const meta = accentLabels[accent]
                return (
                  <button
                    key={accent}
                    type="button"
                    onClick={() => updatePreferences({ accentColor: accent })}
                    aria-pressed={active}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'border-primary text-primary' : 'border-border hover:border-primary/50',
                    )}
                  >
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: meta.color }} />
                    {meta.label}
                  </button>
                )
              })}
            </div>
          </section>

          <Separator />

          {toggleGroups.map((group) => (
            <section key={group.title} className="space-y-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{group.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <div key={String(item.key)} className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-3">
                    <Label htmlFor={String(item.key)} className="space-y-1">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block text-xs leading-5 text-muted-foreground">{item.description}</span>
                    </Label>
                    <Switch
                      id={String(item.key)}
                      checked={Boolean(preferences[item.key])}
                      onCheckedChange={(checked) => updatePreferences({ [item.key]: checked } as Partial<DisplayPreferences>)}
                      aria-label={item.label}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Text and Reading</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <PreferenceSelect label="Text Size" value={preferences.textSize} values={textSizes} onChange={(textSize) => updatePreferences({ textSize })} />
              <PreferenceSelect label="Reading Width" value={preferences.readingWidth} values={readingWidths} onChange={(readingWidth) => updatePreferences({ readingWidth })} />
              <PreferenceSelect label="Line Spacing" value={preferences.lineSpacing} values={lineSpacings} onChange={(lineSpacing) => updatePreferences({ lineSpacing })} />
              <PreferenceSelect label="Letter Spacing" value={preferences.letterSpacing} values={letterSpacings} onChange={(letterSpacing) => updatePreferences({ letterSpacing })} />
              <PreferenceSelect label="Font Mode" value={preferences.fontMode} values={fontModes} onChange={(fontMode) => updatePreferences({ fontMode })} />
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Focus className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Motion</h3>
            </div>
            <PreferenceSelect label="Animation Settings" value={preferences.motionMode} values={motionModes} onChange={(motionMode) => updatePreferences({ motionMode })} />
            <p className="text-xs leading-5 text-muted-foreground">
              System mode follows your device reduced-motion preference when enabled.
            </p>
          </section>
        </div>

        <div className="sticky bottom-0 border-t bg-background/95 px-5 py-4 backdrop-blur">
          <div className="mb-3 min-h-5 text-xs text-muted-foreground" aria-live="polite">
            {saveStatus === 'saving' ? 'Saving preferences...' : null}
            {saveStatus === 'saved' ? 'Preferences saved' : null}
            {saveStatus === 'error' ? 'Saved locally. Cloud sync will retry after another change.' : null}
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" className="flex-1 rounded-xl">
                  <RotateCcw className="h-4 w-4" />
                  Reset all
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset appearance and accessibility settings?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This returns to Phonics Classic, the default accent, normal reading settings, and your system motion preference.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={resetPreferences}>Reset Settings</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button type="button" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
