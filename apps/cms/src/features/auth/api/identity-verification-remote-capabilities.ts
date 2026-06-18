import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

export function isIdentityVerificationRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('identityVerification')
}
