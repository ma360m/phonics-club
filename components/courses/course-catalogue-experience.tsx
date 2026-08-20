'use client'

import Image from 'next/image'
import type { ComponentType } from 'react'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Award,
  Baby,
  BookOpen,
  Briefcase,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Home,
  Layers,
  Library,
  School,
  Sparkles,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DEFAULT_COURSE_CATALOGUE_CONTENT,
  normalizeCourseCatalogueContent,
  type CatalogueAcademy,
  type CourseCatalogueContent,
  type CourseCatalogueIconKey,
} from '@/lib/course-catalogue-content'

type IconComponent = ComponentType<{ className?: string }>

const iconMap: Record<CourseCatalogueIconKey, IconComponent> = {
  baby: Baby,
  library: Library,
  bookOpen: BookOpen,
  home: Home,
  graduationCap: GraduationCap,
  briefcase: Briefcase,
  sparkles: Sparkles,
  award: Award,
  school: School,
}

function statusClass(status: string) {
  const lowered = status.toLowerCase()
  if (lowered.includes('free')) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (lowered.includes('coming')) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (lowered.includes('application')) return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  if (lowered.includes('institutional')) return 'border-slate-300 bg-slate-100 text-slate-700'
  return 'border-blue-200 bg-blue-50 text-[#1D4ED8]'
}

export function CourseCatalogueExperience({ content = DEFAULT_COURSE_CATALOGUE_CONTENT }: { content?: CourseCatalogueContent }) {
  const catalogue = useMemo(() => normalizeCourseCatalogueContent(content), [content])
  const academies = catalogue.academies
  const pathways = catalogue.pathways
  const bundles = catalogue.bundles
  const certificateFramework = catalogue.certificateFramework
  const totalCourses = academies.reduce((sum, academy) => sum + academy.courses.length, 0)
  const firstAcademy = academies[0] ?? DEFAULT_COURSE_CATALOGUE_CONTENT.academies[0]

  const [activeAcademyId, setActiveAcademyId] = useState(firstAcademy.id)
  const [selectedCourseId, setSelectedCourseId] = useState(firstAcademy.courses[0]?.id ?? 1)

  const activeAcademy = useMemo(
    () => academies.find((academy) => academy.id === activeAcademyId) ?? firstAcademy,
    [academies, activeAcademyId, firstAcademy],
  )
  const selectedCourse =
    activeAcademy.courses.find((course) => course.id === selectedCourseId) ?? activeAcademy.courses[0]
  const ActiveIcon = iconMap[activeAcademy.icon] ?? BookOpen

  function selectAcademy(academy: CatalogueAcademy) {
    setActiveAcademyId(academy.id)
    setSelectedCourseId(academy.courses[0]?.id ?? 1)
  }

  return (
    <div className="overflow-hidden">
      <section className="relative isolate bg-white">
        <Image
          src="/images/gallery/play.jpg"
          alt="Children learning through phonics activities"
          fill
          priority
          className="absolute inset-0 -z-20 object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 -z-10 bg-[#07111F]/72" />
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:py-18">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="max-w-3xl text-white"
          >
            <div className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#FBBF24]" />
              {catalogue.hero.badge}
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-normal sm:text-5xl lg:text-6xl">
              {catalogue.hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-white/84">
              {catalogue.hero.subtitle}
            </p>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Academies', String(academies.length)],
                ['Courses', String(totalCourses)],
                ['Bundles', String(bundles.length)],
                ['Pathways', String(pathways.length)],
              ].map(([label, value]) => (
                <motion.div
                  key={label}
                  whileHover={{ y: -3 }}
                  className="rounded-lg border border-white/18 bg-white/12 p-4 backdrop-blur"
                >
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="mt-1 text-sm text-white/70">{label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.12, ease: 'easeOut' }}
            className="self-end rounded-lg border border-white/20 bg-white/92 p-5 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                <Image src="/logo.png" alt="Phonics Club" fill className="object-contain p-2" sizes="64px" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1D4ED8]">{catalogue.hero.cardTitle}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {catalogue.hero.cardDescription}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {pathways.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.22 + index * 0.06 }}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="text-sm font-bold text-[#0F172A]">{item.label}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-600">{item.path}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-[#F6F8FC] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-[#1D4ED8]">{catalogue.overview.kicker}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#0F172A]">{catalogue.overview.title}</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                {catalogue.overview.description}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              <span className="font-bold text-[#0F172A]">{totalCourses}</span> {catalogue.overview.totalLabel}
            </div>
          </div>

          <div className="mt-7 overflow-x-auto pb-2">
            <div className="flex min-w-max gap-2">
              {academies.map((academy) => {
                const Icon = iconMap[academy.icon] ?? BookOpen
                const selected = academy.id === activeAcademy.id
                return (
                  <button
                    key={academy.id}
                    type="button"
                    onClick={() => selectAcademy(academy)}
                    className={cn(
                      'relative flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-bold transition-colors',
                      selected ? academy.accent : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-[#1D4ED8]',
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="academy-tab"
                        className="absolute inset-0 -z-10 rounded-lg"
                        transition={{ type: 'spring', stiffness: 440, damping: 34 }}
                      />
                    )}
                    <Icon className="h-4 w-4" />
                    {academy.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAcademy.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px]"
            >
              <div>
                <div className="flex items-start gap-4">
                  <div className={cn('rounded-lg border p-3', activeAcademy.soft)}>
                    <ActiveIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold tracking-normal text-[#0F172A]">{activeAcademy.title}</h2>
                    <p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">{activeAcademy.focus}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Audience', activeAcademy.audience, Users],
                    ['Launch model', activeAcademy.launch, Layers],
                    ['Courses', `${activeAcademy.courses.length} entries`, FileText],
                  ].map(([label, value, Icon]) => (
                    <div key={String(label)} className="rounded-lg border border-slate-200 bg-[#F8FAFC] p-4">
                      <Icon className="h-5 w-5 text-[#1D4ED8]" />
                      <div className="mt-3 text-xs font-bold text-slate-500">{label as string}</div>
                      <div className="mt-1 text-sm font-semibold text-[#0F172A]">{value as string}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-2">
                  {activeAcademy.courses.map((course, index) => {
                    const selected = course.id === selectedCourse.id
                    return (
                      <motion.button
                        key={course.id}
                        type="button"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.28, delay: index * 0.025 }}
                        onClick={() => setSelectedCourseId(course.id)}
                        className={cn(
                          'group rounded-lg border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md',
                          selected ? 'border-[#1D4ED8] ring-2 ring-blue-100' : 'border-slate-200',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1D4ED8]">Course {course.id}</p>
                            <h3 className="mt-1 text-base font-bold leading-6 text-[#0F172A]">{course.title}</h3>
                          </div>
                          <ChevronRight
                            className={cn(
                              'mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1',
                              selected && 'text-[#1D4ED8]',
                            )}
                          />
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{course.summary}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {course.level}
                          </span>
                          <span className={cn('rounded-md border px-2.5 py-1 text-xs font-semibold', statusClass(course.status))}>
                            {course.status}
                          </span>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              <motion.aside
                layout
                className="h-fit rounded-lg border border-slate-200 bg-[#F8FAFC] p-5 shadow-sm lg:sticky lg:top-6"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCourse.id}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className={cn('inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold', activeAcademy.soft)}>
                      <Award className="h-4 w-4" />
                      {selectedCourse.award}
                    </div>
                    <h3 className="mt-5 text-2xl font-bold tracking-normal text-[#0F172A]">{selectedCourse.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{selectedCourse.summary}</p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <Users className="h-4 w-4 text-[#1D4ED8]" />
                        <p className="mt-2 text-xs font-bold text-slate-500">Audience</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A]">{selectedCourse.audience}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                        <Clock className="h-4 w-4 text-[#1D4ED8]" />
                        <p className="mt-2 text-xs font-bold text-slate-500">Duration</p>
                        <p className="mt-1 text-sm font-semibold text-[#0F172A]">{selectedCourse.duration}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-4">
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">Core curriculum</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{selectedCourse.curriculum}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#0F172A]">Learning experience</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{selectedCourse.experience}</p>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.aside>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="bg-[#F6F8FC] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
            <div>
              <p className="text-sm font-bold text-[#B91C1C]">{catalogue.bundlesIntro.kicker}</p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal text-[#0F172A]">{catalogue.bundlesIntro.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-600">
                {catalogue.bundlesIntro.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {bundles.map((bundle, index) => (
                <motion.div
                  key={bundle.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.32, delay: index * 0.04 }}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-[#1D4ED8] p-2 text-white">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">{bundle.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{bundle.includes}</p>
                      <p className="mt-3 text-xs font-bold text-slate-500">{bundle.audience}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-slate-200 bg-[#0F172A] p-6 text-white shadow-sm md:p-8">
            <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div>
                <p className="text-sm font-bold text-[#FBBF24]">{catalogue.certificateIntro.kicker}</p>
                <h2 className="mt-2 text-3xl font-bold tracking-normal">{catalogue.certificateIntro.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  {catalogue.certificateIntro.description}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {certificateFramework.map(([award, use]) => (
                  <div key={award} className="rounded-lg border border-white/14 bg-white/8 p-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-[#FBBF24]" />
                      <h3 className="text-sm font-bold">{award}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/72">{use}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
