/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Notification } from '../api/notification-service'

vi.mock('@/shared/ui', () => ({
  CmsButton: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}))

vi.mock('@/shared/ui/content-modal', () => ({
  ContentModal: ({
    open,
    title,
    footer,
    children,
  }: {
    open: boolean
    title: string
    footer: React.ReactNode
    children: React.ReactNode
  }) =>
    open ? (
      <div data-testid="content-modal">
        <h1>{title}</h1>
        <div data-testid="modal-body">{children}</div>
        <div>{footer}</div>
      </div>
    ) : null,
}))

import { NotificationDetailModal } from './notification-detail-modal'

function notification(overrides: Partial<Notification>): Notification {
  return {
    id: '1',
    type: 'inquiry',
    title: '',
    body: '',
    read: true,
    createdAt: '2026-11-15T09:00:00+09:00',
    ...overrides,
  }
}

function renderModal(item: Notification) {
  render(<NotificationDetailModal notification={item} onClose={() => {}} onNavigate={() => {}} />)
  return screen.getByTestId('modal-body')
}

describe('NotificationDetailModal — 서버 title·message·programName 그대로 (BE 2026-11-15 계약)', () => {
  afterEach(() => {
    cleanup()
  })

  it('프로그램 미선택 문의: programName이 없으면 [프로그램명] 줄을 그리지 않는다', () => {
    const body = renderModal(
      notification({
        title: '신규 문의 접수',
        body: '김회원님이 문의를 등록하였습니다.\n문의 내용을 확인 후 답변해 주세요.',
        target: { eventType: 'ADMIN_INQUIRY_CREATED_UNASSIGNED', linkType: 'INQUIRY', linkId: '9' },
      })
    )
    expect(screen.getByRole('heading').textContent).toBe('신규 문의 접수')
    expect(body.querySelector('.notification-detail-modal__program')).toBeNull()
    expect(body.textContent).not.toContain('일반 문의')
    expect(body.querySelector('.notification-detail-modal__body')?.textContent).toBe(
      '김회원님이 문의를 등록하였습니다.\n문의 내용을 확인 후 답변해 주세요.'
    )
  })

  it('프로그램 선택 문의: [programName]을 본문과 별도로 한 번만 그린다', () => {
    const body = renderModal(
      notification({
        title: '신규 문의 접수',
        body: '김회원님이 문의를 등록하였습니다.\n문의 내용을 확인 후 답변해 주세요.',
        programName: '경제교육 기본 과정',
        target: {
          eventType: 'ADMIN_INQUIRY_CREATED',
          linkType: 'INQUIRY',
          linkId: '9',
          programId: '120',
        },
      })
    )
    expect(body.querySelectorAll('.notification-detail-modal__program')).toHaveLength(1)
    expect(body.querySelector('.notification-detail-modal__program')?.textContent).toBe(
      '[경제교육 기본 과정]'
    )
    expect(body.textContent?.split('경제교육 기본 과정')).toHaveLength(2)
  })

  it('강사비 정정 요청: [프로그램명]이 두 번 나오지 않는다', () => {
    const body = renderModal(
      notification({
        type: 'settlement',
        title: '강사비 정정 요청',
        body: '김강사님이 2회차 강사비의 지급 정정을 요청하였습니다.\n정정 요청 내용을 확인해 주세요.',
        programName: '강사 양성 과정',
        target: {
          eventType: 'ADMIN_PAYMENT_STATEMENT_CORRECTION_REQUESTED',
          linkType: 'SETTLEMENT',
          linkId: '5',
          programId: '10',
        },
      })
    )
    expect(body.textContent?.split('강사 양성 과정')).toHaveLength(2)
    expect(screen.getByRole('button', { name: '정정 요청 확인' })).toBeTruthy()
  })
})
