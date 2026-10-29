import type { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getMemberDeleteCurrentPasswordInvalidAlertOptions } from '@/features/user/api/get-member-api-error'
import {
  ADMIN_ACCESS_DENIED_ALERT_CONTENT,
  ADMIN_ACCESS_DENIED_ALERT_TITLE,
} from '@/shared/lib/admin-role-policy'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  clearForbiddenApiErrorAlertDedupe,
  isGlobalApiErrorAlertShown,
  showGlobalApiErrorAlert,
} from './show-global-api-error-alert'

const onboarding = vi.hoisted(() => ({ incomplete: false }))

vi.mock('@/shared/utils/post-auth-redirect', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/utils/post-auth-redirect')>()
  return {
    ...actual,
    isAdminFirstLoginOnboardingIncomplete: () => onboarding.incomplete,
  }
})

function forbiddenError(
  url: string,
  message = '현재 계정에 필요한 권한 또는 접근 범위가 없습니다.'
): AxiosError {
  return {
    isAxiosError: true,
    message,
    name: 'AxiosError',
    toJSON: () => ({}),
    response: {
      status: 403,
      data: {
        success: false,
        error: { code: 'PERMISSION_DENIED', message },
      },
    },
    config: { method: 'get', url },
  } as AxiosError
}

function conflictError(url: string): AxiosError {
  return {
    isAxiosError: true,
    message: 'CONFLICT',
    name: 'AxiosError',
    toJSON: () => ({}),
    response: {
      status: 409,
      data: { message: 'CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS' },
    },
    config: { method: 'post', url },
  } as AxiosError
}

describe('showGlobalApiErrorAlert 403', () => {
  beforeEach(() => {
    onboarding.incomplete = false
    vi.restoreAllMocks()
    clearForbiddenApiErrorAlertDedupe()
    vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
  })

  it('운영 기간 오류는 서버 공통 문구 대신 기간 안내를 한 번만 띄운다', () => {
    const error = {
      isAxiosError: true,
      message: '입력값을 확인해 주세요.',
      name: 'AxiosError',
      toJSON: () => ({}),
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'PROGRAM_DATE_OUTSIDE_OPEN_PERIOD',
            message: '입력값을 확인해 주세요.',
            field: 'recruitments.INSTRUCTOR.operationStartDate',
            details: {
              date: '2026-10-01',
              openStart: '2026-10-03',
              openEnd: '2026-11-30',
            },
          },
        },
      },
      config: { method: 'post', url: '/api/admin/programs' },
    } as AxiosError

    expect(showGlobalApiErrorAlert(error)).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '운영 기간을 확인해 주세요',
      content: expect.stringContaining('강사의 운영 시작일'),
    })
    expect(isGlobalApiErrorAlertShown(error)).toBe(true)
    expect(showGlobalApiErrorAlert(error)).toBe(false)
  })

  it('서버 메시지 대신 권한 안내 고정 카피를 띄운다', () => {
    const error = forbiddenError('/api/admin/members/all')
    const shown = showGlobalApiErrorAlert(error)

    expect(shown).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: ADMIN_ACCESS_DENIED_ALERT_TITLE,
      content: ADMIN_ACCESS_DENIED_ALERT_CONTENT,
    })
    expect(isGlobalApiErrorAlertShown(error)).toBe(true)
  })

  it('서로 다른 URL 403은 모달을 한 번만 띄운다', () => {
    const first = forbiddenError('/api/admin/members/all')
    const second = forbiddenError('/api/admin/programs')

    expect(showGlobalApiErrorAlert(first)).toBe(true)
    expect(showGlobalApiErrorAlert(second)).toBe(false)

    expect(cmsAlertModal.show).toHaveBeenCalledTimes(1)
    expect(isGlobalApiErrorAlertShown(first)).toBe(true)
    expect(isGlobalApiErrorAlertShown(second)).toBe(true)
  })

  it('권한 안내를 닫은 뒤에는 다음 403을 다시 띄운다', () => {
    expect(showGlobalApiErrorAlert(forbiddenError('/api/admin/a'))).toBe(true)
    clearForbiddenApiErrorAlertDedupe()
    expect(showGlobalApiErrorAlert(forbiddenError('/api/admin/b'))).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledTimes(2)
  })

  it('skipGlobalErrorAlert이면 403도 띄우지 않는다', () => {
    const error = forbiddenError('/api/admin/auth/login')
    expect(showGlobalApiErrorAlert(error, { skipGlobalErrorAlert: true })).toBe(false)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(isGlobalApiErrorAlertShown(error)).toBe(false)
  })

  it('최초 로그인 온보딩 중 403은 권한 안내를 띄우지 않는다', () => {
    onboarding.incomplete = true
    const error = forbiddenError('/api/admin/me')
    expect(showGlobalApiErrorAlert(error)).toBe(false)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(isGlobalApiErrorAlertShown(error)).toBe(true)
  })

  it('403이 아닌 오류는 서버 메시지를 유지한다', () => {
    const error = conflictError('/api/admin/admin-accounts')
    expect(showGlobalApiErrorAlert(error)).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '처리 불가',
      content: 'CONFLICT: ADMIN_EMAIL_ALREADY_EXISTS',
    })
  })
})

function currentPasswordInvalidError(url: string): AxiosError {
  return {
    isAxiosError: true,
    message: 'Bad Request',
    name: 'AxiosError',
    toJSON: () => ({}),
    response: {
      status: 400,
      data: {
        success: false,
        error: {
          code: 'CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID',
          message: '현재 비밀번호를 확인해 주세요.',
        },
      },
    },
    config: { method: 'post', url },
  } as AxiosError
}

describe('showGlobalApiErrorAlert CMS_MEMBER_DELETE_CURRENT_PASSWORD_INVALID', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
  })

  it('비밀번호 불일치 안내 고정 카피를 띄운다', () => {
    const error = currentPasswordInvalidError('/api/admin/me/withdrawals')
    expect(showGlobalApiErrorAlert(error)).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledWith(
      getMemberDeleteCurrentPasswordInvalidAlertOptions()
    )
    expect(isGlobalApiErrorAlertShown(error)).toBe(true)
  })
})

function instructorCancelApprovalBlockedError(url: string): AxiosError {
  return {
    isAxiosError: true,
    message: 'Conflict',
    name: 'AxiosError',
    toJSON: () => ({}),
    response: {
      status: 409,
      data: {
        success: false,
        data: null,
        message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
        error: {
          code: 'INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM',
          message: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
          field: null,
          details: null,
        },
      },
    },
    config: { method: 'post', url },
  } as AxiosError
}

describe('showGlobalApiErrorAlert INSTRUCTOR_REVOKE_BLOCKED_BY_ACTIVE_PROGRAM', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.spyOn(cmsAlertModal, 'show').mockImplementation(() => undefined)
  })

  it('강사 권한 승인 취소 요청이면 공통 409 알림을 띄우지 않는다', () => {
    const error = instructorCancelApprovalBlockedError(
      '/api/admin/instructor-role-requests/42/cancel-approval'
    )
    expect(showGlobalApiErrorAlert(error)).toBe(false)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(isGlobalApiErrorAlertShown(error)).toBe(true)
  })

  it('강사 권한 종료 요청이면 공통 409 알림을 띄우지 않는다', () => {
    const error = instructorCancelApprovalBlockedError('/api/admin/instructors/42/revoke')
    expect(showGlobalApiErrorAlert(error)).toBe(false)
    expect(cmsAlertModal.show).not.toHaveBeenCalled()
    expect(isGlobalApiErrorAlertShown(error)).toBe(true)
  })

  it('강사 권한 종료 요청의 다른 409는 공통 알림을 유지한다', () => {
    const error = instructorCancelApprovalBlockedError('/api/admin/instructors/42/revoke')
    if (error.response?.data && typeof error.response.data === 'object') {
      const data = error.response.data as {
        error: { code: string }
      }
      data.error.code = 'INSTRUCTOR_REVOKE_STATE_CHANGED'
    }
    expect(showGlobalApiErrorAlert(error)).toBe(true)
    expect(cmsAlertModal.show).toHaveBeenCalledWith({
      title: '처리 불가',
      content: '현재 데이터 또는 처리 상태와 충돌하여 요청을 완료할 수 없습니다.',
    })
  })
})
