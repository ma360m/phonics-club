import { AnnouncementBar, Navbar, Footer } from '@/components/layout'
import { TrainingRegistrationForm } from '@/components/training/training-registration-form'
import { WhatsAppButton } from '@/components/layout/whatsapp-button'
import { buildMetadata } from '@/utils/seo'
import { COMPANY, TRAINING_CALENDAR_2025, ONLINE_WEBINARS, WEEKLY_PLAN } from '@/lib/company'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Monitor, GraduationCap } from 'lucide-react'

export const metadata = buildMetadata({
  title: 'Training',
  description: 'Jolly Phonics & Grammar training — online webinars and onsite classroom courses in Pakistan',
  path: '/trainings',
})

export default function TrainingsPage() {
  return (
    <main>
      <AnnouncementBar />
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="mb-4 bg-[#1D4ED8]">Training 2025</Badge>
          <h1 className="text-4xl font-bold mb-4">Professional Training</h1>
          <p className="text-muted-foreground text-lg">
            {COMPANY.description}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <WhatsAppButton />
          </div>
        </div>

        {/* Services */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            { title: 'Training', desc: 'We provide training to suit your needs. Training helps unlock hidden potential.', icon: GraduationCap },
            { title: 'Support', desc: 'Extensive support for learners from schools, academies & institutions.', icon: Monitor },
            { title: 'Consultancy', desc: 'School assessments, syllabus design, and implementation support.', icon: MapPin },
          ].map(({ title, desc, icon: Icon }) => (
            <div key={title} className="bg-card rounded-2xl border p-6 shadow-sm glass">
              <Icon className="w-8 h-8 text-[#1D4ED8] mb-4" />
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        {/* Onsite calendar */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-[#D30000]" />
            Classroom Training (Onsite) — 2025 Calendar
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {TRAINING_CALENDAR_2025.map((event) => (
              <div key={event.date + event.title} className="bg-card rounded-2xl border p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.season}</p>
                  </div>
                  <Badge variant="outline">{formatDate(event.date)}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Register your interest below. Minimum delegates required. Cancellation policy applies (15 working days notice).
                </p>
                <TrainingRegistrationForm
                  trainingType="onsite_classroom"
                  eventTitle={`${event.title} — ${event.season}`}
                  eventDate={event.date}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Online webinars */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Monitor className="w-6 h-6 text-[#1D4ED8]" />
            Online Webinars
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {ONLINE_WEBINARS.map((webinar) => (
              <div key={webinar.title} className="bg-card rounded-2xl border p-6">
                <Badge className={webinar.status === 'open' ? 'bg-emerald-600' : ''}>{webinar.status}</Badge>
                <h3 className="font-bold mt-3 mb-2">{webinar.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                  <Calendar className="w-4 h-4" />
                  {formatDate(webinar.date)}
                </p>
                <TrainingRegistrationForm
                  trainingType="online_webinar"
                  eventTitle={webinar.title}
                  eventDate={webinar.date}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Weekly plan */}
        <section className="mb-16 bg-muted/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Weekly Plan (Kindergarten – Grade 2)</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {WEEKLY_PLAN.map((day) => (
              <div key={day.day} className="bg-card rounded-xl border p-4 text-center">
                <p className="font-bold text-[#1D4ED8]">{day.day}</p>
                <p className="text-xs text-muted-foreground mt-2">{day.activity}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center text-sm text-muted-foreground">
          <p>For training, sample books and free resources:</p>
          <p className="mt-2">
            <a href={`mailto:${COMPANY.email}`} className="text-[#1D4ED8] hover:underline">{COMPANY.email}</a>
            {' · '}
            WhatsApp: {COMPANY.phone}
          </p>
        </div>
      </div>
      <Footer />
    </main>
  )
}
