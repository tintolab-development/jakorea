import type { ReactNode } from 'react'
import { Controller } from 'react-hook-form'
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import './text-area-field-row.css'

export type TextAreaFieldRowProps<TFieldValues extends FieldValues> = {
  label: string
  showRequiredStar: boolean
  isFormEdit: boolean
  form: UseFormReturn<TFieldValues> | undefined
  name: FieldPath<TFieldValues>
  /** 모집 양식 상세 정보와 동일: 1행 시작 + 세로 확장. 기본 1 */
  rows?: number
  placeholder: string
  readContent: ReactNode
  /** 기본: `text-area-field-row__field` (`text-area-field-row.css`) */
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
  rows = 1,
  placeholder,
  readContent,
  textareaClassName = 'text-area-field-row__field',
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
                <CmsTextArea
                  {...field}
                  value={typeof field.value === 'string' ? field.value : String(field.value ?? '')}
                  inputSize="medium"
                  width="100%"
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
