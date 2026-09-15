import {
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { Input } from 'antd'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'
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
  /** 제목 본문 뒤·필수(*) 앞 (예: 객관식 중복 선택 안내) */
  suffix?: ReactNode
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
  suffix,
  disabled,
  className,
}: ParagraphInputProps) {
  const [focused, setFocused] = useState(false)
  const safeValue = typeof value === 'string' ? value : ''
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(safeValue, isEditMode ? onChange : undefined)
  const displayValue = isEditMode ? editValue : safeValue
  const filled = displayValue.trim().length > 0
  const isExplanationTitle = className?.includes('paragraph-input-explanation-title') ?? false
  const isExplanationBody = className?.includes('paragraph-input--explanation-body') ?? false
  /** 단락 카드 설명 — `\n` 개행·여러 줄 편집 */
  const isMultilineCardDescription =
    type === 'description' &&
    !isExplanationBody &&
    (!isExplanationTitle || displayValue.includes('\n'))
  /** 설명글_텍스트형 본문 — 긴 텍스트 줄바꿈(말줄임 금지), `\n`·자동 개행 */
  const isExplanationBodyMultiline = isExplanationBody
  const useMultilineInput = isMultilineCardDescription || isExplanationBodyMultiline
  /**
   * 폭·높이는 CSS(`field-sizing` / fit-content)로 처리.
   * 키마다 canvas 측정·autoSize 재계산하면 레이아웃 스래싱으로 버벅인다.
   */
  const shellStyle: CSSProperties | undefined = useMultilineInput
    ? { width: '100%', minWidth: 0, maxWidth: '100%' }
    : undefined

  const rootClass = cn(
    'paragraph-input',
    type === 'title' ? 'paragraph-input--title' : 'paragraph-input--description',
    isEditMode ? 'paragraph-input--edit' : 'paragraph-input--view',
    filled && 'paragraph-input--filled',
    isMultilineCardDescription && 'paragraph-input--description-multiline',
    isExplanationBodyMultiline && 'paragraph-input--explanation-body-multiline',
    className
  )

  const row = (
    <>{leading != null ? <span className="paragraph-input__leading">{leading}</span> : null}</>
  )

  if (!isEditMode) {
    return (
      <div className={rootClass}>
        <div className="paragraph-input__row">
          {row}
          <span className="paragraph-input__main">
            <span className="paragraph-input__view-text">
              {filled ? (
                displayValue
              ) : (
                <span className="paragraph-input__placeholder">{placeholder ?? ''}</span>
              )}
            </span>
            {suffix}
            {required ? (
              <span className="paragraph-input__required" aria-hidden>
                *
              </span>
            ) : null}
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
        <span className="paragraph-input__main">
          <div className={shellClass} style={shellStyle}>
            {useMultilineInput ? (
              <Input.TextArea
                disabled={disabled}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  flushEditValue()
                  setFocused(false)
                }}
                placeholder={placeholder}
                variant="borderless"
                autoSize={false}
              />
            ) : (
              <Input
                disabled={disabled}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  flushEditValue()
                  setFocused(false)
                }}
                placeholder={placeholder}
                variant="borderless"
              />
            )}
          </div>
          {suffix}
          {required ? (
            <span className="paragraph-input__required" aria-hidden>
              *
            </span>
          ) : null}
        </span>
      </div>
    </div>
  )
}
