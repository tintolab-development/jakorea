import {
  buildFileTypeInvalidAlertCopy,
  PLATFORM_ALERT_COPY,
  type PlatformAlertCopy,
} from '../../../../shared/lib/platform-alert-copy.ts'
import { buildRequestFailedAlertCopy } from '../../../../shared/lib/platform-error-alert.ts'
import { CRIME_CONSENT_MESSAGES } from './crime-consent-original.ts'

/** 성범죄 경력 조회 동의서 원본 허용 형식 — 시안 「파일 형식이 맞지 않는 경우」 설명에 넣는다 */
export const CRIME_CONSENT_ORIGINAL_FORMATS_LABEL = 'PDF, JPG, PNG'

/** 요청 실패 시 FE가 채운 기본 문구 — 시안 「처리 실패」로 바꾼다 */
const GENERIC_FAILURE_MESSAGES = new Set<string>([
  CRIME_CONSENT_MESSAGES.uploadFailed,
  CRIME_CONSENT_MESSAGES.submitFailed,
  CRIME_CONSENT_MESSAGES.downloadFailed,
  CRIME_CONSENT_MESSAGES.formFileUnavailable,
])

/**
 * 동의서 업로드·제출·다운로드 요청이 실패했을 때의 안내 문구(`resolveCrimeConsent*ErrorMessage` 결과)
 * → 시안 「오류 제한 팝업」(14491-2533) 제목·설명.
 * 오류 코드별 업무 안내(유효기간 경과·버전 변경 등)는 「처리 실패」 제목 아래 설명으로 그대로 둔다.
 */
export function toCrimeConsentFailureAlert(message: string): PlatformAlertCopy {
  if (message === CRIME_CONSENT_MESSAGES.network) return PLATFORM_ALERT_COPY.networkError
  if (message === CRIME_CONSENT_MESSAGES.rateLimited) return PLATFORM_ALERT_COPY.rateLimited
  if (message === CRIME_CONSENT_MESSAGES.fileType) {
    return buildFileTypeInvalidAlertCopy(CRIME_CONSENT_ORIGINAL_FORMATS_LABEL)
  }
  if (GENERIC_FAILURE_MESSAGES.has(message)) return PLATFORM_ALERT_COPY.requestFailed
  return buildRequestFailedAlertCopy(message)
}
