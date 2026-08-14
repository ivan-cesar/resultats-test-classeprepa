import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { Resultat } from '@/lib/firestore'

const ASSETS_DIR = path.join(process.cwd(), 'lib/certificate/assets')
const TEMPLATE_PATH = path.join(ASSETS_DIR, 'admission-template.pdf')
const FONT_PATH = path.join(ASSETS_DIR, 'RedHatDisplay-Black.ttf')

/**
 * Position exacte du nom sur la page 2 du template, relevée sur le PDF
 * source (police, taille et ligne de base) avant que le nom n'en soit
 * retiré. Le fond (dégradé/vagues) reste intact autour de ce point.
 */
const NAME_X = 119.39
const NAME_BASELINE_Y = 681.67
const NAME_FONT_SIZE = 10
const NAME_COLOR = rgb(29 / 255, 29 / 255, 27 / 255)
const NAME_MAX_WIDTH = 428

export async function generateAdmissionCertificate(resultat: Resultat): Promise<Uint8Array> {
  const [templateBytes, fontBytes] = await Promise.all([
    readFile(TEMPLATE_PATH),
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
    x: NAME_X,
    y: NAME_BASELINE_Y,
    size: fontSize,
    font,
    color: NAME_COLOR,
  })

  return pdfDoc.save()
}
