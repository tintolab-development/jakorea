import { ADMIN_REGISTER_TERMS_VERSION } from '@/features/auth/lib/admin-register.constants'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'

export async function flushSocialPendingLinks(): Promise<void> {
  await cmsSocialAuthClient.flushPendingLinks({
    socialConsentVersion: ADMIN_REGISTER_TERMS_VERSION,
    socialConsentAgreed: true,
  })
}
