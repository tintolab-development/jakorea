/**
 * @vitest-environment jsdom
 */
import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import {
  ADMIN_ACCESS_DENIED_ALERT_CONTENT,
  ADMIN_ACCESS_DENIED_ALERT_TITLE,
} from '@/shared/lib/admin-role-policy'
import {
  CmsAlertModalProvider,
  useCmsAlert,
} from './cms-alert-modal-provider'

vi.mock('./alert-modal', async () => {
  const react = await import('react')
  return {
    AlertModal: (props: {
      open: boolean
      title: string
      content: string
      onClose: () => void
    }) =>
      props.open
        ? react.createElement(
            'div',
            { 'data-testid': 'cms-alert' },
            react.createElement('p', { 'data-testid': 'cms-alert-title' }, props.title),
            react.createElement('p', { 'data-testid': 'cms-alert-content' }, props.content),
            react.createElement(
              'button',
              { type: 'button', onClick: props.onClose },
              '확인'
            )
          )
        : null,
  }
})

function Probe({ children }: { children?: ReactNode }) {
  const { showAlert } = useCmsAlert()
  return createElement(
    'div',
    null,
    createElement(
      'button',
      {
        type: 'button',
        onClick: () =>
          showAlert({
            title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
            content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
          }),
      },
      'open-denied'
    ),
    createElement(
      'button',
      {
        type: 'button',
        onClick: () => showAlert({ title: '안내', content: '서버 권한 메시지' }),
      },
      'open-other'
    ),
    children
  )
}

describe('CmsAlertModalProvider 권한 안내 중복', () => {
  afterEach(cleanup)

  it('권한 안내가 열려 있으면 후속 showAlert를 무시한다', () => {
    render(createElement(CmsAlertModalProvider, null, createElement(Probe)))

    fireEvent.click(screen.getByText('open-denied'))
    expect(screen.getByTestId('cms-alert-title')).toHaveTextContent(ADMIN_ACCESS_DENIED_ALERT_TITLE)
    expect(screen.getByTestId('cms-alert-content')).toHaveTextContent(
      '해당 화면은 권한이 있는 사용자만 이용할 수 있습니다.'
    )

    fireEvent.click(screen.getByText('open-other'))
    expect(screen.getByTestId('cms-alert-title')).toHaveTextContent(ADMIN_ACCESS_DENIED_ALERT_TITLE)
    expect(screen.queryByText('서버 권한 메시지')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('cms-alert')).toHaveLength(1)
  })

  it('같은 권한 안내를 다시 열어도 모달은 하나다', () => {
    render(createElement(CmsAlertModalProvider, null, createElement(Probe)))

    fireEvent.click(screen.getByText('open-denied'))
    fireEvent.click(screen.getByText('open-denied'))

    expect(screen.getAllByTestId('cms-alert')).toHaveLength(1)
  })

  it('닫은 뒤에는 다른 Alert를 열 수 있다', () => {
    render(createElement(CmsAlertModalProvider, null, createElement(Probe)))

    fireEvent.click(screen.getByText('open-denied'))
    fireEvent.click(screen.getByText('확인'))
    fireEvent.click(screen.getByText('open-other'))

    expect(screen.getByTestId('cms-alert-title')).toHaveTextContent('안내')
    expect(screen.getByTestId('cms-alert-content')).toHaveTextContent('서버 권한 메시지')
  })
})
