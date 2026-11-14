/**
 * @vitest-environment jsdom
 */
/**
 * 세션 종료 확인 흐름 — 지금 화면에서 「로그인이 종료되었어요.」를 띄우고 [확인]·닫기 때 한 번만 로그아웃한다.
 */
import { createElement } from 'react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { CmsAlertModalProvider } from '@/shared/ui/cms-alert-modal-provider'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  confirmSessionEnded,
  isSessionEndConfirmPending,
  resetSessionEndConfirmForTest,
} from './session-ended-confirm'
import { SESSION_ENDED_NOTICE, SESSION_ENDED_NOTICE_STORAGE_KEY } from './session-restore-notice'

vi.mock('@/shared/ui/alert-modal', async () => {
  const react = await import('react')
  return {
    AlertModal: (props: {
      open: boolean
      title: string
      content: string
      onClose: () => void
      onConfirm?: () => void
    }) =>
      props.open
        ? react.createElement(
            'div',
            { 'data-testid': 'cms-alert' },
            react.createElement('p', { 'data-testid': 'cms-alert-title' }, props.title),
            react.createElement(
              'button',
              { type: 'button', onClick: () => { props.onConfirm?.(); props.onClose() } },
              '확인'
            ),
            react.createElement('button', { type: 'button', onClick: () => props.onClose() }, '닫기X')
          )
        : null,
  }
})

describe('confirmSessionEnded', () => {
  beforeEach(() => {
    resetSessionEndConfirmForTest()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    resetSessionEndConfirmForTest()
  })

  it('안내를 띄운 채 기다리다가 [확인]을 누르면 그때 한 번 로그아웃한다', () => {
    render(createElement(CmsAlertModalProvider, null, createElement('main', null, '현재 화면')))
    const endSession = vi.fn()

    act(() => confirmSessionEnded(endSession))

    expect(screen.getByTestId('cms-alert-title')).toHaveTextContent(SESSION_ENDED_NOTICE.title)
    expect(screen.getByText('현재 화면')).toBeInTheDocument()
    expect(endSession).not.toHaveBeenCalled()
    expect(isSessionEndConfirmPending()).toBe(true)

    fireEvent.click(screen.getByText('확인'))
    expect(endSession).toHaveBeenCalledTimes(1)
    expect(isSessionEndConfirmPending()).toBe(false)
    expect(screen.queryByTestId('cms-alert')).not.toBeInTheDocument()
  })

  it('X(닫기)로 닫아도 한 번 로그아웃한다', () => {
    render(createElement(CmsAlertModalProvider, null, null))
    const endSession = vi.fn()
    act(() => confirmSessionEnded(endSession))

    fireEvent.click(screen.getByText('닫기X'))
    expect(endSession).toHaveBeenCalledTimes(1)
  })

  it('여러 경로에서 동시에 알려도 안내는 하나, 로그아웃도 한 번이다', () => {
    render(createElement(CmsAlertModalProvider, null, null))
    const first = vi.fn()
    const second = vi.fn()
    act(() => {
      confirmSessionEnded(first)
      confirmSessionEnded(second)
    })
    expect(screen.getAllByTestId('cms-alert')).toHaveLength(1)

    fireEvent.click(screen.getByText('확인'))
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })

  it('안내가 떠 있는 동안 다른 Alert로 덮이거나 밖에서 닫히지 않는다', () => {
    render(createElement(CmsAlertModalProvider, null, null))
    const endSession = vi.fn()
    act(() => confirmSessionEnded(endSession))

    act(() => {
      cmsAlertModal.show({ title: '다른 오류', content: '서버 오류' })
      cmsAlertModal.close()
    })
    expect(screen.getByTestId('cms-alert-title')).toHaveTextContent(SESSION_ENDED_NOTICE.title)
    expect(endSession).not.toHaveBeenCalled()
  })

  it('공통 Alert를 쓸 수 없으면 로그인 화면 안내 표시를 남기고 바로 로그아웃한다', () => {
    const endSession = vi.fn()
    confirmSessionEnded(endSession)
    expect(endSession).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(SESSION_ENDED_NOTICE_STORAGE_KEY)).toBe('1')
    expect(isSessionEndConfirmPending()).toBe(false)
  })
})
