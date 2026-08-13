/**
 * 오시는 길 관리 도메인 타입
 */

export type DirectionsInfo = {
  addressKo: string
  addressEn: string
  kakaoMapHtml: string
  phone: string
  fax: string
  email: string
  updatedAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}
