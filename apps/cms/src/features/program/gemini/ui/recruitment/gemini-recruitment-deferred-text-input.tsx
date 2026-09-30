import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { CmsInput, type CmsInputProps } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsTextArea, type CmsTextAreaProps } from '@/shared/ui/cms-textarea'

function commitDeferred(local: string, value: string, onCommit: (next: string) => void) {
  if (local === value) return
  // 저장/미리보기 직전 blur() 후 draft setState가 반영되도록 동기 flush
  flushSync(() => {
    onCommit(local)
  })
}

/**
 * 타이핑은 로컬 state만 갱신하고, blur 때 부모(draft)로 commit.
 * TipTap·형제 필드가 매 키마다 리렌더되지 않게 한다.
 * 저장 직전 `document.activeElement.blur()` 로 flush.
 */
export function GeminiDeferredCmsInput({
  value,
  onCommit,
  onBlur,
  ...props
}: Omit<CmsInputProps, 'value' | 'onChange' | 'defaultValue'> & {
  value: string
  onCommit: (next: string) => void
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <CmsInput
      {...props}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => {
        onBlur?.(e)
        commitDeferred(local, value, onCommit)
      }}
    />
  )
}

export function GeminiDeferredCmsPhoneInput({
  value,
  onCommit,
  onBlur,
  ...props
}: Omit<CmsInputProps, 'value' | 'onChange' | 'defaultValue'> & {
  value: string
  onCommit: (next: string) => void
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <CmsPhoneInput
      {...props}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => {
        onBlur?.(e)
        commitDeferred(local, value, onCommit)
      }}
    />
  )
}

export function GeminiDeferredCmsTextArea({
  value,
  onCommit,
  onBlur,
  ...props
}: Omit<CmsTextAreaProps, 'value' | 'onChange' | 'defaultValue'> & {
  value: string
  onCommit: (next: string) => void
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => {
    setLocal(value)
  }, [value])

  return (
    <CmsTextArea
      {...props}
      value={local}
      onChange={e => setLocal(e.target.value)}
      onBlur={e => {
        onBlur?.(e)
        commitDeferred(local, value, onCommit)
      }}
    />
  )
}
