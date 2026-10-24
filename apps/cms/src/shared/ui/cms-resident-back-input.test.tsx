/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CmsResidentBackInput } from './cms-resident-back-input'

afterEach(cleanup)

describe('CmsResidentBackInput', () => {
  it('입력 중 첫 자리만 평문이고 나머지는 *이며 onChange는 숫자만 넘긴다', () => {
    const onValueChange = vi.fn()
    const { rerender } = render(
      createElement(CmsResidentBackInput, {
        value: '',
        onValueChange,
        placeholder: '주민등록 뒤 7자리',
      })
    )

    const input = screen.getByLabelText('주민등록번호 뒷자리')
    fireEvent.change(input, { target: { value: '1' } })
    expect(onValueChange).toHaveBeenLastCalledWith('1')

    rerender(createElement(CmsResidentBackInput, { value: '1', onValueChange }))
    fireEvent.change(screen.getByLabelText('주민등록번호 뒷자리'), {
      target: { value: '12' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith('12')

    rerender(createElement(CmsResidentBackInput, { value: '1234567', onValueChange }))
    expect(screen.getByLabelText('주민등록번호 뒷자리')).toHaveValue('1******')
  })

  it('눈 아이콘으로 7자리를 평문으로 보여 준다', () => {
    render(createElement(CmsResidentBackInput, { value: '1234567' }))

    expect(screen.getByLabelText('주민등록번호 뒷자리')).toHaveValue('1******')
    fireEvent.click(screen.getByRole('button', { name: '뒷자리 보기' }))
    expect(screen.getByLabelText('주민등록번호 뒷자리')).toHaveValue('1234567')

    fireEvent.click(screen.getByRole('button', { name: '뒷자리 숨기기' }))
    expect(screen.getByLabelText('주민등록번호 뒷자리')).toHaveValue('1******')
  })

  it('같은 숫자면 onChange를 다시 호출하지 않는다', () => {
    const onValueChange = vi.fn()
    render(
      createElement(CmsResidentBackInput, {
        value: '1234567',
        onValueChange,
      })
    )

    fireEvent.change(screen.getByLabelText('주민등록번호 뒷자리'), {
      target: { value: '1******' },
    })
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('읽기 전용 미리보기는 평문 뒷자리를 *로 가리고, 이미 마스킹된 값은 유지한다', () => {
    const { rerender } = render(
      createElement(CmsResidentBackInput, { value: '1234567', readOnly: true })
    )
    expect(screen.getByLabelText('주민등록번호 뒷자리')).toHaveValue('1******')

    rerender(createElement(CmsResidentBackInput, { value: '1******', readOnly: true }))
    expect(screen.getByLabelText('주민등록번호 뒷자리')).toHaveValue('1******')
  })

  it('별표가 섞여 붙여넣어도 숫자만 보존한다', () => {
    const onValueChange = vi.fn()
    render(createElement(CmsResidentBackInput, { value: '', onValueChange }))

    fireEvent.change(screen.getByLabelText('주민등록번호 뒷자리'), {
      target: { value: '1a2*34567' },
    })
    expect(onValueChange).toHaveBeenLastCalledWith('1234567')
  })
})
