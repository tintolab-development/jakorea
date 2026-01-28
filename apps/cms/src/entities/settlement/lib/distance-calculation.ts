/**
 * 거리 계산 로직 (FR-G01)
 * Task 4.1.1: 자택 ↔ 학교 간 거리 계산, 지도 API 연동 준비
 */

export interface DistanceInputCoord {
  lat: number
  lng: number
}

export interface DistanceInputAddress {
  address: string
}

export type DistanceInputPoint = DistanceInputCoord | DistanceInputAddress

export interface DistanceCalculationInput {
  origin: DistanceInputPoint
  destination: DistanceInputPoint
}

export interface DistanceCalculationResult {
  /** 편도 거리 (km) */
  distanceKm: number
  /** 예상 소요 시간 (분), API 지원 시 */
  durationMinutes?: number
}

/**
 * 거리 계산 프로바이더 인터페이스
 * 네이버/카카오 지도 API 연동 시 구현체 교체
 */
export interface DistanceProvider {
  calculate(input: DistanceCalculationInput): Promise<DistanceCalculationResult>
}

/**
 * Haversine 공식: 두 위경도 간 직선 거리 (km)
 * 실제 도로 거리와 차이 있음. 지도 API 사용 시 더 정확.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 주소 → 위경도 Mock 매핑 (지도 API 연동 전)
 * 실제 연동 시 Geocoding API로 대체
 */
const MOCK_ADDRESS_TO_COORD: Record<string, { lat: number; lng: number }> = {
  서울: { lat: 37.5665, lng: 126.978 },
  경기: { lat: 37.4138, lng: 127.5183 },
  인천: { lat: 37.4563, lng: 126.7052 },
  부산: { lat: 35.1796, lng: 129.0756 },
  대구: { lat: 35.8714, lng: 128.6014 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  울산: { lat: 35.5384, lng: 129.3114 },
  세종: { lat: 36.4801, lng: 127.2892 },
  파주: { lat: 37.7599, lng: 126.7802 },
  용인: { lat: 37.2411, lng: 127.1775 },
}

function resolveToCoord(point: DistanceInputPoint): { lat: number; lng: number } {
  if ('lat' in point && 'lng' in point) {
    return { lat: point.lat, lng: point.lng }
  }
  const addr = point.address.trim()
  for (const [key, coord] of Object.entries(MOCK_ADDRESS_TO_COORD)) {
    if (addr.includes(key)) return coord
  }
  return { lat: 37.5665, lng: 126.978 }
}

/**
 * Mock 거리 계산 (Haversine 기반)
 * 지도 API 연동 시 DistanceProvider 구현체로 교체
 */
const mockDistanceProvider: DistanceProvider = {
  async calculate(input: DistanceCalculationInput): Promise<DistanceCalculationResult> {
    await new Promise(r => setTimeout(r, 150))
    const o = resolveToCoord(input.origin)
    const d = resolveToCoord(input.destination)
    const distanceKm = Math.round(haversineDistanceKm(o.lat, o.lng, d.lat, d.lng) * 10) / 10
    return { distanceKm }
  },
}

let _provider: DistanceProvider = mockDistanceProvider

/**
 * 거리 계산 프로바이더 설정 (테스트/API 연동용)
 */
export function setDistanceProvider(provider: DistanceProvider): void {
  _provider = provider
}

/**
 * 자택 ↔ 학교 간 편도 거리 계산
 * @param input origin(자택), destination(학교) 주소 또는 위경도
 */
export async function calculateDistance(
  input: DistanceCalculationInput
): Promise<DistanceCalculationResult> {
  return _provider.calculate(input)
}
