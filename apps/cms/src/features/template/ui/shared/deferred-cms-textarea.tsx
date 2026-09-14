import type { FocusEvent } from 'react'
import { CmsTextArea, type CmsTextAreaProps } from '@/shared/ui/cms-textarea'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'

type DeferredCmsTextAreaProps = Omit<CmsTextAreaProps, 'value' | 'onChange' | 'defaultValue'> & {
  value: string
  onCommit: (next: string) => void
}

/** CmsTextArea + draft 동기 갱신 완충 */
export function DeferredCmsTextArea({
  value,
  onCommit,
  onBlur,
  ...rest
}: DeferredCmsTextAreaProps) {
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, onCommit)

  const handleBlur = (e: FocusEvent<HTMLTextAreaElement>) => {
    flushEditValue()
    onBlur?.(e)
  }

  return (
    <CmsTextArea
      {...rest}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleBlur}
    />
  )
}
