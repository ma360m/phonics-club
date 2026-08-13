import { getAllProfiles } from '@/lib/data/queries'
import { requireAdmin } from '@/lib/auth'
import { getAdminCustomerRows } from '@/lib/admin/customers'
import { makeInstructorByEmailAction, revokeInstructorAccessAction, updateProfileRoleAction } from '@/actions/admin/users'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LmsEmptyState, LmsPageHeader } from '@/components/lms/lms-primitives'
import { formatDate } from '@/utils/format'
import { Download, GraduationCap, ShieldCheck, UserRound, Users } from 'lucide-react'
import type { UserRole } from '@/types/database'

const roleOptions: UserRole[] = ['user', 'instructor', 'admin']

function roleTone(role: UserRole): 'default' | 'secondary' | 'outline' {
  if (role === 'admin') return 'default'
  if (role === 'instructor') return 'outline'
  return 'secondary'
}

export default async function AdminUsersPage() {
  await requireAdmin()
  const [users, customerRows] = await Promise.all([getAllProfiles(), getAdminCustomerRows()])
  const instructors = users.filter((user) => user.role === 'instructor')
  const admins = users.filter((user) => user.role === 'admin')
  const coursesByEmail = new Map<string, string[]>()

  customerRows.forEach((row) => {
    const email = row.email.trim().toLowerCase()
    const courses = [...row.enrolledCourses, ...row.coursePaymentCourses].filter(Boolean)
    if (email && courses.length) coursesByEmail.set(email, Array.from(new Set(courses)))
  })

  return (
    <div className="w-full max-w-none space-y-6">
      <LmsPageHeader
        eyebrow="User Management"
        title="Accounts and instructor approvals"
        description="Approve existing accounts as instructors, manage roles and keep LMS-building permissions explicit."
        action={
          <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white">
            <a href="/api/admin/students/export">
              <Download className="mr-2 h-4 w-4" />
              Export Students CSV
            </a>
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Users className="h-5 w-5 text-[#1D4ED8]" />
          <p className="mt-3 text-3xl font-bold text-[#0F172A]">{users.length}</p>
          <p className="text-sm text-slate-500">Total accounts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <GraduationCap className="h-5 w-5 text-[#8B1E2D]" />
          <p className="mt-3 text-3xl font-bold text-[#0F172A]">{instructors.length}</p>
          <p className="text-sm text-slate-500">Approved instructors</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          <p className="mt-3 text-3xl font-bold text-[#0F172A]">{admins.length}</p>
          <p className="text-sm text-slate-500">Admins</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#0F172A]">Approve Instructor By Email</h2>
          <p className="mt-1 text-sm text-slate-500">
            The person must already have created an account. Approval changes their role to instructor and unlocks LMS course-building access.
          </p>
        </div>
        <form action={makeInstructorByEmailAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            name="email"
            type="email"
            required
            placeholder="instructor@example.com"
            className="rounded-xl border-slate-200"
          />
          <Button type="submit" className="rounded-xl bg-[#1D4ED8]">
            <GraduationCap className="mr-2 h-4 w-4" />
            Make Instructor
          </Button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">All Accounts</h2>
            <p className="mt-1 text-sm text-slate-500">Use role changes carefully. Only admins should receive full store and site access.</p>
          </div>
          <Button asChild size="sm" className="w-fit rounded-xl bg-[#1D4ED8]">
            <a href="/api/admin/students/export">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
        {users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-[#F8FAFC] text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 text-left">User</th>
                  <th className="px-5 py-3 text-left">Email</th>
                  <th className="px-5 py-3 text-left">Courses Enrolled</th>
                  <th className="px-5 py-3 text-left">Current Role</th>
                  <th className="px-5 py-3 text-left">Joined</th>
                  <th className="px-5 py-3 text-right">Manage</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const courseTitles = coursesByEmail.get(user.email.trim().toLowerCase()) ?? []

                  return (
                    <tr key={user.id} className="border-t border-slate-200">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8]">
                              <UserRound className="h-4 w-4" />
                            </span>
                          )}
                          <span className="font-semibold text-[#0F172A]">{user.full_name ?? 'Unnamed user'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{user.email}</td>
                      <td className="px-5 py-4">
                        {courseTitles.length ? (
                          <div className="flex max-w-[420px] flex-wrap gap-1.5">
                            {courseTitles.map((title) => (
                              <Badge key={title} variant="outline" className="rounded-full border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]">
                                {title}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400">No course enrollment</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant={roleTone(user.role)} className="capitalize">{user.role}</Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                          {user.role === 'instructor' && (
                            <form action={revokeInstructorAccessAction.bind(null, user.id)}>
                              <Button type="submit" size="sm" variant="destructive" className="rounded-xl">
                                Revoke Instructor
                              </Button>
                            </form>
                          )}
                          <form action={updateProfileRoleAction.bind(null, user.id)} className="flex items-center justify-end gap-2">
                            <label className="sr-only" htmlFor={`role-${user.id}`}>Role</label>
                            <select
                              id={`role-${user.id}`}
                              name="role"
                              defaultValue={user.role}
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
                            >
                              {roleOptions.map((role) => (
                                <option key={role} value={role}>{role}</option>
                              ))}
                            </select>
                            <Button type="submit" size="sm" variant="outline" className="rounded-xl border-slate-200 bg-white">
                              Save
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <LmsEmptyState
            icon={Users}
            title="No accounts found"
            description="Profiles will appear here after users sign up."
          />
        )}
      </section>
    </div>
  )
}
