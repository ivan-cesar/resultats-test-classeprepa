import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ResultCard } from '@/components/result-card'
import { buttonVariants } from '@/components/ui/button'
import { findResultatByNumero } from '@/lib/firestore'
import { normalizePhone } from '@/lib/phone'

export default async function ResultatAdmisPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero: rawNumero } = await searchParams
  const numero = normalizePhone(rawNumero ?? '')
  const resultat = numero ? await findResultatByNumero(numero) : null

  if (!resultat || resultat.statut !== 'admis') {
    redirect('/')
  }

  return (
    <>
      <ResultCard resultat={resultat} />

      <a
        href={`/resultat/admis/certificat?numero=${encodeURIComponent(resultat.numero)}`}
        download
        className={buttonVariants({
          className:
            'h-14 w-full bg-primary text-base font-medium tracking-wide text-primary-foreground hover:bg-primary/90',
        })}
      >
        <Download className="size-4" aria-hidden="true" />
        Télécharger mon certificat d&apos;admission
      </a>

      <Link
        href="/"
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour à l&apos;accueil
      </Link>
    </>
  )
}
