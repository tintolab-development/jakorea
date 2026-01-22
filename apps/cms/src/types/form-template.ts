/**
 * 신청서 폼 템플릿 타입
 * Phase 0.2.2: 템플릿 기반 동적 신청서 (FR-C03)
 */

/** 동적 폼 필드 타입 */
export type FormFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date'

/** 동적 폼 필드 정의 */
export interface FormFieldDef {
  id: string
  label: string
  type: FormFieldType
  required?: boolean
  placeholder?: string
  /** select 타입일 때 옵션 { value, label } */
  options?: { value: string; label: string }[]
  /** 기본값 */
  defaultValue?: string | number | boolean
}

/** 프로그램별 신청서 폼 템플릿 */
export interface ApplicationFormTemplate {
  programId: string
  /** 역할별 커스텀 필드 (개인: student, 학교: school, 강사: instructor) */
  customFields: FormFieldDef[]
}
