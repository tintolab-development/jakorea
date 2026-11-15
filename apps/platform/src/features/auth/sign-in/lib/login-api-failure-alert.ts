import { isAxiosError } from 'axios'
import { PLATFORM_ALERT_COPY, type PlatformAlertCopy } from '@/shared/lib/platform-alert-copy'
import {
  isPlatformNetworkError,
  isPlatformRateLimitedError,
  resolvePlatformErrorAlert,
} from '@/shared/lib/platform-error-alert'
import {
  getLoginApiErrorMessage,
  type LoginApiErrorMessageOptions,
} from './get-login-api-error-message'

/**
 * 회원 API(로그인·본인인증·회원정보) 오류 중 서버가 보낸 업무 메시지·코드 매핑 문구만 돌려준다.
 * FE가 던진 오류·axios 원문은 빈 값 — 시안 「처리 실패」 팝업이 맡는다.
 */
export function readLoginApiServerMessage(
  error: unknown,
  options?: LoginApiErrorMessageOptions,
): string {
  if (!isAxiosError(error)) return ''
  return getLoginApiErrorMessage(error, '', options).trim()
}

/**
 * 요청 실패를 시안 공통 팝업(14491-2533)으로 바꿀지 판단한다.
 * - 네트워크·429 → 해당 팝업
 * - 서버 업무 메시지가 있으면 null (호출부가 입력란·화면 문구로 그대로 안내)
 * - 그 밖의 실패 → 「처리 실패」
 */
export function resolveLoginApiFailureAlert(
  error: unknown,
  options?: LoginApiErrorMessageOptions,
): PlatformAlertCopy | null {
  if (isPlatformNetworkError(error) || isPlatformRateLimitedError(error)) {
    return resolvePlatformErrorAlert(error)
  }
  if (readLoginApiServerMessage(error, options)) return null
  return PLATFORM_ALERT_COPY.requestFailed
}
