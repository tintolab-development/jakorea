import { describe, expect, it, vi } from 'vitest'
import { AxiosError } from 'axios'

import { AdminLoginApiError } from '@/features/auth/api/admin-login-fetcher'
import {
  LOGIN_EMAIL_NOT_FOUND_MESSAGE,
  LOGIN_PASSWORD_MISMATCH_MESSAGE,
  applyLoginFieldErrors,
} from './login-field-errors'

function createFormMock() {
  const setFields = vi.fn()
  return { setFields }
}

describe('applyLoginFieldErrors', () => {
  it('sets both field messages on generic login failure', () => {
    const form = createFormMock()

    applyLoginFieldErrors(form as never, new AdminLoginApiError('INVALID_CREDENTIALS', 'fail'))

    expect(form.setFields).toHaveBeenCalledWith([
      { name: 'email', errors: [LOGIN_EMAIL_NOT_FOUND_MESSAGE] },
      { name: 'password', errors: [LOGIN_PASSWORD_MISMATCH_MESSAGE] },
    ])
  })

  it('sets email message only when API field is email', () => {
    const form = createFormMock()
    const error = new AxiosError('fail', undefined, undefined, undefined, {
      status: 401,
      data: { error: { code: 'INVALID_CREDENTIALS', field: 'email' } },
      statusText: 'Unauthorized',
      headers: {},
      config: {} as never,
    })

    applyLoginFieldErrors(form as never, error)

    expect(form.setFields).toHaveBeenCalledWith([
      { name: 'email', errors: [LOGIN_EMAIL_NOT_FOUND_MESSAGE] },
    ])
  })

  it('sets password message only for password mismatch code', () => {
    const form = createFormMock()

    applyLoginFieldErrors(form as never, new AdminLoginApiError('INVALID_PASSWORD', 'fail'))

    expect(form.setFields).toHaveBeenCalledWith([
      { name: 'password', errors: [LOGIN_PASSWORD_MISMATCH_MESSAGE] },
    ])
  })
})
