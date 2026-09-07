import { instructorApplyConsentPath } from '../../../lib/constants'
import { buildSettlementTabPath } from './write-path'

export function buildSettlementPaymentConsentPath(options: {
  applicationId: string
  mode: 'write' | 'view'
}): string {
  const returnTo = buildSettlementTabPath(options.applicationId)
  const params = new URLSearchParams({
    returnTo,
    mode: options.mode,
  })
  return `${instructorApplyConsentPath('consentPaymentStatement')}?${params.toString()}`
}
