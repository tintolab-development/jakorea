import { useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'
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

function measureTextWidthPx(
  text: string,
  type: ParagraphInputType,
  isExplanationTitle: boolean
): number {
  if (typeof document === 'undefined') return 0
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return 0
  const fontSize = type === 'title' ? (isExplanationTitle ? 24 : 20) : isExplanationTitle ? 18 : 16
  const fontWeight = type === 'title' ? 700 : 500
  context.font = `${fontWeight} ${fontSize}px Pretendard, sans-serif`
  return Math.ceil(context.measureText(text).width)
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
  const isExplanationTitle = className?.includes('paragraph-input-explanation-title') ?? false
  const isExplanationBody = className?.includes('paragraph-input--explanation-body') ?? false
  const widthSource = filled ? value : (placeholder ?? '')
  const dynamicWidthPx = useMemo(() => {
    const source = widthSource.length > 0 ? widthSource : ' '
    const measured = measureTextWidthPx(source, type, isExplanationTitle)
    return Math.max(measured + 2, 1)
  }, [widthSource, type, isExplanationTitle])
  const dynamicWidthStyle: CSSProperties = {
    width: isExplanationBody ? '100%' : `${dynamicWidthPx}px`,
    maxWidth: '100%',
  }

  const rootClass = cn(
    'paragraph-input',
    type === 'title' ? 'paragraph-input--title' : 'paragraph-input--description',
    isEditMode ? 'paragraph-input--edit' : 'paragraph-input--view',
    filled && 'paragraph-input--filled',
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
            <span className="paragraph-input__view-text" style={dynamicWidthStyle}>
              {filled ? (
                value
              ) : (
                <span className="paragraph-input__placeholder">{placeholder ?? ''}</span>
              )}
            </span>
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
          <div className={shellClass} style={dynamicWidthStyle}>
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
