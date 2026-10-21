import type { NewsletterSubscribeResponse } from './newsletter-client'

export const NEWSLETTER_SUBSCRIBE_PENDING_STATUSES = [
  'PENDING',
  'CONFIRM_REQUIRED',
  'CONFIRMATION_REQUIRED',
] as const

const COMPLETE_COPY = {
  title: '뉴스레터 구독이 완료되었어요',
  description: 'JA Korea의 교육 프로그램과\n새로운 소식을 이메일로 전해드릴게요.',
}

const PENDING_COPY = {
  title: '구독 확인 메일을 확인해 주세요',
  description:
    '입력하신 이메일로 구독 확인 안내를 보냈어요.\n메일함에서 확인을 완료해야 뉴스레터를 받을 수 있어요.',
}

export function isNewsletterSubscribePending(status?: string): boolean {
  const normalized = status?.trim().toUpperCase()
  return Boolean(
    normalized &&
      NEWSLETTER_SUBSCRIBE_PENDING_STATUSES.includes(
        normalized as (typeof NEWSLETTER_SUBSCRIBE_PENDING_STATUSES)[number],
      ),
  )
}

export function getNewsletterSubscribeResultCopy(
  response?: NewsletterSubscribeResponse | null,
): { title: string; description: string } {
  if (!isNewsletterSubscribePending(response?.status)) {
    return COMPLETE_COPY
  }

  const message = response?.message?.trim()
  return {
    title: PENDING_COPY.title,
    description: message || PENDING_COPY.description,
  }
}
