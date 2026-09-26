/**
 * 오시는 길 — OpenAPI ↔ 도메인 매핑
 */

import type { DirectionsInfo } from '@/entities/directions/model/types'
import type { DirectionsResponse } from '@/shared/api/generated/ja-korea/schemas/directionsResponse'
import type { DirectionsUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/directionsUpdateRequest'

export function mapDirectionsResponseToDomain(row: DirectionsResponse): DirectionsInfo {
  return {
    addressKo: row.koreanAddress ?? '',
    addressEn: row.englishAddress ?? '',
    kakaoMapHtml: row.kakaoMapHtml ?? '',
    phone: row.phone ?? '',
    fax: row.fax ?? '',
    email: row.email ?? '',
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

export function toDirectionsUpdateRequest(data: DirectionsInfo): DirectionsUpdateRequest {
  return {
    koreanAddress: data.addressKo.trimEnd(),
    englishAddress: data.addressEn.trimEnd(),
    kakaoMapHtml: data.kakaoMapHtml.trimEnd(),
    phone: data.phone.trimEnd(),
    fax: data.fax.trimEnd(),
    email: data.email.trimEnd(),
    version: data.version,
  }
}
