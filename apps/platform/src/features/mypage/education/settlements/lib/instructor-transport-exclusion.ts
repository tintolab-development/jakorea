/**
 * 강사 정산 미리보기(POST .../instructor-assignments/{assignmentId}/settlement-applications/preview)의
 * 교통비 제외 안내. 일반 프로그램은 지도에서 주소·경로를 못 찾으면 교통비 0원으로 신청할 수 있다.
 * 1사1교는 이 필드 대신 409 SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED가 난다(기존 처리 유지).
 */
export const TRANSPORTATION_EXCLUDED_REASON_ADDRESS_UNRESOLVED = 'ADDRESS_UNRESOLVED'

export type InstructorTransportExclusion = {
  reason: string
  /** ORIGIN | DESTINATION | ROUTE | UNKNOWN | null */
  addressSide: string | null
}

const SIDE_MESSAGE: Record<string, string> = {
  ORIGIN: '회원정보의 자택 주소를 지도에서 찾을 수 없어 교통비가 제외되었습니다. 주소를 확인해 주세요.',
  DESTINATION: '교육 장소 주소를 지도에서 찾을 수 없어 교통비가 제외되었습니다. 담당자에게 문의해 주세요.',
  ROUTE: '이동 경로를 찾을 수 없어 교통비가 제외되었습니다.',
}

/** UNKNOWN·값 없음 — 프롬프트에 문구가 없어 일반 문구로 안내한다. */
const DEFAULT_MESSAGE = '교통비 계산에 필요한 주소를 지도에서 찾을 수 없어 교통비가 제외되었습니다.'

export const TRANSPORTATION_EXCLUDED_RESUBMIT_GUIDE =
  '제출 후 교통비를 보완하려면 반려 후 재신청해야 합니다.'

function normalize(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase() : null
}

/** 미리보기 응답 → 교통비 제외 정보. 제외되지 않았으면 null */
export function readInstructorTransportExclusion(preview: unknown): InstructorTransportExclusion | null {
  if (!preview || typeof preview !== 'object') return null
  const record = preview as Record<string, unknown>
  const reason = normalize(record.transportationExcludedReason)
  if (!reason) return null
  return { reason, addressSide: normalize(record.transportationUnresolvedAddressSide) }
}

/** 교통비 제외 안내 문장들(본문, 재신청 안내). 제외가 아니면 null */
export function instructorTransportExclusionNotice(
  exclusion: InstructorTransportExclusion | null | undefined,
): string[] | null {
  if (!exclusion || exclusion.reason !== TRANSPORTATION_EXCLUDED_REASON_ADDRESS_UNRESOLVED) return null
  const message = (exclusion.addressSide && SIDE_MESSAGE[exclusion.addressSide]) || DEFAULT_MESSAGE
  return [message, TRANSPORTATION_EXCLUDED_RESUBMIT_GUIDE]
}
