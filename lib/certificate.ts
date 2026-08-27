import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { Filiere, Resultat } from '@/lib/firestore'

const ASSETS_DIR = path.join(process.cwd(), 'lib/certificate/assets')
const FONT_PATH = path.join(ASSETS_DIR, 'RedHatDisplay-Black.ttf')

const NAME_FONT_SIZE = 10
const NAME_COLOR = rgb(29 / 255, 29 / 255, 27 / 255)
const NAME_MAX_WIDTH = 420

/**
 * Chaque filière a sa propre lettre (contenu, partenaires, concours) donc
 * son propre template PDF. Seule la position du nom diffère d'un template
 * à l'autre — relevée sur le PDF source (police, taille, ligne de base)
 * avant que le nom n'en soit retiré. Le fond (dégradé/vagues) reste intact
 * autour de ce point.
 */
const TEMPLATES: Record<Filiere, { file: string; nameX: number; nameBaselineY: number }> = {
  polytechnique: {
    file: 'polytechnique-admission-template.pdf',
    nameX: 119.39,
    nameBaselineY: 681.67,
  },
  ecg: {
    file: 'ecg-admission-template.pdf',
    nameX: 120.27,
    nameBaselineY: 695.55,
  },
}

/**
 * La ligne « Abidjan, le [date] » est, comme le nom avant modification,
 * gravée dans le PDF source. Pour la rendre dynamique on masque la zone
 * d'origine (fond blanc, relevé sur le template) puis on réécrit la date
 * au même point d'ancrage. Couleur et position relevées sur chaque
 * template avant modification ; la police "Medium" d'origine n'étant pas
 * embarquée dans le projet, on réutilise la police "Black" déjà chargée
 * pour le nom (rendu légèrement plus gras que l'original, écart mineur).
 */
const DATE_TEMPLATES: Record<
  Filiere,
  { dateX: number; dateBaselineY: number; color: readonly [number, number, number]; coverRect: { x: number; y: number; width: number; height: number } }
> = {
  polytechnique: {
    dateX: 47.8,
    dateBaselineY: 753.74,
    color: [29 / 255, 29 / 255, 27 / 255],
    coverRect: { x: 40, y: 743.89, width: 220, height: 24 },
  },
  ecg: {
    dateX: 47.8,
    dateBaselineY: 764.74,
    color: [81 / 255, 81 / 255, 81 / 255],
    coverRect: { x: 40, y: 757.89, width: 220, height: 20 },
  },
}

export async function generateAdmissionCertificate(
  resultat: Resultat,
  dateLabel?: string,
): Promise<Uint8Array> {
  const template = TEMPLATES[resultat.filiere]

  const [templateBytes, fontBytes] = await Promise.all([
    readFile(path.join(ASSETS_DIR, template.file)),
    readFile(FONT_PATH),
  ])

  const pdfDoc = await PDFDocument.load(templateBytes)
  pdfDoc.registerFontkit(fontkit)
  const font = await pdfDoc.embedFont(fontBytes, { subset: true })

  const page = pdfDoc.getPage(1)
  const fullName = [resultat.prenom, resultat.nom].filter(Boolean).join(' ').trim().toUpperCase()

  let fontSize = NAME_FONT_SIZE
  const width = font.widthOfTextAtSize(fullName, fontSize)
  if (width > NAME_MAX_WIDTH) {
    fontSize = fontSize * (NAME_MAX_WIDTH / width)
  }

  page.drawText(fullName, {
    x: template.nameX,
    y: template.nameBaselineY,
    size: fontSize,
    font,
    color: NAME_COLOR,
  })

  if (dateLabel) {
    const dateTemplate = DATE_TEMPLATES[resultat.filiere]

    page.drawRectangle({
      x: dateTemplate.coverRect.x,
      y: dateTemplate.coverRect.y,
      width: dateTemplate.coverRect.width,
      height: dateTemplate.coverRect.height,
      color: rgb(1, 1, 1),
    })

    page.drawText(`Abidjan, le ${dateLabel}`, {
      x: dateTemplate.dateX,
      y: dateTemplate.dateBaselineY,
      size: 10,
      font,
      color: rgb(...dateTemplate.color),
    })
  }

  return pdfDoc.save()
}
