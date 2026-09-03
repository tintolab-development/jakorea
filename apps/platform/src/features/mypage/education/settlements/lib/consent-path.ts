import { educationApplicationDetailPath, instructorApplyConsentPath } from '../../../lib/constants'

export function buildSettlementPaymentConsentPath(options: {
  applicationId: string
  mode: 'write' | 'view'
}): string {
  const returnTo = `${educationApplicationDetailPath(options.applicationId)}?section=settlement`
  const params = new URLSearchParams({
    returnTo,
    mode: options.mode,
  })
  return `${instructorApplyConsentPath('consentPaymentStatement')}?${params.toString()}`
}
