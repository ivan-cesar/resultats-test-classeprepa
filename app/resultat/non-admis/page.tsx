import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ResultCard } from '@/components/result-card'
import { findResultatByNumero } from '@/lib/firestore'
import { normalizePhone } from '@/lib/phone'

export default async function ResultatNonAdmisPage({
  searchParams,
}: {
  searchParams: Promise<{ numero?: string }>
}) {
  const { numero: rawNumero } = await searchParams
  const numero = normalizePhone(rawNumero ?? '')
  const resultat = numero ? await findResultatByNumero(numero) : null

  if (!resultat || resultat.statut !== 'non_admis') {
    redirect('/')
  }

  return (
    <>
      <ResultCard resultat={resultat} />
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
