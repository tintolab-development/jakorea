import { NOTIFICATION_ROOT_CATEGORY_ID } from '@/features/notifications/lib/tree'

export type MailTabKey = 'template' | 'send-history'

export const MAIL_ROOT_CATEGORY_ID = NOTIFICATION_ROOT_CATEGORY_ID

export type MailCategory = {
  id: string
  name: string
  parentId: string
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
  attachmentFileName?: string
}

export type MailTemplatePendingFilters = {
  categoryName: string
  templateName: string
}

export type MailTreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'template'; id: string }
  | null
