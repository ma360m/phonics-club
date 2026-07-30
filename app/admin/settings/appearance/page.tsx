import { getAdminAppearanceSettings } from '@/actions/admin/appearance-settings'
import { AppearanceSettingsForm } from '@/components/admin/appearance-settings-form'

export default async function AdminAppearanceSettingsPage() {
  const settings = await getAdminAppearanceSettings()

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Developer and Admin Settings</p>
        <h1 className="mt-2 text-3xl font-bold">Appearance Settings</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Control the public default theme, enabled user-selectable themes, approved color overrides, Children&apos;s Learning Mode, and whether user-facing accessibility controls are shown.
        </p>
      </div>
      <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
        <p>Last updated: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Not published yet'}</p>
        <p>Last published: {settings.publishedAt ? new Date(settings.publishedAt).toLocaleString() : 'Not published yet'}</p>
      </div>
      <AppearanceSettingsForm settings={settings} />
    </div>
  )
}
