/** 정산 교통비 거리 스냅샷 API `provider` / `fuelType` → 화면 라벨 */

export const TRANSPORT_SNAPSHOT_PROVIDER_LABELS: Record<string, string> = {
  NAVER_MAPS: '네이버 지도',
  TMAP: '티맵',
  KAKAO_MAP: '카카오맵',
  KAKAO_MOBILITY: '카카오맵',
  GOOGLE_MAPS: '구글 지도',
  LOCAL_DISTANCE: '로컬 거리',
}

export const TRANSPORT_SNAPSHOT_FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINE: '휘발유',
  PREMIUM_GASOLINE: '고급휘발유',
  PREMIUM: '고급휘발유',
  DIESEL: '경유',
  LPG: 'LPG',
  KEROSENE: '등유',
  ELECTRIC: '전기',
}

function looksLikeApiEnum(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value)
}

function formatMappedApiLabel(
  value: string | null | undefined,
  labels: Record<string, string>
): string {
  const trimmed = value?.trim()
  if (!trimmed) return '-'
  const mapped =
    labels[trimmed] ?? labels[trimmed.toUpperCase()] ?? labels[trimmed.toLowerCase()]
  if (mapped) return mapped
  if (looksLikeApiEnum(trimmed)) return '-'
  return trimmed
}

export function formatTransportSnapshotProviderLabel(value: string | null | undefined): string {
  return formatMappedApiLabel(value, TRANSPORT_SNAPSHOT_PROVIDER_LABELS)
}

export function formatTransportSnapshotFuelTypeLabel(value: string | null | undefined): string {
  return formatMappedApiLabel(value, TRANSPORT_SNAPSHOT_FUEL_TYPE_LABELS)
}
