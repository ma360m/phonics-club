'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import type { ActionResult } from '@/types'

export async function enrollInCourseAction(courseId: string): Promise<ActionResult> {
  const user = await getSession()
  if (!user) return { success: false, error: 'Please sign in to enroll' }

  const supabase = await createClient()
  const { error } = await supabase.from('enrollments').insert({
    user_id: user.id,
    course_id: courseId,
    progress: 0,
  } as never)

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Already enrolled' }
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/courses')
  return { success: true }
}

export async function getUserEnrollments() {
  const user = await getSession()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('enrollments')
    .select('*, courses(*)')
    .eq('user_id', user.id)

  return data ?? []
}
