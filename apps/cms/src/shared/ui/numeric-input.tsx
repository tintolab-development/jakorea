import { forwardRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { InputRef } from 'antd'
import {
  acceptStrictIntegerInput,
  formatCurrencyInput,
  formatDecimalInputDisplay,
  formatGroupedDigits,
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
  /** 정수부 천단위 구분을 표시할지 여부. 퍼센트 입력처럼 원문 표시가 필요한 경우 false. */
  groupThousands?: boolean
  min?: number
  max?: number
  precision?: number
  onValueChange?: (value: string) => void
  /**
   * opt-in(integer 전용): 숫자 외 문자·부호·소수점이 들어오면 값을 고치지 않고 입력을 거부한다.
   * 기본 false — 기존 정제(문자 제거) 동작 유지.
   */
  rejectInvalidInput?: boolean
  /** opt-in: 정수 자릿수 상한. `rejectInvalidInput`과 함께 쓰면 초과 입력을 거부한다. */
  maxDigits?: number
  /** 거부된 입력 알림 — 화면에서 오류 문구를 띄울 때 쓴다. */
  onInvalidInput?: (reason: 'invalid-char' | 'too-long') => void
  /**
   * blur 시 부호 제거·min/max 보정을 할지. 기본 true(기존 동작).
   * false면 값을 바꾸지 않고 화면 검증 문구로 안내한다.
   */
  normalizeOnBlur?: boolean
}

function formatNumericInputDisplay(
  raw: string,
  mode: NumericInputMode,
  groupThousands: boolean
): string {
  if (!groupThousands) return raw
  if (mode === 'currency') return formatCurrencyInput(raw)
  if (mode === 'integer') return formatGroupedDigits(raw)
  if (mode === 'decimal') return formatDecimalInputDisplay(raw)
  return raw
}

function restoreGroupedCaret(display: string, rawLength: number): number {
  let nextCaret = 0
  let rawCount = 0
  while (nextCaret < display.length && rawCount < rawLength) {
    if (display[nextCaret] !== ',') rawCount += 1
    nextCaret += 1
  }
  return nextCaret
}

export const CmsNumericInput = forwardRef<InputRef, CmsNumericInputProps>(
  (
    {
      mode,
      value,
      defaultValue = '',
      pattern,
      allowNegative = false,
      groupThousands = true,
      min,
      max,
      precision,
      onValueChange,
      rejectInvalidInput = false,
      maxDigits,
      onInvalidInput,
      normalizeOnBlur = true,
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
    const displayValue = formatNumericInputDisplay(rawValue, mode, groupThousands)
    const groupsThousands =
      groupThousands && (mode === 'currency' || mode === 'integer' || mode === 'decimal')

    const updateValue = (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget
      if (rejectInvalidInput && mode === 'integer') {
        const accepted = acceptStrictIntegerInput(input.value, maxDigits)
        if (!accepted.ok) {
          onInvalidInput?.(accepted.reason)
          return
        }
      }
      const selectionStart = input.selectionStart
      const rawBeforeCaret =
        selectionStart == null
          ? null
          : sanitizeNumericInput(input.value.slice(0, selectionStart), options).length
      const nextValue = sanitizeNumericInput(input.value, options)
      updateValue(nextValue)

      if (groupsThousands && rawBeforeCaret != null) {
        requestAnimationFrame(() => {
          if (!input.isConnected) return
          const nextDisplay = formatNumericInputDisplay(nextValue, mode, groupThousands)
          const nextCaret = restoreGroupedCaret(nextDisplay, rawBeforeCaret)
          input.setSelectionRange(nextCaret, nextCaret)
        })
      }
    }

    const handleBlur: CmsInputProps['onBlur'] = event => {
      if (normalizeOnBlur) {
        const normalized = normalizeNumericInputOnBlur(rawValue, options)
        if (normalized !== rawValue) updateValue(normalized)
      }
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
