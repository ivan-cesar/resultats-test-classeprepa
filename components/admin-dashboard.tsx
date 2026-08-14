'use client'

import { LogOut, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { changeStatutAction, logoutAdmin } from '@/app/admin/actions'
import { Button } from '@/components/ui/button'
import type { Filiere, Resultat, Statut } from '@/lib/firestore'
import { formatPhone } from '@/lib/phone'

const STATUT_OPTIONS: { value: Statut; label: string }[] = [
  { value: 'admis', label: 'Admis' },
  { value: 'non_admis', label: 'Non admis' },
  { value: 'en_attente', label: 'En attente' },
]

const STATUT_BADGE: Record<Statut, string> = {
  admis: 'bg-success/10 text-success border-success/30',
  non_admis: 'bg-destructive/10 text-destructive border-destructive/30',
  en_attente: 'bg-warning/10 text-warning border-warning/30',
}

const FILIERE_LABEL: Record<Filiere, string> = {
  polytechnique: 'MPSI/PCSI',
  ecg: 'ECG',
}

export function AdminDashboard({ resultats }: { resultats: Resultat[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [pendingNumero, setPendingNumero] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const counts = useMemo(() => {
    return resultats.reduce(
      (acc, r) => {
        acc[r.statut] += 1
        return acc
      },
      { admis: 0, non_admis: 0, en_attente: 0 } as Record<Statut, number>,
    )
  }, [resultats])

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return resultats
    return resultats.filter((r) =>
      [r.nom, r.prenom, r.numero].some((field) => field.toLowerCase().includes(normalized)),
    )
  }, [resultats, query])

  function handleStatutChange(numero: string, statut: Statut) {
    setPendingNumero(numero)
    startTransition(async () => {
      await changeStatutAction(numero, statut)
      router.refresh()
      setPendingNumero(null)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
            {resultats.length} au total
          </span>
        </div>

        <form action={logoutAdmin}>
          <Button
            type="submit"
            variant="outline"
            className="border-border text-card-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Déconnexion
          </Button>
        </form>
      </div>

      <div className="relative flex items-center">
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
              {filtered.map((r) => (
                <tr key={r.numero} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-card-foreground">
                    {[r.prenom, r.nom].filter(Boolean).join(' ')}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{formatPhone(r.numero)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{FILIERE_LABEL[r.filiere]}</td>
                  <td className="px-5 py-3">
                    <select
                      value={r.statut}
                      disabled={isPending && pendingNumero === r.numero}
                      onChange={(event) =>
                        handleStatutChange(r.numero, event.target.value as Statut)
                      }
                      className={`rounded-md border px-2.5 py-1.5 text-sm font-medium outline-none transition-colors disabled:opacity-50 ${STATUT_BADGE[r.statut]}`}
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
