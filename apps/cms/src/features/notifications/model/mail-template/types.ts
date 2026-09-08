import { NOTIFICATION_ROOT_CATEGORY_ID } from '@/features/notifications/lib/tree'

export type MailTabKey = 'template' | 'send-history'

export const MAIL_ROOT_CATEGORY_ID = NOTIFICATION_ROOT_CATEGORY_ID

export type MailCategory = {
  id: string
  name: string
  parentId: string
  isVirtualUnclassified?: boolean
}

export type MailTemplateAttachment = {
  attachmentId: number
  fileObjectId?: number
  fileName: string
  byteSize?: number
  downloadHint?: string
}

export type MailTemplateItem = {
  id: string
  name: string
  templateName: string
  categoryId: string
  registeredAt: string
  updatedAt: string
  senderName: string
  senderEmail: string
  /** BE preview/detail `senderDisplay` (이름 <메일>) */
  senderDisplay?: string
  subject: string
  bodyHtml: string
  attachmentFileNames: string[]
  attachments?: MailTemplateAttachment[]
  /** 첨부 파일명 → byte (미리보기 용량 표시용, 선택) */
  attachmentSizes?: Record<string, number>
}

export type MailTemplateFormMode = 'create' | 'edit'

export type MailTemplatePendingFilters = {
  categoryName: string
  templateName: string
}

export type MailTreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'template'; id: string }
  | null
