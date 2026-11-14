/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// antd Grid 반응형 훅용 jsdom 폴리필
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}

type IdentitySuccess = (result: { sessionId: number; profileToken?: string }) => void

const identity = vi.hoisted(() => ({ onSuccess: null as IdentitySuccess | null }))
const post = vi.hoisted(() => vi.fn())
const showGlobalApiErrorAlert = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api', () => ({ axiosClient: { post } }))
vi.mock('@/shared/lib/show-global-api-error-alert', () => ({ showGlobalApiErrorAlert }))
vi.mock('@/features/auth/identity-verification', () => ({
  usePasswordChangeRequiredIdentityVerification: (options: { onSuccess: IdentitySuccess }) => {
    identity.onSuccess = options.onSuccess
    return { verify: vi.fn(), status: 'idle', isVerifying: false, errorMessage: null }
  },
}))

import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'
import { PasswordChangeRequiredIdentityPage } from './password-change-required-identity-page'

function verifiedByOtherError() {
  return {
    isAxiosError: true,
    response: {
      status: 409,
      data: {
        success: false,
        error: { code: 'ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER', message: '서버 기본 문구' },
      },
    },
  }
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={[passwordChangeRequiredPaths.identity]}>
      <Routes>
        <Route path={passwordChangeRequiredPaths.identity} element={<PasswordChangeRequiredIdentityPage />} />
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route path={passwordChangeRequiredPaths.changePassword} element={<div>비밀번호 변경</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function confirmWithVerifiedByOther() {
  post.mockRejectedValueOnce(verifiedByOtherError())
  await act(async () => {
    identity.onSuccess?.({ sessionId: 1, profileToken: 'profile-token' })
  })
  await screen.findByText('중복 가입 안내')
}

describe('PasswordChangeRequiredIdentityPage — 409 ADMIN_IDENTITY_ALREADY_VERIFIED_BY_OTHER', () => {
  const initialState = useAuthStore.getState()
  const logout = vi.fn()

  beforeEach(() => {
    post.mockReset()
    logout.mockReset()
    showGlobalApiErrorAlert.mockReset()
    vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
    useAuthStore.setState({
      isAuthenticated: true,
      passwordChangeRequired: true,
      identityVerificationRequired: true,
      user: { email: 'admin@jakorea.org', role: 'ADMIN' } as ReturnType<
        typeof useAuthStore.getState
      >['user'],
      logout,
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    useAuthStore.setState(initialState, true)
  })

  it('「중복 가입 안내」 팝업만 한 번 띄운다(전역 오류 알럿·다른 알럿 없음)', async () => {
    renderPage()
    await confirmWithVerifiedByOther()

    expect(screen.getAllByText('중복 가입 안내')).toHaveLength(1)
    // 본문 두 줄은 한 문단 안에서 줄바꿈으로 나뉜다
    const body = document.querySelector('.confirm-modal__content')
    expect(body?.querySelectorAll('br')).toHaveLength(1)
    expect(body?.textContent).toBe(
      '본인인증한 정보로 가입된 계정이 있습니다.가입한 이메일로 로그인하거나, 이메일 찾기를 이용해 주세요.'
    )
    expect(showGlobalApiErrorAlert).not.toHaveBeenCalled()
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(post).toHaveBeenCalledWith(
      '/api/admin/auth/identity/confirm',
      { identityVerificationSessionId: 1, profileToken: 'profile-token' },
      expect.objectContaining({ skipGlobalErrorAlert: true })
    )
  })

  it('[확인]은 팝업만 닫고 본인인증 단계에 머문다', async () => {
    renderPage()
    await confirmWithVerifiedByOther()

    fireEvent.click(screen.getByRole('button', { name: '확인' }))

    expect(logout).not.toHaveBeenCalled()
    expect(screen.queryByText('로그인 페이지')).toBeNull()
    expect(screen.queryByText('비밀번호 변경')).toBeNull()
    expect(screen.getByText('본인인증을 진행해 주세요.')).toBeTruthy()
  })

  it('[로그인 하기]는 로그아웃한 뒤 로그인 화면으로 이동한다', async () => {
    renderPage()
    await confirmWithVerifiedByOther()

    fireEvent.click(screen.getByRole('button', { name: '로그인 하기' }))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('로그인 페이지')).toBeTruthy()
  })
})
