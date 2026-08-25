import { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import type { InputRef } from 'antd'
import {
  applyKoreanBusinessNumberInputChange,
  formatKoreanBusinessNumber,
} from '@jakorea/domain/shared/korean-business-number'
import { CmsInput } from './cms-input'
import type { CmsInputProps } from './cms-input'

function getNativeInput(ref: InputRef | null): HTMLInputElement | null {
  if (!ref) return null
  if (ref.input) return ref.input
  return ref.nativeElement instanceof HTMLInputElement ? ref.nativeElement : null
}

export const CmsBusinessNumberInput = forwardRef<InputRef, CmsInputProps>(
  function CmsBusinessNumberInput({ value, defaultValue, onChange, ...rest }, ref) {
    const innerRef = useRef<InputRef>(null)
    const pendingCaret = useRef<number | null>(null)
    const previousRef = useRef(
      formatKoreanBusinessNumber(String(value ?? defaultValue ?? ''))
    )

    useImperativeHandle(ref, () => innerRef.current as InputRef)

    const formatted =
      value === undefined || value === null
        ? undefined
        : formatKoreanBusinessNumber(String(value))

    if (formatted !== undefined) previousRef.current = formatted

    useLayoutEffect(() => {
      const caret = pendingCaret.current
      if (caret == null) return
      pendingCaret.current = null
      const el = getNativeInput(innerRef.current)
      el?.setSelectionRange(caret, caret)
    })

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const result = applyKoreanBusinessNumberInputChange(
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
        autoComplete="off"
        maxLength={12}
        value={formatted}
        defaultValue={
          defaultValue === undefined
            ? undefined
            : formatKoreanBusinessNumber(String(defaultValue))
        }
        onChange={handleChange}
      />
    )
  }
)
