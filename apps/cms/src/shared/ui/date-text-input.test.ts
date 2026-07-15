/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {
  DateTextInput,
  isValidCalendarDate,
  normalizeDateTextInputOnBlur,
  sanitizeDateTextInput,
} from './date-text-input'

afterEach(cleanup)

describe('date text helpers', () => {
  it('숫자를 YYYY.MM.DD 형태로 점진 포맷한다', () => {
    expect(sanitizeDateTextInput('202')).toBe('202')
    expect(sanitizeDateTextInput('20261')).toBe('2026.1')
    expect(sanitizeDateTextInput('20260102')).toBe('2026.01.02')
    expect(sanitizeDateTextInput('2026.1.2')).toBe('2026.1.2')
    expect(sanitizeDateTextInput('２０２６．１．２')).toBe('2026.1.2')
  })

  it('실제 달력 날짜를 검증한다', () => {
    expect(isValidCalendarDate('2024.2.29')).toBe(true)
    expect(isValidCalendarDate('2025.2.29')).toBe(false)
    expect(isValidCalendarDate('2026.13.1')).toBe(false)
    expect(isValidCalendarDate('2026.4.31')).toBe(false)
  })

  it('blur에서 유효하고 완성된 날짜만 패딩한다', () => {
    expect(normalizeDateTextInputOnBlur('2026.1.2')).toBe('2026.01.02')
    expect(normalizeDateTextInputOnBlur('2026.2')).toBe('2026.2')
    expect(normalizeDateTextInputOnBlur('2026.2.30')).toBe('2026.2.30')
  })
})

describe('DateTextInput', () => {
  it('8자리 붙여넣기를 포맷하고 string value를 반환한다', () => {
    const onValueChange = vi.fn()
    render(
      createElement(DateTextInput, {
        'aria-label': '시작일',
        onValueChange,
      })
    )

    const input = screen.getByRole('textbox', { name: '시작일' })
    fireEvent.change(input, { target: { value: '20260102' } })

    expect(input).toHaveValue('2026.01.02')
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(onValueChange).toHaveBeenLastCalledWith('2026.01.02')
  })

  it('유효한 YYYY.M.D만 blur에서 패딩하고 검증 결과를 알린다', () => {
    const onValueChange = vi.fn()
    const onValidityChange = vi.fn()
    render(
      createElement(DateTextInput, {
        'aria-label': '종료일',
        onValueChange,
        onValidityChange,
      })
    )

    const input = screen.getByRole('textbox', { name: '종료일' })
    fireEvent.change(input, { target: { value: '2024.2.29' } })
    expect(input).toHaveValue('2024.2.29')

    fireEvent.blur(input)
    expect(input).toHaveValue('2024.02.29')
    expect(onValueChange).toHaveBeenLastCalledWith('2024.02.29')
    expect(onValidityChange).toHaveBeenLastCalledWith(true, '2024.02.29')
  })

  it('실제 달력에서 유효하지 않은 값은 blur에서도 덮어쓰지 않는다', () => {
    const onValidityChange = vi.fn()
    render(
      createElement(DateTextInput, {
        defaultValue: '2025.2.29',
        'aria-label': '생년월일',
        onValidityChange,
      })
    )

    const input = screen.getByRole('textbox', { name: '생년월일' })
    fireEvent.blur(input)

    expect(input).toHaveValue('2025.2.29')
    expect(onValidityChange).toHaveBeenLastCalledWith(false, '2025.2.29')
  })
})
