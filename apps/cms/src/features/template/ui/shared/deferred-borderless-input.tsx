import { Input } from 'antd'
import type { FocusEvent } from 'react'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'

/** antd borderless Input + draft 동기 갱신 완충 (발급 전용 단일 필드 등) */
export function DeferredBorderlessInput({
  value,
  onCommit,
  disabled,
  className,
  placeholder,
  'aria-label': ariaLabel,
}: {
  value: string
  onCommit: (next: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  'aria-label'?: string
}) {
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, disabled ? undefined : onCommit)

  const handleBlur = (_e: FocusEvent<HTMLInputElement>) => {
    flushEditValue()
  }

  return (
    <Input
      className={className}
      variant="borderless"
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  )
}
