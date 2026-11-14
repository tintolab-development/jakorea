/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('@/features/auth/identity-verification', () => ({
  useFindPasswordIdentityVerification: (options: { onSuccess: IdentitySuccess }) => {
    identity.onSuccess = options.onSuccess
    return { verify: vi.fn(), isVerifying: false, errorMessage: null, resetError: vi.fn() }
  },
}))

vi.mock('@/features/auth/api/find-password-service', () => ({
  FIND_PASSWORD_VERIFICATION_TTL_MS: 600_000,
  verifyFindPasswordEmail: vi.fn(),
  changePasswordAfterReset: vi.fn(),
  verifyPasswordResetEligibility: vi.fn(async () => ({ kind: 'not_eligible' })),
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
