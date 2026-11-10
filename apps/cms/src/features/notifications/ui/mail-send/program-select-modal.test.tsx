/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { ProgramSelectModal } from './program-select-modal'

const PROGRAMS = [{ id: '11', name: '2026 JA Company Of the Year', year: 2026 }]

describe('ProgramSelectModal', () => {
  afterEach(() => {
    cleanup()
  })

  it('선택된 프로그램이 있으면 안내 문구와 「프로그램 선택 해제」를 보이고 해제를 알린다', () => {
    const onDeselect = vi.fn()
    render(
      <ProgramSelectModal
        open
        programs={PROGRAMS}
        selectedId="11"
        selectedName="2026 JA Company Of the Year"
        onClose={() => {}}
        onSelect={() => {}}
        onDeselect={onDeselect}
      />
    )

    expect(screen.getByText('[2026 JA Company Of the Year]')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '프로그램 선택 해제' }))
    expect(onDeselect).toHaveBeenCalledTimes(1)
  })

  it('선택된 프로그램이 없으면 해제 버튼을 보이지 않는다', () => {
    render(
      <ProgramSelectModal
        open
        programs={PROGRAMS}
        onClose={() => {}}
        onSelect={() => {}}
        onDeselect={() => {}}
      />
    )

    expect(screen.queryByRole('button', { name: '프로그램 선택 해제' })).not.toBeInTheDocument()
    expect(screen.queryByText(/현재 선택된 프로그램은/)).not.toBeInTheDocument()
  })
})
