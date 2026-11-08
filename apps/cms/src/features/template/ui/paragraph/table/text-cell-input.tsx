import { Input } from 'antd'
import { useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
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

function hasExplicitLineBreak(value: string, placeholder: string) {
  return value.includes('\n') || placeholder.includes('\n')
}

/** view 셀과 동일 타이포로 soft-wrap 시 두 줄 이상인지 측정 */
function measureSoftWrapsToMultipleLines(
  text: string,
  availableWidthPx: number,
  typography: { fontSize: string; lineHeight: string }
): boolean {
  if (availableWidthPx <= 0 || text.trim() === '') return false
  const measure = document.createElement('span')
  measure.setAttribute('aria-hidden', 'true')
  measure.style.cssText = [
    'position:absolute',
    'left:-99999px',
    'top:0',
    'visibility:hidden',
    'pointer-events:none',
    'white-space:pre-wrap',
    'overflow-wrap:break-word',
    'word-break:break-word',
    'font-family:Pretendard,sans-serif',
    `font-size:${typography.fontSize}`,
    'font-weight:500',
    'font-style:normal',
    `line-height:${typography.lineHeight}`,
    `width:${Math.floor(availableWidthPx)}px`,
  ].join(';')
  measure.textContent = text
  document.body.appendChild(measure)
  const height = measure.getBoundingClientRect().height
  const singleLine = Number.parseFloat(getComputedStyle(measure).lineHeight) || 24
  document.body.removeChild(measure)
  return height > singleLine + 4
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
  const shellRef = useRef<HTMLDivElement>(null)
  const [softWrapsMultiline, setSoftWrapsMultiline] = useState(false)
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, onChange)

  const explicitMultiline = hasExplicitLineBreak(editValue, placeholder)
  /** body만 soft-wrap 측정. 한 줄이면 fit-content·고정 높이, 두 줄+면 셀 너비 TextArea */
  const multiline = variant === 'body' && (explicitMultiline || softWrapsMultiline)

  useLayoutEffect(() => {
    if (variant !== 'body') {
      setSoftWrapsMultiline(false)
      return
    }
    if (explicitMultiline) {
      setSoftWrapsMultiline(true)
      return
    }
    const parent = shellRef.current?.parentElement
    if (!parent) {
      setSoftWrapsMultiline(false)
      return
    }
    const availableWidth = parent.clientWidth - 16
    const sample = editValue.trim() !== '' ? editValue : placeholder
    // 조회 셀과 같은 표 타이포(--ht-font-size·--ht-line-height)로 측정
    const style = getComputedStyle(parent)
    const fontSize = style.getPropertyValue('--ht-font-size').trim() || '16px'
    const lineHeight = style.getPropertyValue('--ht-line-height').trim() || '24px'
    setSoftWrapsMultiline(
      measureSoftWrapsToMultipleLines(sample, availableWidth, { fontSize, lineHeight })
    )
  }, [variant, editValue, placeholder, explicitMultiline])

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

  if (variant === 'header') {
    return (
      <div ref={shellRef} className={className}>
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
    <div ref={shellRef} className={className}>
      <TextArea
        variant="borderless"
        className="text-cell-input__control text-cell-input__control--area"
        autoSize={multiline ? { minRows: 1 } : { minRows: 1, maxRows: 1 }}
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
