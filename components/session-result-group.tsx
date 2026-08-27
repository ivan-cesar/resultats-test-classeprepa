import { Download } from 'lucide-react'
import type { LookupResult } from '@/app/actions'
import { ResultCard } from '@/components/result-card'
import { buttonVariants } from '@/components/ui/button'

export function SessionResultGroup({ source, sessionLabel, sessionId, resultat }: LookupResult) {
  const certificatHref =
    source === 'session' && sessionId
      ? `/resultat/admis/certificat?numero=${encodeURIComponent(resultat.numero)}&sessionId=${encodeURIComponent(sessionId)}`
      : `/resultat/admis/certificat?numero=${encodeURIComponent(resultat.numero)}`

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {sessionLabel}
      </span>

      <ResultCard resultat={resultat} />

      {resultat.statut === 'admis' && (
        <a
          href={certificatHref}
          download
          className={buttonVariants({
            className:
              'h-14 w-full bg-primary text-base font-medium tracking-wide text-primary-foreground hover:bg-primary/90',
          })}
        >
          <Download className="size-4" aria-hidden="true" />
          Télécharger mon certificat d&apos;admission
        </a>
      )}
    </div>
  )
}
