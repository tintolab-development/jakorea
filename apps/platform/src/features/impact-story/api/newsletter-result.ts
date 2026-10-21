import type { NewsletterSubscribeResponse, NewsletterSubscribeStatus } from './newsletter-client'

export const NEWSLETTER_SUBSCRIBE_STATUSES = [
  'PENDING',
  'SUBSCRIBED',
  'FAILED',
  'SKIPPED_LOCAL',
] as const satisfies readonly NewsletterSubscribeStatus[]

const COMPLETE_COPY = {
  title: '뉴스레터 구독이 완료되었어요',
  description: 'JA Korea의 교육 프로그램과\n새로운 소식을 이메일로 전해드릴게요.',
}

const PENDING_COPY = {
  title: '구독 확인 메일을 확인해 주세요',
  description:
    '입력하신 이메일로 구독 확인 안내를 보냈어요.\n메일함에서 확인을 완료해야 뉴스레터를 받을 수 있어요.',
}

const FAILED_COPY = {
  title: '뉴스레터 구독 안내',
  description: '구독 신청은 저장됐지만 스티비 동기화에 실패했습니다.',
}

const SKIPPED_LOCAL_COPY = {
  title: '뉴스레터 구독 안내',
  description: '로컬 환경에서는 스티비 동기화를 건너뛰었습니다.',
}

const UNKNOWN_COPY = {
  title: '뉴스레터 구독 안내',
  description: '구독 신청 결과를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
}

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

/** 확인 안내 또는 즉시 구독 완료만 성공 화면으로 연다. */
export function isNewsletterSubscribeAccepted(status?: string): boolean {
  const normalized = normalizeNewsletterSubscribeStatus(status)
  return normalized === 'PENDING' || normalized === 'SUBSCRIBED'
}

export function getNewsletterSubscribeResultCopy(
  response?: NewsletterSubscribeResponse | null,
): { title: string; description: string } {
  const status = normalizeNewsletterSubscribeStatus(response?.status)
  const message = response?.message?.trim()

  if (status === 'PENDING') {
    return {
      title: PENDING_COPY.title,
      description: message || PENDING_COPY.description,
    }
  }

  if (status === 'SUBSCRIBED') {
    return {
      title: COMPLETE_COPY.title,
      description: message || COMPLETE_COPY.description,
    }
  }

  if (status === 'FAILED') {
    return {
      title: FAILED_COPY.title,
      description: message || FAILED_COPY.description,
    }
  }

  if (status === 'SKIPPED_LOCAL') {
    return {
      title: SKIPPED_LOCAL_COPY.title,
      description: message || SKIPPED_LOCAL_COPY.description,
    }
  }

  return {
    title: UNKNOWN_COPY.title,
    description: message || UNKNOWN_COPY.description,
  }
}
