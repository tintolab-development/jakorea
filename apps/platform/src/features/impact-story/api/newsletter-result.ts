import { PLATFORM_ALERT_COPY } from '../../../shared/lib/platform-alert-copy.ts'
import type { NewsletterSubscribeResponse, NewsletterSubscribeStatus } from './newsletter-client'

export const NEWSLETTER_SUBSCRIBE_STATUSES = [
  'PENDING',
  'SUBSCRIBED',
  'FAILED',
  'SKIPPED_LOCAL',
] as const satisfies readonly NewsletterSubscribeStatus[]

/** 구독 완료 팝업 — PENDING(확인 메일 발송)·SUBSCRIBED 모두 이 문구로 고정한다 */
const COMPLETE_COPY = {
  title: '뉴스레터 구독이 완료되었어요.',
  description: 'JA Korea의 교육 프로그램과\n새로운 소식을 이메일로 전해드릴게요.',
}

/** 구독이 접수되지 않은 결과(FAILED·SKIPPED_LOCAL·알 수 없음) — 시안 「공통 제한 안내 / 처리 실패」 */
const FAILED_COPY = PLATFORM_ALERT_COPY.requestFailed

export function normalizeNewsletterSubscribeStatus(
  status?: string,
): NewsletterSubscribeStatus | undefined {
  const normalized = status?.trim().toUpperCase()
  if (
    normalized === 'PENDING' ||
    normalized === 'SUBSCRIBED' ||
    normalized === 'FAILED' ||
    normalized === 'SKIPPED_LOCAL'
  ) {
    return normalized
  }
  return undefined
}

export function isNewsletterSubscribePending(status?: string): boolean {
  return normalizeNewsletterSubscribeStatus(status) === 'PENDING'
}

export function isNewsletterSubscribeCompleted(status?: string): boolean {
  return normalizeNewsletterSubscribeStatus(status) === 'SUBSCRIBED'
}

export type NewsletterSubscribeUi =
  | 'confirm-email'
  | 'complete'
  | 'error'

/** PENDING → 확인 메일, SUBSCRIBED → 완료, 그 외(FAILED/SKIPPED_LOCAL 포함) → 에러 */
export function resolveNewsletterSubscribeUi(
  status?: string,
): NewsletterSubscribeUi {
  const normalized = normalizeNewsletterSubscribeStatus(status)
  if (normalized === 'PENDING') return 'confirm-email'
  if (normalized === 'SUBSCRIBED') return 'complete'
  return 'error'
}

/** 확인 안내 또는 즉시 구독 완료만 성공 화면으로 연다. 202 + FAILED는 완료가 아니다. */
export function isNewsletterSubscribeAccepted(status?: string): boolean {
  const ui = resolveNewsletterSubscribeUi(status)
  return ui === 'confirm-email' || ui === 'complete'
}

export function getNewsletterSubscribeResultCopy(
  response?: NewsletterSubscribeResponse | null,
): { title: string; description: string } {
  const status = normalizeNewsletterSubscribeStatus(response?.status)

  if (status === 'PENDING' || status === 'SUBSCRIBED') {
    return COMPLETE_COPY
  }

  return FAILED_COPY
}
