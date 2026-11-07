import { describe, expect, it } from 'vitest'
import { getFileDownloadPasswordFormError } from './file-download-password-api-error'

describe('getFileDownloadPasswordFormError', () => {
  it('DOWNLOAD_PASSWORD_REQUIRED + field=password 를 폼 에러로 반환한다', () => {
    expect(
      getFileDownloadPasswordFormError({
        response: {
          status: 400,
          data: {
            message: '파일 암호를 입력해 주세요.',
            error: { code: 'DOWNLOAD_PASSWORD_REQUIRED', field: 'password' },
          },
        },
      })
    ).toBe('파일 암호를 입력해 주세요.')
  })

  it('DOWNLOAD_PASSWORD_INVALID + field=password 를 폼 에러로 반환한다', () => {
    expect(
      getFileDownloadPasswordFormError({
        response: {
          status: 400,
          data: {
            message:
              '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
            error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' },
          },
        },
      })
    ).toBe('파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.')
  })

  it('다른 필드의 암호 코드는 폼 에러로 쓰지 않는다', () => {
    expect(
      getFileDownloadPasswordFormError({
        response: {
          status: 400,
          data: {
            message: '파일 암호를 입력해 주세요.',
            error: { code: 'DOWNLOAD_PASSWORD_REQUIRED', field: 'confirm' },
          },
        },
      })
    ).toBeNull()
  })
})
