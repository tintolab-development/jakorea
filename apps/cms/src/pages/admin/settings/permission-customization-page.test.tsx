// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PermissionCustomizationPage } from './permission-customization-page'

function renderPage(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/admin/settings/permissions${search}`]}>
      <Routes>
        <Route path="/admin/settings/permissions" element={<PermissionCustomizationPage />} />
      </Routes>
    </MemoryRouter>
  )
}

function itemInputs(container: HTMLElement): HTMLInputElement[] {
  return [
    ...container.querySelectorAll<HTMLInputElement>(
      '.permission-customization-page__item-checkbox input'
    ),
  ]
}

function checkedItemCount(container: HTMLElement): number {
  return itemInputs(container).filter(input => input.checked).length
}

describe('PermissionCustomizationPage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('Master 102개를 조회 전용으로 표시하고 권한 API를 호출하지 않는다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const { container } = renderPage()

    const tabs = screen.getAllByRole('tab').map(tab => tab.textContent)
    expect(tabs).toEqual(['Master', 'Accounting Manager', 'Program Manager', 'Program Viewer'])
    expect(screen.getByRole('tab', { name: 'Master' })).toHaveAttribute('aria-selected', 'true')

    expect(
      [...container.querySelectorAll('.permission-customization-page__card-head-title')].map(
        node => node.textContent
      )
    ).toEqual(['등록·수정·삭제', '개인정보 열람', '화면 열람', '파일 다운로드', '설정·처리'])

    const inputs = itemInputs(container)
    expect(inputs).toHaveLength(102)
    expect(inputs.every(input => input.disabled)).toBe(true)
    expect(checkedItemCount(container)).toBe(102)
    expect(screen.queryByRole('button', { name: /저장|적용|초기화/ })).toBeNull()
    expect(fetchSpy).not.toHaveBeenCalled()

    fireEvent.click(inputs[0]!)
    expect(inputs[0]!.checked).toBe(true)
  })

  it('탭을 바꾸면 해당 역할의 체크 상태만 바뀐다', () => {
    const { container } = renderPage()

    fireEvent.click(screen.getByRole('tab', { name: 'Accounting Manager' }))
    expect(screen.getByRole('tab', { name: 'Accounting Manager' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(checkedItemCount(container)).toBe(87)

    fireEvent.click(screen.getByRole('tab', { name: 'Program Manager' }))
    expect(checkedItemCount(container)).toBe(78)

    fireEvent.click(screen.getByRole('tab', { name: 'Program Viewer' }))
    expect(checkedItemCount(container)).toBe(16)
    expect(screen.getByText('대시보드').closest('label')?.querySelector('input')).toBeChecked()
    expect(
      screen.getByText('프로그램 등록·삭제').closest('label')?.querySelector('input')
    ).not.toBeChecked()
    expect(screen.getByText('GNB 알림 수신').closest('label')?.querySelector('input')).toBeChecked()

    const crudCard = screen
      .getByText('등록·수정·삭제')
      .closest('.permission-customization-page__category-card')
    expect(crudCard?.querySelector('.ant-checkbox-indeterminate')).toBeNull()
    expect(crudCard?.querySelector('.ant-checkbox-checked')).toBeNull()

    const screenCard = screen
      .getByText('화면 열람')
      .closest('.permission-customization-page__category-card')
    expect(
      screenCard?.querySelector(
        '.permission-customization-page__card-head .ant-checkbox-indeterminate'
      )
    ).not.toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'Master' }))
    expect(checkedItemCount(container)).toBe(102)
  })

  it('role 쿼리로 초기 탭을 정하고 과거 pm 값은 Program Manager로 본다', () => {
    const accounting = renderPage('?role=accounting-manager')
    expect(screen.getByRole('tab', { name: 'Accounting Manager' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(checkedItemCount(accounting.container)).toBe(87)
    cleanup()

    const legacyPm = renderPage('?role=pm')
    expect(screen.getByRole('tab', { name: 'Program Manager' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(checkedItemCount(legacyPm.container)).toBe(78)
  })
})
