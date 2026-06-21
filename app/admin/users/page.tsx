import { getAllProfiles } from '@/lib/data/queries'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/format'

export default async function AdminUsersPage() {
  const users = await getAllProfiles()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <div className="bg-card rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-4">{u.full_name ?? '—'}</td>
                <td className="p-4">{u.email}</td>
                <td className="p-4">
                  <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                </td>
                <td className="p-4 text-muted-foreground">{formatDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
