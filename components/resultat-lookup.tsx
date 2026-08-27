'use client'

import { AlertTriangle, Loader2, Phone, SearchX } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { lookupResultat, type LookupState } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { SessionResultGroup } from '@/components/session-result-group'
import { digitCount, formatPhone } from '@/lib/phone'

export function ResultatLookup() {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [state, setState] = useState<LookupState | null>(null)
  const [isPending, startTransition] = useTransition()

  const isValid = digitCount(value) >= 10

  function runLookup(rawNumero: string) {
    startTransition(async () => {
      const result = await lookupResultat(rawNumero)

      if (result.status === 'found' && result.results.length === 1 && result.results[0].source === 'legacy') {
        const { statut } = result.results[0].resultat

        if (statut === 'admis') {
          router.push(`/resultat/admis?numero=${encodeURIComponent(result.numero)}`)
          return
        }

        if (statut === 'non_admis') {
          router.push(`/resultat/non-admis?numero=${encodeURIComponent(result.numero)}`)
          return
        }
      }

      setState(result)
    })
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid || isPending) return
    runLookup(value)
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="numero"
            className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
          >
            Numéro de téléphone
          </label>
          <div className="relative flex items-center">
            <Phone
              className="pointer-events-none absolute left-4 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="numero"
              name="numero"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="05 02 18 04 38"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setState(null)
              }}
              aria-describedby="numero-aide"
              className="h-14 w-full rounded-md border border-input bg-card pl-11 pr-4 font-sans text-lg tracking-wide text-card-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
            />
          </div>
          <p id="numero-aide" className="text-sm leading-relaxed text-muted-foreground">
            Saisissez le numéro utilisé lors de votre inscription. Les espaces, tirets et
            l&apos;indicatif +225 sont acceptés.
          </p>
        </div>

        <Button
          type="submit"
          disabled={!isValid || isPending}
          className="h-14 w-full bg-primary text-base font-medium tracking-wide text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Recherche en cours…
            </>
          ) : (
            'Voir mon résultat'
          )}
        </Button>
      </form>

      {isPending && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-6 text-sm text-muted-foreground"
        >
          <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
          Consultation du registre des résultats…
        </div>
      )}

      {!isPending && state?.status === 'found' && (
        <div className="flex flex-col gap-6">
          {state.results.map((result) => (
            <SessionResultGroup key={`${result.source}-${result.sessionLabel}`} {...result} />
          ))}
        </div>
      )}

      {!isPending && state?.status === 'not_found' && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-border bg-card px-5 py-6"
        >
          <div className="flex items-center gap-3">
            <SearchX className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-serif text-lg text-card-foreground">Aucun résultat trouvé</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Aucun résultat trouvé pour le numéro {formatPhone(state.numero)}. Vérifiez votre saisie
            ou contactez l&apos;administration.
          </p>
        </div>
      )}

      {!isPending && (state?.status === 'error' || state?.status === 'invalid') && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-card px-5 py-6"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
            <h2 className="font-serif text-lg text-card-foreground">
              {state.status === 'invalid' ? 'Numéro invalide' : 'Consultation impossible'}
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{state.message}</p>
          {state.status === 'error' && (
            <Button
              type="button"
              variant="outline"
              onClick={() => runLookup(value)}
              className="w-fit border-border text-card-foreground"
            >
              Réessayer
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
