// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY } from '../src/features/auth/session/auth-restore-notice-display'
import { isPasswordRecentlyUsedApiError } from '../src/features/auth/sign-in/lib/get-login-api-error-message'
import { resolveSettlementWriteValidationAlert } from '../src/features/mypage/education/settlements/lib/validate-write-draft'
import {
  ISSUANCE_PERIOD_EXPIRED_MESSAGE,
  isCertificateIssuancePeriodExpiredMessage,
} from '../src/features/mypage/education/applications/lib/certificate-reason-messages'
import {
  NETWORK_ERROR_ALERT_CONTENT,
  NETWORK_ERROR_ALERT_TITLE,
} from '../src/shared/lib/network-error-message'
import {
  PLATFORM_ALERT_COPY,
  PLATFORM_REQUIRED_NOT_FILLED_TITLE,
} from '../src/shared/lib/platform-alert-copy'
import { PFAlertModal } from '../src/shared/ui/pf-alert-modal'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function axiosErr(status: number, data: unknown) {
  return new AxiosError('Request failed', undefined, undefined, undefined, {
    status,
    data,
    statusText: 'Error',
    headers: {},
    config: {} as never,
  })
}

describe('Platform 공통 팝업 문구 (사용자 플랫폼 14491-2533)', () => {
  it('자동 로그아웃 안내는 시안 문구를 쓴다', () => {
    expect(PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY.sessionEndedTitle).toBe('자동으로 로그아웃되었어요.')
    expect(PLATFORM_AUTH_RESTORE_NOTICE_DISPLAY.sessionEndedBody).toBe(
      '보안을 위해 로그인 세션이 종료되었어요.\n계속 이용하시려면 다시 로그인해 주세요.',
    )
  })

  it('네트워크 오류 안내는 Platform 시안 문구를 쓴다(CMS 문구와 별개)', () => {
    expect(NETWORK_ERROR_ALERT_TITLE).toBe('일시적인 네트워크 오류가 발생했어요.')
    expect(NETWORK_ERROR_ALERT_CONTENT).toBe('잠시 후 다시 시도해 주세요.')
  })

  it('정산 필수 항목 미입력 팝업 제목은 시안 문구다', () => {
    expect(resolveSettlementWriteValidationAlert('required_incomplete').title).toBe(
      PLATFORM_REQUIRED_NOT_FILLED_TITLE,
    )
    expect(PLATFORM_REQUIRED_NOT_FILLED_TITLE).toBe('입력하지 않은 필수 항목이 있어요.')
  })

  it('수료증 발급 기한 만료 안내를 알아본다', () => {
    expect(isCertificateIssuancePeriodExpiredMessage(ISSUANCE_PERIOD_EXPIRED_MESSAGE)).toBe(true)
    expect(isCertificateIssuancePeriodExpiredMessage('이미 발급된 증명서입니다.')).toBe(false)
    expect(isCertificateIssuancePeriodExpiredMessage(null)).toBe(false)
  })

  it('최근 사용한 비밀번호 오류 코드를 알아본다', () => {
    expect(
      isPasswordRecentlyUsedApiError(
        axiosErr(400, { error: { code: 'PASSWORD_RECENTLY_USED', message: '최근에 사용한 비밀번호…' } }),
      ),
    ).toBe(true)
    expect(isPasswordRecentlyUsedApiError(axiosErr(400, { error: { code: 'VALIDATION_FAILED' } }))).toBe(
      false,
    )
    expect(isPasswordRecentlyUsedApiError(new Error('x'))).toBe(false)
  })
})

describe('PFAlertModal 보조 버튼 — 중복 가입 팝업 [확인] + [로그인하기]', () => {
  let root: Root | null = null

  afterEach(() => {
    act(() => root?.unmount())
    root = null
    document.body.innerHTML = ''
  })

  it('보조 버튼과 확인 버튼을 함께 그리고 각각의 동작을 부른다', () => {
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    act(() => {
      root?.render(
        <PFAlertModal
          open
          title={PLATFORM_ALERT_COPY.duplicateMember.title}
          description={PLATFORM_ALERT_COPY.duplicateMember.description}
          cancelLabel="확인"
          onCancel={onCancel}
          confirmLabel="로그인하기"
          confirmVariant="primary"
          onConfirm={onConfirm}
        />,
      )
    })

    const buttons = [...document.querySelectorAll('[role="alertdialog"] button')]
    expect(buttons.map(button => button.textContent)).toEqual(['확인', '로그인하기'])
    expect(document.body.textContent).toContain('이미 가입된 회원이에요.')

    act(() => (buttons[0] as HTMLButtonElement).click())
    act(() => (buttons[1] as HTMLButtonElement).click())
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
