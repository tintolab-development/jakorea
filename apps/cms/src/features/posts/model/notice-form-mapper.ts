import type { Notice, NoticeAttachment } from '@/data/mock/notices'

/** 폼 필드(에디터·첨부 제외) — 셀렉트 value는 category.id */
export type NoticeFormFieldValues = {
  categoryId: string
  visibility: 'public' | 'private'
  pinTop: 'off' | 'on'
  title: string
}

export function noticeToFormValues(notice: Notice): NoticeFormFieldValues {
  return {
    categoryId: notice.categoryId != null ? String(notice.categoryId) : '',
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
  /** 공지 카테고리 ID (API categoryId) */
  categoryId: number
  /** 표시용 카테고리명 (로컬 Notice.category) */
  category: string
  visibility: 'public' | 'private'
  pinToTop: boolean
  /** 최종 반영할 첨부 파일명(기존 유지 + 신규 파일명) */
  attachmentNames: string[]
  /** 실 API 업로드용 실제 파일. 파일명만 보내면 S3 PUT이 수행되지 않는다. */
  newFiles?: File[]
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
    categoryId: params.categoryId,
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
    categoryId: params.categoryId,
    status: params.visibility === 'public' ? 'published' : 'draft',
    isImportant: params.pinToTop,
    hasAttachment: names.length > 0,
    attachments,
    author: existing.author,
    createdAt: existing.createdAt,
    viewCount: existing.viewCount,
  }
}
