/**
 * 공개 오시는 길 — PublicDirectionsResponse → 도메인
 */

import type { DirectionsInfo } from '../model/types'
import type { PublicDirectionsResponse } from './types'

function asText(value: string | undefined | null): string {
  return typeof value === 'string' ? value : ''
}

export function mapPublicDirections(response: PublicDirectionsResponse): DirectionsInfo {
  return {
    addressKo: asText(response.koreanAddress),
    addressEn: asText(response.englishAddress),
    kakaoMapHtml: asText(response.kakaoMapHtml),
    phone: asText(response.phone),
    fax: asText(response.fax),
    email: asText(response.email),
    updatedAt: '',
  }
}

/** 주소·연락 중 하나라도 있으면 표시 가능하다. */
export function hasDirectionsContent(info: DirectionsInfo | null | undefined): boolean {
  if (!info) return false
  return Boolean(
    info.addressKo.trim() ||
      info.addressEn.trim() ||
      info.phone.trim() ||
      info.fax.trim() ||
      info.email.trim() ||
      info.kakaoMapHtml.trim(),
  )
}
