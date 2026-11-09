/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const showAdminAccessDeniedAlert = vi.fn()
let roleCode = 'PROGRAM_VIEWER'

vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: (selector: (state: { user: unknown }) => unknown) =>
    selector({ user: { role: 'ADMIN', roleCode } }),
}))
vi.mock('@/shared/lib/admin-role-policy', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/admin-role-policy')>()
  return { ...actual, showAdminAccessDeniedAlert: () => showAdminAccessDeniedAlert() }
})

const { AdminReadOnlyActionGuard } = await import('./admin-read-only-action-guard')

function renderButtons(onClick: (label: string) => void) {
  const labels = [
    '지급조서 발급',
    '알림 재발송',
    '선택 승인',
    '동의서 보기',
    '메일 발송',
    '알림톡 발송',
    '문자 발송',
    '캘린더 뷰로 보기',
    '내역 보기',
    '발송 이력 조회',
  ]
  render(
    <AdminReadOnlyActionGuard>
      {labels.map(label => (
        <button key={label} type="button" onClick={() => onClick(label)}>
          {label}
        </button>
      ))}
      <span role="button" data-program-action="write" onClick={() => onClick('dropdown')}>
        Accounting Manager
      </span>
    </AdminReadOnlyActionGuard>
  )
}

describe('AdminReadOnlyActionGuard', () => {
  afterEach(() => {
    cleanup()
    showAdminAccessDeniedAlert.mockClear()
  })

  it('뷰어는 쓰기·발급·발송·개인정보·드롭다운 클릭을 막고 접근 불가 안내를 띄운다', () => {
    roleCode = 'PROGRAM_VIEWER'
    const onClick = vi.fn()
    renderButtons(onClick)
    for (const label of ['지급조서 발급', '알림 재발송', '선택 승인', '동의서 보기', '메일 발송', '알림톡 발송', '문자 발송']) {
      fireEvent.click(screen.getByText(label))
    }
    fireEvent.click(screen.getByText('Accounting Manager'))
    expect(onClick).not.toHaveBeenCalled()
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(8)
  })

  it('뷰어도 조회 버튼은 그대로 동작한다', () => {
    roleCode = 'PROGRAM_VIEWER'
    const onClick = vi.fn()
    renderButtons(onClick)
    fireEvent.click(screen.getByText('캘린더 뷰로 보기'))
    fireEvent.click(screen.getByText('내역 보기'))
    fireEvent.click(screen.getByText('발송 이력 조회'))
    expect(onClick.mock.calls.map(call => call[0])).toEqual([
      '캘린더 뷰로 보기',
      '내역 보기',
      '발송 이력 조회',
    ])
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
  })

  it('뷰어가 아니면 가로채지 않는다', () => {
    roleCode = 'MASTER'
    const onClick = vi.fn()
    renderButtons(onClick)
    fireEvent.click(screen.getByText('지급조서 발급'))
    expect(onClick).toHaveBeenCalledWith('지급조서 발급')
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
  })
})
