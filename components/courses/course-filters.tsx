'use client'

import { SlidersHorizontal, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  filters: {
    q: string
    category: string
    level: string
    duration: string
    price: string
    sort: string
  }
  categories: string[]
  levels: string[]
}

function formatCourseCategory(category: string): string {
  return category.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function FilterFields({ filters, categories, levels }: Props) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="course-search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="course-search" name="q" defaultValue={filters.q} placeholder="Search courses" className="rounded-xl pl-9" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-category">Category</Label>
        <select id="course-category" name="category" defaultValue={filters.category} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="all">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {formatCourseCategory(category)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-level">Level</Label>
        <select id="course-level" name="level" defaultValue={filters.level} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="all">All levels</option>
          {levels.map((level) => (
            <option key={level} value={level}>
              {formatCourseCategory(level)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-duration">Duration</Label>
        <select id="course-duration" name="duration" defaultValue={filters.duration} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="all">Any duration</option>
          <option value="short">Up to 4 weeks</option>
          <option value="medium">5 to 8 weeks</option>
          <option value="long">9+ weeks</option>
          <option value="self-paced">Self-paced</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-price">Price</Label>
        <select id="course-price" name="price" defaultValue={filters.price} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="all">Free and paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="course-sort">Sort</Label>
        <select id="course-sort" name="sort" defaultValue={filters.sort} className="w-full rounded-xl border bg-background px-3 py-2 text-sm">
          <option value="newest">Newest</option>
          <option value="popularity">Popularity</option>
          <option value="rating">Rating</option>
          <option value="title">Title</option>
        </select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 rounded-xl bg-[#D30000] hover:bg-[#D30000]/90">
          Apply
        </Button>
        <Button asChild variant="outline" className="rounded-xl">
          <a href="/courses">Reset</a>
        </Button>
      </div>
    </>
  )
}

export function CourseFilters(props: Props) {
  return (
    <>
      <aside className="hidden rounded-2xl border bg-card p-5 shadow-sm lg:block">
        <form action="/courses" className="space-y-4">
          <FilterFields {...props} />
        </form>
      </aside>

      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="rounded-xl">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>Filter courses</SheetTitle>
              <SheetDescription>Refine courses by topic, level, duration and price.</SheetDescription>
            </SheetHeader>
            <form action="/courses" className="mt-4 space-y-4">
              <FilterFields {...props} />
            </form>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
