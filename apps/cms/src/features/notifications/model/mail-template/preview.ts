import dayjs from 'dayjs'

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
  name: '홍길동',
  email: 'gildong@jakorea.org',
  extraCount: 914,
} as const

const VARIABLE_SAMPLE_OVERRIDES: Record<string, string> = {
  회원명: '이가원',
  프로그램명: 'JA KOREA',
}

export function mailPreviewSampleValue(label: string): string {
  return VARIABLE_SAMPLE_OVERRIDES[label] ?? '예시값'
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

export function formatMailPreviewDateTime(value: string | Date | undefined): string {
  const parsed = value ? dayjs(value) : dayjs()
  if (!parsed.isValid()) return '-'
  const weekday = KO_WEEKDAYS[parsed.day()] ?? ''
  return `${parsed.year()}. ${parsed.month() + 1}. ${parsed.date()} (${weekday}) ${parsed.format('HH:mm')}`
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
