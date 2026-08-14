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

export async function generateAdmissionCertificate(resultat: Resultat): Promise<Uint8Array> {
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

  return pdfDoc.save()
}
