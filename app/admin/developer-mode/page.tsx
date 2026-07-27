import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Columns3,
  FilePenLine,
  Layers3,
  Monitor,
  PanelLeft,
  PanelRight,
  Smartphone,
  Tablet,
} from 'lucide-react'

const editablePages = [
  { key: 'home', label: 'Homepage', href: '/', editorHref: '/admin/content', editorLabel: 'Edit homepage content' },
  { key: 'about', label: 'About Us', href: '/about', editorHref: '/admin/content#about_page', editorLabel: 'Edit About content' },
  { key: 'blog', label: 'Blog', href: '/blog', editorHref: '/admin/blog', editorLabel: 'Edit blog posts' },
  { key: 'shop', label: 'Shop', href: '/shop', editorHref: '/admin/products', editorLabel: 'Edit products' },
  { key: 'courses', label: 'Courses', href: '/courses', editorHref: '/admin/courses', editorLabel: 'Edit courses' },
  { key: 'trainings', label: 'Trainings', href: '/trainings', editorHref: '/admin/content', editorLabel: 'Edit videos and content' },
  { key: 'research', label: 'Research', href: '/research', editorHref: '/admin/content#research_page', editorLabel: 'Edit research content' },
  { key: 'faqs', label: 'FAQs', href: '/faqs', editorHref: '/admin/content#faqs', editorLabel: 'Edit FAQs' },
  { key: 'contact', label: 'Contact', href: '/contact', editorHref: '/admin/content', editorLabel: 'Edit contact content' },
  { key: 'privacy', label: 'Privacy Policy', href: '/privacy', editorHref: '/admin/content#privacy_policy', editorLabel: 'Edit privacy policy' },
]

const previewModes = [
  { label: 'Desktop', icon: Monitor },
  { label: 'Tablet', icon: Tablet },
  { label: 'Mobile', icon: Smartphone },
]

export default async function DeveloperModePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireAdmin()
  const { page } = await searchParams
  const selected = editablePages.find((item) => item.key === page) ?? editablePages[0]

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Exit
            </Link>
          </Button>
          <form className="flex items-center gap-2" action="/admin/developer-mode">
            <label htmlFor="developer-page" className="sr-only">Page selector</label>
            <select
              id="developer-page"
              name="page"
              defaultValue={selected.key}
              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60A5FA]"
            >
              {editablePages.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="rounded-xl bg-[#1D4ED8]">
              Open
            </Button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[#1D4ED8]">Admin Preview Mode</span>
          {previewModes.map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </span>
          ))}
        </div>
      </header>

      <div className="grid flex-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="hidden border-r border-slate-200 bg-white p-4 lg:block">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <PanelLeft className="h-4 w-4 text-[#1D4ED8]" />
            Pages
          </div>
          <nav className="space-y-1" aria-label="Developer mode pages">
            {editablePages.map((item) => (
              <Link
                key={item.key}
                href={`/admin/developer-mode?page=${item.key}`}
                className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                  item.key === selected.key
                    ? 'bg-[#1D4ED8] text-white'
                    : 'text-slate-600 hover:bg-[#EFF6FF] hover:text-[#1D4ED8]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="min-h-[70vh] overflow-hidden bg-slate-100 p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live canvas</p>
              <h1 className="text-lg font-bold text-slate-900">{selected.label}</h1>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white">
              <Link href={selected.href} target="_blank">
                Open Page
              </Link>
            </Button>
          </div>
          <div className="h-[calc(100vh-14rem)] min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <iframe
              src={selected.href}
              title={`${selected.label} preview`}
              className="h-full w-full bg-white"
            />
          </div>
        </section>

        <aside className="border-t border-slate-200 bg-white p-4 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <PanelRight className="h-4 w-4 text-[#D30000]" />
            Edit
          </div>
          <div className="space-y-3">
            <Button asChild className="w-full justify-start rounded-xl bg-[#1D4ED8]">
              <Link href={selected.editorHref}>
                <FilePenLine className="h-4 w-4" />
                {selected.editorLabel}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-slate-200 bg-white">
              <Link href="/admin/content">
                <Layers3 className="h-4 w-4" />
                Site Content
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-xl border-slate-200 bg-white">
              <Link href="/admin/upload">
                <Columns3 className="h-4 w-4" />
                Media Upload
              </Link>
            </Button>
          </div>

          <div className="mt-6 rounded-2xl border border-[#FBBF24]/50 bg-[#FFF8E1] p-4 text-sm leading-6 text-slate-700">
            Draft layout storage is intentionally not connected to checkout, payments, enrolments, quiz scoring, certificates, or Supabase credentials.
          </div>
        </aside>
      </div>
    </div>
  )
}
