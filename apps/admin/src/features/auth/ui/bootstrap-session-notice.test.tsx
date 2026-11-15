/** @vitest-environment jsdom */
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mounted: { root: Root; container: HTMLDivElement }[] = []
function render(node: ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mounted.push({ root, container })
  act(() => { root.render(node) })
}
function cleanup() {
  for (const { root, container } of mounted.splice(0)) {
    act(() => { root.unmount() })
    container.remove()
  }
}
function hasText(text: string): boolean {
  return (document.body.textContent ?? '').includes(text)
}
function buttonNamed(label: string): HTMLButtonElement {
  const button = Array.from(document.body.querySelectorAll('button')).find(
    el => (el.textContent ?? '').replace(/\s/g, '') === label.replace(/\s/g, '')
  )
  if (!button) throw new Error(`button not found: ${label}`)
  return button as HTMLButtonElement
}

const showAlert = vi.fn()
vi.mock('@/shared/ui/cms-alert-modal-provider', () => ({
  useCmsAlert: () => ({ showAlert, closeAlert: vi.fn() }),
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { BootstrapSessionNotice } from './bootstrap-session-notice'

const original = useAuthStore.getState()
const retryBootstrapRestore = vi.fn(async () => {})
const dismissBootstrapUnreachable = vi.fn()

describe('QA-0137 새로고침 복원 실패 안내 UI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({
      bootstrapNotice: null,
      bootstrapRetrying: false,
      retryBootstrapRestore,
      dismissBootstrapUnreachable,
    })
  })

  afterEach(() => {
    cleanup()
    useAuthStore.setState({
      bootstrapNotice: null,
      retryBootstrapRestore: original.retryBootstrapRestore,
      dismissBootstrapUnreachable: original.dismissBootstrapUnreachable,
    })
  })

  it('안내가 없으면 아무것도 띄우지 않는다', () => {
    render(<BootstrapSessionNotice />)
    expect(hasText('네트워크 오류 안내')).toBe(false)
    expect(showAlert).not.toHaveBeenCalled()
  })

  it('session-ended는 공통 Alert 모달([확인])로 한 번 띄우고 안내 상태를 비운다', () => {
    useAuthStore.setState({ bootstrapNotice: 'session-ended' })
    render(<BootstrapSessionNotice />)
    expect(showAlert).toHaveBeenCalledTimes(1)
    expect(showAlert).toHaveBeenCalledWith({
      title: '자동 로그아웃 안내',
      content: '보안을 위해 로그인 세션이 종료되었습니다.\n계속 이용하시려면 다시 로그인해 주세요.',
      confirmLabel: '확인',
    })
    expect(useAuthStore.getState().bootstrapNotice).toBeNull()
  })

  it('unreachable은 시안 「네트워크 오류 안내」 [확인] Alert를 띄우고 확인하면 로그인 화면으로 보낸다', async () => {
    useAuthStore.setState({ bootstrapNotice: 'unreachable' })
    render(<BootstrapSessionNotice />)
    expect(hasText('네트워크 오류 안내')).toBe(true)
    expect(hasText('일시적인 네트워크 오류가 발생하였습니다.')).toBe(true)
    expect(
      Array.from(document.querySelectorAll('button')).some(b => b.textContent?.trim() === '다시 시도')
    ).toBe(false)

    await act(async () => {
      buttonNamed('확인').click()
    })
    expect(dismissBootstrapUnreachable).toHaveBeenCalled()
    expect(retryBootstrapRestore).not.toHaveBeenCalled()
  })
})
