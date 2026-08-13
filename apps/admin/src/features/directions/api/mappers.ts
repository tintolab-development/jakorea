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
    koreanAddress: data.addressKo.trimEnd() || undefined,
    englishAddress: data.addressEn.trimEnd() || undefined,
    kakaoMapHtml: data.kakaoMapHtml.trimEnd() || undefined,
    phone: data.phone.trimEnd() || undefined,
    fax: data.fax.trimEnd() || undefined,
    email: data.email.trimEnd() || undefined,
    version: data.version,
  }
}
