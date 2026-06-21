import { getCertificateTemplates, deleteCertificateTemplateAction } from '@/actions/admin/certificates'
import { CertificateForm } from '@/components/admin/certificate-form'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export default async function AdminCertificatesPage() {
  const templates = await getCertificateTemplates().catch(() => [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Certificate Templates</h1>
      <p className="text-muted-foreground mb-8">Upload template images via Cloudinary and link to courses.</p>
      <CertificateForm />
      <div className="mt-10 space-y-3">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates yet.</p>
        ) : (
          templates.map((t: { id: string; name: string; description?: string; template_url?: string }) => (
            <div key={t.id} className="flex justify-between bg-card rounded-xl border p-4">
              <div>
                <p className="font-semibold">{t.name}</p>
                {t.template_url && (
                  <a href={t.template_url} className="text-xs text-[#1D4ED8] hover:underline" target="_blank" rel="noreferrer">
                    View template
                  </a>
                )}
              </div>
              <form action={deleteCertificateTemplateAction.bind(null, t.id)}>
                <Button type="submit" size="sm" variant="destructive" className="rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
