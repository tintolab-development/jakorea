import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import type { InputRef } from 'antd'
import {
  applyKoreanPhoneInputChange,
  formatKoreanPhoneNumber,
} from '@jakorea/domain/shared/korean-phone'
import { CmsInput } from './cms-input'
import type { CmsInputProps } from './cms-input'

function getNativeInput(ref: InputRef | null): HTMLInputElement | null {
  if (!ref) return null
  if (ref.input) return ref.input
  return ref.nativeElement instanceof HTMLInputElement ? ref.nativeElement : null
}

export const CmsPhoneInput = forwardRef<InputRef, CmsInputProps>(function CmsPhoneInput(
  { value, defaultValue, onChange, ...rest },
  ref
) {
  const innerRef = useRef<InputRef>(null)
  const pendingCaret = useRef<number | null>(null)
  const previousRef = useRef(
    formatKoreanPhoneNumber(String(value ?? defaultValue ?? ''))
  )

  useImperativeHandle(ref, () => innerRef.current as InputRef)

  const formatted =
    value === undefined || value === null ? undefined : formatKoreanPhoneNumber(String(value))

  if (formatted !== undefined) previousRef.current = formatted

  useLayoutEffect(() => {
    const caret = pendingCaret.current
    if (caret == null) return
    pendingCaret.current = null
    const el = getNativeInput(innerRef.current)
    el?.setSelectionRange(caret, caret)
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const result = applyKoreanPhoneInputChange(
      previousRef.current,
      event.target.value,
      event.target.selectionStart
    )
    previousRef.current = result.formatted
    pendingCaret.current = result.caret
    event.target.value = result.formatted
    onChange?.(event)
  }

  return (
    <CmsInput
      {...rest}
      ref={innerRef}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      value={formatted}
      defaultValue={
        defaultValue === undefined ? undefined : formatKoreanPhoneNumber(String(defaultValue))
      }
      onChange={handleChange}
    />
  )
})
