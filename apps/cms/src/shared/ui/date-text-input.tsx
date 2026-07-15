import { forwardRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { InputRef } from 'antd'
import { CmsInput } from './cms-input'
import type { CmsInputProps } from './cms-input'

interface DateParts {
  year: string
  month: string
  day: string
}

function parseCompleteDate(value: string): DateParts | null {
  const match = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(value)
  if (!match) return null

  return {
    year: match[1],
    month: match[2],
    day: match[3],
  }
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export function isValidCalendarDate(value: string): boolean {
  const parts = parseCompleteDate(value)
  if (!parts) return false

  const year = Number(parts.year)
  const month = Number(parts.month)
  const day = Number(parts.day)
  if (year < 1 || month < 1 || month > 12 || day < 1) return false

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]

  return day <= (daysInMonth[month - 1] ?? 0)
}

export function sanitizeDateTextInput(value: string): string {
  const sanitized = value
    .replace(/[０-９]/g, digit =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0)
    )
    .replace(/．/g, '.')
    .replace(/[^\d.]/g, '')

  if (!sanitized.includes('.')) {
    const digits = sanitized.slice(0, 8)
    if (digits.length <= 4) return digits
    if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`
    return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
  }

  const parts = sanitized.split('.')
  const year = (parts[0] ?? '').slice(0, 4)
  if (parts.length === 1) return year

  const month = (parts[1] ?? '').slice(0, 2)
  if (parts.length === 2) return `${year}.${month}`

  const day = (parts[2] ?? '').slice(0, 2)
  return `${year}.${month}.${day}`
}

export function normalizeDateTextInputOnBlur(value: string): string {
  const sanitized = sanitizeDateTextInput(value)
  const parts = parseCompleteDate(sanitized)
  if (!parts || !isValidCalendarDate(sanitized)) return sanitized

  return `${parts.year}.${parts.month.padStart(2, '0')}.${parts.day.padStart(2, '0')}`
}

export interface CmsDateTextInputProps
  extends Omit<
    CmsInputProps,
    'defaultValue' | 'inputMode' | 'onChange' | 'type' | 'value'
  > {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onValidityChange?: (isValid: boolean, value: string) => void
}

export const CmsDateTextInput = forwardRef<InputRef, CmsDateTextInputProps>(
  (
    {
      value,
      defaultValue = '',
      onValueChange,
      onValidityChange,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(() =>
      sanitizeDateTextInput(defaultValue)
    )
    const isControlled = value !== undefined
    const currentValue = isControlled ? sanitizeDateTextInput(value) : internalValue

    const updateValue = (nextValue: string) => {
      if (!isControlled) setInternalValue(nextValue)
      onValueChange?.(nextValue)
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = sanitizeDateTextInput(event.target.value)
      updateValue(nextValue)
      onValidityChange?.(isValidCalendarDate(nextValue), nextValue)
    }

    const handleBlur: CmsInputProps['onBlur'] = event => {
      const normalized = normalizeDateTextInputOnBlur(currentValue)
      if (normalized !== currentValue) updateValue(normalized)
      onValidityChange?.(isValidCalendarDate(normalized), normalized)
      onBlur?.(event)
    }

    return (
      <CmsInput
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9.]*"
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    )
  }
)

CmsDateTextInput.displayName = 'CmsDateTextInput'

/** @deprecated 신규 코드는 CmsDateTextInput을 사용합니다. */
export const DateTextInput = CmsDateTextInput
export type DateTextInputProps = CmsDateTextInputProps
