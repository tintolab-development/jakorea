import './signature-fonts.css'

/** 서명 만들기용 로컬 autograph 폰트 6종 */
export type SignatureFontStyle = {
  code: string
  /** CSS font-family 이름 */
  family: string
  weight: number
}

export const SIGNATURE_FONT_STYLES: readonly SignatureFontStyle[] = [
  { code: 'style-01', family: '"JA Signature NanumPen"', weight: 400 },
  { code: 'style-02', family: '"JA Signature NanumDahaeng"', weight: 400 },
  { code: 'style-03', family: '"JA Signature OngleipKimKonghae"', weight: 400 },
  { code: 'style-04', family: '"JA Signature OngleipParkDahyun"', weight: 400 },
  { code: 'style-05', family: '"JA Signature GangwonEduAll"', weight: 700 },
  { code: 'style-06', family: '"JA Signature KimjungchulScript"', weight: 700 },
] as const

export async function ensureSignatureFontsReady() {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  await Promise.all(
    SIGNATURE_FONT_STYLES.map(style =>
      document.fonts.load(`${style.weight} 72px ${style.family}`),
    ),
  )
}
