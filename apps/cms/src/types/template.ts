import type { DateValue, UUID } from '@/types'

export type TemplateType = 'files' | 'sms' | 'email'
export type TemplateStatus = 'draft' | 'review' | 'published' | 'archived'
export type TemplateAudience =
  | 'ADMIN_INTERNAL'
  | 'SCHOOL'
  | 'INSTRUCTOR'
  | 'INDIVIDUAL'

export interface BaseTemplate {
  id: UUID
  type: TemplateType
  title: string
  description?: string
  tags: string[]
  audience: TemplateAudience[]
  status: TemplateStatus
  updatedAt: DateValue
  updatedBy: string
}

export interface FileTemplateContent {
  fileName: string
  mimeType: string
  downloadUrl: string
  version: string
  sizeBytes?: number
}

export interface SmsTemplateContent {
  text: string
  variables: string[]
}

export interface EmailTemplateContent {
  subject: string
  html: string
  markdown: string
  variables: string[]
}

export type FileTemplate = BaseTemplate & { type: 'files'; content: FileTemplateContent }
export type SmsTemplate = BaseTemplate & { type: 'sms'; content: SmsTemplateContent }
export type EmailTemplate = BaseTemplate & { type: 'email'; content: EmailTemplateContent }

export type Template = FileTemplate | SmsTemplate | EmailTemplate

