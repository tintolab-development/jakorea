/** 편도 30km 이상(포함)만 강사 교통비 지급. CMS-FUNC-0544 / USER-FUNC-0277 */
export const INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM = 30

export type InstructorTransportPreview = {
  oneWayDistanceKm: number | null
  fuelCostWon: number | null
  tollFeeWon: number | null
  totalTransportFeeWon: number | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function parseWonInteger(value: unknown): number | null {
  const n = parseFiniteNumber(value)
  if (n == null || !Number.isSafeInteger(n)) return null
  return n
}

function readNestedPreview(record: Record<string, unknown>): Record<string, unknown> | null {
  for (const key of [
    'transportPreview',
    'instructorTransportPreview',
    'transportationSnapshot',
    'transportSnapshot',
  ]) {
    const nested = record[key]
    if (isRecord(nested)) return nested
  }
  return null
}

export function parseInstructorTransportPreview(value: unknown): InstructorTransportPreview | null {
  if (!isRecord(value)) return null
  const nested = readNestedPreview(value)
  const source = nested ?? value
  const preview: InstructorTransportPreview = {
    oneWayDistanceKm: parseFiniteNumber(
      source.oneWayDistanceKm ?? source.distanceFromHome ?? source.distanceKm ?? value.distanceFromHome,
    ),
    fuelCostWon: parseWonInteger(source.fuelCostWon ?? source.fuelCost),
    tollFeeWon: parseWonInteger(source.tollFeeWon ?? source.tollAmount ?? source.tollFee),
    totalTransportFeeWon: parseWonInteger(
      source.totalTransportFeeWon ??
        source.calculatedTransportAmount ??
        source.totalTransportFee ??
        source.transportTotalAmount,
    ),
  }
  if (
    preview.oneWayDistanceKm == null &&
    preview.fuelCostWon == null &&
    preview.tollFeeWon == null &&
    preview.totalTransportFeeWon == null
  ) {
    return null
  }
  return preview
}

/** 거리가 확인됐고 편도 30km 미만이면 섹션 비노출·미지급 */
export function isInstructorTransportBelowMinimum(
  preview: InstructorTransportPreview | null | undefined,
): boolean {
  const km = preview?.oneWayDistanceKm
  return km != null && km < INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM
}

export function isInstructorTransportSectionVisible(
  preview: InstructorTransportPreview | null | undefined,
): boolean {
  return !isInstructorTransportBelowMinimum(preview)
}

export function formatInstructorOneWayDistanceKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return '-'
  const rounded = Number.isInteger(km) ? String(km) : String(Math.round(km * 10) / 10)
  return `${rounded}km(편도)`
}

export function formatInstructorTransportWon(amount: number | null | undefined): string {
  if (amount == null || !Number.isSafeInteger(amount)) return '-'
  return `${amount.toLocaleString('ko-KR')}원`
}
