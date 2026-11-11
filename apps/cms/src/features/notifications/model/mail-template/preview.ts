import dayjs from 'dayjs'
import {
  isPlainTextMailBody,
  renderPlainMailBodyAfterSubstitute,
} from '@/features/notifications/model/shared/mail-body-display-html'

const KO_WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const
const MAIL_VARIABLE_TOKEN_RE = /#\{([^{}]+)\}/g
const MAIL_VARIABLE_ATTR_SPAN_RE =
  /<span\b[^>]*data-mail-variable="([^"]+)"[^>]*>[\s\S]*?<\/span>/gi
const MAIL_VARIABLE_WRAPPED_TOKEN_RE = /<span\b[^>]*>\s*#\{([^{}]+)\}\s*<\/span>/gi

export type MailPreviewAttachment = {
  name: string
  sizeBytes?: number
}

/** 시안 미리보기용 샘플 수신자 */
export const MAIL_PREVIEW_SAMPLE_RECIPIENT = {
  name: '수신자',
  email: 'gildong@jakorea.org',
  extraCount: 914,
} as const

/**
 * 회차·차시를 구분해 보여야 하는 변수만 예시값으로 바꾼다(BE N2). 그 외 변수는 토큰 그대로.
 * 실제 값은 발송 시 BE가 치환한다.
 */
export const MAIL_PREVIEW_SAMPLE_VALUES: Readonly<Record<string, string>> = {
  '교육 진행 차시': '2차시',
  '교육 진행 회차': '3회차',
}

export function mailPreviewSampleValue(label: string): string {
  return MAIL_PREVIEW_SAMPLE_VALUES[label.trim()] ?? `#{${label}}`
}

export function applyMailPreviewTokens(text: string): string {
  return text.replace(MAIL_VARIABLE_TOKEN_RE, (_, label: string) => mailPreviewSampleValue(label))
}

export function applyMailPreviewHtml(html: string): string {
  const fromAttr = html.replace(MAIL_VARIABLE_ATTR_SPAN_RE, (_, label: string) =>
    escapeHtml(mailPreviewSampleValue(label))
  )
  const fromWrapped = fromAttr.replace(MAIL_VARIABLE_WRAPPED_TOKEN_RE, (_, label: string) =>
    escapeHtml(mailPreviewSampleValue(label))
  )
  return fromWrapped.replace(MAIL_VARIABLE_TOKEN_RE, (_, label: string) =>
    escapeHtml(mailPreviewSampleValue(label))
  )
}

/**
 * 메일 본문 미리보기 (BE renderedContent와 시각적으로 일치).
 * 평문 템플릿(블록 태그 없음): 샘플값 치환 후 전체 이스케이프 + `\n` → `<br>`.
 * HTML 템플릿: 기존 `applyMailPreviewHtml`과 동일.
 */
export function applyMailPreviewBody(template: string): string {
  if (isPlainTextMailBody(template)) {
    return renderPlainMailBodyAfterSubstitute(applyMailPreviewTokens(template))
  }
  return applyMailPreviewHtml(template)
}

/** 기획: YYYY.MM.DD(요일) HH:mm — 미리보기 시점 기준 */
export function formatMailPreviewDateTime(value: string | Date | undefined): string {
  const parsed = value ? dayjs(value) : dayjs()
  if (!parsed.isValid()) return '-'
  const weekday = KO_WEEKDAYS[parsed.day()] ?? ''
  return `${parsed.format('YYYY.MM.DD')}(${weekday}) ${parsed.format('HH:mm')}`
}

export function formatMailPreviewPerson(name: string | undefined, email: string | undefined): string {
  const trimmedName = name?.trim() ?? ''
  const trimmedEmail = email?.trim() ?? ''
  if (trimmedName && trimmedEmail) return `${trimmedName} <${trimmedEmail}>`
  if (trimmedEmail) return trimmedEmail
  if (trimmedName) return trimmedName
  return '-'
}

export type MailPreviewRecipient = {
  name?: string
  email?: string
  extraCount?: number
}

export function formatMailPreviewRecipient(recipient?: MailPreviewRecipient): string {
  const name = recipient?.name ?? MAIL_PREVIEW_SAMPLE_RECIPIENT.name
  const email = recipient?.email ?? MAIL_PREVIEW_SAMPLE_RECIPIENT.email
  const extraCount = recipient?.extraCount ?? MAIL_PREVIEW_SAMPLE_RECIPIENT.extraCount
  const person = formatMailPreviewPerson(name, email)
  if (extraCount <= 0) return person
  return `${person} 외 ${extraCount}명`
}

export function formatMailPreviewAttachment(attachment: MailPreviewAttachment): string {
  if (attachment.sizeBytes == null || attachment.sizeBytes <= 0) return attachment.name
  return `${attachment.name} (${formatPreviewFileSize(attachment.sizeBytes)})`
}

function formatPreviewFileSize(bytes: number): string {
  const kb = bytes / 1024
  if (kb < 1024) return `${Math.round(kb)}KB`
  return `${(kb / 1024).toFixed(1).replace(/\.0$/, '')}MB`
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** 시안: 템플릿 미리보기(목록·등록/수정·발송 피커) vs 발송 화면 최종 메일 미리보기(9433:48985) */
export const MAIL_TEMPLATE_PREVIEW_TITLE = '템플릿 미리보기'
export const MAIL_SEND_PREVIEW_TITLE = '메일 미리보기'

/**
 * 시안「이름 | 이메일」표시용. 이름이 비었거나 이메일과 같으면(BE가 표시명 없이 주소만 줄 때) 이름은 생략.
 */
export function splitMailSenderNameEmail(
  name: string | null | undefined,
  email: string | null | undefined
): { name: string; email: string } {
  const trimmedEmail = email?.trim() ?? ''
  // BE 표시명이 「이름 <메일>」·「메일 <메일>」 형태로 올 때 꺾쇠 부분은 이메일 칸과 중복이므로 제거
  const trimmedName = (name?.trim() ?? '').replace(/\s*<[^<>]*>\s*$/, '').trim()
  if (!trimmedName || trimmedName.toLowerCase() === trimmedEmail.toLowerCase()) {
    return { name: '', email: trimmedEmail }
  }
  return { name: trimmedName, email: trimmedEmail }
}

