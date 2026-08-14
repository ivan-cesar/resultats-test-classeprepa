'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSession, destroyAdminSession, isAdminAuthenticated, verifyAdminPassword } from '@/lib/admin-auth'
import { updateResultatStatut, type Statut } from '@/lib/firestore'

export type AdminLoginState = { status: 'idle' | 'error'; message?: string }

export async function loginAdmin(
  _prevState: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const password = String(formData.get('password') ?? '')

  let valid: boolean
  try {
    valid = verifyAdminPassword(password)
  } catch {
    return { status: 'error', message: "Configuration serveur manquante (ADMIN_PASSWORD)." }
  }

  if (!valid) {
    return { status: 'error', message: 'Mot de passe incorrect.' }
  }

  await createAdminSession()
  revalidatePath('/admin')
  return { status: 'idle' }
}

export async function logoutAdmin(): Promise<void> {
  await destroyAdminSession()
  revalidatePath('/admin')
}

export async function changeStatutAction(numero: string, statut: Statut): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Non autorisé.')
  }

  await updateResultatStatut(numero, statut)
  revalidatePath('/admin')
}
