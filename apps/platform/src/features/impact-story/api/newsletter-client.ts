import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { isRemoteApiConfigured } from '@/shared/lib'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

const PUBLIC_SUBSCRIBE_PATH = '/api/portal/public/newsletter/subscriptions'
const NEWSLETTER_CONSENT_TERMS_TYPE = 'MARKETING'

/** SubscribeRequest.source — 임팩트 스토리 배너·신청 모달 */
export const NEWSLETTER_SUBSCRIBE_SOURCE = 'IMPACT_STORY'

const SKIP_AUTH: SkipAuthConfig = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

/** POST SubscribeRequest */
export type NewsletterSubscribeRequest = {
  email: string
  name: string
  source: string
  marketingConsent: boolean
  consentVersion: string
}

/** POST /api/portal/public/newsletter/subscriptions — NewsletterSubscribeResponse.status */
export type NewsletterSubscribeStatus = 'PENDING' | 'SUBSCRIBED' | 'FAILED' | 'SKIPPED_LOCAL'

/** 202 SubscribeResponse */
export type NewsletterSubscribeResponse = {
  status?: NewsletterSubscribeStatus | string
  message?: string
}

export type NewsletterSubscribeInput = {
  name: string
  email: string
}

async function fetchNewsletterConsentVersion(): Promise<string> {
  const { data } = await axiosClient.get<unknown>(
    `/api/public/terms-documents/${NEWSLETTER_CONSENT_TERMS_TYPE}/current`,
    SKIP_AUTH,
  )
  const doc = unwrapEnvelope<Record<string, unknown> | null>(data)
  const version = typeof doc?.version === 'string' ? doc.version.trim() : ''
  if (!version) {
    throw new Error('뉴스레터 수신 동의 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
  return version
}

function toRequest(
  input: NewsletterSubscribeInput,
  consentVersion: string,
): NewsletterSubscribeRequest {
  return {
    name: input.name,
    email: input.email,
    source: NEWSLETTER_SUBSCRIBE_SOURCE,
    marketingConsent: true,
    consentVersion,
  }
}

/** POST /api/portal/public/newsletter/subscriptions — 비회원 포함 공개 구독 */
export async function subscribeNewsletter(
  input: NewsletterSubscribeInput,
): Promise<NewsletterSubscribeResponse> {
  if (!isRemoteApiConfigured()) {
    throw new Error('뉴스레터 구독 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  const consentVersion = await fetchNewsletterConsentVersion()
  const { data } = await axiosClient.post<unknown>(
    PUBLIC_SUBSCRIBE_PATH,
    toRequest(input, consentVersion),
    SKIP_AUTH,
  )
  const unwrapped = unwrapEnvelope<NewsletterSubscribeResponse | null>(data)
  return unwrapped ?? {}
}
