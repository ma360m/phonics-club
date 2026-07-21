'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { toError } from '@/lib/friendly-error'
import type { UserRole } from '@/types/database'

const allowedRoles = new Set<UserRole>(['user', 'instructor', 'admin'])

function normalizeRole(value: FormDataEntryValue | null): UserRole {
  const role = String(value ?? 'user') as UserRole
  if (!allowedRoles.has(role)) throw toError('Invalid role selected', 'User role could not be updated.')
  return role
}

export async function updateProfileRoleAction(profileId: string, formData: FormData): Promise<void> {
  await requireAdmin()
  const role = normalizeRole(formData.get('role'))
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ role } as never)
    .eq('id', profileId)

  if (error) throw toError(error, 'User role could not be updated.')
  revalidatePath('/admin/users')
  revalidatePath('/admin/courses')
}

export async function makeInstructorByEmailAction(formData: FormData): Promise<void> {
  await requireAdmin()
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) throw toError('Enter a valid email address', 'Instructor account could not be approved.')

  const supabase = await createClient()
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (lookupError) throw toError(lookupError, 'Instructor account could not be approved.')
  if (!profile) {
    throw toError('No profile exists for that email. Ask the instructor to sign up first.', 'Instructor account could not be approved.')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: 'instructor' } as never)
    .eq('id', profile.id)

  if (error) throw toError(error, 'Instructor account could not be approved.')
  revalidatePath('/admin/users')
  revalidatePath('/admin/courses')
}

export async function revokeInstructorAccessAction(profileId: string): Promise<void> {
  await requireAdmin()
  const supabase = await createClient()

  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'user' } as never)
    .eq('id', profileId)
    .eq('role', 'instructor')

  if (roleError) throw toError(roleError, 'Instructor access could not be revoked.')

  await supabase
    .from('course_instructors')
    .delete()
    .eq('profile_id', profileId)

  revalidatePath('/admin/users')
  revalidatePath('/admin/courses')
}
