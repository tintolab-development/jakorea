import {
  extractApiErrorCode,
  extractApiErrorMessage,
} from '@/shared/lib/extract-api-error-message'

/** 일반 기관 합반 생성 `error.code` → 화면 문구 */
export const ORGANIZATION_MERGE_ERROR_MESSAGES: Record<string, string> = {
  GENERAL_ORGANIZATION_MERGE_REQUIRES_AT_LEAST_TWO_APPLICATIONS:
    '리드 신청을 포함해 승인된 신청 2건 이상을 선택해 주세요.',
  GENERAL_ORGANIZATION_MERGE_LEAD_MUST_BE_MEMBER: '리드 신청을 합반 대상에 포함해 주세요.',
  GENERAL_ORGANIZATION_MERGE_APPLICATION_DUPLICATED: '동일한 신청이 중복 선택되었습니다.',
  GENERAL_ORGANIZATION_MERGE_GRADE_REQUIRED: '합반 대상 신청의 학년 정보를 확인해 주세요.',
  GENERAL_ORGANIZATION_MERGE_GRADE_DUPLICATED: '서로 다른 학년을 선택해 주세요.',
  GENERAL_ORGANIZATION_MERGE_SAME_ORGANIZATION_REQUIRED: '같은 기관의 신청만 합반할 수 있습니다.',
  GENERAL_ORGANIZATION_MERGE_APPLICATION_NOT_APPROVED: '승인된 신청만 합반할 수 있습니다.',
  GENERAL_ORGANIZATION_MERGE_APPLICATION_ALREADY_MERGED:
    '이미 다른 합반 그룹에 포함된 신청입니다.',
  GENERAL_ORGANIZATION_MERGE_NEXT_SCHEDULE_REQUIRED:
    '합반을 적용할 다음 교육 일정이 없습니다. 교육 일정을 확인해 주세요.',
  GENERAL_ORGANIZATION_MERGE_SINGLE_SESSION_ONLY: '단일 회차 프로그램만 합반할 수 있습니다.',
  GENERAL_ORGANIZATION_MERGE_SAME_EDUCATION_DATE_REQUIRED:
    '같은 교육일의 학급만 합반할 수 있습니다.',
  GENERAL_ORGANIZATION_MERGE_EDUCATION_DATE_MISSING:
    '합반 대상 학급의 교육 일정을 확인할 수 없습니다.',
}

function readTraceId(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const envelope = data as { traceId?: unknown; error?: { traceId?: unknown } }
  const nested = envelope.error?.traceId
  if (typeof nested === 'string' && nested.trim()) return nested.trim()
  const top = envelope.traceId
  return typeof top === 'string' && top.trim() ? top.trim() : undefined
}

export function resolveOrganizationMergeErrorMessage(
  data: unknown,
  options?: { httpStatus?: number | null; fallback?: string }
): string {
  const code = extractApiErrorCode(data)
  const traceId = readTraceId(data)
  if (traceId) {
    console.error('[organization-merge]', code ?? 'UNKNOWN', traceId)
  }
  const mapped = code ? ORGANIZATION_MERGE_ERROR_MESSAGES[code] : undefined
  if (mapped) return mapped
  return extractApiErrorMessage(data, options)
}
