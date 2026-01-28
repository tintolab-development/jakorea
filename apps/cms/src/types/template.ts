import type { DateValue, UUID } from '@/types'
import type { FormFieldDef } from '@/types/form-template'

export type TemplateType = 'files' | 'sms' | 'email' | 'program-forms'
export type TemplateStatus = 'draft' | 'review' | 'published' | 'archived'
export type TemplateAudience = 'ADMIN_INTERNAL' | 'SCHOOL' | 'INSTRUCTOR' | 'INDIVIDUAL'

/** 프로그램 양식 템플릿 종류 */
export type ProgramFormTemplateType =
  | 'application' // 신청 기본 템플릿
  | 'survey' // 설문조사 템플릿
  | 'satisfaction' // 만족도조사 템플릿
  | 'assignment' // 과제 제출 템플릿

/** 파일 양식 카테고리 */
export type FileTemplateCategory =
  | 'instructor-resume' // 강사 이력서
  | 'lecture-report' // 강의 보고서
  | 'education-plan' // 교육계획서
  | 'certificate' // 수료증
  | 'activity-confirmation' // 활동확인서
  | 'receipt' // 영수증
  | 'payment-statement' // 지급조서
  | 'employment-certificate' // 경력증명서
  | 'other' // 기타

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

/** 수료증 텍스트 필드 정의 */
export interface CertificateTextField {
  id: string
  label: string // 필드 라벨 (예: "수료자 이름")
  key: string // 변수 키 (예: "recipientName")
  x: number // X 좌표 (픽셀)
  y: number // Y 좌표 (픽셀)
  fontSize: number // 폰트 크기
  color: string // 텍스트 색상 (hex)
  align: 'left' | 'center' | 'right' // 정렬
  fontFamily?: string // 폰트 패밀리
}

export interface FileTemplateContent {
  fileName: string
  mimeType: string
  downloadUrl: string
  version: string
  sizeBytes?: number
  /** 파일 양식 카테고리 (선택사항) */
  category?: FileTemplateCategory
  /** 배경 이미지 URL (수료증 전용) */
  backgroundImageUrl?: string
  /** 텍스트 필드 정의 (수료증 전용) */
  textFields?: CertificateTextField[]
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

export interface ProgramFormTemplateContent {
  formType: ProgramFormTemplateType
  fields: FormFieldDef[]
  /** 프로그램별로 필드 수정 가능 여부 (유동 템플릿) */
  isEditable: boolean
}

export type FileTemplate = BaseTemplate & { type: 'files'; content: FileTemplateContent }
export type SmsTemplate = BaseTemplate & { type: 'sms'; content: SmsTemplateContent }
export type EmailTemplate = BaseTemplate & { type: 'email'; content: EmailTemplateContent }
export type ProgramFormTemplate = BaseTemplate & {
  type: 'program-forms'
  content: ProgramFormTemplateContent
}

export type Template = FileTemplate | SmsTemplate | EmailTemplate | ProgramFormTemplate
