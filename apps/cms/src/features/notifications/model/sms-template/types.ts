import { NOTIFICATION_ROOT_CATEGORY_ID } from '@/features/notifications/lib/tree'
import type { SmsMessageType } from '@/features/notifications/api/adapters/sms-channel'

export const SMS_ROOT_CATEGORY_ID = NOTIFICATION_ROOT_CATEGORY_ID

export type SmsCategory = {
  id: string
  name: string
  parentId: string
  isVirtualUnclassified?: boolean
}

export type SmsTemplateAttachment = {
  attachmentId: number
  fileObjectId?: number
  fileName: string
  byteSize?: number
  downloadHint?: string
}

export type SmsTemplateItem = {
  id: string
  name: string
  templateName: string
  categoryId: string
  categoryName?: string
  registeredAt: string
  updatedAt: string
  senderPhone: string
  messageType: SmsMessageType
  subject: string
  bodyText: string
  attachmentFileNames: string[]
  attachments?: SmsTemplateAttachment[]
}

export type SmsTemplateFormMode = 'create' | 'edit'

export type SmsTemplatePendingFilters = {
  categoryName: string
  templateName: string
}

export type SmsTreeSelection =
  | { kind: 'category'; id: string }
  | { kind: 'template'; id: string }
  | null
