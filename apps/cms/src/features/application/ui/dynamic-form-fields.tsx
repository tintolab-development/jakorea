/**
 * 템플릿 기반 동적 폼 필드 컴포넌트
 * Phase 0.2.2: 템플릿 기반 동적 신청서 (FR-C03)
 * Task 2.4.1: file 타입 지원 추가
 */

import { Form, Input, Select, Checkbox, Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { CmsDateTextInput } from '@/shared/ui/date-text-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import type { FormFieldDef } from '@/types/form-template'

const { TextArea } = Input

const DEFAULT_FILE_MAX_SIZE = 5 * 1024 * 1024 // 5MB

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
              <CmsNumericInput
                mode="decimal"
                value={val === undefined || val === null ? '' : String(val)}
                onValueChange={rawValue =>
                  update(field.id, rawValue === '' ? undefined : Number(rawValue))
                }
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
              <Checkbox checked={!!val} onChange={e => update(field.id, e.target.checked)}>
                {field.placeholder || field.label}
              </Checkbox>
            )}
            {field.type === 'date' && (
              <CmsDateTextInput
                value={(val as string) ?? ''}
                onValueChange={next =>
                  update(field.id, next === '' ? undefined : next.replace(/\./g, '-'))
                }
                placeholder={field.placeholder ?? 'YYYY.MM.DD'}
                width="100%"
              />
            )}
            {field.type === 'file' && (
              <Upload
                maxCount={1}
                accept={field.fileAccept}
                beforeUpload={file => {
                  const maxSize = field.fileMaxSize ?? DEFAULT_FILE_MAX_SIZE
                  if (file.size > maxSize) {
                    return false
                  }
                  update(field.id, file)
                  return false
                }}
                fileList={
                  val && val instanceof File
                    ? ([
                        {
                          uid: '1',
                          name: (val as File).name,
                          size: (val as File).size,
                        } as UploadFile,
                      ] as UploadFile[])
                    : []
                }
                onRemove={() => update(field.id, undefined)}
              >
                <Button icon={<UploadOutlined />}>{field.placeholder ?? '파일 선택'}</Button>
              </Upload>
            )}
          </Form.Item>
        )
      })}
    </>
  )
}
