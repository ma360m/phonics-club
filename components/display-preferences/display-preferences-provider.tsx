'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  DISPLAY_PREFERENCES_STORAGE_KEY,
  appearanceThemes,
  defaultAppearanceSettings,
  defaultDisplayPreferences,
  preferencesToStorageRow,
  sanitizeDisplayPreferences,
  storageRowToPreferences,
  type AppearanceSettings,
  type DisplayPreferences,
} from '@/lib/display-preferences/types'
import { AppearanceAccessibilityButton } from './appearance-accessibility-button'
import { AppearanceAccessibilityPanel } from './appearance-accessibility-panel'

interface DisplayPreferencesContextValue {
  preferences: DisplayPreferences
  settings: AppearanceSettings
  open: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  setOpen: (open: boolean) => void
  updatePreferences: (patch: Partial<DisplayPreferences>) => void
  resetPreferences: () => void
}

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(null)

function readLocalPreferenceState() {
  if (typeof window === 'undefined') return { preferences: defaultDisplayPreferences, hasLocal: false }
  try {
    const stored = window.localStorage.getItem(DISPLAY_PREFERENCES_STORAGE_KEY)
    return {
      preferences: stored ? sanitizeDisplayPreferences(JSON.parse(stored)) : defaultDisplayPreferences,
      hasLocal: Boolean(stored),
    }
  } catch {
    return { preferences: defaultDisplayPreferences, hasLocal: false }
  }
}

const overridableCssVariables = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  border: '--border',
  ring: '--ring',
} as const

function applyPreferencesToDocument(preferences: DisplayPreferences, settings: AppearanceSettings) {
  const root = document.documentElement
  root.dataset.pcTheme = preferences.theme
  root.dataset.pcAccent = preferences.accentColor
  root.dataset.pcGreyscale = String(preferences.greyscaleEnabled)
  root.dataset.pcHighVisibility = String(preferences.highVisibilityEnabled)
  root.dataset.pcNegativeContrast = String(preferences.negativeContrastEnabled)
  root.dataset.pcLightBackground = String(preferences.lightBackgroundEnabled)
  root.dataset.pcHighlightLinks = String(preferences.highlightLinksEnabled)
  root.dataset.pcUnderlineLinks = String(preferences.underlineLinksEnabled)
  root.dataset.pcStrongFocus = String(preferences.strongFocusEnabled)
  root.dataset.pcTextSize = preferences.textSize
  root.dataset.pcReadingWidth = preferences.readingWidth
  root.dataset.pcLineSpacing = preferences.lineSpacing
  root.dataset.pcLetterSpacing = preferences.letterSpacing
  root.dataset.pcFontMode = preferences.fontMode
  root.dataset.pcMotion = preferences.motionMode
  root.dataset.pcLargerButtons = String(preferences.largerButtonsEnabled)
  root.dataset.pcLargerTargets = String(preferences.largerTargetsEnabled)
  root.dataset.pcSimplified = String(preferences.simplifiedInterfaceEnabled)
  root.dataset.pcReduceDecorations = String(preferences.reduceDecorationsEnabled)
  root.dataset.pcReadingFocus = String(preferences.readingFocusEnabled)
  root.dataset.pcChildrenMode = String(preferences.childrenModeEnabled)

  if (
    preferences.motionMode === 'system' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    root.dataset.pcMotion = 'reduced'
  }

  Object.values(overridableCssVariables).forEach((variableName) => {
    root.style.removeProperty(variableName)
  })

  const overrides = settings.themeConfig?.[preferences.theme] as Record<string, string> | undefined
  if (!overrides) return

  Object.entries(overridableCssVariables).forEach(([key, variableName]) => {
    const value = overrides[key]
    if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
      root.style.setProperty(variableName, value)
    }
  })
}

function normalizeSettings(row: Record<string, unknown> | null | undefined): AppearanceSettings {
  if (!row) return defaultAppearanceSettings
  const enabledThemes = Array.isArray(row.enabled_themes)
    ? row.enabled_themes.filter((item): item is AppearanceSettings['enabledThemes'][number] => typeof item === 'string' && appearanceThemes.includes(item as AppearanceSettings['enabledThemes'][number]))
    : defaultAppearanceSettings.enabledThemes

  return {
    defaultTheme: (row.default_theme as AppearanceSettings['defaultTheme']) ?? defaultAppearanceSettings.defaultTheme,
    enabledThemes,
    neonLearningEnabled: row.neon_learning_enabled === true,
    childrenModeEnabled: row.children_mode_enabled !== false,
    accessibilityControlsEnabled: row.accessibility_controls_enabled !== false,
    defaultAccentColor: (row.default_accent_color as AppearanceSettings['defaultAccentColor']) ?? defaultAppearanceSettings.defaultAccentColor,
    themeConfig: (row.theme_config as Record<string, unknown>) ?? {},
    draftConfig: (row.draft_config as Record<string, unknown>) ?? {},
    publishedAt: row.published_at as string | null | undefined,
    publishedBy: row.published_by as string | null | undefined,
    updatedAt: row.updated_at as string | null | undefined,
  }
}

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const initialLocalState = useRef<{ preferences: DisplayPreferences; hasLocal: boolean } | null>(null)
  if (!initialLocalState.current) initialLocalState.current = readLocalPreferenceState()

  const [preferences, setPreferences] = useState<DisplayPreferences>(() => initialLocalState.current!.preferences)
  const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearanceSettings)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const hasMounted = useRef(false)
  const saveTimer = useRef<number | null>(null)

  useEffect(() => {
    applyPreferencesToDocument(preferences, settings)
    window.localStorage.setItem(DISPLAY_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences, settings])

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function syncInitial() {
      const { data: settingsRow } = await supabase
        .from('public_appearance_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle()

      const normalizedSettings = normalizeSettings(settingsRow as Record<string, unknown> | null)
      if (!cancelled) {
        setSettings(normalizedSettings)
        if (!initialLocalState.current?.hasLocal) {
          setPreferences((current) => ({
            ...current,
            theme: normalizedSettings.defaultTheme,
            accentColor: normalizedSettings.defaultAccentColor,
          }))
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      setUserId(user.id)
      if (initialLocalState.current?.hasLocal) {
        await supabase
          .from('user_display_preferences')
          .upsert(preferencesToStorageRow(preferences, user.id) as never, { onConflict: 'user_id' })
        return
      }

      const { data: row } = await supabase
        .from('user_display_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (row && !cancelled) setPreferences(storageRowToPreferences(row as Record<string, unknown>))
    }

    syncInitial().catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (!userId) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)

    setSaveStatus('saving')
    saveTimer.current = window.setTimeout(async () => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('user_display_preferences')
          .upsert(preferencesToStorageRow(preferences, userId) as never, { onConflict: 'user_id' })
        if (error) throw error
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 700)

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [preferences, userId])

  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = window.setTimeout(() => setSaveStatus('idle'), 1800)
    return () => window.clearTimeout(timer)
  }, [saveStatus])

  const updatePreferences = useCallback((patch: Partial<DisplayPreferences>) => {
    setPreferences((current) => sanitizeDisplayPreferences({ ...current, ...patch }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(defaultDisplayPreferences)
    toast.success('Appearance settings reset')
  }, [])

  const value = useMemo(
    () => ({
      preferences,
      settings,
      open,
      saveStatus,
      setOpen,
      updatePreferences,
      resetPreferences,
    }),
    [open, preferences, resetPreferences, saveStatus, settings, updatePreferences],
  )

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
      <AppearanceAccessibilityButton />
      <AppearanceAccessibilityPanel />
    </DisplayPreferencesContext.Provider>
  )
}

export function useDisplayPreferences() {
  const context = useContext(DisplayPreferencesContext)
  if (!context) throw new Error('useDisplayPreferences must be used inside DisplayPreferencesProvider')
  return context
}
