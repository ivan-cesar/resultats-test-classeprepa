'use client'

import { AlertTriangle, CheckCircle2, Loader2, Search, UserPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useActionState, useMemo, useState, useTransition } from 'react'
import {
  enrollCandidatAction,
  enrollCandidatsBulkAction,
  updateSessionCandidatFiliereAction,
  updateSessionCandidatStatutAction,
  type EnrollBulkState,
  type EnrollCandidatState,
} from '@/app/admin/sessions/actions'
import { Button } from '@/components/ui/button'
import type { Filiere, Statut } from '@/lib/firestore'
import { formatPhone } from '@/lib/phone'
import type { Session, SessionCandidat } from '@/lib/sessions'
import { FILIERE_OPTIONS, STATUT_BADGE, STATUT_OPTIONS } from '@/lib/statut-labels'

export function SessionDetail({
  session,
  candidats,
}: {
  session: Session
  candidats: SessionCandidat[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filiereFilter, setFiliereFilter] = useState<'all' | Filiere>('all')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const counts = useMemo(() => {
    return candidats.reduce(
      (acc, c) => {
        acc[c.statut] += 1
        return acc
      },
      { admis: 0, non_admis: 0, en_attente: 0 } as Record<Statut, number>,
    )
  }, [candidats])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return candidats.filter((c) => {
      if (filiereFilter !== 'all' && c.filiere !== filiereFilter) return false
      if (!normalized) return true
      return [c.nom, c.prenom, c.numero].some((field) => field.toLowerCase().includes(normalized))
    })
  }, [candidats, query, filiereFilter])

  function handleStatutChange(candidatId: string, statut: Statut) {
    setPendingId(candidatId)
    startTransition(async () => {
      await updateSessionCandidatStatutAction(candidatId, statut, session.id)
      router.refresh()
      setPendingId(null)
    })
  }

  function handleFiliereChange(candidatId: string, filiere: Filiere) {
    setPendingId(candidatId)
    startTransition(async () => {
      await updateSessionCandidatFiliereAction(candidatId, filiere, session.id)
      router.refresh()
      setPendingId(null)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap gap-3">
        <span className="rounded-md border border-success/30 bg-success/10 px-3 py-1.5 text-sm font-medium text-success">
          {counts.admis} admis
        </span>
        <span className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-sm font-medium text-destructive">
          {counts.non_admis} non admis
        </span>
        <span className="rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-sm font-medium text-warning">
          {counts.en_attente} en attente
        </span>
        <span className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-card-foreground">
          {candidats.length} au total
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <EnrollForm sessionId={session.id} />
        <BulkEnrollForm sessionId={session.id} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Rechercher un nom, prénom ou numéro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-12 w-full rounded-md border border-input bg-card pl-11 pr-4 font-sans text-base text-card-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>

        <select
          value={filiereFilter}
          onChange={(event) => setFiliereFilter(event.target.value as 'all' | Filiere)}
          className="h-12 rounded-md border border-input bg-card px-4 text-base text-card-foreground outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          <option value="all">Toutes les filières</option>
          {FILIERE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <th className="px-5 py-3">Candidat</th>
                <th className="px-5 py-3">Numéro</th>
                <th className="px-5 py-3">Filière</th>
                <th className="px-5 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-card-foreground">
                    {[c.prenom, c.nom].filter(Boolean).join(' ')}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatPhone(c.numero)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={c.filiere}
                      disabled={isPending && pendingId === c.id}
                      onChange={(event) => handleFiliereChange(c.id, event.target.value as Filiere)}
                      className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-medium text-foreground outline-none transition-colors disabled:opacity-50"
                    >
                      {FILIERE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={c.statut}
                      disabled={isPending && pendingId === c.id}
                      onChange={(event) => handleStatutChange(c.id, event.target.value as Statut)}
                      className={`rounded-md border px-2.5 py-1.5 text-sm font-medium outline-none transition-colors disabled:opacity-50 ${STATUT_BADGE[c.statut]}`}
                    >
                      {STATUT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    Aucun candidat ne correspond à la recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const initialEnrollState: EnrollCandidatState = { status: 'idle' }

function EnrollForm({ sessionId }: { sessionId: string }) {
  const action = enrollCandidatAction.bind(null, sessionId)
  const [state, formAction, isPending] = useActionState(action, initialEnrollState)

  return (
    <form
      action={formAction}
      key={JSON.stringify(state)}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card px-6 py-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <UserPlus className="size-4 text-accent" aria-hidden="true" />
        <h2 className="font-serif text-lg text-card-foreground">Ajouter un candidat</h2>
      </div>

      <input
        name="nom"
        type="text"
        placeholder="Nom"
        required
        className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      />
      <input
        name="prenom"
        type="text"
        placeholder="Prénom"
        required
        className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      />
      <input
        name="numero"
        type="tel"
        placeholder="Numéro de téléphone"
        required
        className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      />
      <select
        name="filiere"
        defaultValue="polytechnique"
        className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {FILIERE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {state.status === 'error' && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.message}</span>
        </div>
      )}

      {state.status === 'success' && (
        <div className="flex items-start gap-2 text-sm text-success">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>Candidat inscrit.</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-11 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Inscrire'}
      </Button>
    </form>
  )
}

const initialBulkState: EnrollBulkState = { status: 'idle' }

function BulkEnrollForm({ sessionId }: { sessionId: string }) {
  const action = enrollCandidatsBulkAction.bind(null, sessionId)
  const [state, formAction, isPending] = useActionState(action, initialBulkState)

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card px-6 py-6 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <UserPlus className="size-4 text-accent" aria-hidden="true" />
        <h2 className="font-serif text-lg text-card-foreground">Import en masse</h2>
      </div>

      <select
        name="filiere"
        defaultValue="polytechnique"
        className="h-11 w-full rounded-md border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        {FILIERE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <textarea
        name="text"
        rows={5}
        placeholder={'Nom,Prénom,Numéro\nDiallo,Awa,0502180438\nKouassi,Yao,0709876543'}
        required
        className="w-full rounded-md border border-input bg-background px-4 py-2.5 font-mono text-sm text-foreground outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      />

      {state.status === 'done' && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            <span>
              {state.added} ajouté{(state.added ?? 0) > 1 ? 's' : ''}
              {state.skipped && state.skipped.length > 0 ? `, ${state.skipped.length} ignoré(s)` : ''}
            </span>
          </div>
          {state.skipped && state.skipped.length > 0 && (
            <ul className="flex flex-col gap-1 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              {state.skipped.map((s, i) => (
                <li key={i}>
                  {s.line} — {s.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        variant="outline"
        className="h-11 border-border text-sm font-medium text-card-foreground disabled:opacity-40"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : 'Importer'}
      </Button>
    </form>
  )
}
