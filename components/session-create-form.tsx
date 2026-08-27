'use client'

import { AlertTriangle, Loader2, Plus } from 'lucide-react'
import { useActionState } from 'react'
import { createSessionAction, type CreateSessionState } from '@/app/admin/sessions/actions'
import { Button } from '@/components/ui/button'

const initialState: CreateSessionState = { status: 'idle' }

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function SessionCreateForm() {
  const [state, formAction, isPending] = useActionState(createSessionAction, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border bg-card px-6 py-6 shadow-sm sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <label
          htmlFor="nom"
          className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          Nom de la session
        </label>
        <input
          id="nom"
          name="nom"
          type="text"
          required
          placeholder="Session Août 2026"
          className="h-12 w-full rounded-md border border-input bg-background px-4 font-sans text-base text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="date"
          className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
        >
          Date (sur le certificat)
        </label>
        <input
          id="date"
          name="date"
          type="date"
          required
          defaultValue={today()}
          className="h-12 rounded-md border border-input bg-background px-4 font-sans text-base text-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
        />
      </div>

      {state.status === 'error' && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Création…
          </>
        ) : (
          <>
            <Plus className="size-4" aria-hidden="true" />
            Créer la session
          </>
        )}
      </Button>
    </form>
  )
}
