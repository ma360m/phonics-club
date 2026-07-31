import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { LmsShell } from '@/components/lms/lms-shell'
import { LmsPageHeader } from '@/components/lms/lms-primitives'
import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form'
import { getProfile, isAdminRole, isLmsManagerRole, requireAuth } from '@/lib/auth'

export default async function DashboardProfilePage() {
  await requireAuth()
  const profile = await getProfile()
  const isAdmin = isAdminRole(profile?.role)
  const isLmsManager = isLmsManagerRole(profile?.role)

  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <LmsShell userName={profile?.full_name} userEmail={profile?.email} isAdmin={isAdmin} isLmsManager={isLmsManager}>
        <LmsPageHeader
          eyebrow="Profile Settings"
          title="Account and security"
          description="Manage your display name, username, and password from a secure signed-in session."
        />
        <ProfileSettingsForm
          profile={{
            email: profile?.email ?? '',
            full_name: profile?.full_name ?? '',
            username: profile?.username ?? '',
          }}
        />
      </LmsShell>
      <Footer />
    </main>
  )
}
