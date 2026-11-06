/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SESSION_POLICY_DISPLAY } from '@jakorea/domain/session'

const hookState = vi.hoisted(() => ({
  showWarning: true,
  warningKind: 'idle' as 'idle' | 'absolute' | null,
  countdown: 299,
  extendError: null as string | null,
  extending: false,
  dismissWarning: vi.fn(),
  extendIdleSession: vi.fn(),
  logout: vi.fn(),
}))

vi.mock('../hooks/use-session-timeout', () => ({
  useSessionTimeout: () => hookState,
}))

vi.mock('@/shared/ui', () => ({
  CmsButton: ({
    children,
    onClick,
    variant,
  }: {
    children: React.ReactNode
    onClick?: () => void
    variant?: string
  }) => (
    <button type="button" data-variant={variant} onClick={onClick}>
      {children}
    </button>
  ),
  ContentModal: ({
    title,
    footer,
    children,
    onCancel,
    width,
    titlePrefix,
  }: {
    title: string
    width?: number
    titlePrefix?: React.ReactNode
    footer: React.ReactNode
    children: React.ReactNode
    onCancel: () => void
  }) => (
    <div data-testid="content-modal" data-width={width}>
      {titlePrefix ? <span data-testid="title-prefix">{titlePrefix}</span> : null}
      <h1>{title}</h1>
      <button type="button" aria-label="close" onClick={onCancel}>
        x
      </button>
      {children}
      <div>{footer}</div>
    </div>
  ),
}))

import { SessionWarningModal } from './session-warning-modal'

describe('session warning modal copy', () => {
  afterEach(() => {
    cleanup()
  })

  it('FE17 CMS 유휴 모달에 로그아웃·로그인 연장이 있다', () => {
    hookState.warningKind = 'idle'
    render(<SessionWarningModal />)
    expect(screen.getByText(SESSION_POLICY_DISPLAY.idleTitle)).toBeTruthy()
    expect(screen.getByText(SESSION_POLICY_DISPLAY.idleLogoutLabel)).toBeTruthy()
    expect(screen.getByText(SESSION_POLICY_DISPLAY.idleExtendLabel)).toBeTruthy()
  })

  it('시안 카피: 제목·유휴 본문(5분 고정, 카운트다운 미표시)', () => {
    hookState.warningKind = 'idle'
    hookState.countdown = 123
    render(<SessionWarningModal />)
    expect(screen.getByText('로그인 종료 예정 안내')).toBeTruthy()
    expect(document.querySelector('.session-warning-modal__body')?.textContent).toBe(
      '장시간 이용하지 않아 5분 후 자동으로 로그아웃됩니다.\n계속 이용하시려면 [로그인 연장]을 눌러 주세요.'
    )
    expect(screen.queryByText(/2분 03초/)).toBeNull()
  })

  it('시안 카피: 절대 본문(5분 고정)', () => {
    hookState.warningKind = 'absolute'
    render(<SessionWarningModal />)
    expect(screen.getByText('로그인 종료 예정 안내')).toBeTruthy()
    expect(document.querySelector('.session-warning-modal__body')?.textContent).toBe(
      '5분 후 로그인 유지 시간이 종료되어 자동으로 로그아웃됩니다.\n계속 이용하시려면 로그아웃된 후 다시 로그인해 주세요.'
    )
  })

  it('시안 UI: 폭 600 · 경고 아이콘 없음 · 절대 확인은 secondary', () => {
    hookState.warningKind = 'absolute'
    render(<SessionWarningModal />)
    expect(screen.getByTestId('content-modal').getAttribute('data-width')).toBe('600')
    expect(screen.queryByTestId('title-prefix')).toBeNull()
    expect(
      screen.getByText(SESSION_POLICY_DISPLAY.absoluteConfirmLabel).getAttribute('data-variant')
    ).toBe('secondary')
  })

  it('FE19 CMS 절대 만료 모달은 확인만 제공한다', () => {
    hookState.warningKind = 'absolute'
    render(<SessionWarningModal />)
    expect(screen.getByText(SESSION_POLICY_DISPLAY.absoluteTitle)).toBeTruthy()
    expect(screen.getByText(SESSION_POLICY_DISPLAY.absoluteConfirmLabel)).toBeTruthy()
    expect(screen.queryByText(SESSION_POLICY_DISPLAY.idleExtendLabel)).toBeNull()
  })

  it('FE21 X 클릭은 dismiss만 하고 연장 함수를 호출하지 않는다', () => {
    hookState.warningKind = 'idle'
    hookState.dismissWarning.mockClear()
    hookState.extendIdleSession.mockClear()
    render(<SessionWarningModal />)
    screen.getByLabelText('close').click()
    expect(hookState.dismissWarning).toHaveBeenCalledTimes(1)
    expect(hookState.extendIdleSession).not.toHaveBeenCalled()
  })
})
