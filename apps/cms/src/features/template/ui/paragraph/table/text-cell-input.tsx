import { Input } from 'antd'
import type { FocusEvent, KeyboardEvent } from 'react'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'
import '@/features/template/ui/paragraph/table/text-cell-input.css'

const { TextArea } = Input

type TextCellInputVariant = 'header' | 'body'

type TextCellInputProps = {
  value: string
  placeholder: string
  variant: TextCellInputVariant
  /** 가로형·세로형 헤더는 가운데, 세로형 본문은 좌측 */
  align?: 'center' | 'start'
  autoFocus?: boolean
  onChange: (value: string) => void
  onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onFocus?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

function isMultiline(value: string, placeholder: string) {
  return value.includes('\n') || placeholder.includes('\n')
}

/** 테이블 텍스트형 셀 전용 인풋 — 각진 모서리 + 파란 테두리 (CmsInput / 주관식형과 분리) */
export function TextCellInput({
  value,
  placeholder,
  variant,
  align = variant === 'header' ? 'center' : 'center',
  autoFocus,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
}: TextCellInputProps) {
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, onChange)
  const multiline = variant === 'body' && isMultiline(editValue, placeholder)
  const className = [
    'text-cell-input',
    `text-cell-input--${variant}`,
    align === 'start' ? 'text-cell-input--align-start' : 'text-cell-input--align-center',
    multiline ? 'text-cell-input--multiline' : 'text-cell-input--single-line',
  ].join(' ')

  const stopEnterSpace = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
    onKeyDown?.(e)
  }

  const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    flushEditValue()
    onBlur?.(e)
  }

  if (!multiline) {
    return (
      <div className={className}>
        <Input
          variant="borderless"
          className="text-cell-input__control"
          autoFocus={autoFocus}
          value={editValue}
          placeholder={placeholder}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onFocus={onFocus}
          onKeyDown={stopEnterSpace}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <TextArea
        variant="borderless"
        className="text-cell-input__control text-cell-input__control--area"
        autoSize={{ minRows: 1 }}
        autoFocus={autoFocus}
        value={editValue}
        placeholder={placeholder}
        onChange={e => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onFocus={onFocus}
        onKeyDown={stopEnterSpace}
      />
    </div>
  )
}
