import type { SettlementFrontendResponse } from '@/shared/api/generated/settlement/schemas'

/**
 * 강사비 산정에 적용된 인정 차시. 지급조서 「교육 진행 차시」 기준.
 * 없으면 null — sessionOrdinal(회차 번호)·진행 회차로 대체하지 않는다. 0은 0차시.
 */
export function readSettlementRecognizedSessionCount(
  settlement: SettlementFrontendResponse | null | undefined
): number | null {
  // `SettlementFrontendResponse.recognizedSessionCount` — 정산 = snapshot 인정 차시,
  // Gemini 계좌 지급 상세 = class_count, 값 없는 예전 정산 = null.
  const raw = settlement?.recognizedSessionCount
  return typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 ? raw : null
}
