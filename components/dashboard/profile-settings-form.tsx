'use client'

import { useActionState } from 'react'
import { updateProfileSettingsAction, updateSignedInPasswordAction } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/password-input'
import type { ActionResult } from '@/types'

type ProfileSettingsFormProps = {
  profile: {
    email: string
    full_name: string | null
    username?: string | null
  }
}

const initialState: ActionResult = { success: false }

export function ProfileSettingsForm({ profile }: ProfileSettingsFormProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileSettingsAction, initialState)
  const [passwordState, passwordAction, passwordPending] = useActionState(updateSignedInPasswordAction, initialState)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <form action={profileAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Public profile</h2>
          <p className="mt-1 text-sm text-slate-500">Choose the name and username shown in your learning space.</p>
        </div>

        {profileState.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{profileState.error}</p>}
        {profileState.success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Profile updated.</p>}

        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile.full_name ?? ''}
            required
            minLength={2}
            maxLength={120}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            defaultValue={profile.username ?? ''}
            pattern="[a-z0-9_]{3,30}"
            maxLength={30}
            placeholder="maryam_reader"
            className="rounded-xl"
          />
          <p className="text-xs text-slate-500">Use 3-30 lowercase letters, numbers, or underscores. Leave blank if you do not want a username yet.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={profile.email} disabled className="rounded-xl bg-slate-50" />
          <p className="text-xs text-slate-500">Email changes use the secure account verification flow.</p>
        </div>

        <Button type="submit" disabled={profilePending} className="rounded-xl bg-[#1D4ED8]">
          {profilePending ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>

      <form action={passwordAction} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">Password</h2>
          <p className="mt-1 text-sm text-slate-500">Change your password from your signed-in account. Passwords are never shown to admins.</p>
        </div>

        {passwordState.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{passwordState.error}</p>}
        {passwordState.success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password changed. Use the new password next time you sign in.</p>}

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput id="currentPassword" name="currentPassword" required autoComplete="current-password" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput id="password" name="password" required autoComplete="new-password" className="rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <PasswordInput id="confirmPassword" name="confirmPassword" required autoComplete="new-password" className="rounded-xl" />
        </div>

        <Button type="submit" disabled={passwordPending} className="rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
          {passwordPending ? 'Changing...' : 'Change Password'}
        </Button>
      </form>
    </div>
  )
}
