import {
  loginWithSocial,
  type SocialProvider,
} from '@/entities/user/api/auth-service'
import type { LoginResponse } from '@/types/user'

type OAuthExchangeMode = 'mock' | 'backend'

export interface OAuthExchangeRequest {
  provider: SocialProvider
  code: string
  state: string
}

export interface OAuthExchangeAdapter {
  exchangeOAuthCode: (
    request: OAuthExchangeRequest
  ) => Promise<LoginResponse & { requiresMfa?: boolean }>
}

const mockOAuthExchangeAdapter: OAuthExchangeAdapter = {
  async exchangeOAuthCode({ provider, code }) {
    return loginWithSocial(provider, code)
  },
}

const backendOAuthExchangeAdapter: OAuthExchangeAdapter = {
  async exchangeOAuthCode({ provider, code, state }) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL
    if (!baseUrl) {
      throw new Error('VITE_API_BASE_URL 이 설정되지 않아 백엔드 OAuth 교환을 진행할 수 없습니다.')
    }

    const response = await fetch(`${baseUrl}/auth/oauth/${provider}/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    })

    if (!response.ok) {
      throw new Error('백엔드 OAuth 교환에 실패했습니다.')
    }

    return response.json()
  },
}

function getOAuthExchangeMode(): OAuthExchangeMode {
  const rawMode = import.meta.env.VITE_OAUTH_EXCHANGE_MODE
  if (rawMode === 'backend') {
    return 'backend'
  }
  return 'mock'
}

export async function exchangeOAuthCode(
  request: OAuthExchangeRequest
): Promise<LoginResponse & { requiresMfa?: boolean }> {
  const mode = getOAuthExchangeMode()
  const adapter = mode === 'backend' ? backendOAuthExchangeAdapter : mockOAuthExchangeAdapter
  return adapter.exchangeOAuthCode(request)
}
