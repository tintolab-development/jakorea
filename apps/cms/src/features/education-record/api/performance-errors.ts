import { isAxiosError } from 'axios'
import { MESSAGES } from '@/shared/constants'

export type PerformanceRemoteUnavailableReason = 'API_NOT_CONFIGURED' | 'AUTH_REQUIRED'

export class PerformanceRemoteUnavailableError extends Error {
  readonly reason: PerformanceRemoteUnavailableReason

  constructor(reason: PerformanceRemoteUnavailableReason) {
    super(reason === 'AUTH_REQUIRED' ? '관리자 인증이 필요합니다.' : '실적 API가 설정되지 않았습니다.')
    this.name = 'PerformanceRemoteUnavailableError'
    this.reason = reason
  }
}

export function getPerformanceLoadErrorMessage(error: unknown): string {
  if (error instanceof PerformanceRemoteUnavailableError) {
    return error.reason === 'AUTH_REQUIRED'
      ? '관리자 인증이 만료되었거나 필요합니다. 다시 로그인해 주세요.'
      : '실적 API가 연결되지 않았습니다. CMS API 설정을 확인해 주세요.'
  }

  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) return '관리자 인증이 만료되었거나 필요합니다. 다시 로그인해 주세요.'
    if (status === 403) return '실적 관리 조회 권한이 없습니다. 관리자에게 문의해 주세요.'
    if (!error.response) return '실적 API에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.'
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return MESSAGES.error.performanceRecordsLoadFailed
}

export function getPerformanceExportErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status
    if (status === 401) return '관리자 인증이 만료되었거나 필요합니다. 다시 로그인해 주세요.'
    if (status === 403) return '실적 엑셀 다운로드 권한이 없습니다. 마스터 관리자에게 문의해 주세요.'
    if (!error.response) return '실적 export API에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.'
  }
  return getPerformanceLoadErrorMessage(error)
}
