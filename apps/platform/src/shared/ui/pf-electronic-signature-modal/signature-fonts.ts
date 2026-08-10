/** 서명 만들기용 임시 필기체 6종 (Google Fonts) — Notion zip 반입 전 대체 */
export type SignatureFontStyle = {
  code: string
  family: string
  weight: number
}

export const SIGNATURE_FONT_STYLES: readonly SignatureFontStyle[] = [
  { code: 'style-01', family: '"Nanum Pen Script", cursive', weight: 400 },
  { code: 'style-02', family: '"Gaegu", cursive', weight: 400 },
  { code: 'style-03', family: '"Gamja Flower", cursive', weight: 400 },
  { code: 'style-04', family: '"Hi Melody", cursive', weight: 400 },
  { code: 'style-05', family: '"Single Day", cursive', weight: 400 },
  { code: 'style-06', family: '"Poor Story", cursive', weight: 400 },
] as const

export const SIGNATURE_GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Gaegu&family=Gamja+Flower&family=Hi+Melody&family=Nanum+Pen+Script&family=Poor+Story&family=Single+Day&display=swap'
