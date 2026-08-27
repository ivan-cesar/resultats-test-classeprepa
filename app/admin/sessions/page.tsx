import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SessionCreateForm } from '@/components/session-create-form'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { listSessions } from '@/lib/sessions'

export default async function AdminSessionsPage() {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) {
    redirect('/admin')
  }

  const sessions = await listSessions()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b-2 border-accent bg-primary">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-1 px-5 py-7 sm:px-8">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
            ISPA — Institut Supérieur
          </span>
          <span className="font-serif text-lg leading-tight text-primary-foreground">
            Sessions d&apos;examen
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/admin"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour au tableau de bord
        </Link>

        <SessionCreateForm />

        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="px-5 py-3">Session</th>
                  <th className="px-5 py-3">Créée le</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-card-foreground">{session.nom}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/admin/sessions/${session.id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        Gérer
                      </Link>
                    </td>
                  </tr>
                ))}

                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                      Aucune session pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
