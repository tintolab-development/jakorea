// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const showAdminAccessDeniedAlert = vi.fn(() => true)
const fetchProgramMyAssignment = vi.fn()
let roleCode: string = 'PROGRAM_MANAGER'

vi.mock('@/shared/lib/admin-role-policy', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/admin-role-policy')>()
  return {
    ...actual,
    resolveAdminRoleCodeFromUser: () => roleCode,
    showAdminAccessDeniedAlert: () => showAdminAccessDeniedAlert(),
  }
})
vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { adminAccountId: number } }) => unknown) =>
    selector({ user: { adminAccountId: 7 } }),
}))
vi.mock('@/features/program/general/api/general-programs-remote-capabilities', () => ({
  shouldUseProgramsHttpRemoteApi: () => true,
}))
vi.mock('@/features/program/shared/lib/program-my-assignment', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/shared/lib/program-my-assignment')>()
  return { ...actual, fetchProgramMyAssignment: (id: string) => fetchProgramMyAssignment(id) }
})

import { useAdminActionGuardDelegated } from '@/shared/lib/admin-action-guard-delegation'
import { ProgramDetailActionGuard } from './program-detail-action-guard'

async function renderGuard(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const view = render(
    <QueryClientProvider client={client}>
      <ProgramDetailActionGuard programId="12">{children}</ProgramDetailActionGuard>
    </QueryClientProvider>
  )
  // 배정 응답이 반영된 뒤 클릭한다(실제 화면은 상세 진입 확인에서 이미 캐시됨).
  await waitFor(() => {
    expect(fetchProgramMyAssignment).toHaveBeenCalledWith('12')
    expect(client.isFetching()).toBe(0)
  })
  await act(async () => {})
  return view
}

describe('ProgramDetailActionGuard', () => {
  beforeEach(() => {
    roleCode = 'PROGRAM_MANAGER'
    showAdminAccessDeniedAlert.mockClear()
    fetchProgramMyAssignment.mockReset()
  })
  afterEach(cleanup)

  it('프로그램 뷰어가 선택 반려를 누르면 안내만 띄우고 동작은 막는다', async () => {
    fetchProgramMyAssignment.mockResolvedValue({
      assigned: true,
      assignmentRole: 'VIEWER',
      capabilities: ['PROGRAM_VIEW'],
    })
    const onReject = vi.fn()
    await renderGuard(
      <button type="button" onClick={onReject}>
        선택 반려
      </button>
    )
    fireEvent.click(screen.getByRole('button', { name: '선택 반려' }))
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(1)
    expect(onReject).not.toHaveBeenCalled()
    expect((screen.getByRole('button', { name: '선택 반려' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('모달 포털 안의 엑셀 다운로드도 막고, 조회 버튼은 그대로 동작한다', async () => {
    fetchProgramMyAssignment.mockResolvedValue({
      assigned: true,
      assignmentRole: 'VIEWER',
      capabilities: ['PROGRAM_VIEW'],
    })
    const onDownload = vi.fn()
    const onPreview = vi.fn()
    await renderGuard(
      createPortal(
        <>
          <button type="button" onClick={onDownload}>
            <span>엑셀 다운로드</span>
          </button>
          <button type="button" onClick={onPreview}>
            미리보기
          </button>
        </>,
        document.body
      )
    )
    fireEvent.click(screen.getByText('엑셀 다운로드'))
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(1)
    expect(onDownload).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '미리보기' }))
    expect(onPreview).toHaveBeenCalledTimes(1)
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(1)
  })

  it('Program Assistant는 쓰기 버튼을 그대로 누를 수 있다', async () => {
    fetchProgramMyAssignment.mockResolvedValue({
      assigned: true,
      assignmentRole: 'PARTNER',
      capabilities: ['PROGRAM_VIEW', 'PROGRAM_EDIT', 'FILE_DOWNLOAD'],
    })
    const onEdit = vi.fn()
    await renderGuard(
      <button type="button" onClick={onEdit}>
        정보 수정
      </button>
    )
    fireEvent.click(screen.getByRole('button', { name: '정보 수정' }))
    expect(onEdit).toHaveBeenCalledTimes(1)
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
  })

  it('캘린더 뷰로 보기 같은 조회 버튼은 막지 않고, 툴바 전역 가드는 꺼 둔다', async () => {
    fetchProgramMyAssignment.mockResolvedValue({
      assigned: true,
      assignmentRole: 'VIEWER',
      capabilities: ['PROGRAM_VIEW'],
    })
    const onCalendar = vi.fn()
    function DelegationProbe() {
      return <span data-testid="delegated">{String(useAdminActionGuardDelegated())}</span>
    }
    await renderGuard(
      <>
        <button type="button" onClick={onCalendar}>
          캘린더 뷰로 보기
        </button>
        <DelegationProbe />
      </>
    )
    fireEvent.click(screen.getByRole('button', { name: '캘린더 뷰로 보기' }))
    expect(onCalendar).toHaveBeenCalledTimes(1)
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
    expect(screen.getByTestId('delegated').textContent).toBe('true')
  })

  it('LNB 메뉴·텍스트 탭 이동은 라벨이 동작어로 끝나도 막지 않는다', async () => {
    fetchProgramMyAssignment.mockResolvedValue({
      assigned: true,
      assignmentRole: 'VIEWER',
      capabilities: ['PROGRAM_VIEW'],
    })
    const onLnb = vi.fn()
    const onTab = vi.fn()
    const onSave = vi.fn()
    await renderGuard(
      <>
        <button type="button" className="detail-fullpage-modal__lnb-child" onClick={onLnb}>
          <span>신청 기관 임시 배정</span>
        </button>
        <div role="tablist">
          <button type="button" role="tab" onClick={onTab}>
            봉사자 등록
          </button>
        </div>
        <button type="button" onClick={onSave}>
          임시 배정 저장
        </button>
      </>
    )
    fireEvent.click(screen.getByText('신청 기관 임시 배정'))
    fireEvent.click(screen.getByRole('tab', { name: '봉사자 등록' }))
    expect(onLnb).toHaveBeenCalledTimes(1)
    expect(onTab).toHaveBeenCalledTimes(1)
    expect(showAdminAccessDeniedAlert).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '임시 배정 저장' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(showAdminAccessDeniedAlert).toHaveBeenCalledTimes(1)
  })
})
