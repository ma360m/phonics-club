export const DISPLAY_PREFERENCES_STORAGE_KEY = 'phonics-display-preferences'

export const appearanceThemes = [
  'phonics-classic',
  'neon-learning',
  'midnight-focus',
  'minimal-white',
  'high-contrast',
] as const

export const accentColors = [
  'phonics-red',
  'royal-blue',
  'golden-yellow',
  'cyan',
  'purple',
  'emerald-green',
] as const

export const textSizes = ['small', 'default', 'large', 'extra-large'] as const
export const readingWidths = ['normal', 'narrow', 'wide'] as const
export const lineSpacings = ['normal', 'relaxed', 'spacious'] as const
export const letterSpacings = ['normal', 'medium', 'large'] as const
export const fontModes = ['default', 'readable', 'dyslexia-friendly'] as const
export const motionModes = ['system', 'full', 'reduced', 'none'] as const

export type AppearanceTheme = (typeof appearanceThemes)[number]
export type AccentColor = (typeof accentColors)[number]
export type TextSize = (typeof textSizes)[number]
export type ReadingWidth = (typeof readingWidths)[number]
export type LineSpacing = (typeof lineSpacings)[number]
export type LetterSpacing = (typeof letterSpacings)[number]
export type FontMode = (typeof fontModes)[number]
export type MotionMode = (typeof motionModes)[number]

export interface DisplayPreferences {
  theme: AppearanceTheme
  accentColor: AccentColor
  greyscaleEnabled: boolean
  highVisibilityEnabled: boolean
  negativeContrastEnabled: boolean
  lightBackgroundEnabled: boolean
  highlightLinksEnabled: boolean
  underlineLinksEnabled: boolean
  strongFocusEnabled: boolean
  textSize: TextSize
  readingWidth: ReadingWidth
  lineSpacing: LineSpacing
  letterSpacing: LetterSpacing
  fontMode: FontMode
  motionMode: MotionMode
  largerButtonsEnabled: boolean
  largerTargetsEnabled: boolean
  simplifiedInterfaceEnabled: boolean
  reduceDecorationsEnabled: boolean
  readingFocusEnabled: boolean
  childrenModeEnabled: boolean
}

export interface AppearanceSettings {
  defaultTheme: AppearanceTheme
  enabledThemes: AppearanceTheme[]
  neonLearningEnabled: boolean
  childrenModeEnabled: boolean
  accessibilityControlsEnabled: boolean
  defaultAccentColor: AccentColor
  themeConfig: Record<string, unknown>
  draftConfig: Record<string, unknown>
  publishedAt?: string | null
  publishedBy?: string | null
  updatedAt?: string | null
}

export const defaultDisplayPreferences: DisplayPreferences = {
  theme: 'phonics-classic',
  accentColor: 'phonics-red',
  greyscaleEnabled: false,
  highVisibilityEnabled: false,
  negativeContrastEnabled: false,
  lightBackgroundEnabled: false,
  highlightLinksEnabled: false,
  underlineLinksEnabled: false,
  strongFocusEnabled: false,
  textSize: 'default',
  readingWidth: 'normal',
  lineSpacing: 'normal',
  letterSpacing: 'normal',
  fontMode: 'default',
  motionMode: 'system',
  largerButtonsEnabled: false,
  largerTargetsEnabled: false,
  simplifiedInterfaceEnabled: false,
  reduceDecorationsEnabled: false,
  readingFocusEnabled: false,
  childrenModeEnabled: false,
}

export const defaultAppearanceSettings: AppearanceSettings = {
  defaultTheme: 'phonics-classic',
  enabledThemes: ['phonics-classic', 'midnight-focus', 'minimal-white', 'high-contrast'],
  neonLearningEnabled: false,
  childrenModeEnabled: true,
  accessibilityControlsEnabled: true,
  defaultAccentColor: 'phonics-red',
  themeConfig: {},
  draftConfig: {},
}

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
}

export function sanitizeDisplayPreferences(value: unknown): DisplayPreferences {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    ...defaultDisplayPreferences,
    theme: isOneOf(raw.theme, appearanceThemes) ? raw.theme : defaultDisplayPreferences.theme,
    accentColor: isOneOf(raw.accentColor, accentColors) ? raw.accentColor : defaultDisplayPreferences.accentColor,
    greyscaleEnabled: raw.greyscaleEnabled === true,
    highVisibilityEnabled: raw.highVisibilityEnabled === true,
    negativeContrastEnabled: raw.negativeContrastEnabled === true,
    lightBackgroundEnabled: raw.lightBackgroundEnabled === true,
    highlightLinksEnabled: raw.highlightLinksEnabled === true,
    underlineLinksEnabled: raw.underlineLinksEnabled === true,
    strongFocusEnabled: raw.strongFocusEnabled === true,
    textSize: isOneOf(raw.textSize, textSizes) ? raw.textSize : defaultDisplayPreferences.textSize,
    readingWidth: isOneOf(raw.readingWidth, readingWidths) ? raw.readingWidth : defaultDisplayPreferences.readingWidth,
    lineSpacing: isOneOf(raw.lineSpacing, lineSpacings) ? raw.lineSpacing : defaultDisplayPreferences.lineSpacing,
    letterSpacing: isOneOf(raw.letterSpacing, letterSpacings) ? raw.letterSpacing : defaultDisplayPreferences.letterSpacing,
    fontMode: isOneOf(raw.fontMode, fontModes) ? raw.fontMode : defaultDisplayPreferences.fontMode,
    motionMode: isOneOf(raw.motionMode, motionModes) ? raw.motionMode : defaultDisplayPreferences.motionMode,
    largerButtonsEnabled: raw.largerButtonsEnabled === true,
    largerTargetsEnabled: raw.largerTargetsEnabled === true,
    simplifiedInterfaceEnabled: raw.simplifiedInterfaceEnabled === true,
    reduceDecorationsEnabled: raw.reduceDecorationsEnabled === true,
    readingFocusEnabled: raw.readingFocusEnabled === true,
    childrenModeEnabled: raw.childrenModeEnabled === true,
  }
}

export function storageRowToPreferences(row: Record<string, unknown> | null | undefined): DisplayPreferences {
  if (!row) return defaultDisplayPreferences
  return sanitizeDisplayPreferences({
    theme: row.theme,
    accentColor: row.accent_color,
    greyscaleEnabled: row.greyscale_enabled,
    highVisibilityEnabled: row.high_visibility_enabled,
    negativeContrastEnabled: row.negative_contrast_enabled,
    lightBackgroundEnabled: row.light_background_enabled,
    highlightLinksEnabled: row.highlight_links_enabled,
    underlineLinksEnabled: row.underline_links_enabled,
    strongFocusEnabled: row.strong_focus_enabled,
    textSize: row.text_size,
    readingWidth: row.reading_width,
    lineSpacing: row.line_spacing,
    letterSpacing: row.letter_spacing,
    fontMode: row.font_mode,
    motionMode: row.motion_mode,
    largerButtonsEnabled: row.larger_buttons_enabled,
    largerTargetsEnabled: row.larger_targets_enabled,
    simplifiedInterfaceEnabled: row.simplified_interface_enabled,
    reduceDecorationsEnabled: row.reduce_decorations_enabled,
    readingFocusEnabled: row.reading_focus_enabled,
    childrenModeEnabled: row.children_mode_enabled,
  })
}

export function preferencesToStorageRow(preferences: DisplayPreferences, userId: string) {
  return {
    user_id: userId,
    theme: preferences.theme,
    accent_color: preferences.accentColor,
    greyscale_enabled: preferences.greyscaleEnabled,
    high_visibility_enabled: preferences.highVisibilityEnabled,
    negative_contrast_enabled: preferences.negativeContrastEnabled,
    light_background_enabled: preferences.lightBackgroundEnabled,
    highlight_links_enabled: preferences.highlightLinksEnabled,
    underline_links_enabled: preferences.underlineLinksEnabled,
    strong_focus_enabled: preferences.strongFocusEnabled,
    text_size: preferences.textSize,
    reading_width: preferences.readingWidth,
    line_spacing: preferences.lineSpacing,
    letter_spacing: preferences.letterSpacing,
    font_mode: preferences.fontMode,
    motion_mode: preferences.motionMode,
    larger_buttons_enabled: preferences.largerButtonsEnabled,
    larger_targets_enabled: preferences.largerTargetsEnabled,
    simplified_interface_enabled: preferences.simplifiedInterfaceEnabled,
    reduce_decorations_enabled: preferences.reduceDecorationsEnabled,
    reading_focus_enabled: preferences.readingFocusEnabled,
    children_mode_enabled: preferences.childrenModeEnabled,
  }
}
