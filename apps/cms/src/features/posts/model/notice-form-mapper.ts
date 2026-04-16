import type { Notice, NoticeAttachment } from '@/data/mock/notices'

/** 폼 필드(에디터·첨부 제외) */
export type NoticeFormFieldValues = {
  category: string
  visibility: 'public' | 'private'
  pinTop: 'off' | 'on'
  title: string
}

export function noticeToFormValues(notice: Notice): NoticeFormFieldValues {
  return {
    category: notice.category,
    visibility: notice.status === 'published' ? 'public' : 'private',
    pinTop: notice.isImportant ? 'on' : 'off',
    title: notice.title,
  }
}

export function noticeInitialMarkdown(notice: Notice): string {
  return notice.content ?? ''
}

export function noticeInitialAttachmentNames(notice: Notice): string[] {
  if (notice.attachments?.length) return notice.attachments.map(a => a.name)
  return []
}

export type BuildNoticeBodyParams = {
  title: string
  contentMarkdown: string
  category: string
  visibility: 'public' | 'private'
  pinToTop: boolean
  /** 최종 반영할 첨부 파일명(기존 유지 + 신규 파일명) */
  attachmentNames: string[]
  author: string
}

function toAttachments(names: string[]): NoticeAttachment[] | undefined {
  if (names.length === 0) return undefined
  return names.map(name => ({ name }))
}

/** 신규 공지 — id 제외 */
export function buildNoticeCreateBody(params: BuildNoticeBodyParams): Omit<Notice, 'id'> {
  const names = params.attachmentNames.map(n => n.trim()).filter(Boolean)
  const attachments = toAttachments(names)
  return {
    title: params.title.trim(),
    content: params.contentMarkdown,
    category: params.category,
    status: params.visibility === 'public' ? 'published' : 'draft',
    isImportant: params.pinToTop,
    hasAttachment: names.length > 0,
    attachments,
    author: params.author,
    createdAt: new Date().toISOString(),
    viewCount: 0,
  }
}

/** 수정 — 기존 행 유지 필드 보존 */
export function buildNoticeUpdateBody(
  existing: Notice,
  params: BuildNoticeBodyParams
): Partial<Notice> {
  const names = params.attachmentNames.map(n => n.trim()).filter(Boolean)
  const attachments = toAttachments(names)
  return {
    title: params.title.trim(),
    content: params.contentMarkdown,
    category: params.category,
    status: params.visibility === 'public' ? 'published' : 'draft',
    isImportant: params.pinToTop,
    hasAttachment: names.length > 0,
    attachments,
    author: existing.author,
    createdAt: existing.createdAt,
    viewCount: existing.viewCount,
  }
}
