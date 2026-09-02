import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_DOWNLOAD_LOG_FALLBACK,
  CERTIFICATE_SERIAL_ALLOCATE_FALLBACK,
  CertificateSerialAllocateError,
  buildCertificateSerialAllocateRequest,
  getCertificateSerialAllocateErrorMessage,
  logCertificateIssueDownload,
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
        response: {
          status: 400,
          data: {
            success: false,
            data: null,
            message: 'top',
            error: { code: 'BAD_REQUEST', message: '미허용 certificateType 입니다.' },
          },
        },
      })
    ).toBe('미허용 certificateType 입니다.')

    expect(
      getCertificateSerialAllocateErrorMessage({
        response: { status: 404, data: { message: '참가자를 찾을 수 없습니다.' } },
      })
    ).toBe('참가자를 찾을 수 없습니다.')

    expect(getCertificateSerialAllocateErrorMessage(null)).toBe(CERTIFICATE_SERIAL_ALLOCATE_FALLBACK)
  })
})

describe('buildCertificateSerialAllocateRequest', () => {
  it('omits program/participant ids for 양식 관리 sample downloads', () => {
    expect(
      buildCertificateSerialAllocateRequest({
        certificateType: 'document-participation-certificate',
        issuanceSource: 'FORM_TEMPLATE',
      })
    ).toEqual({
      certificateType: 'document-participation-certificate',
      issuanceSource: 'FORM_TEMPLATE',
    })
  })

  it('requires numeric program and participant ids for program issuance', () => {
    expect(
      buildCertificateSerialAllocateRequest({
        programId: 5001,
        subjectId: 7001,
        certificateType: 'document-3',
      })
    ).toEqual({
      programId: 5001,
      participantId: 7001,
      certificateType: 'document-3',
      issuanceSource: 'PROGRAM',
    })

    expect(() =>
      buildCertificateSerialAllocateRequest({
        programId: 'prog-1',
        subjectId: 7001,
        certificateType: 'document-3',
      })
    ).toThrow('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')

    expect(() =>
      buildCertificateSerialAllocateRequest({
        programId: 5001,
        subjectId: 'student-1',
        certificateType: 'document-3',
      })
    ).toThrow('참가자 정보가 없어 고유번호를 발급할 수 없습니다.')
  })
})

describe('logCertificateIssueDownload', () => {
  it('rejects invalid issueId or empty fileName before calling the API', async () => {
    await expect(logCertificateIssueDownload(0, { fileName: 'a.pdf' })).rejects.toThrow(
      CERTIFICATE_DOWNLOAD_LOG_FALLBACK
    )
    await expect(logCertificateIssueDownload(-1, { fileName: 'a.pdf' })).rejects.toThrow(
      CERTIFICATE_DOWNLOAD_LOG_FALLBACK
    )
    await expect(logCertificateIssueDownload(12, { fileName: '   ' })).rejects.toThrow(
      CERTIFICATE_DOWNLOAD_LOG_FALLBACK
    )
  })
})
