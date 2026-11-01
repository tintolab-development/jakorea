import {
  extractApiErrorDetails,
  getApiErrorCode,
  readApiErrorAlertMessage,
} from '@/shared/lib/extract-api-error-message'
import {
  normalizedClassKey,
  type ChangeClassRowFields,
} from '@/features/program/ujat/ui/detail-modal/progress/institutions/detail/change-class'

/** Alert 제목 — `readApiErrorAlertMessage` 본문과 쌍으로 사용 */
export const UJAT_CLASS_REMAP_ERROR_TITLES: Record<string, string> = {
  UJAT_CLASS_REMAP_APPLY_FROM_IN_PAST: '적용일을 확인할 수 없습니다',
  UJAT_CLASS_REMAP_INVALID_MAPPING: '학급 변경 정보가 올바르지 않습니다',
  UJAT_CLASS_REMAP_DUPLICATE_FROM: '동일한 기존 학급이 중복되었습니다',
  UJAT_CLASS_REMAP_SAME_CLASS: '기존 학급과 변경 학급이 동일합니다',
  UJAT_CLASS_REMAP_FROM_NOT_FOUND: '기존 학급을 찾을 수 없습니다',
  UJAT_CLASS_REMAP_APPLY_DATE_MISMATCH: '적용 일정과 날짜가 일치하지 않습니다',
  ORGANIZATION_APPLICATION_NOT_FOUND: '기관 신청을 찾을 수 없습니다',
  SCHEDULE_NOT_FOUND: '교육 일정을 찾을 수 없습니다',
  UJAT_CLASS_REMAP_REVISION_CONFLICT: '학급 정보가 변경되었습니다',
  UJAT_CLASS_REMAP_HAS_VOLUNTEER_ASSIGNMENTS: '봉사자 배정이 있어 변경할 수 없습니다',
  UJAT_CLASS_REMAP_TARGET_EXISTS: '이미 진행 중인 학급으로 변경할 수 없습니다.',
  UJAT_CLASS_REMAP_TARGET_SLOT_CONFLICT:
    '같은 교육일에 이미 존재하는 학급으로 변경할 수 없습니다.',
  INVALID_MAPPING: '학급 변경 정보가 올바르지 않습니다',
  DUPLICATE_FROM: '동일한 기존 학급이 중복되었습니다',
  SAME_CLASS: '기존 학급과 변경 학급이 동일합니다',
  FROM_NOT_FOUND: '기존 학급을 찾을 수 없습니다',
  APPLY_DATE_MISMATCH: '적용 일정과 날짜가 일치하지 않습니다',
}

const INLINE_FORM_ERROR_CODES = new Set<string>([
  'UJAT_CLASS_REMAP_TARGET_EXISTS',
  'UJAT_CLASS_REMAP_TARGET_SLOT_CONFLICT',
  'UJAT_CLASS_REMAP_INVALID_MAPPING',
  'UJAT_CLASS_REMAP_DUPLICATE_FROM',
  'UJAT_CLASS_REMAP_SAME_CLASS',
  'UJAT_CLASS_REMAP_FROM_NOT_FOUND',
  'INVALID_MAPPING',
  'DUPLICATE_FROM',
  'SAME_CLASS',
  'FROM_NOT_FOUND',
])

export function isUjatClassRemapInlineFormErrorCode(code: string | undefined): boolean {
  return Boolean(code && INLINE_FORM_ERROR_CODES.has(code))
}

function apiErrorDetailsFromUnknown(error: unknown): Record<string, string | undefined> {
  if (!error || typeof error !== 'object' || !('response' in error)) return {}
  const data = (error as { response?: { data?: unknown } }).response?.data
  return extractApiErrorDetails(data)
}

function findRowIndexForRemapTarget(
  rows: ReadonlyArray<ChangeClassRowFields>,
  toGrade: string,
  toClassName: string
): number {
  const targetKey = normalizedClassKey(toGrade, toClassName)
  if (!targetKey) return -1
  return rows.findIndex(row => {
    const rowKey = normalizedClassKey(row.newGrade, row.newClassNo)
    return rowKey === targetKey
  })
}

/**
 * remapping 저장 API 실패 → 변경 팝업 `formError` (클라이언트 검증과 동일 톤).
 * null이면 alert 등 다른 경로로 처리한다.
 */
export function resolveUjatClassRemapInlineFormError(
  error: unknown,
  rows: ReadonlyArray<ChangeClassRowFields>
): string | null {
  const code = getApiErrorCode(error)
  if (!isUjatClassRemapInlineFormErrorCode(code)) return null

  if (code === 'UJAT_CLASS_REMAP_TARGET_EXISTS') {
    const details = apiErrorDetailsFromUnknown(error)
    const toGrade = details.toGrade?.trim()
    const toClassName = details.toClassName?.trim()
    if (toGrade && toClassName) {
      const rowIndex = findRowIndexForRemapTarget(rows, toGrade, toClassName)
      if (rowIndex >= 0) {
        return `${rowIndex + 1}번째 행의 변경 학급은 이미 진행 중인 학급입니다.`
      }
    }
  }

  const fallback =
    (code && UJAT_CLASS_REMAP_ERROR_TITLES[code]) ||
    '교육 학년 및 학급 변경을 저장하지 못했습니다.'
  return readApiErrorAlertMessage(error, fallback)
}
