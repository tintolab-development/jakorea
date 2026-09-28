/** GET /api/public/ja-korea/directions — 공개 오시는 길 (무토큰) */

export type PublicDirectionsResponse = {
  koreanAddress?: string
  englishAddress?: string
  kakaoMapHtml?: string
  phone?: string
  fax?: string
  email?: string
}
