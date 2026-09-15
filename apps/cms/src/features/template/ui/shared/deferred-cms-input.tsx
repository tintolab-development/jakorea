import type { FocusEvent } from 'react'
import { CmsInput, type CmsInputProps } from '@/shared/ui/cms-input'
import { useDeferredFieldCommit } from '@/features/template/ui/shared/use-deferred-field-commit'

type DeferredCmsInputProps = Omit<CmsInputProps, 'value' | 'onChange' | 'defaultValue'> & {
  value: string
  onCommit: (next: string) => void
}

/** CmsInput + draft 동기 갱신 완충 (우측 패널·옵션 라벨 등) */
export function DeferredCmsInput({
  value,
  onCommit,
  onBlur,
  ...rest
}: DeferredCmsInputProps) {
  const {
    value: editValue,
    setValue: setEditValue,
    flush: flushEditValue,
  } = useDeferredFieldCommit(value, onCommit)

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    flushEditValue()
    onBlur?.(e)
  }

  return (
    <CmsInput
      {...rest}
      value={editValue}
      onChange={e => setEditValue(e.target.value)}
      onBlur={handleBlur}
    />
  )
}
