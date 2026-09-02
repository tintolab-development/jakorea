import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_SERIAL_ALLOCATE_FALLBACK,
  CertificateSerialAllocateError,
  getCertificateSerialAllocateErrorMessage,
} from './certificate-serial-api'

describe('getCertificateSerialAllocateErrorMessage', () => {
  it('uses allocate error and axios envelope messages', () => {
    expect(
      getCertificateSerialAllocateErrorMessage(
        new CertificateSerialAllocateError('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')
      )
    ).toBe('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')

    expect(
      getCertificateSerialAllocateErrorMessage({
        response: { status: 404, data: { message: '참가자를 찾을 수 없습니다.' } },
      })
    ).toBe('참가자를 찾을 수 없습니다.')

    expect(getCertificateSerialAllocateErrorMessage(null)).toBe(CERTIFICATE_SERIAL_ALLOCATE_FALLBACK)
  })
})
