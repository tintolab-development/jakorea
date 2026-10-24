import {
  extractApiErrorDetails,
  extractApiErrorField,
  getApiErrorCode,
  getApiErrorField,
} from '@/shared/lib/extract-api-error-message'

export const DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CODE =
  'DETAILED_PROGRAM_CONCURRENT_MODIFICATION'

export const DETAILED_PROGRAM_CONCURRENT_MODIFICATION_TITLE = '정보 변경 안내'
export const DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CONTENT =
  '다른 관리자가 해당 정보를 수정했습니다. 최신 정보를 확인한 후 다시 수정해 주세요.'

export const DETAILED_PROGRAM_ERROR_MESSAGES: Record<string, string> = {
  DETAILED_PROGRAM_NAME_OR_USE_YN_REQUIRED: '수정값을 확인한 후 다시 저장해 주세요.',
  DETAILED_PROGRAM_NAME_KO_REQUIRED: '세부 프로그램명을 입력해 주세요.',
  DETAILED_PROGRAM_VERSION_REQUIRED:
    '버전 정보가 없어 저장할 수 없습니다. 최신 목록을 확인한 후 다시 시도해 주세요.',
  DETAILED_PROGRAM_DUPLICATE_ID: '요청 구성에 오류가 있습니다. 새로고침 후 다시 시도해 주세요.',
  DETAILED_PROGRAM_NAME_ALREADY_EXISTS: '이미 존재하는 세부 프로그램명입니다.',
  DETAILED_PROGRAM_CONCURRENT_MODIFICATION: DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CONTENT,
}

function axiosErrorData(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  return (error as { response?: { data?: unknown } }).response?.data
}

export function isDetailedProgramConcurrentModificationError(error: unknown): boolean {
  return getApiErrorCode(error) === DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CODE
}

export function getDetailedProgramApiErrorMessage(error: unknown, fallback: string): string {
  const code = getApiErrorCode(error)
  if (code && DETAILED_PROGRAM_ERROR_MESSAGES[code]) {
    return DETAILED_PROGRAM_ERROR_MESSAGES[code]
  }
  return fallback
}

/** 서버가 행을 식별하면 해당 id, 아니면 undefined */
export function getDetailedProgramErrorRowId(
  error: unknown,
  updateItems: readonly { id: number }[]
): string | undefined {
  const data = axiosErrorData(error)
  const details = extractApiErrorDetails(data)
  const detailId = details.id ?? details.detailedProgramId ?? details.itemId
  if (typeof detailId === 'string' && detailId.trim()) return detailId.trim()

  const field = getApiErrorField(error) ?? extractApiErrorField(data)
  if (field) {
    const indexMatch = field.match(/items\[(\d+)\]/)
    if (indexMatch) {
      const index = Number(indexMatch[1])
      const item = updateItems[index]
      if (item) return String(item.id)
    }
    if (/^\d+$/.test(field)) return field
  }

  return undefined
}

export function detailedProgramFieldErrorMessage(code: string | undefined): string | undefined {
  if (!code) return undefined
  return DETAILED_PROGRAM_ERROR_MESSAGES[code]
}
