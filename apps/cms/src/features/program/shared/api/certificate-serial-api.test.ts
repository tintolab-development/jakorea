import { describe, expect, it } from 'vitest'
import {
  certificateIssueReasonCodeFromLabel,
  formatCertificateIssueReasonLabel,
} from '@/features/program/shared/lib/certificate-serial'
import {
  CERTIFICATE_DOWNLOAD_LOG_FALLBACK,
  CERTIFICATE_SERIAL_ALLOCATE_FALLBACK,
  CertificateSerialAllocateError,
  buildCertificateRosterSerialAllocateRequest,
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

  it('maps CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE when server message is empty or the code', () => {
    expect(
      getCertificateSerialAllocateErrorMessage({
        response: {
          status: 409,
          data: {
            success: false,
            data: null,
            message: '',
            error: { code: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE', message: '' },
          },
        },
      })
    ).toBe('수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.')

    expect(
      getCertificateSerialAllocateErrorMessage({
        response: {
          status: 409,
          data: {
            success: false,
            data: null,
            message: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE',
            error: {
              code: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE',
              message: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE',
            },
          },
        },
      })
    ).toBe('수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.')

    expect(
      getCertificateSerialAllocateErrorMessage({
        response: {
          status: 409,
          data: {
            success: false,
            data: null,
            message: '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.',
            error: {
              code: 'CERTIFICATE_CONSENT_EVIDENCE_UNAVAILABLE',
              message: '수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.',
            },
          },
        },
      })
    ).toBe('수료증 발급 기간을 확인할 동의 또는 신청 정보가 없습니다.')
  })
})

describe('buildCertificateSerialAllocateRequest — issueReason', () => {
  it('발급 사유 코드를 issueReason으로 싣고, 없으면 생략한다', () => {
    expect(
      buildCertificateSerialAllocateRequest({
        programId: 5001,
        subjectId: 7001,
        certificateType: 'document-4',
        issueReason: 'INSTITUTION_SUBMISSION',
      })
    ).toEqual({
      programId: 5001,
      participantId: 7001,
      certificateType: 'document-4',
      issuanceSource: 'PROGRAM',
      issueReason: 'INSTITUTION_SUBMISSION',
    })
    expect(
      buildCertificateSerialAllocateRequest({
        programId: 5001,
        subjectId: 7001,
        certificateType: 'document-4',
      })
    ).not.toHaveProperty('issueReason')
  })

  it('400 CERTIFICATE_ISSUE_REASON_INVALID 안내', () => {
    expect(
      getCertificateSerialAllocateErrorMessage({
        response: {
          status: 400,
          data: { success: false, error: { code: 'CERTIFICATE_ISSUE_REASON_INVALID' } },
        },
      })
    ).toBe('발급 사유가 올바르지 않습니다. 발급 사유를 다시 선택해 주세요.')
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

describe('buildCertificateRosterSerialAllocateRequest', () => {
  it('sends programId, applicationId, rosterId — not participantId', () => {
    expect(
      buildCertificateRosterSerialAllocateRequest({
        programId: 5001,
        subjectId: 12,
        applicationId: 1691524,
        rosterId: 88,
        certificateType: 'document-3',
      })
    ).toEqual({
      programId: 5001,
      applicationId: 1691524,
      rosterId: 88,
      certificateType: 'document-3',
    })
  })

  it('requires numeric program, application, and roster ids', () => {
    expect(() =>
      buildCertificateRosterSerialAllocateRequest({
        programId: 'prog-1',
        applicationId: 1691524,
        rosterId: 88,
        certificateType: 'document-3',
      })
    ).toThrow('프로그램 정보가 없어 고유번호를 발급할 수 없습니다.')

    expect(() =>
      buildCertificateRosterSerialAllocateRequest({
        programId: 5001,
        rosterId: 88,
        certificateType: 'document-3',
      })
    ).toThrow('기관 신청 정보가 없어 고유번호를 발급할 수 없습니다.')

    expect(() =>
      buildCertificateRosterSerialAllocateRequest({
        programId: 5001,
        applicationId: 1691524,
        certificateType: 'document-3',
      })
    ).toThrow('학생 명단 정보가 없어 고유번호를 발급할 수 없습니다.')
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

describe('certificate issue reason labels', () => {
  it('모달 라벨 ↔ 코드, 발급 이력 표시', () => {
    expect(certificateIssueReasonCodeFromLabel('기관 제출용')).toBe('INSTITUTION_SUBMISSION')
    expect(certificateIssueReasonCodeFromLabel('교육 이수 증빙용')).toBe('EDUCATION_COMPLETION_PROOF')
    expect(certificateIssueReasonCodeFromLabel('개인 보관용')).toBe('PERSONAL_ARCHIVE')
    expect(certificateIssueReasonCodeFromLabel(undefined)).toBeNull()
    expect(formatCertificateIssueReasonLabel('PERSONAL_ARCHIVE')).toBe('개인 보관용')
    expect(formatCertificateIssueReasonLabel(null)).toBe('-')
  })
})
