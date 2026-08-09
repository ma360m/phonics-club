import { FastInvoiceLinkForm } from '@/components/admin/fast-invoice-link-form'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/utils/format'

export const dynamic = 'force-dynamic'

export default async function AdminFastInvoicesPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data: links } = await supabase
    .from('fast_invoice_links')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(25)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#1D4ED8]">Fast Invoices</p>
        <h1 className="mt-2 text-3xl font-bold">Private Fast Invoice Links</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Create a private link for a customer or member. The page is not shown in site navigation and only opens with a valid token.
        </p>
      </div>

      <FastInvoiceLinkForm />

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-bold">Recent links</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Label</th>
                <th className="px-5 py-3">Recipient</th>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Uses</th>
                <th className="px-5 py-3">Expires</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(links ?? []).map((link) => (
                <tr key={link.id}>
                  <td className="px-5 py-4 font-semibold">{link.label ?? 'Fast invoice link'}</td>
                  <td className="px-5 py-4 text-muted-foreground">{link.recipient_email ?? '-'}</td>
                  <td className="px-5 py-4 font-mono text-xs">{link.required_member_id ?? '-'}</td>
                  <td className="px-5 py-4">{Number(link.used_count ?? 0)} / {link.max_uses ?? 'Any'}</td>
                  <td className="px-5 py-4">{link.expires_at ? formatDate(link.expires_at) : 'No expiry'}</td>
                  <td className="px-5 py-4">{link.active ? 'Active' : 'Disabled'}</td>
                </tr>
              ))}
              {(!links || links.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No fast invoice links yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
