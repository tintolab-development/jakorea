import { instructorApplyConsentPath, settingsConsentWritePath } from '../../../lib/constants'
import { RECEIPT_PRE_CONSENT_WRITE_KEY } from '../../../instructor-apply/consent/catalog'
import { buildSettlementTabPath, type SettlementArea } from './write-path'

export function buildSettlementPaymentConsentPath(options: {
  applicationId: string
  mode: 'write' | 'view'
  area?: SettlementArea
  applicationType?: string
}): string {
  const returnTo = buildSettlementTabPath(
    options.applicationId,
    options.area ?? 'education',
    options.applicationType,
  )
  const params = new URLSearchParams({
    returnTo,
    mode: options.mode,
  })
  return `${instructorApplyConsentPath('consentPaymentStatement')}?${params.toString()}`
}

export function buildSettlementReceiptConsentPath(options: {
  applicationId: string
  mode: 'write' | 'view'
  area?: SettlementArea
  applicationType?: string
  /** 작성 완료 후 돌아갈 경로 덮어쓰기 — 기본값 정산 현황 탭. 제출 화면(409)에서는 제출 화면으로 복귀(기획 B) */
  returnTo?: string
}): string {
  const returnTo =
    options.returnTo ??
    buildSettlementTabPath(options.applicationId, options.area ?? 'education', options.applicationType)
  const params = new URLSearchParams({
    returnTo,
    mode: options.mode,
  })
  return `${settingsConsentWritePath(RECEIPT_PRE_CONSENT_WRITE_KEY)}?${params.toString()}`
}
