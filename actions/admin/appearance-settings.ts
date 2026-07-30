'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isAdminRole, requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  accentColors,
  appearanceThemes,
  defaultAppearanceSettings,
  type AccentColor,
  type AppearanceSettings,
  type AppearanceTheme,
} from '@/lib/display-preferences/types'
import type { ActionResult } from '@/types'

const hexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a valid hex color such as #1D4ED8.')

const themeColorSchema = z.object({
  background: hexColorSchema.optional(),
  foreground: hexColorSchema.optional(),
  card: hexColorSchema.optional(),
  cardForeground: hexColorSchema.optional(),
  primary: hexColorSchema.optional(),
  primaryForeground: hexColorSchema.optional(),
  border: hexColorSchema.optional(),
  ring: hexColorSchema.optional(),
})

const themeConfigSchema = z.record(z.enum(appearanceThemes), themeColorSchema.partial()).default({})

const appearanceSettingsSchema = z.object({
  default_theme: z.enum(appearanceThemes),
  enabled_themes: z.array(z.enum(appearanceThemes)).min(1),
  neon_learning_enabled: z.boolean(),
  children_mode_enabled: z.boolean(),
  accessibility_controls_enabled: z.boolean(),
  default_accent_color: z.enum(accentColors),
  theme_config: themeConfigSchema,
  intent: z.enum(['save-draft', 'publish', 'restore', 'discard-draft']),
})

function hexToRgb(color: string) {
  const hex = color.replace('#', '')
  return {
    r: Number.parseInt(hex.slice(0, 2), 16) / 255,
    g: Number.parseInt(hex.slice(2, 4), 16) / 255,
    b: Number.parseInt(hex.slice(4, 6), 16) / 255,
  }
}

function channelToLinear(value: number) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(color: string) {
  const rgb = hexToRgb(color)
  return 0.2126 * channelToLinear(rgb.r) + 0.7152 * channelToLinear(rgb.g) + 0.0722 * channelToLinear(rgb.b)
}

function contrastRatio(a: string, b: string) {
  const light = Math.max(luminance(a), luminance(b))
  const dark = Math.min(luminance(a), luminance(b))
  return (light + 0.05) / (dark + 0.05)
}

function validateThemeContrast(themeConfig: Record<string, z.infer<typeof themeColorSchema>>) {
  for (const [theme, config] of Object.entries(themeConfig)) {
    if (config.background && config.foreground && contrastRatio(config.background, config.foreground) < 4.5) {
      return `${theme} background and text contrast is too low.`
    }
    if (config.card && config.cardForeground && contrastRatio(config.card, config.cardForeground) < 4.5) {
      return `${theme} card and text contrast is too low.`
    }
    if (config.primary && config.primaryForeground && contrastRatio(config.primary, config.primaryForeground) < 4.5) {
      return `${theme} button and button text contrast is too low.`
    }
  }
  return null
}

function normalizeSettings(row: Record<string, unknown> | null | undefined): AppearanceSettings {
  if (!row) return defaultAppearanceSettings
  return {
    defaultTheme: (row.default_theme as AppearanceTheme) ?? defaultAppearanceSettings.defaultTheme,
    enabledThemes: Array.isArray(row.enabled_themes)
      ? (row.enabled_themes.filter((theme) => appearanceThemes.includes(theme as AppearanceTheme)) as AppearanceTheme[])
      : defaultAppearanceSettings.enabledThemes,
    neonLearningEnabled: row.neon_learning_enabled === true,
    childrenModeEnabled: row.children_mode_enabled !== false,
    accessibilityControlsEnabled: row.accessibility_controls_enabled !== false,
    defaultAccentColor: (row.default_accent_color as AccentColor) ?? defaultAppearanceSettings.defaultAccentColor,
    themeConfig: (row.theme_config as Record<string, unknown>) ?? {},
    draftConfig: (row.draft_config as Record<string, unknown>) ?? {},
    publishedAt: row.published_at as string | null | undefined,
    publishedBy: row.published_by as string | null | undefined,
    updatedAt: row.updated_at as string | null | undefined,
  }
}

export async function getAdminAppearanceSettings() {
  const profile = await requireAdmin()
  if (!isAdminRole(profile.role)) return defaultAppearanceSettings

  const supabase = await createClient()
  const { data } = await supabase
    .from('appearance_settings')
    .select('*')
    .eq('id', 1)
    .maybeSingle()
  return normalizeSettings(data as Record<string, unknown> | null)
}

export async function saveAppearanceSettingsAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin()
  const rawThemeConfig = String(formData.get('theme_config') ?? '{}')
  let themeConfig: unknown = {}
  try {
    themeConfig = JSON.parse(rawThemeConfig)
  } catch {
    return { success: false, error: 'Theme color settings are malformed.' }
  }

  const parsed = appearanceSettingsSchema.safeParse({
    default_theme: formData.get('default_theme'),
    enabled_themes: formData.getAll('enabled_themes'),
    neon_learning_enabled: formData.get('neon_learning_enabled') === 'on',
    children_mode_enabled: formData.get('children_mode_enabled') === 'on',
    accessibility_controls_enabled: formData.get('accessibility_controls_enabled') === 'on',
    default_accent_color: formData.get('default_accent_color'),
    theme_config: themeConfig,
    intent: formData.get('intent') || 'save-draft',
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message }

  const enabledThemes = new Set(parsed.data.enabled_themes)
  enabledThemes.add('phonics-classic')
  if (!parsed.data.neon_learning_enabled) enabledThemes.delete('neon-learning')
  if (!enabledThemes.has(parsed.data.default_theme)) {
    return { success: false, error: 'The default theme must also be enabled.' }
  }

  const contrastError = validateThemeContrast(parsed.data.theme_config)
  if (contrastError) return { success: false, error: contrastError }

  const supabase = await createClient()
  const basePayload = {
    default_theme: parsed.data.default_theme,
    enabled_themes: Array.from(enabledThemes),
    neon_learning_enabled: parsed.data.neon_learning_enabled,
    children_mode_enabled: parsed.data.children_mode_enabled,
    accessibility_controls_enabled: parsed.data.accessibility_controls_enabled,
    default_accent_color: parsed.data.default_accent_color,
  }

  let payload: Record<string, unknown>
  if (parsed.data.intent === 'restore') {
    payload = {
      default_theme: defaultAppearanceSettings.defaultTheme,
      enabled_themes: defaultAppearanceSettings.enabledThemes,
      neon_learning_enabled: defaultAppearanceSettings.neonLearningEnabled,
      children_mode_enabled: defaultAppearanceSettings.childrenModeEnabled,
      accessibility_controls_enabled: defaultAppearanceSettings.accessibilityControlsEnabled,
      default_accent_color: defaultAppearanceSettings.defaultAccentColor,
      theme_config: {},
      draft_config: {},
      published_at: new Date().toISOString(),
      published_by: admin.id,
    }
  } else if (parsed.data.intent === 'discard-draft') {
    payload = { draft_config: {} }
  } else if (parsed.data.intent === 'publish') {
    payload = {
      ...basePayload,
      theme_config: parsed.data.theme_config,
      draft_config: {},
      published_at: new Date().toISOString(),
      published_by: admin.id,
    }
  } else {
    payload = {
      ...basePayload,
      draft_config: parsed.data.theme_config,
    }
  }

  const { error } = await supabase
    .from('appearance_settings')
    .update(payload as never)
    .eq('id', 1)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/settings/appearance')
  revalidatePath('/')
  return { success: true }
}
