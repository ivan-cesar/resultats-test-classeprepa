import { NextResponse, type NextRequest } from 'next/server'
import { generateAdmissionCertificate } from '@/lib/certificate'
import { findResultatByNumero, type Resultat } from '@/lib/firestore'
import { normalizePhone } from '@/lib/phone'
import { findCandidatBySessionAndNumero, getSession } from '@/lib/sessions'

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

function formatDateLettre(dateLettre: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${dateLettre}T00:00:00`),
  )
}

export async function GET(request: NextRequest) {
  const numero = normalizePhone(request.nextUrl.searchParams.get('numero') ?? '')
  const sessionId = request.nextUrl.searchParams.get('sessionId')

  if (!numero) {
    return NextResponse.json({ error: 'Numéro manquant.' }, { status: 400 })
  }

  let resultat: Resultat | null
  let dateLabel: string | undefined

  if (sessionId) {
    const [candidat, session] = await Promise.all([
      findCandidatBySessionAndNumero(sessionId, numero),
      getSession(sessionId),
    ])

    resultat =
      candidat && session
        ? {
            nom: candidat.nom,
            prenom: candidat.prenom,
            numero: candidat.numero,
            statut: candidat.statut,
            filiere: candidat.filiere,
          }
        : null
    dateLabel = session ? formatDateLettre(session.dateLettre) : undefined
  } else {
    resultat = await findResultatByNumero(numero)
  }

  if (!resultat || resultat.statut !== 'admis') {
    return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 })
  }

  const pdfBytes = await generateAdmissionCertificate(resultat, dateLabel)
  const fullName = [resultat.prenom, resultat.nom].filter(Boolean).join(' ').trim()
  const filename = `certificat-admission-${slugify(fullName) || numero}.pdf`

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
