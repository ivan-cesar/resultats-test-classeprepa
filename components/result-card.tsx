'use client'

import confetti from 'canvas-confetti'
import { CheckCircle2, Clock3, Frown, XCircle } from 'lucide-react'
import { useEffect } from 'react'
import type { Resultat } from '@/lib/firestore'
import { formatPhone } from '@/lib/phone'

const STATUT_CONFIG = {
  admis: {
    label: 'Admis',
    verdict: 'Félicitations, vous êtes admis',
    Icon: CheckCircle2,
    band: 'bg-success text-success-foreground',
    accent: 'text-success',
  },
  non_admis: {
    label: 'Non admis',
    verdict: 'Votre candidature n’a pas été retenue',
    Icon: XCircle,
    band: 'bg-destructive text-destructive-foreground',
    accent: 'text-destructive',
  },
  en_attente: {
    label: 'En attente',
    verdict: 'Votre dossier est en cours d’examen',
    Icon: Clock3,
    band: 'bg-warning text-warning-foreground',
    accent: 'text-warning',
  },
} as const

function useAdmissionConfetti(statut: Resultat['statut']) {
  useEffect(() => {
    if (statut !== 'admis') return

    const colors = ['#1e3a5f', '#d4af37', '#ffffff']
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors })
    confetti({ particleCount: 60, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors })
    confetti({ particleCount: 60, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors })
  }, [statut])
}

export function ResultCard({ resultat }: { resultat: Resultat }) {
  const config = STATUT_CONFIG[resultat.statut]
  const { Icon } = config
  const fullName = [resultat.prenom, resultat.nom].filter(Boolean).join(' ').trim()

  useAdmissionConfetti(resultat.statut)

  return (
    <section
      aria-live="polite"
      className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
    >
      <div className={`flex items-center gap-3 px-6 py-4 ${config.band}`}>
        <Icon className="size-6 shrink-0" aria-hidden="true" />
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.18em] opacity-80">
            Résultat officiel
          </span>
          <span className="font-serif text-xl leading-tight">{config.label}</span>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Candidat
          </span>
          <h2 className="font-serif text-2xl leading-snug text-pretty text-card-foreground">
            {fullName || 'Nom non renseigné'}
          </h2>
          <p className="text-sm text-muted-foreground">{formatPhone(resultat.numero)}</p>
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-5">
          {resultat.statut === 'non_admis' && (
            <Frown className={`size-6 shrink-0 ${config.accent}`} aria-hidden="true" />
          )}
          <p className={`font-serif text-lg leading-relaxed text-pretty ${config.accent}`}>
            {config.verdict}
          </p>
        </div>

        {(resultat.score !== undefined || resultat.mention) && (
          <dl className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:gap-10">
            {resultat.score !== undefined && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Score
                </dt>
                <dd className="font-serif text-3xl leading-none text-card-foreground">
                  {resultat.score}
                </dd>
              </div>
            )}
            {resultat.mention && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Mention
                </dt>
                <dd className="font-serif text-2xl leading-tight text-card-foreground">
                  {resultat.mention}
                </dd>
              </div>
            )}
          </dl>
        )}

        <p className="border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
          Pour toute réclamation, présentez-vous au secrétariat de l&apos;ISPA muni d&apos;une pièce
          d&apos;identité.
        </p>
      </div>
    </section>
  )
}
