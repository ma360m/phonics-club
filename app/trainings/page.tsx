import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { TrainingRegistrationForm } from '@/components/training/training-registration-form'
import { WebinarCarousel } from '@/components/training/webinar-carousel'
import { EagerTrainingVideo } from '@/components/training/eager-training-video'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { buildMetadata } from '@/utils/seo'
import { COMPANY, TRAINING_CALENDAR_2026, ONLINE_WEBINARS, WEEKLY_PLAN } from '@/lib/company'
import { getContactSettings, getWebsiteVideos } from '@/lib/site-content'
import { getPublishedTrainingEvents } from '@/actions/training'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { GraduationCap, MapPin, Monitor } from 'lucide-react'

const TRAINING_HERO_DESCRIPTION =
  'Phonics Club Pvt. Ltd. is a leading organization dedicated to promoting excellence in literacy education through the internationally recognized Synthetic Phonics approach. We equip teachers with the confidence, knowledge, and practical teaching strategies needed to nurture confident readers & writers. Through professional training, educational consultancy, and ongoing support, we partner with schools and educators to create lasting impact in classrooms across Pakistan and beyond.'

export const metadata = buildMetadata({
  title: 'Training',
  description: 'Jolly Phonics and Jolly Literacy training - online webinars and onsite classroom courses in Pakistan',
  path: '/trainings',
})

export default async function TrainingsPage() {
  const [websiteVideos, trainingEvents, contactSettings] = await Promise.all([
    getWebsiteVideos(),
    getPublishedTrainingEvents(),
    getContactSettings(),
  ])
  const adminOnsiteEvents = trainingEvents
    .filter((event) => event.event_type === 'onsite_training' && event.event_date)
    .map((event) => ({
      title: event.title,
      date: event.event_date as string,
      season: event.season ?? 'Upcoming Cohort',
      description: event.description,
    }))
  const adminWebinars = trainingEvents
    .filter((event) => event.event_type === 'online_webinar' && event.event_date)
    .map((event) => ({
      title: event.title,
      date: event.event_date as string,
      status: event.status,
    }))
  const onsiteEvents = adminOnsiteEvents.length ? adminOnsiteEvents : TRAINING_CALENDAR_2026
  const webinars = adminWebinars.length ? adminWebinars : ONLINE_WEBINARS

  return (
    <main>
      <AnnouncementBar />
      <Navbar />

      <section className="relative overflow-hidden bg-[#0F172A] text-white">
        {websiteVideos.trainingsHeroVideoUrl ? (
          <EagerTrainingVideo
            src={websiteVideos.trainingsHeroVideoUrl}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[#0F172A]/70" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-12">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h1 className="mb-4 text-4xl font-bold">Professional Training</h1>
            <p className="text-lg text-white/85">{TRAINING_HERO_DESCRIPTION}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <WhatsAppButton contactSettings={contactSettings} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Training', desc: 'Programs shaped for teachers, parents, schools, and implementation teams.', icon: GraduationCap },
              { title: 'Support', desc: 'Follow-up support for schools, academies, institutions, and home learning.', icon: Monitor },
              { title: 'Consultancy', desc: 'School assessments, syllabus design, and classroom implementation support.', icon: MapPin },
            ].map(({ title, desc, icon: Icon }) => (
              <div key={title} className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-sm backdrop-blur">
                <Icon className="mb-4 h-8 w-8 text-[#FBBF24]" />
                <h3 className="mb-2 text-lg font-bold">{title}</h3>
                <p className="text-sm text-white/80">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-6 border-y border-[#D7DEE8] bg-white" aria-hidden="true" />

      <section className="border-b border-[#D7DEE8] bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className={`mb-8 grid gap-6 lg:items-center ${websiteVideos.trainingsOnsiteVideoUrl ? 'lg:grid-cols-[0.9fr_1.1fr]' : 'lg:grid-cols-1'}`}>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#D30000]">Onsite Training</p>
              <h2 className="flex items-center gap-2 text-3xl font-bold text-[#111827]">
                <MapPin className="h-7 w-7 text-[#D30000]" />
                Classroom Training (Onsite) - 2026 Calendar
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                Book a 2026 onsite cohort from August onward. These sessions use a solid registration layout so dates,
                participant details, and preferred months are easy to review.
              </p>
            </div>

            {websiteVideos.trainingsOnsiteVideoUrl ? (
              <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-sm">
                <div className="aspect-video bg-[#0F172A]">
                  <EagerTrainingVideo
                    src={websiteVideos.trainingsOnsiteVideoUrl}
                    controls
                    className="h-full w-full object-cover sm:object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {onsiteEvents.map((event) => (
              <div key={event.date + event.title} className="rounded-2xl border border-[#CBD5E1] bg-white p-6 text-[#111827] shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.season}</p>
                  </div>
                  <Badge variant="outline">{formatDate(event.date)}</Badge>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  {'description' in event && event.description
                    ? event.description
                    : 'Register your interest below. Minimum delegates are required. Cancellation policy applies with 15 working days notice.'}
                </p>
                <TrainingRegistrationForm
                  trainingType="onsite_classroom"
                  eventTitle={`${event.title} - ${event.season}`}
                  eventDate={event.date}
                />
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-[#CBD5E1] bg-white p-6 text-center shadow-sm">
            <h3 className="text-xl font-bold">Need a school-specific training plan?</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              Share your preferred month and approximate participant count in the registration form, or contact Phonics Club for a custom onsite session.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
              International trainings are also available for schools and organizations interested in having Phonics Club conduct a programme outside Pakistan.
            </p>
            <div className="mt-5 flex justify-center">
              <WhatsAppButton contactSettings={contactSettings} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12">
        <section className="mb-16">
          <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
            <Monitor className="h-6 w-6 text-[#1D4ED8]" />
            Online Webinars
          </h2>
          <WebinarCarousel webinars={webinars} />
        </section>

        <section className="mb-16 rounded-2xl bg-muted/30 p-8">
          <h2 className="mb-3 text-2xl font-bold">Weekly Plan</h2>
          <p className="mb-2 text-sm font-semibold text-[#1D4ED8]">
            Need a customized plan for your school? Contact Phonics Club for professional consultancy services.
          </p>
          <p className="mb-6 text-sm text-muted-foreground">Grade 2 example:</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {WEEKLY_PLAN.map((day) => (
              <div key={day.day} className="rounded-xl border bg-card p-4 text-center">
                <p className="font-bold text-[#1D4ED8]">{day.day}</p>
                <p className="mt-2 text-xs text-muted-foreground">{day.activity}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-sm text-muted-foreground">
          <p>For training, sample books and free resources:</p>
          <p className="mt-2">
            <a href={`mailto:${COMPANY.email}`} className="text-[#1D4ED8] hover:underline">{COMPANY.email}</a>
            {' - '}
            WhatsApp: {contactSettings.phoneDisplay}
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
