/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CmsNumericInput } from './numeric-input'

afterEach(cleanup)

describe('CmsNumericInput', () => {
  it('CmsInput 기반 text input에 mode별 inputMode와 aria 속성을 전달한다', () => {
    render(
      createElement(CmsNumericInput, {
        mode: 'decimal',
        'aria-label': '비율',
        'aria-describedby': 'ratio-help',
      })
    )

    const input = screen.getByRole('textbox', { name: '비율' })
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveAttribute('inputmode', 'decimal')
    expect(input).toHaveAttribute('aria-describedby', 'ratio-help')
    expect(input.closest('.cms-input')).not.toBeNull()
  })

  it('currency는 쉼표로 표시하고 raw digits를 반환한다', () => {
    const onValueChange = vi.fn()
    render(
      createElement(CmsNumericInput, {
        mode: 'currency',
        'aria-label': '금액',
        onValueChange,
      })
    )

    const input = screen.getByRole('textbox', { name: '금액' })
    fireEvent.change(input, { target: { value: '12,345원' } })

    expect(input).toHaveValue('12,345')
    expect(onValueChange).toHaveBeenLastCalledWith('12345')
  })

  it('빈값과 decimal 중간 상태를 보존하고 precision을 적용한다', () => {
    const onValueChange = vi.fn()
    render(
      createElement(CmsNumericInput, {
        mode: 'decimal',
        precision: 2,
        'aria-label': '소수',
        onValueChange,
      })
    )

    const input = screen.getByRole('textbox', { name: '소수' })
    fireEvent.change(input, { target: { value: '-.' } })
    expect(input).toHaveValue('-.')

    fireEvent.change(input, { target: { value: '-.123' } })
    expect(input).toHaveValue('-.12')
    expect(onValueChange).toHaveBeenLastCalledWith('-.12')

    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue('')
  })

  it('min/max와 음수 허용 여부를 blur에서만 적용한다', () => {
    const onValueChange = vi.fn()
    render(
      createElement(CmsNumericInput, {
        mode: 'integer',
        min: 10,
        max: 20,
        'aria-label': '인원',
        onValueChange,
      })
    )

    const input = screen.getByRole('textbox', { name: '인원' })
    fireEvent.change(input, { target: { value: '-2' } })
    expect(input).toHaveValue('-2')

    fireEvent.blur(input)
    expect(input).toHaveValue('10')
    expect(onValueChange).toHaveBeenLastCalledWith('10')
  })

  it('numericText는 blur 후에도 leading zero를 보존한다', () => {
    render(
      createElement(CmsNumericInput, {
        mode: 'numericText',
        defaultValue: '00102',
        'aria-label': '코드',
      })
    )

    const input = screen.getByRole('textbox', { name: '코드' })
    fireEvent.blur(input)
    expect(input).toHaveValue('00102')
  })
})
