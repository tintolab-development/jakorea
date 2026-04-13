import { useState, type MouseEvent, type ReactNode } from 'react'
import { Input } from 'antd'
import './paragraph-input.css'

export type ParagraphInputType = 'title' | 'description'

export interface ParagraphInputProps {
  type: ParagraphInputType
  value: string
  onChange?: (next: string) => void
  /** 단락 카드가 선택된 경우 true → 편집 UI */
  isEditMode: boolean
  placeholder?: string
  required?: boolean
  /** 번호 접두 등(예: <span>1. </span>) */
  leading?: ReactNode
  disabled?: boolean
  className?: string
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function ParagraphInput({
  type,
  value,
  onChange,
  isEditMode,
  placeholder,
  required,
  leading,
  disabled,
  className,
}: ParagraphInputProps) {
  const [focused, setFocused] = useState(false)
  const filled = value.trim().length > 0

  const rootClass = cn(
    'paragraph-input',
    type === 'title' ? 'paragraph-input--title' : 'paragraph-input--description',
    isEditMode ? 'paragraph-input--edit' : 'paragraph-input--view',
    filled && 'paragraph-input--filled',
    className
  )

  const row = (
    <>
      {required ? (
        <span className="paragraph-input__required" aria-hidden>
          *
        </span>
      ) : null}
      {leading != null ? <span className="paragraph-input__leading">{leading}</span> : null}
    </>
  )

  if (!isEditMode) {
    return (
      <div className={rootClass}>
        <div className="paragraph-input__row">
          {row}
          <span className="paragraph-input__view-text">
            {filled ? (
              value
            ) : (
              <span className="paragraph-input__placeholder">{placeholder ?? ''}</span>
            )}
          </span>
        </div>
      </div>
    )
  }

  const shellClass = cn('paragraph-input__shell', focused && 'paragraph-input__shell--focused')

  const stopCard = (e: MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className={rootClass} onClick={stopCard} onMouseDown={stopCard}>
      <div className="paragraph-input__row">
        {row}
        <div className={shellClass}>
          <Input
            disabled={disabled}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            variant="borderless"
          />
        </div>
      </div>
    </div>
  )
}
