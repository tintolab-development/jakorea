import { Input } from 'antd'
import { useState, type FocusEvent, type KeyboardEvent } from 'react'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'
import './table-cell-inline-text-input.css'

/** 가로표 본문 — borderless 한 줄. blur 시 텍스트 중앙, focus 시 좌측 편집(폭 고정) */
export function TableCellInlineTextInput({
  value,
  placeholder,
  className,
  onCommit,
  onFocus,
}: {
  value: string
  placeholder: string
  className?: string
  onCommit: (next: string) => void
  onFocus?: () => void
}) {
  const [focused, setFocused] = useState(false)
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, onCommit)

  const stopEnterSpace = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
  }

  const handleFocus = (_e: FocusEvent<HTMLInputElement>) => {
    setFocused(true)
    onFocus?.()
  }

  const handleBlur = (_e: FocusEvent<HTMLInputElement>) => {
    flushEditValue()
    setFocused(false)
  }

  const cn = [
    'table-cell-inline-text-input',
    focused ? 'table-cell-inline-text-input--focused' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Input
      variant="borderless"
      className={cn}
      value={editValue}
      placeholder={placeholder}
      onChange={e => setEditValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={stopEnterSpace}
    />
  )
}
