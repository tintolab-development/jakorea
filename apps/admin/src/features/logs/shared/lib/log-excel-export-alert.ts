import { readApiErrorCode, readApiErrorMessage } from '@/shared/lib/api-error-message'

export const LOG_EXCEL_EXPORT_FAILURE_TITLE = '내보내기 실패'

const LOG_EXCEL_EXPORT_FAILURE_FALLBACK = '엑셀 내보내기에 실패했습니다. 다시 시도해 주세요.'

export function logExcelExportFailureAlert(error: unknown): { title: string; content: string } {
  const code = readApiErrorCode(error)
  if (code === 'DATA_INTEGRITY_CONFLICT') {
    return {
      title: LOG_EXCEL_EXPORT_FAILURE_TITLE,
      content: '다운로드 이력 저장 중 충돌이 발생했습니다. 잠시 후 다시 시도해 주세요.',
    }
  }
  return {
    title: LOG_EXCEL_EXPORT_FAILURE_TITLE,
    content: readApiErrorMessage(error)?.trim() || LOG_EXCEL_EXPORT_FAILURE_FALLBACK,
  }
}
