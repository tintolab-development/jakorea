import type { SocialProvider, SocialProviderCode } from './types'

const TO_API: Record<SocialProvider, SocialProviderCode> = {
  kakao: 'KAKAO',
  naver: 'NAVER',
  google: 'GOOGLE',
}

const FROM_API: Record<SocialProviderCode, SocialProvider> = {
  KAKAO: 'kakao',
  NAVER: 'naver',
  GOOGLE: 'google',
}

export function toApiProviderCode(provider: SocialProvider): SocialProviderCode {
  return TO_API[provider]
}

export function fromApiProviderCode(code: string): SocialProvider | null {
  const upper = code.toUpperCase() as SocialProviderCode
  return FROM_API[upper] ?? null
}

export function isSocialProvider(value: unknown): value is SocialProvider {
  return value === 'kakao' || value === 'naver' || value === 'google'
}
