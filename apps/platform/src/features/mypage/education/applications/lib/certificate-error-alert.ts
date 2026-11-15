import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'
import {
  resolveEducationErrorAlert,
  type EducationAlert,
} from '../../shared/lib/education-error-alert'
import { isCertificateIssuancePeriodExpiredMessage } from './certificate-reason-messages'

type ResolveMessage = (error: unknown, fallback: string) => string | null | undefined

/**
 * 수료증·참여증 발급/다운로드 오류 팝업.
 * 발급 기한(신청일로부터 3년) 만료는 시안 「수료증 발급 불가 안내」, 그 밖은 시안 「오류 제한 팝업」.
 */
export function resolveCertificateErrorAlert(
  error: unknown,
  resolveMessage: ResolveMessage,
): EducationAlert {
  const alert = resolveEducationErrorAlert(error, resolveMessage)
  return isCertificateIssuancePeriodExpiredMessage(alert.description)
    ? PLATFORM_ALERT_COPY.certificateExpired
    : alert
}
