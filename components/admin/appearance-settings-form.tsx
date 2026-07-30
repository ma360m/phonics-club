'use client'

import { useMemo, useState, useActionState } from 'react'
import { Save, RotateCcw, Send, Undo2 } from 'lucide-react'
import { saveAppearanceSettingsAction } from '@/actions/admin/appearance-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  accentColors,
  appearanceThemes,
  defaultAppearanceSettings,
  type AppearanceSettings,
  type AppearanceTheme,
} from '@/lib/display-preferences/types'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false }

const colorFields = [
  ['background', 'Background'],
  ['foreground', 'Text'],
  ['card', 'Card'],
  ['cardForeground', 'Card Text'],
  ['primary', 'Primary'],
  ['primaryForeground', 'Primary Text'],
  ['border', 'Border'],
  ['ring', 'Focus Ring'],
] as const

const themeLabels: Record<AppearanceTheme, string> = {
  'phonics-classic': 'Phonics Classic',
  'neon-learning': 'Neon Learning',
  'midnight-focus': 'Midnight Focus',
  'minimal-white': 'Minimal White',
  'high-contrast': 'High Contrast',
}

function labelize(value: string) {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function initialConfig(settings: AppearanceSettings) {
  const draft = settings.draftConfig && Object.keys(settings.draftConfig).length ? settings.draftConfig : null
  return (draft ?? settings.themeConfig ?? {}) as Record<string, Record<string, string>>
}

export function AppearanceSettingsForm({ settings }: { settings: AppearanceSettings }) {
  const [state, formAction, pending] = useActionState(saveAppearanceSettingsAction, initialState)
  const [selectedTheme, setSelectedTheme] = useState<AppearanceTheme>(settings.defaultTheme)
  const [themeConfig, setThemeConfig] = useState<Record<string, Record<string, string>>>(() => initialConfig(settings))
  const hasDraft = Boolean(settings.draftConfig && Object.keys(settings.draftConfig).length)

  const configJson = useMemo(() => JSON.stringify(themeConfig), [themeConfig])
  const selectedOverrides = themeConfig[selectedTheme] ?? {}

  function updateColor(field: string, value: string) {
    setThemeConfig((current) => ({
      ...current,
      [selectedTheme]: {
        ...(current[selectedTheme] ?? {}),
        [field]: value,
      },
    }))
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.error}</p>}
      {state.success && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Appearance settings saved.</p>}
      {hasDraft && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A draft is available. Publish it to make it live, or discard it to return to the currently published colors.
        </p>
      )}

      <input type="hidden" name="theme_config" value={configJson} />

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Public Theme Availability</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Normal users can only select themes that are enabled here. Phonics Classic always remains available.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <Label>Default Public Theme</Label>
            <select name="default_theme" defaultValue={settings.defaultTheme} className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
              {appearanceThemes.map((theme) => (
                <option key={theme} value={theme}>{themeLabels[theme]}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <Label>Default Accent Color</Label>
            <select name="default_accent_color" defaultValue={settings.defaultAccentColor} className="h-11 w-full rounded-xl border bg-background px-3 text-sm">
              {accentColors.map((accent) => (
                <option key={accent} value={accent}>{labelize(accent)}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {appearanceThemes.map((theme) => (
            <label key={theme} className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
              <input
                type="checkbox"
                name="enabled_themes"
                value={theme}
                defaultChecked={theme === 'phonics-classic' || settings.enabledThemes.includes(theme)}
                disabled={theme === 'phonics-classic'}
              />
              <span className="font-medium">{themeLabels[theme]}</span>
            </label>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
            <input type="checkbox" name="neon_learning_enabled" defaultChecked={settings.neonLearningEnabled} />
            <span>Enable Neon Learning</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm">
            <input type="checkbox" name="children_mode_enabled" defaultChecked={settings.childrenModeEnabled} />
            <span>Enable Children&apos;s Learning Mode</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border bg-background p-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              name="accessibility_controls_enabled"
              defaultChecked={settings.accessibilityControlsEnabled}
            />
            <span>Show Appearance &amp; Accessibility icon and footer link for users</span>
          </label>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-bold">Approved Theme Colors</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit carefully. The server rejects low-contrast foreground/background and button color combinations.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]">
          <label className="space-y-2">
            <Label>Theme to Edit</Label>
            <select
              value={selectedTheme}
              onChange={(event) => setSelectedTheme(event.target.value as AppearanceTheme)}
              className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
            >
              {appearanceThemes.map((theme) => (
                <option key={theme} value={theme}>{themeLabels[theme]}</option>
              ))}
            </select>
          </label>

          <div className="rounded-2xl border p-4" style={{
            background: selectedOverrides.background || 'var(--background)',
            color: selectedOverrides.foreground || 'var(--foreground)',
            borderColor: selectedOverrides.border || 'var(--border)',
          }}>
            <p className="text-sm font-semibold">Preview</p>
            <div className="mt-3 rounded-xl border p-4" style={{
              background: selectedOverrides.card || 'var(--card)',
              color: selectedOverrides.cardForeground || 'var(--card-foreground)',
              borderColor: selectedOverrides.border || 'var(--border)',
            }}>
              <p className="font-bold">Course card sample</p>
              <p className="mt-1 text-sm opacity-80">Text, borders, and buttons should stay readable at a glance.</p>
              <span className="mt-3 inline-flex rounded-lg px-3 py-2 text-sm font-semibold" style={{
                background: selectedOverrides.primary || 'var(--primary)',
                color: selectedOverrides.primaryForeground || 'var(--primary-foreground)',
              }}>
                Primary Button
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {colorFields.map(([field, label]) => (
            <label key={field} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="color"
                value={selectedOverrides[field] ?? '#ffffff'}
                onChange={(event) => updateColor(field, event.target.value)}
                className="h-11 rounded-xl p-1"
              />
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="save-draft" disabled={pending} variant="outline" className="rounded-xl">
          <Save className="h-4 w-4" />
          Save Draft
        </Button>
        <Button type="submit" name="intent" value="publish" disabled={pending} className="rounded-xl bg-[#1D4ED8]">
          <Send className="h-4 w-4" />
          Publish Changes
        </Button>
        <Button type="submit" name="intent" value="discard-draft" disabled={pending} variant="outline" className="rounded-xl">
          <Undo2 className="h-4 w-4" />
          Undo Draft
        </Button>
        <Button type="submit" name="intent" value="restore" disabled={pending} variant="destructive" className="rounded-xl">
          <RotateCcw className="h-4 w-4" />
          Restore Defaults
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Defaults restore to {themeLabels[defaultAppearanceSettings.defaultTheme]}, Phonics Red, no draft color overrides, and the default enabled theme list.
      </p>
    </form>
  )
}
