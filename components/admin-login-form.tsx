'use client'

import { AlertTriangle, Loader2, Lock } from 'lucide-react'
import { useActionState } from 'react'
import { loginAdmin, type AdminLoginState } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'

const initialState: AdminLoginState = { status: 'idle' }

export function AdminLoginForm() {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 rounded-lg border border-border bg-card px-6 py-8 shadow-sm">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Accès réservé
        </span>
        <h1 className="font-serif text-2xl leading-tight text-card-foreground">
          Administration
        </h1>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Mot de passe
          </label>
          <div className="relative flex items-center">
            <Lock
              className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-md border border-input bg-background pl-11 pr-4 font-sans text-base text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </div>
        </div>

        {state.status === 'error' && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 w-full bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Connexion…
            </>
          ) : (
            'Se connecter'
          )}
        </Button>
      </form>
    </div>
  )
}
