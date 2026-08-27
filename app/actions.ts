'use server'

import { findResultatByNumero, type Resultat } from '@/lib/firestore'
import { normalizePhone } from '@/lib/phone'
import { findCandidatsByNumero } from '@/lib/sessions'

export type LookupResult = {
  source: 'legacy' | 'session'
  sessionLabel: string
  sessionId?: string
  resultat: Resultat
}

export type LookupState =
  | { status: 'found'; numero: string; results: LookupResult[] }
  | { status: 'not_found'; numero: string }
  | { status: 'invalid'; message: string }
  | { status: 'error'; message: string }

export async function lookupResultat(rawNumero: string): Promise<LookupState> {
  const numero = normalizePhone(rawNumero ?? '')

  if (numero.length < 10) {
    return {
      status: 'invalid',
      message: 'Le numéro doit contenir au moins 10 chiffres.',
    }
  }

  if (numero.length > 15) {
    return {
      status: 'invalid',
      message: 'Le numéro saisi est trop long. Vérifiez votre saisie.',
    }
  }

  try {
    const [legacy, candidats] = await Promise.all([
      findResultatByNumero(numero),
      findCandidatsByNumero(numero),
    ])

    const results: LookupResult[] = []

    if (legacy) {
      results.push({ source: 'legacy', sessionLabel: 'Session 2026', resultat: legacy })
    }

    for (const candidat of candidats) {
      results.push({
        source: 'session',
        sessionLabel: candidat.sessionNom,
        sessionId: candidat.sessionId,
        resultat: {
          nom: candidat.nom,
          prenom: candidat.prenom,
          numero: candidat.numero,
          statut: candidat.statut,
          filiere: candidat.filiere,
        },
      })
    }

    if (results.length === 0) {
      return { status: 'not_found', numero }
    }

    return { status: 'found', numero, results }
  } catch (error) {
    console.log('[v0] lookupResultat error:', error instanceof Error ? error.message : error)
    return {
      status: 'error',
      message:
        'La connexion au serveur des résultats a échoué. Vérifiez votre connexion internet puis réessayez.',
    }
  }
}
