'use server'

import { findResultatByNumero, type Resultat } from '@/lib/firestore'
import { normalizePhone } from '@/lib/phone'

export type LookupState =
  | { status: 'found'; numero: string; resultat: Resultat }
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
    const resultat = await findResultatByNumero(numero)

    if (!resultat) {
      return { status: 'not_found', numero }
    }

    return { status: 'found', numero, resultat }
  } catch (error) {
    console.log('[v0] lookupResultat error:', error instanceof Error ? error.message : error)
    return {
      status: 'error',
      message:
        'La connexion au serveur des résultats a échoué. Vérifiez votre connexion internet puis réessayez.',
    }
  }
}
