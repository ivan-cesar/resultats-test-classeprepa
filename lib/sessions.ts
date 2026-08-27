import 'server-only'

import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getDb, readFiliere, readStatut, readString, type Filiere, type Statut } from '@/lib/firestore'
import { digitCount, normalizePhone } from '@/lib/phone'

export const SESSIONS_COLLECTION = 'sessions'
export const CANDIDATS_COLLECTION = 'session_candidats'

export type Session = {
  id: string
  nom: string
  createdAt: string
  /** Date (ISO, "YYYY-MM-DD") affichée sur les certificats ("Abidjan, le ..."). */
  dateLettre: string
}

export type SessionCandidat = {
  id: string
  sessionId: string
  sessionNom: string
  nom: string
  prenom: string
  numero: string
  filiere: Filiere
  statut: Statut
}

function readSession(id: string, data: Record<string, unknown>): Session {
  const createdAtRaw = data.createdAt
  const createdAtDate = createdAtRaw instanceof Timestamp ? createdAtRaw.toDate() : new Date(0)

  return {
    id,
    nom: readString(data, 'nom') ?? '',
    createdAt: createdAtDate.toISOString(),
    dateLettre: readString(data, 'dateLettre') ?? createdAtDate.toISOString().slice(0, 10),
  }
}

function readCandidat(id: string, data: Record<string, unknown>): SessionCandidat {
  return {
    id,
    sessionId: readString(data, 'sessionId') ?? '',
    sessionNom: readString(data, 'sessionNom') ?? '',
    nom: readString(data, 'nom') ?? '',
    prenom: readString(data, 'prenom') ?? '',
    numero: readString(data, 'numero') ?? '',
    filiere: readFiliere(data),
    statut: readStatut(data),
  }
}

export async function createSession(nom: string, dateLettre: string): Promise<string> {
  const trimmed = nom.trim()
  if (!trimmed) {
    throw new Error('Le nom de la session est requis.')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLettre)) {
    throw new Error('La date de la session est invalide.')
  }

  const ref = await getDb()
    .collection(SESSIONS_COLLECTION)
    .add({ nom: trimmed, dateLettre, createdAt: FieldValue.serverTimestamp() })

  return ref.id
}

export async function listSessions(): Promise<Session[]> {
  const snapshot = await getDb().collection(SESSIONS_COLLECTION).orderBy('createdAt', 'desc').get()
  return snapshot.docs.map((doc) => readSession(doc.id, doc.data() as Record<string, unknown>))
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const doc = await getDb().collection(SESSIONS_COLLECTION).doc(sessionId).get()
  if (!doc.exists) return null
  return readSession(doc.id, doc.data() as Record<string, unknown>)
}

export async function listSessionCandidats(sessionId: string): Promise<SessionCandidat[]> {
  const snapshot = await getDb()
    .collection(CANDIDATS_COLLECTION)
    .where('sessionId', '==', sessionId)
    .get()

  return snapshot.docs
    .map((doc) => readCandidat(doc.id, doc.data() as Record<string, unknown>))
    .sort((a, b) => a.nom.localeCompare(b.nom))
}

type EnrollInput = { nom: string; prenom: string; numero: string; filiere: Filiere }

export async function enrollCandidat(
  sessionId: string,
  input: EnrollInput,
): Promise<{ ok: true } | { ok: false; reason: 'duplicate' | 'invalid' }> {
  const nom = input.nom.trim()
  const prenom = input.prenom.trim()
  const numero = normalizePhone(input.numero)

  if (!nom || !prenom || digitCount(numero) < 10) {
    return { ok: false, reason: 'invalid' }
  }

  const session = await getSession(sessionId)
  if (!session) {
    return { ok: false, reason: 'invalid' }
  }

  const db = getDb()
  const existing = await db
    .collection(CANDIDATS_COLLECTION)
    .where('sessionId', '==', sessionId)
    .where('numero', '==', numero)
    .limit(1)
    .get()

  if (!existing.empty) {
    return { ok: false, reason: 'duplicate' }
  }

  await db.collection(CANDIDATS_COLLECTION).add({
    sessionId,
    sessionNom: session.nom,
    nom,
    prenom,
    numero,
    filiere: input.filiere,
    statut: 'en_attente',
  })

  return { ok: true }
}

type SkippedLine = { line: string; reason: string }

export async function enrollCandidatsBulk(
  sessionId: string,
  filiere: Filiere,
  rawText: string,
): Promise<{ added: number; skipped: SkippedLine[] }> {
  const session = await getSession(sessionId)
  if (!session) {
    throw new Error('Session introuvable.')
  }

  const db = getDb()
  const existing = await listSessionCandidats(sessionId)
  const knownNumeros = new Set(existing.map((c) => c.numero))

  const skipped: SkippedLine[] = []
  const toAdd: EnrollInput[] = []
  const seenInBatch = new Set<string>()

  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)

  for (const line of lines) {
    const parts = line.split(/\t|,/).map((p) => p.trim()).filter((p) => p.length > 0)

    if (parts.length !== 3) {
      skipped.push({ line, reason: 'format invalide (attendu : Nom,Prénom,Numéro)' })
      continue
    }

    const [nom, prenom, numeroRaw] = parts
    const numero = normalizePhone(numeroRaw)

    if (digitCount(numero) < 10) {
      skipped.push({ line, reason: 'numéro invalide' })
      continue
    }

    if (knownNumeros.has(numero)) {
      skipped.push({ line, reason: 'déjà inscrit dans cette session' })
      continue
    }

    if (seenInBatch.has(numero)) {
      skipped.push({ line, reason: 'doublon dans la liste collée' })
      continue
    }

    seenInBatch.add(numero)
    toAdd.push({ nom, prenom, numero, filiere })
  }

  const chunkSize = 450
  for (let i = 0; i < toAdd.length; i += chunkSize) {
    const chunk = toAdd.slice(i, i + chunkSize)
    const batch = db.batch()

    for (const candidat of chunk) {
      const ref = db.collection(CANDIDATS_COLLECTION).doc()
      batch.set(ref, {
        sessionId,
        sessionNom: session.nom,
        nom: candidat.nom,
        prenom: candidat.prenom,
        numero: candidat.numero,
        filiere: candidat.filiere,
        statut: 'en_attente',
      })
    }

    await batch.commit()
  }

  return { added: toAdd.length, skipped }
}

export async function updateCandidatStatut(candidatId: string, statut: Statut): Promise<void> {
  await getDb().collection(CANDIDATS_COLLECTION).doc(candidatId).update({ statut })
}

export async function updateCandidatFiliere(candidatId: string, filiere: Filiere): Promise<void> {
  await getDb().collection(CANDIDATS_COLLECTION).doc(candidatId).update({ filiere })
}

export async function findCandidatsByNumero(numero: string): Promise<SessionCandidat[]> {
  const snapshot = await getDb().collection(CANDIDATS_COLLECTION).where('numero', '==', numero).get()
  return snapshot.docs.map((doc) => readCandidat(doc.id, doc.data() as Record<string, unknown>))
}

export async function findCandidatBySessionAndNumero(
  sessionId: string,
  numero: string,
): Promise<SessionCandidat | null> {
  const snapshot = await getDb()
    .collection(CANDIDATS_COLLECTION)
    .where('sessionId', '==', sessionId)
    .where('numero', '==', numero)
    .limit(1)
    .get()

  if (snapshot.empty) return null
  return readCandidat(snapshot.docs[0].id, snapshot.docs[0].data() as Record<string, unknown>)
}
