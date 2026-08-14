import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'ispa_admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 12 // 12h

export class ConfigurationAdminManquanteError extends Error {
  constructor() {
    super('ADMIN_PASSWORD manquante.')
    this.name = 'ConfigurationAdminManquanteError'
  }
}

function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) throw new ConfigurationAdminManquanteError()
  return password
}

/**
 * Le cookie ne contient jamais le mot de passe : c'est un jeton dérivé par
 * HMAC, recalculé côté serveur à chaque vérification et comparé en temps
 * constant pour éviter les attaques par timing.
 */
function computeSessionToken(password: string): string {
  return createHmac('sha256', password).update('ispa-admin-session').digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function verifyAdminPassword(candidate: string): boolean {
  return safeEqual(candidate, getAdminPassword())
}

export async function createAdminSession(): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, computeSessionToken(getAdminPassword()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })
}

export async function destroyAdminSession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return false

  try {
    return safeEqual(token, computeSessionToken(getAdminPassword()))
  } catch {
    return false
  }
}
