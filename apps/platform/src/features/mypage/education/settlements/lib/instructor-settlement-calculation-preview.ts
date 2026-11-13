import type { PortalInstructorSettlementPreview } from '../api/instructor-settlement-client.ts'

type JsonRecord = Record<string, unknown>

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord : null
}
function won(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null
}
function parseBasis(value: unknown): JsonRecord {
  if (typeof value !== 'string') return {}
  try {
    return record(JSON.parse(value)) ?? {}
  } catch {
    return {}
  }
}
function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}
function wonLabel(value: number): string {
  return `${value.toLocaleString('ko-KR')}원`
}

export type InstructorSettlementCalculationView = {
  /** Read-only server amounts: never recalculate wages, expenses or withholding in the browser. */
  gross: string
  withholding: string
  net: string
  lecture: string
  transportation: string
  explanation: string | null
}

/**
 * The backend's calculationDetails contains zero-payable lines even when items=[]
 * (e.g. a 25-minute online lecture). This parser never fabricates a fee or reads PII.
 */
export function readInstructorSettlementCalculation(
  preview: PortalInstructorSettlementPreview | null | undefined,
): InstructorSettlementCalculationView | null {
  const gross = won(preview?.grossAmount)
  const withholding = won(preview?.withholdingTaxAmount)
  const net = won(preview?.netPaymentAmount)
  if (gross == null || withholding == null || net == null) return null
  if (gross - withholding !== net) return null

  const details = preview?.calculationDetails ?? []
  const lectureDetail = details.find(item => item.calculationType === 'LECTURE_FEE')
  const transportDetail = details.find(item => item.calculationType === 'TRANSPORTATION')
  const lecture = parseBasis(lectureDetail?.basisJsonb)
  const transport = parseBasis(transportDetail?.basisJsonb)
  const unit = won(lecture.instructorFeeAmount)
  const sessions = won(lecture.recognizedSessionCount)
  const minutes = won(lecture.actualTrainingMinutes)
  const wage = won(lectureDetail?.resultAmount)
  const transportWon = won(transportDetail?.resultAmount)
  const transportReason = asText(transport.reason)

  const wageInfo = unit != null && sessions != null &&
      ['PER_HOUR', 'PER_CLASS'].includes(String(lecture.instructorFeeCalculationUnit))
    ? `강사비: ${wonLabel(unit)} × ${sessions}차시 = ${wonLabel(wage ?? 0)}` +
      (minutes != null ? ` (교육 ${minutes}분)` : '')
    : wage != null
      ? `강사비: 서버 확정 ${wonLabel(wage)}`
      : '강사비: 계산 근거 확인 필요'

  const transportInfo = transportReason === 'EDUCATION_FORM_ZERO'
    ? `교통비: 온라인·혼합 교육 0km → ${wonLabel(transportWon ?? 0)}`
    : transportReason === 'BELOW_MINIMUM_DISTANCE'
      ? `교통비: 최소 지급 거리 미달 → ${wonLabel(transportWon ?? 0)}`
      : transportReason === 'ADDRESS_UNRESOLVED'
        ? '교통비: 주소·경로 확인 불가로 제외'
        : transportWon != null
          ? `교통비: 서버 확정 ${wonLabel(transportWon)}`
          : '교통비: 계산 근거 확인 필요'

  const explanation = preview?.canSubmit === false
    ? (asText(preview.blockerCode) === 'SETTLEMENT_CALCULATION_ITEMS_REQUIRED'
        ? '정산 지급 항목이 없어 신청할 수 없습니다. 교육 시간과 지급 정책을 확인해 주세요.'
        : asText(preview.blockerCode))
    : null

  return {
    gross: wonLabel(gross),
    withholding: wonLabel(withholding),
    net: wonLabel(net),
    lecture: wageInfo,
    transportation: transportInfo,
    explanation,
  }
}
