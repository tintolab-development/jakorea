/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// antd Form(Grid) 반응형 훅용 jsdom 폴리필
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
const service = vi.hoisted(() => ({
  eligibility: vi.fn(),
  change: vi.fn(),
}))

vi.mock('@/features/auth/identity-verification', () => ({
  useFindPasswordIdentityVerification: (options: { onSuccess: IdentitySuccess }) => {
    identity.onSuccess = options.onSuccess
    return { verify: vi.fn(), isVerifying: false, errorMessage: null, resetError: vi.fn() }
  },
}))

vi.mock('@/features/auth/api/find-password-service', () => ({
  FIND_PASSWORD_VERIFICATION_TTL_MS: 600_000,
  verifyFindPasswordEmail: vi.fn(),
  changePasswordAfterReset: service.change,
  verifyPasswordResetEligibility: service.eligibility,
}))

import { FindPasswordPage } from './find-password-page'

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/find-password']}>
      <Routes>
        <Route path="/find-password" element={<FindPasswordPage />} />
        <Route path="/find-email" element={<div>이메일 찾기 페이지</div>} />
        <Route path="/login" element={<div>로그인 페이지</div>} />
      </Routes>
    </MemoryRouter>
  )
}

async function showNotFoundView() {
  await act(async () => {
    identity.onSuccess?.({ sessionId: 1, profileToken: 'profile-token' })
  })
  await screen.findByText('일치하는 가입 정보가 없습니다.')
}

describe('FindPasswordPage — 가입 정보 없음', () => {
  beforeEach(() => {
    service.eligibility.mockReset()
    service.eligibility.mockResolvedValue({ kind: 'not_eligible' })
  })

  afterEach(() => {
    cleanup()
  })

  it('[이메일 다시 찾기]를 누르면 이메일 찾기 페이지(/find-email)로 이동한다', async () => {
    renderPage()
    await showNotFoundView()

    fireEvent.click(screen.getByRole('button', { name: '이메일 다시 찾기' }))

    expect(await screen.findByText('이메일 찾기 페이지')).toBeTruthy()
  })

  it('[로그인 화면 돌아가기]는 기존처럼 로그인 화면으로 이동한다', async () => {
    renderPage()
    await showNotFoundView()

    fireEvent.click(screen.getByRole('button', { name: '로그인 화면 돌아가기' }))

    expect(await screen.findByText('로그인 페이지')).toBeTruthy()
  })
})

describe('FindPasswordPage — 비밀번호 재설정 오류 코드(BE 회신 2026-11-14)', () => {
  beforeEach(() => {
    service.eligibility.mockReset()
    service.change.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  async function verifyIdentity() {
    await act(async () => {
      identity.onSuccess?.({ sessionId: 1, profileToken: 'profile-token' })
    })
  }

  async function submitNewPassword() {
    await screen.findByText('새 비밀번호를 입력해 주세요.')
    fireEvent.change(screen.getByPlaceholderText('새 비밀번호를 입력해 주세요'), {
      target: { value: 'Abcdefgh123!' },
    })
    fireEvent.change(screen.getByPlaceholderText('비밀번호를 한 번 더 입력해 주세요'), {
      target: { value: 'Abcdefgh123!' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '비밀번호 변경하기' }))
    })
  }

  it('계정 확인 401 PASSWORD_RESET_ACCOUNT_MISMATCH — 이메일 입력 단계의 이메일 칸에 서버 문구', async () => {
    service.eligibility.mockResolvedValueOnce({ kind: 'account_mismatch', message: '서버 문구: 계정 불일치' })
    renderPage()
    await verifyIdentity()

    expect(await screen.findByText('서버 문구: 계정 불일치')).toBeTruthy()
    expect(screen.getByPlaceholderText('이메일을 입력해 주세요')).toBeTruthy()
  })

  it('재설정 401 PASSWORD_RESET_CONFIRM_MISMATCH — 확인값 칸에 오류', async () => {
    service.eligibility.mockResolvedValueOnce({ kind: 'eligible' })
    service.change.mockResolvedValueOnce({ kind: 'confirm_mismatch' })
    renderPage()
    await verifyIdentity()
    await submitNewPassword()

    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeTruthy()
    expect(screen.getByText('새 비밀번호를 입력해 주세요.')).toBeTruthy()
  })

  it('재설정 401 PASSWORD_RESET_ACCOUNT_MISMATCH — 이메일 입력 단계로 돌아가 이메일 칸에 서버 문구', async () => {
    service.eligibility.mockResolvedValueOnce({ kind: 'eligible' })
    service.change.mockResolvedValueOnce({ kind: 'account_mismatch', message: '서버 문구: 계정 불일치' })
    renderPage()
    await verifyIdentity()
    await submitNewPassword()

    expect(await screen.findByText('서버 문구: 계정 불일치')).toBeTruthy()
    expect(screen.getByPlaceholderText('이메일을 입력해 주세요')).toBeTruthy()
    expect(screen.queryByText('새 비밀번호를 입력해 주세요.')).toBeNull()
  })

  it('재설정 401 IDENTITY_VERIFICATION_SESSION_REQUIRED — 본인인증부터 다시(이메일 입력 단계)', async () => {
    service.eligibility.mockResolvedValueOnce({ kind: 'eligible' })
    service.change.mockResolvedValueOnce({ kind: 'identity_required' })
    renderPage()
    await verifyIdentity()
    await submitNewPassword()

    expect(await screen.findByPlaceholderText('이메일을 입력해 주세요')).toBeTruthy()
    expect(screen.queryByText('새 비밀번호를 입력해 주세요.')).toBeNull()
  })
})
