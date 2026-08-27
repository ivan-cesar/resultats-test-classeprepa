import type { Filiere, Statut } from '@/lib/firestore'

export const STATUT_OPTIONS: { value: Statut; label: string }[] = [
  { value: 'admis', label: 'Admis' },
  { value: 'non_admis', label: 'Non admis' },
  { value: 'en_attente', label: 'En attente' },
]

export const STATUT_BADGE: Record<Statut, string> = {
  admis: 'bg-success/10 text-success border-success/30',
  non_admis: 'bg-destructive/10 text-destructive border-destructive/30',
  en_attente: 'bg-warning/10 text-warning border-warning/30',
}

export const FILIERE_LABEL: Record<Filiere, string> = {
  polytechnique: 'MPSI/PCSI',
  ecg: 'ECG',
}

export const FILIERE_OPTIONS: { value: Filiere; label: string }[] = [
  { value: 'polytechnique', label: 'MPSI/PCSI' },
  { value: 'ecg', label: 'ECG' },
]
