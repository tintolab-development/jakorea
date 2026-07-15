import { forwardRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { InputRef } from 'antd'
import {
  formatCurrencyInput,
  normalizeNumericInputOnBlur,
  sanitizeNumericInput,
} from '@/shared/lib/numeric-input'
import type { NumericInputMode, NumericInputOptions } from '@/shared/lib/numeric-input'
import { CmsInput } from './cms-input'
import type { CmsInputProps } from './cms-input'

export interface CmsNumericInputProps
  extends Omit<
    CmsInputProps,
    'defaultValue' | 'inputMode' | 'onChange' | 'type' | 'value'
  > {
  mode: NumericInputMode
  value?: string
  defaultValue?: string
  allowNegative?: boolean
  min?: number
  max?: number
  precision?: number
  onValueChange?: (value: string) => void
}

export const CmsNumericInput = forwardRef<InputRef, CmsNumericInputProps>(
  (
    {
      mode,
      value,
      defaultValue = '',
      pattern,
      allowNegative = false,
      min,
      max,
      precision,
      onValueChange,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const options: NumericInputOptions = {
      mode,
      allowNegative,
      min,
      max,
      precision,
    }
    const [internalValue, setInternalValue] = useState(() =>
      sanitizeNumericInput(defaultValue, options)
    )
    const isControlled = value !== undefined
    const rawValue = isControlled ? sanitizeNumericInput(value, options) : internalValue
    const displayValue = mode === 'currency' ? formatCurrencyInput(rawValue) : rawValue

    const updateValue = (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget
      const selectionStart = input.selectionStart
      const rawBeforeCaret =
        selectionStart == null
          ? null
          : sanitizeNumericInput(input.value.slice(0, selectionStart), options).length
      const nextValue = sanitizeNumericInput(input.value, options)
      updateValue(nextValue)

      if (mode === 'currency' && rawBeforeCaret != null) {
        requestAnimationFrame(() => {
          if (!input.isConnected) return
          const nextDisplay = formatCurrencyInput(nextValue)
          let nextCaret = 0
          let rawCount = 0
          while (nextCaret < nextDisplay.length && rawCount < rawBeforeCaret) {
            if (/\d/.test(nextDisplay[nextCaret] ?? '')) rawCount += 1
            nextCaret += 1
          }
          input.setSelectionRange(nextCaret, nextCaret)
        })
      }
    }

    const handleBlur: CmsInputProps['onBlur'] = event => {
      const normalized = normalizeNumericInputOnBlur(rawValue, options)
      if (normalized !== rawValue) updateValue(normalized)
      onBlur?.(event)
    }

    return (
      <CmsInput
        {...rest}
        ref={ref}
        type="text"
        inputMode={mode === 'decimal' ? 'decimal' : 'numeric'}
        pattern={
          pattern ?? (mode !== 'decimal' && !allowNegative ? '[0-9]*' : undefined)
        }
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    )
  }
)

CmsNumericInput.displayName = 'CmsNumericInput'
