import './signature-fonts.css'

/** 서명 만들기용 로컬 autograph 폰트 6종 */
export type SignatureFontStyle = {
  code: string
  /** CSS font-family 이름 */
  family: string
  weight: number
}

export const SIGNATURE_FONT_STYLES: readonly SignatureFontStyle[] = [
  // 표시 순서는 시안(Figma 14482-22611) 기준. code는 저장값과 맞물리므로 폰트와의 대응을 바꾸지 않는다.
  { code: 'style-02', family: '"JA Signature NanumDahaeng"', weight: 400 },
  { code: 'style-05', family: '"JA Signature GangwonEduAll"', weight: 700 },
  { code: 'style-06', family: '"JA Signature KimjungchulScript"', weight: 700 },
  { code: 'style-04', family: '"JA Signature OngleipParkDahyun"', weight: 400 },
  { code: 'style-03', family: '"JA Signature OngleipKimKonghae"', weight: 400 },
  { code: 'style-01', family: '"JA Signature NanumPen"', weight: 400 },
] as const

/**
 * 폰트 한 종이라도 로드 실패 시 reject되면 서명 생성이 중단되므로
 * 개별 실패는 무시한다(해당 스타일만 fallback 렌더).
 */
export async function ensureSignatureFontsReady() {
  if (typeof document === 'undefined' || !document.fonts?.load) return
  await Promise.allSettled(
    SIGNATURE_FONT_STYLES.map(style =>
      document.fonts.load(`${style.weight} 72px ${style.family}`),
    ),
  )
}
