import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'

const REGION_ERROR_FALLBACK: Record<string, string> = {
  UJAT_EDUCATION_REGION_NOT_FOUND:
    '등록되지 않은 교육 지역입니다. 지역 목록을 다시 확인한 뒤 선택해 주세요.',
  UJAT_EDUCATION_REGION_CODE_UNKNOWN:
    '등록되지 않은 교육 지역입니다. 지역 목록을 다시 확인해 주세요.',
  UJAT_EDUCATION_REGION_CODE_REQUIRED: '희망 교육 활동 지역을 선택해 주세요.',
  VOLUNTEER_ACTIVITY_REGION_PROGRAM_TYPE_UNSUPPORTED:
    '이 신청은 희망 교육 활동 지역을 수정할 수 없습니다.',
  VOLUNTEER_APPLICATION_NOT_FOUND: '봉사자 신청을 찾을 수 없습니다.',
  VOLUNTEER_APPLICATION_FORM_RESPONSE_NOT_FOUND:
    '제출된 신청서가 없어 희망 교육 활동 지역을 수정할 수 없습니다.',
  UJAT_VOLUNTEER_REGION_CHANGE_HAS_ACTIVE_ASSIGNMENTS:
    '예정된 교육일 배정이 있어 활동 지역을 변경할 수 없습니다. 기존 배정을 먼저 취소하거나 대체해 주세요.',
}

function extractApiErrorPayload(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return undefined
  return data as Record<string, unknown>
}

export function getVolunteerActivityRegionErrorCode(error: unknown): string | undefined {
  const data = extractApiErrorPayload(error)
  if (!data) return undefined
  if (typeof data.error === 'object' && data.error && 'code' in data.error) {
    const nested = (data.error as { code?: unknown }).code
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  if (typeof data.code === 'string' && data.code.trim()) return data.code.trim()
  return undefined
}

function upcomingAssignmentCount(error: unknown): number | null {
  const data = extractApiErrorPayload(error)
  const details =
    data && typeof data.error === 'object' && data.error && 'details' in data.error
      ? (data.error as { details?: unknown }).details
      : undefined
  if (!details || typeof details !== 'object') return null
  const count = (details as { upcomingAssignmentCount?: unknown }).upcomingAssignmentCount
  return typeof count === 'number' && Number.isFinite(count) ? count : null
}

export function getVolunteerActivityRegionErrorMessage(error: unknown): string {
  const code = getVolunteerActivityRegionErrorCode(error)
  if (code === 'UJAT_VOLUNTEER_REGION_CHANGE_HAS_ACTIVE_ASSIGNMENTS') {
    const fromServer = getGeneralProgramApiErrorMessage(error, '')
    if (fromServer) return fromServer
    const count = upcomingAssignmentCount(error)
    if (count != null) {
      return `예정된 교육일 배정이 ${count}건 있어 활동 지역을 변경할 수 없습니다. 기존 배정을 먼저 취소하거나 대체해 주세요.`
    }
    return REGION_ERROR_FALLBACK[code]
  }
  if (code && REGION_ERROR_FALLBACK[code]) {
    return getGeneralProgramApiErrorMessage(error, REGION_ERROR_FALLBACK[code])
  }
  return getGeneralProgramApiErrorMessage(
    error,
    '희망 교육 활동 지역을 저장하지 못했습니다. 다시 시도해 주세요.'
  )
}
