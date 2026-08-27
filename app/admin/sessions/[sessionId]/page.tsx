import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SessionDetail } from '@/components/session-detail'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { getSession, listSessionCandidats } from '@/lib/sessions'

export default async function AdminSessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const authenticated = await isAdminAuthenticated()
  if (!authenticated) {
    redirect('/admin')
  }

  const { sessionId } = await params
  const session = await getSession(sessionId)
  if (!session) {
    redirect('/admin/sessions')
  }

  const candidats = await listSessionCandidats(sessionId)

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b-2 border-accent bg-primary">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-1 px-5 py-7 sm:px-8">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
            ISPA — Institut Supérieur
          </span>
          <span className="font-serif text-lg leading-tight text-primary-foreground">
            {session.nom}
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/admin/sessions"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour aux sessions
        </Link>

        <SessionDetail session={session} candidats={candidats} />
      </main>
    </div>
  )
}
