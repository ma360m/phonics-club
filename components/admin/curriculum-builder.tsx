'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CurriculumModule } from '@/types/database'

interface Props {
  value: CurriculumModule[]
  onChange: (modules: CurriculumModule[]) => void
}

export function CurriculumBuilder({ value, onChange }: Props) {
  const [modules, setModules] = useState<CurriculumModule[]>(value.length ? value : [{ title: 'Module 1', lessons: [{ title: 'Introduction', duration: '10 min' }] }])

  function update(next: CurriculumModule[]) {
    setModules(next)
    onChange(next)
  }

  function addModule() {
    update([...modules, { title: `Module ${modules.length + 1}`, lessons: [] }])
  }

  function removeModule(i: number) {
    update(modules.filter((_, idx) => idx !== i))
  }

  function addLesson(mi: number) {
    const next = [...modules]
    next[mi] = {
      ...next[mi],
      lessons: [...next[mi].lessons, { title: 'New lesson', duration: '15 min' }],
    }
    update(next)
  }

  function updateModuleTitle(mi: number, title: string) {
    const next = [...modules]
    next[mi] = { ...next[mi], title }
    update(next)
  }

  function updateLesson(mi: number, li: number, field: 'title' | 'duration', val: string) {
    const next = [...modules]
    const lessons = [...next[mi].lessons]
    lessons[li] = { ...lessons[li], [field]: val }
    next[mi] = { ...next[mi], lessons }
    update(next)
  }

  function removeLesson(mi: number, li: number) {
    const next = [...modules]
    next[mi] = { ...next[mi], lessons: next[mi].lessons.filter((_, idx) => idx !== li) }
    update(next)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Curriculum Builder</Label>
        <Button type="button" size="sm" variant="outline" onClick={addModule} className="rounded-xl">
          <Plus className="w-4 h-4 mr-1" /> Add Module
        </Button>
      </div>
      {modules.map((mod, mi) => (
        <div key={mi} className="border rounded-2xl p-4 bg-muted/30 space-y-3">
          <div className="flex gap-2 items-center">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              value={mod.title}
              onChange={(e) => updateModuleTitle(mi, e.target.value)}
              className="rounded-xl font-semibold"
              placeholder="Module title"
            />
            <Button type="button" size="icon" variant="ghost" onClick={() => removeModule(mi)} className="shrink-0">
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
          <div className="pl-6 space-y-2">
            {mod.lessons.map((lesson, li) => (
              <div key={li} className="flex gap-2">
                <Input
                  value={lesson.title}
                  onChange={(e) => updateLesson(mi, li, 'title', e.target.value)}
                  className="rounded-xl text-sm flex-1"
                  placeholder="Lesson title"
                />
                <Input
                  value={lesson.duration ?? ''}
                  onChange={(e) => updateLesson(mi, li, 'duration', e.target.value)}
                  className="rounded-xl text-sm w-28"
                  placeholder="Duration"
                />
                <Button type="button" size="icon" variant="ghost" onClick={() => removeLesson(mi, li)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="outline" onClick={() => addLesson(mi)} className="rounded-xl text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add Lesson
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
