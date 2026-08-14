import { AdminDashboard } from '@/components/admin-dashboard'
import { AdminLoginForm } from '@/components/admin-login-form'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { listResultats } from '@/lib/firestore'

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated()

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b-2 border-accent bg-primary">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-1 px-5 py-7 sm:px-8">
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-accent">
            ISPA — Institut Supérieur
          </span>
          <span className="font-serif text-lg leading-tight text-primary-foreground">
            Administration des résultats
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-5 py-10 sm:px-8 sm:py-14">
        {authenticated ? <AdminResultsPanel /> : <AdminLoginForm />}
      </main>
    </div>
  )
}

async function AdminResultsPanel() {
  const resultats = await listResultats()
  return <AdminDashboard resultats={resultats} />
}
