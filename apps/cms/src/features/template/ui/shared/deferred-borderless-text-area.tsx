import { Input } from 'antd'
import type { KeyboardEvent } from 'react'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'

const { TextArea } = Input

/** 표 field flavor / always-visible TextArea — draft 동기 갱신 완충 */
export function DeferredBorderlessTextArea({
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
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, onCommit)

  const stopEnterSpace = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
  }

  return (
    <TextArea
      variant="borderless"
      className={className}
      autoSize={{ minRows: 1 }}
      value={editValue}
      placeholder={placeholder}
      onChange={e => setEditValue(e.target.value)}
      onBlur={flushEditValue}
      onFocus={onFocus}
      onKeyDown={stopEnterSpace}
    />
  )
}
