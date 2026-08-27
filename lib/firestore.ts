import 'server-only'

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export const FIREBASE_PROJECT_ID = 'resultats-test-classeprepa2026'
export const RESULTS_COLLECTION = 'resultats_prepa_2026'

export type Statut = 'admis' | 'non_admis' | 'en_attente'
export type Filiere = 'polytechnique' | 'ecg'

export type Resultat = {
  nom: string
  prenom: string
  numero: string
  statut: Statut
  filiere: Filiere
  score?: number
  mention?: string
}

export class ConfigurationManquanteError extends Error {
  constructor() {
    super('FIREBASE_SERVICE_ACCOUNT_KEY manquante.')
    this.name = 'ConfigurationManquanteError'
  }
}

/**
 * Le SDK Admin s'authentifie avec un compte de service : il agit avec les
 * privilèges du projet et n'est donc pas soumis aux règles de sécurité
 * Firestore. Les règles peuvent rester fermées (`allow read: if false`),
 * ce qui rend toute lecture depuis un navigateur impossible.
 */
export function getDb() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (!raw) {
    throw new ConfigurationManquanteError()
  }

  if (!getApps().length) {
    let parsed: { project_id?: string; client_email?: string; private_key?: string }

    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_KEY n'est pas un JSON valide. Collez le contenu complet du fichier .json.",
      )
    }

    if (!parsed.client_email || !parsed.private_key) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT_KEY incomplète : "client_email" ou "private_key" est absent.',
      )
    }

    initializeApp({
      credential: cert({
        projectId: parsed.project_id ?? FIREBASE_PROJECT_ID,
        clientEmail: parsed.client_email,
        // Les retours à la ligne sont souvent échappés lors du copier-coller.
        privateKey: parsed.private_key.replace(/\\n/g, '\n'),
      }),
    })
  }

  return getFirestore(getApp())
}

export function readString(data: Record<string, unknown>, key: string): string | undefined {
  const raw = data[key]
  if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim()
  return undefined
}

function readNumber(data: Record<string, unknown>, key: string): number | undefined {
  const raw = data[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string') {
    const parsed = Number(raw.replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

export function readStatut(data: Record<string, unknown>): Statut {
  const raw = (readString(data, 'statut') ?? '').toLowerCase().replace(/[\s-]+/g, '_')
  if (raw === 'admis' || raw === 'admise' || raw === 'admis_e') return 'admis'
  if (['non_admis', 'non_admise', 'refuse', 'refusé', 'refusée'].includes(raw)) {
    return 'non_admis'
  }
  return 'en_attente'
}

/** Les résultats créés avant l'ajout de ce champ sont traités comme "polytechnique". */
export function readFiliere(data: Record<string, unknown>): Filiere {
  const raw = (readString(data, 'filiere') ?? '').toLowerCase()
  return raw === 'ecg' ? 'ecg' : 'polytechnique'
}

/**
 * Recherche un unique résultat par égalité stricte sur `numero`, limité à
 * 1 document. Aucun listing complet de la collection n'est exposé.
 */
export async function findResultatByNumero(numero: string): Promise<Resultat | null> {
  const snapshot = await getDb()
    .collection(RESULTS_COLLECTION)
    .where('numero', '==', numero)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const data = snapshot.docs[0].data() as Record<string, unknown>

  return {
    nom: readString(data, 'nom') ?? '',
    prenom: readString(data, 'prenom') ?? '',
    numero: readString(data, 'numero') ?? numero,
    statut: readStatut(data),
    filiere: readFiliere(data),
    score: readNumber(data, 'score'),
    mention: readString(data, 'mention'),
  }
}

/**
 * Liste l'intégralité de la collection, réservée à l'espace admin
 * (protégé par mot de passe en amont dans `app/admin`).
 */
export async function listResultats(): Promise<Resultat[]> {
  const snapshot = await getDb().collection(RESULTS_COLLECTION).orderBy('nom').get()

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>
    return {
      nom: readString(data, 'nom') ?? '',
      prenom: readString(data, 'prenom') ?? '',
      numero: readString(data, 'numero') ?? '',
      statut: readStatut(data),
      filiere: readFiliere(data),
      score: readNumber(data, 'score'),
      mention: readString(data, 'mention'),
    }
  })
}

/**
 * Recherche par égalité sur `numero` plutôt que par ID de document : les
 * données peuvent avoir été créées avec un ID différent du numéro.
 */
export async function updateResultatStatut(numero: string, statut: Statut): Promise<void> {
  const snapshot = await getDb()
    .collection(RESULTS_COLLECTION)
    .where('numero', '==', numero)
    .limit(1)
    .get()

  if (snapshot.empty) {
    throw new Error(`Aucun résultat pour le numéro ${numero}.`)
  }

  await snapshot.docs[0].ref.update({ statut })
}
