/** 편도 30km 이상(포함)만 강사 교통비 지급. CMS-FUNC-0544 / USER-FUNC-0277 */
export const INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM = 30

export type InstructorTransportPreview = {
  oneWayDistanceKm: number | null
  fuelCostWon: number | null
  tollFeeWon: number | null
  /** 서버 총 산정 교통비. FE에서 유류+톨을 더하지 않는다. */
  calculatedTransportAmount: number | null
  /** calculatedTransportAmount와 동일. 기존 제출 payload 호환. */
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
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  return null
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
  const calculatedTransportAmount = parseWonInteger(
    source.calculatedTransportAmount ??
      source.totalTransportFeeWon ??
      source.totalTransportFee ??
      source.transportTotalAmount,
  )
  const preview: InstructorTransportPreview = {
    oneWayDistanceKm: parseFiniteNumber(
      source.oneWayDistanceKm ??
        source.distanceFromHome ??
        source.distanceKm ??
        value.distanceFromHome,
    ),
    fuelCostWon: parseWonInteger(source.fuelCostWon ?? source.fuelCost),
    tollFeeWon: parseWonInteger(source.tollFeeWon ?? source.tollAmount ?? source.tollFee),
    calculatedTransportAmount,
    totalTransportFeeWon: calculatedTransportAmount,
  }
  if (
    preview.oneWayDistanceKm == null &&
    preview.fuelCostWon == null &&
    preview.tollFeeWon == null &&
    preview.calculatedTransportAmount == null
  ) {
    return null
  }
  return preview
}

/** 거리가 확인됐고 편도 30km 미만이면 미지급 */
export function isInstructorTransportBelowMinimum(
  preview: InstructorTransportPreview | null | undefined,
): boolean {
  const km = preview?.oneWayDistanceKm
  return km != null && km < INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM
}

function readInstructorTransportPaidAmount(
  preview: InstructorTransportPreview | null | undefined,
): number | null {
  const amount = preview?.calculatedTransportAmount ?? preview?.totalTransportFeeWon
  if (amount == null || !Number.isSafeInteger(amount) || amount <= 0) return null
  return amount
}

/** 편도 30km 이상(포함)이고 서버가 교통비 금액을 준 경우만 지급 항목으로 노출 */
export function isInstructorTransportSectionVisible(
  preview: InstructorTransportPreview | null | undefined,
): boolean {
  if (!preview) return false
  if (isInstructorTransportBelowMinimum(preview)) return false
  const km = preview.oneWayDistanceKm
  if (km == null || km < INSTRUCTOR_TRANSPORT_MIN_ONE_WAY_KM) return false
  return readInstructorTransportPaidAmount(preview) != null
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

/** 총 산정 교통비. 서버 calculatedTransportAmount만. 유류비+톨비 합산 금지. */
export function formatInstructorCalculatedTransportAmount(
  preview: InstructorTransportPreview | null | undefined,
): string {
  return formatInstructorTransportWon(
    preview?.calculatedTransportAmount ?? preview?.totalTransportFeeWon,
  )
}
