/**
 * @deprecated `@jakorea/social-auth`의 `cmsSocialAuthClient`를 사용하세요.
 */

import {
  loginWithSocial,
  type SocialProvider,
} from '@/entities/user/api/auth-service'
import type { LoginResponse } from '@/types/user'

export interface OAuthExchangeRequest {
  provider: SocialProvider
  code: string
  state: string
}

export async function exchangeOAuthCode(
  request: OAuthExchangeRequest
): Promise<LoginResponse & { requiresMfa?: boolean }> {
  return loginWithSocial(request.provider, request.code)
}
