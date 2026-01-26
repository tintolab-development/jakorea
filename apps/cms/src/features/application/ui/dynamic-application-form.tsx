/**
 * 템플릿 기반 동적 신청서 폼
 * Task 2.4.1: FR-C03 - 템플릿에서 필드 정의를 읽어 동적 폼 생성, 필드별 validation
 */

import { DynamicFormFields } from './dynamic-form-fields'
import type { FormFieldDef } from '@/types/form-template'
import { MESSAGES } from '@/shared/constants'

export interface DynamicApplicationFormProps {
  /** 템플릿 필드 정의 */
  fields: FormFieldDef[]
  /** 폼 값 (필드 id -> 값) */
  value: Record<string, unknown>
  /** 값 변경 콜백 */
  onChange: (value: Record<string, unknown>) => void
  /** 필드별 에러 메시지 (validation 결과) */
  fieldErrors?: Record<string, string>
}

/**
 * 템플릿 기반 동적 신청서 폼 컴포넌트
 * - 템플릿 필드 정의에 따라 동적 렌더링 (text, textarea, number, select, checkbox, date, file)
 * - 필드별 validation 규칙(required 등) 적용
 */
export function DynamicApplicationForm({
  fields,
  value,
  onChange,
  fieldErrors = {},
}: DynamicApplicationFormProps) {
  return (
    <DynamicFormFields
      fields={fields}
      value={value}
      onChange={onChange}
      fieldErrors={fieldErrors}
    />
  )
}

/**
 * 동적 필드 validation
 * - required 체크
 * - file 타입: 필수 시 파일 존재 여부
 */
export function validateDynamicFields(
  fields: FormFieldDef[],
  value: Record<string, unknown>
): Record<string, string> {
  const err: Record<string, string> = {}
  for (const f of fields) {
    if (!f.required) continue
    const v = value[f.id]
    if (v === undefined || v === null || v === '') {
      err[f.id] = MESSAGES.validation.fieldRequired(f.label)
    }
    if (f.type === 'file' && (!v || !(v instanceof File))) {
      err[f.id] = MESSAGES.validation.fieldRequired(f.label)
    }
  }
  return err
}
