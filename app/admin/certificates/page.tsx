import { deleteCertificateTemplateAction, getCertificateTemplates } from '@/actions/admin/certificates'
import { CertificateForm } from '@/components/admin/certificate-form'
import { Button } from '@/components/ui/button'
import { LmsEmptyState, LmsPageHeader, LmsSectionCard } from '@/components/lms/lms-primitives'
import { Award, ExternalLink, Trash2 } from 'lucide-react'

export default async function AdminCertificatesPage() {
  const templates = await getCertificateTemplates().catch(() => [])

  return (
    <div className="mx-auto max-w-7xl">
      <LmsPageHeader
        eyebrow="Certificates"
        title="Certificate Templates"
        description="Upload template images and link them to courses for the certificate workflow."
      />

      <LmsSectionCard title="Upload Template" icon={Award}>
        <CertificateForm />
      </LmsSectionCard>

      <LmsSectionCard title="Saved Templates" icon={Award} className="mt-6">
        {templates.length === 0 ? (
          <LmsEmptyState icon={Award} title="No templates yet" description="Uploaded certificate templates will appear here." />
        ) : (
          <div className="space-y-3">
            {templates.map((template: { id: string; name: string; description?: string; template_url?: string }) => (
              <article key={template.id} className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-semibold text-[#0F172A]">{template.name}</h2>
                    {template.description && <p className="mt-1 text-sm text-slate-500">{template.description}</p>}
                    {template.template_url && (
                      <a
                        href={template.template_url}
                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#1D4ED8] hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View template
                      </a>
                    )}
                  </div>
                  <form action={deleteCertificateTemplateAction.bind(null, template.id)}>
                    <Button type="submit" size="sm" variant="destructive" className="rounded-xl" aria-label={`Delete ${template.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </LmsSectionCard>
    </div>
  )
}
