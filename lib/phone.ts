/**
 * Normalise un numéro de téléphone ivoirien vers un format compact
 * de 10 chiffres, sans espaces, tirets, points ni indicatif pays.
 *
 * Exemples :
 *  "+225 05 02 18 04 38" -> "0502180438"
 *  "00225-0502180438"    -> "0502180438"
 *  "05.02.18.04.38"      -> "0502180438"
 */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '')

  if (digits.startsWith('00225')) {
    digits = digits.slice(5)
  } else if (digits.startsWith('225') && digits.length > 10) {
    digits = digits.slice(3)
  }

  return digits
}

/** Nombre de chiffres saisis, utilisé pour activer le bouton. */
export function digitCount(input: string): number {
  return normalizePhone(input).length
}

/** Formatage lisible : 05 02 18 04 38 */
export function formatPhone(input: string): string {
  const digits = normalizePhone(input)
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}
