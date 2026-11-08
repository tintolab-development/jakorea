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
  return `${settingsConsentWritePath(RECEIPT_PRE_CONSENT_WRITE_KEY)}?${params.toString()}`
}
