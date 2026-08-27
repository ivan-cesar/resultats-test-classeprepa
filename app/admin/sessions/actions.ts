'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import type { Filiere, Statut } from '@/lib/firestore'
import {
  createSession,
  enrollCandidat,
  enrollCandidatsBulk,
  updateCandidatFiliere,
  updateCandidatStatut,
} from '@/lib/sessions'

export type CreateSessionState = { status: 'idle' | 'error'; message?: string }

export async function createSessionAction(
  _prevState: CreateSessionState,
  formData: FormData,
): Promise<CreateSessionState> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Non autorisé.')
  }

  const nom = String(formData.get('nom') ?? '').trim()
  if (!nom) {
    return { status: 'error', message: 'Le nom de la session est requis.' }
  }

  const dateLettre = String(formData.get('date') ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateLettre)) {
    return { status: 'error', message: 'La date de la session est requise.' }
  }

  const id = await createSession(nom, dateLettre)
  revalidatePath('/admin/sessions')
  redirect(`/admin/sessions/${id}`)
}

export type EnrollCandidatState = { status: 'idle' | 'error' | 'success'; message?: string }

export async function enrollCandidatAction(
  sessionId: string,
  _prevState: EnrollCandidatState,
  formData: FormData,
): Promise<EnrollCandidatState> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Non autorisé.')
  }

  const nom = String(formData.get('nom') ?? '')
  const prenom = String(formData.get('prenom') ?? '')
  const numero = String(formData.get('numero') ?? '')
  const filiere = String(formData.get('filiere') ?? '') as Filiere

  const result = await enrollCandidat(sessionId, { nom, prenom, numero, filiere })

  if (!result.ok) {
    return {
      status: 'error',
      message:
        result.reason === 'duplicate'
          ? 'Ce numéro est déjà inscrit dans cette session.'
          : 'Merci de renseigner un nom, un prénom et un numéro valides.',
    }
  }

  revalidatePath(`/admin/sessions/${sessionId}`)
  return { status: 'success' }
}

export type EnrollBulkState = {
  status: 'idle' | 'done'
  added?: number
  skipped?: { line: string; reason: string }[]
}

export async function enrollCandidatsBulkAction(
  sessionId: string,
  _prevState: EnrollBulkState,
  formData: FormData,
): Promise<EnrollBulkState> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Non autorisé.')
  }

  const filiere = String(formData.get('filiere') ?? '') as Filiere
  const text = String(formData.get('text') ?? '')

  const { added, skipped } = await enrollCandidatsBulk(sessionId, filiere, text)

  revalidatePath(`/admin/sessions/${sessionId}`)
  return { status: 'done', added, skipped }
}

export async function updateSessionCandidatStatutAction(
  candidatId: string,
  statut: Statut,
  sessionId: string,
): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Non autorisé.')
  }

  await updateCandidatStatut(candidatId, statut)
  revalidatePath(`/admin/sessions/${sessionId}`)
}

export async function updateSessionCandidatFiliereAction(
  candidatId: string,
  filiere: Filiere,
  sessionId: string,
): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Non autorisé.')
  }

  await updateCandidatFiliere(candidatId, filiere)
  revalidatePath(`/admin/sessions/${sessionId}`)
}
