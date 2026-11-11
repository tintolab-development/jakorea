// @vitest-environment jsdom

/**
 * 「발표일에 맞춰서」 경과 비활성 — 공통 알림 라디오 3종(PermissionModal·강사비 책정 승인·UJAT 일괄 합격)이
 * 모집 화면 Provider의 발표일을 같은 규칙으로 따른다.
 */
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PermissionModal } from '@/shared/components/permission-modal'
import { NotifyAnnouncementProvider } from '@/shared/components/notify-announcement-context'
import { InstructorFeeApprovalModal } from '@/features/program/shared/ui/detail-modal/components/instructor-fee-approval-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import { UjatVolunteerInterview2BulkPassModal } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview2/bulk-pass-modal'

vi.mock('@/shared/ui/cms-alert-modal-provider', () => ({
  useCmsAlert: () => ({ showAlert: vi.fn() }),
}))

// antd 모달 첫 렌더는 동시 실행 부하에서 5초를 넘길 수 있다
vi.setConfig({ testTimeout: 30_000 })

const PASSED = '2020-01-01T15:00:00Z'
const FUTURE = '2999-01-01T15:00:00Z'

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({
        matches: false,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }
})

afterEach(() => cleanup())

function withAnnouncement(announcementAt: string | null, node: ReactNode) {
  return <NotifyAnnouncementProvider announcementAt={announcementAt}>{node}</NotifyAnnouncementProvider>
}

function announcementRadio(): HTMLInputElement {
  return screen.getByRole('radio', { name: '발표일에 맞춰서' }) as HTMLInputElement
}

function permissionModal(extra: Partial<Parameters<typeof PermissionModal>[0]> = {}) {
  return createElement(PermissionModal, {
    open: true,
    title: '프로그램 신청 승인 안내',
    variant: 'approve',
    onCancel: () => {},
    onConfirm: () => {},
    ...extra,
  })
}

describe('PermissionModal — 발표일 경과 시 「발표일에 맞춰서」 비활성', () => {
  it('Provider 발표일이 지났으면 비활성', () => {
    render(withAnnouncement(PASSED, permissionModal()))
    expect(announcementRadio().disabled).toBe(true)
  })

  it('Provider 발표일이 남았으면 선택 가능', () => {
    render(withAnnouncement(FUTURE, permissionModal()))
    expect(announcementRadio().disabled).toBe(false)
  })

  it('발표일 미설정(null)·Provider 없음은 기존처럼 선택 가능', () => {
    render(withAnnouncement(null, permissionModal()))
    expect(announcementRadio().disabled).toBe(false)
    cleanup()
    render(permissionModal())
    expect(announcementRadio().disabled).toBe(false)
  })

  it('announcementAt prop이 Provider보다 우선한다', () => {
    render(withAnnouncement(FUTURE, permissionModal({ announcementAt: PASSED })))
    expect(announcementRadio().disabled).toBe(true)
  })

  it('골라 둔 상태에서 발표일이 지나면 즉시로 되돌린다', () => {
    const { rerender } = render(withAnnouncement(FUTURE, permissionModal()))
    fireEvent.click(announcementRadio())
    expect(announcementRadio().checked).toBe(true)
    rerender(withAnnouncement(PASSED, permissionModal()))
    expect(announcementRadio().checked).toBe(false)
    expect((screen.getByRole('radio', { name: '즉시' }) as HTMLInputElement).checked).toBe(true)
  })
})

describe('강사비 책정 및 승인 팝업 — 같은 규칙', () => {
  function feeModal() {
    return createElement(InstructorFeeApprovalModal, {
      open: true,
      onCancel: () => {},
      onConfirm: () => {},
      instructorName: '김제이',
      notifyTimingCapability: NOTIFY_TIMING_CAPABILITY.full,
    })
  }

  it('강사 모집 발표일이 지났으면 비활성, 남았으면 선택 가능', () => {
    render(withAnnouncement(PASSED, feeModal()))
    expect(announcementRadio().disabled).toBe(true)
    cleanup()
    render(withAnnouncement(FUTURE, feeModal()))
    expect(announcementRadio().disabled).toBe(false)
  })
})

describe('UJAT 봉사자 2차 면접 일괄 합격 팝업 — 같은 규칙', () => {
  function bulkPassModal() {
    return createElement(UjatVolunteerInterview2BulkPassModal, {
      open: true,
      subjectName: '김제이',
      count: 2,
      onCancel: () => {},
      onConfirm: () => {},
    })
  }

  it('봉사자 모집 발표일이 지났으면 비활성, 남았으면 선택 가능', () => {
    render(withAnnouncement(PASSED, bulkPassModal()))
    expect(announcementRadio().disabled).toBe(true)
    cleanup()
    render(withAnnouncement(FUTURE, bulkPassModal()))
    expect(announcementRadio().disabled).toBe(false)
  })
})
