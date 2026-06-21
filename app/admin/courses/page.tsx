import Link from 'next/link'
import { getAdminCourses, deleteCourseAction } from '@/actions/admin/courses'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default async function AdminCoursesPage() {
  const courses = await getAdminCourses()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Courses</h1>
        <Button asChild className="rounded-xl bg-[#1D4ED8]">
          <Link href="/admin/courses/new"><Plus className="w-4 h-4 mr-2" /> Add Course</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {courses.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-card rounded-2xl border p-4">
            <div>
              <p className="font-semibold">{c.title}</p>
              <p className="text-sm text-muted-foreground capitalize">{c.category} · {c.level}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline" className="rounded-lg">
                <Link href={`/admin/courses/${c.id}`}><Pencil className="w-3.5 h-3.5" /></Link>
              </Button>
              <form action={deleteCourseAction.bind(null, c.id)}>
                <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
