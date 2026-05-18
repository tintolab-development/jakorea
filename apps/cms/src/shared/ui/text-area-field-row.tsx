import type { ReactNode } from 'react'
import { Input } from 'antd'
import { Controller } from 'react-hook-form'
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import './text-area-field-row.css'

const { TextArea } = Input

export type TextAreaFieldRowProps<TFieldValues extends FieldValues> = {
  label: string
  showRequiredStar: boolean
  isFormEdit: boolean
  form: UseFormReturn<TFieldValues> | undefined
  name: FieldPath<TFieldValues>
  rows: number
  placeholder: string
  readContent: ReactNode
  /** 기본: `text-area-field-row__content-textarea` (`text-area-field-row.css`) */
  textareaClassName?: string
  readContentWrapperClassName?: string
}

/**
 * 테이블 행: 라벨 + react-hook-form TextArea(수정) 또는 읽기 전용 블록
 * 스타일: `./text-area-field-row.css`
 */
export function TextAreaFieldRow<TFieldValues extends FieldValues>({
  label,
  showRequiredStar,
  isFormEdit,
  form,
  name,
  rows,
  placeholder,
  readContent,
  textareaClassName = 'text-area-field-row__content-textarea',
  readContentWrapperClassName = 'text-area-field-row__content-block' }: TextAreaFieldRowProps<TFieldValues>) {
  return (
    <tr>
      <th>
        {label}
        {showRequiredStar ? <span className="text-area-field-row__required">*</span> : null}
      </th>
      <td>
        {isFormEdit && form ? (
          <Controller
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <>
                <TextArea
                  {...field}
                  value={typeof field.value === 'string' ? field.value : String(field.value ?? '')}
                  rows={rows}
                  placeholder={placeholder}
                  className={textareaClassName}
                  status={fieldState.error ? 'error' : undefined}
                />
                {fieldState.error && (
                  <span className="text-area-field-row__field-error">
                    {fieldState.error ? '입력값을 확인해주세요.' : null}
                  </span>
                )}
              </>
            )}
          />
        ) : (
          <div className={readContentWrapperClassName}>{readContent}</div>
        )}
      </td>
    </tr>
  )
}
