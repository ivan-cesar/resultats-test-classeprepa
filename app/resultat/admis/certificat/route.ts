import { NextResponse, type NextRequest } from 'next/server'
import { generateAdmissionCertificate } from '@/lib/certificate'
import { findResultatByNumero } from '@/lib/firestore'
import { normalizePhone } from '@/lib/phone'

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export async function GET(request: NextRequest) {
  const numero = normalizePhone(request.nextUrl.searchParams.get('numero') ?? '')

  if (!numero) {
    return NextResponse.json({ error: 'Numéro manquant.' }, { status: 400 })
  }

  const resultat = await findResultatByNumero(numero)

  if (!resultat || resultat.statut !== 'admis') {
    return NextResponse.json({ error: 'Résultat introuvable.' }, { status: 404 })
  }

  const pdfBytes = await generateAdmissionCertificate(resultat)
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
