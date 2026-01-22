/**
 * 템플릿 기반 동적 폼 필드 컴포넌트
 * Phase 0.2.2: 템플릿 기반 동적 신청서 (FR-C03)
 */

import { Form, Input, InputNumber, Select, Checkbox } from 'antd'
import type { FormFieldDef } from '@/types/form-template'

const { TextArea } = Input

export interface DynamicFormFieldsProps {
  fields: FormFieldDef[]
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
  /** 필드별 에러 메시지 */
  fieldErrors?: Record<string, string>
}

export function DynamicFormFields({
  fields,
  value,
  onChange,
  fieldErrors = {},
}: DynamicFormFieldsProps) {
  const update = (id: string, fieldValue: unknown) => {
    onChange({ ...value, [id]: fieldValue })
  }

  if (fields.length === 0) return null

  return (
    <>
      {fields.map(field => {
        const raw = value[field.id]
        const err = fieldErrors[field.id]
        const val = raw !== undefined && raw !== null ? raw : field.defaultValue

        return (
          <Form.Item
            key={field.id}
            label={field.label}
            required={field.required}
            validateStatus={err ? 'error' : ''}
            help={err}
          >
            {field.type === 'text' && (
              <Input
                value={(val as string) ?? ''}
                onChange={e => update(field.id, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
            {field.type === 'textarea' && (
              <TextArea
                value={(val as string) ?? ''}
                onChange={e => update(field.id, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
              />
            )}
            {field.type === 'number' && (
              <InputNumber
                value={(val as number) ?? undefined}
                onChange={v => update(field.id, v)}
                placeholder={field.placeholder}
                style={{ width: '100%' }}
              />
            )}
            {field.type === 'select' && (
              <Select
                value={(val as string) ?? undefined}
                onChange={v => update(field.id, v)}
                placeholder={field.placeholder ?? '선택해주세요'}
                allowClear
                options={field.options}
                style={{ width: '100%' }}
              />
            )}
            {field.type === 'checkbox' && (
              <Checkbox
                checked={!!val}
                onChange={e => update(field.id, e.target.checked)}
              >
                {field.placeholder || field.label}
              </Checkbox>
            )}
            {field.type === 'date' && (
              <Input
                type="date"
                value={(val as string) ?? ''}
                onChange={e => update(field.id, e.target.value || undefined)}
              />
            )}
          </Form.Item>
        )
      })}
    </>
  )
}
