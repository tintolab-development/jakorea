import { describe, expect, it } from 'vitest'
import { CertificateSerialAllocateRequestCertificateType } from '@/shared/api/generated/certificates/schemas/certificateSerialAllocateRequestCertificateType'
import {
  CERTIFICATE_SERIAL_PLACEHOLDER,
  CERTIFICATE_SERIAL_TYPES,
  isAllowedCertificateSerialType,
  isCertificateSerialPlaceholder,
  isFormTemplateCertificateSerialSubject,
  isIssuedCertificateSerial,
  parseCertificateIssueId,
  parseCertificateSerialInt64,
  parseIssuedCertificateSerial,
} from './certificate-serial'

describe('isCertificateSerialPlaceholder', () => {
  it('treats empty and 00000 as not issued', () => {
    expect(isCertificateSerialPlaceholder(undefined)).toBe(true)
    expect(isCertificateSerialPlaceholder('')).toBe(true)
    expect(isCertificateSerialPlaceholder(CERTIFICATE_SERIAL_PLACEHOLDER)).toBe(true)
    expect(isCertificateSerialPlaceholder('26-JA-00017')).toBe(false)
  })
})

describe('parseIssuedCertificateSerial', () => {
  it('accepts issued numbers and rejects placeholder or malformed values', () => {
    expect(parseIssuedCertificateSerial('26-JA-00017')).toBe('26-JA-00017')
    expect(parseIssuedCertificateSerial(' 26-JA-00017 ')).toBe('26-JA-00017')
    expect(parseIssuedCertificateSerial(CERTIFICATE_SERIAL_PLACEHOLDER)).toBeNull()
    expect(parseIssuedCertificateSerial('26-JA-00000')).toBeNull()
    expect(parseIssuedCertificateSerial('COMPLETION')).toBeNull()
    expect(parseIssuedCertificateSerial('')).toBeNull()
    expect(isIssuedCertificateSerial('26-JA-00017')).toBe(true)
    expect(isIssuedCertificateSerial(CERTIFICATE_SERIAL_PLACEHOLDER)).toBe(false)
  })
})

describe('parseCertificateSerialInt64', () => {
  it('accepts positive integers and numeric strings', () => {
    expect(parseCertificateSerialInt64(5001)).toBe(5001)
    expect(parseCertificateSerialInt64('7001')).toBe(7001)
  })

  it('rejects mock string ids, zero, and empty', () => {
    expect(parseCertificateSerialInt64('prog-1')).toBeNull()
    expect(parseCertificateSerialInt64('student-9')).toBeNull()
    expect(parseCertificateSerialInt64(0)).toBeNull()
    expect(parseCertificateSerialInt64('')).toBeNull()
    expect(parseCertificateSerialInt64(undefined)).toBeNull()
  })
})

describe('parseCertificateIssueId', () => {
  it('accepts positive issue ids and rejects invalid values', () => {
    expect(parseCertificateIssueId(12)).toBe(12)
    expect(parseCertificateIssueId('81001')).toBe(81001)
    expect(parseCertificateIssueId(0)).toBeNull()
    expect(parseCertificateIssueId(null)).toBeNull()
    expect(parseCertificateIssueId({})).toBeNull()
  })
})

describe('isAllowedCertificateSerialType', () => {
  it('uses OpenAPI certificateType enum and rejects COMPLETION/ACTIVITY', () => {
    expect(CERTIFICATE_SERIAL_TYPES).toEqual(
      Object.values(CertificateSerialAllocateRequestCertificateType)
    )
    expect(isAllowedCertificateSerialType('document-3')).toBe(true)
    expect(isAllowedCertificateSerialType('document-participation-certificate')).toBe(true)
    expect(isAllowedCertificateSerialType('document-4')).toBe(true)
    expect(isAllowedCertificateSerialType('document-5')).toBe(true)
    expect(isAllowedCertificateSerialType('COMPLETION')).toBe(false)
    expect(isAllowedCertificateSerialType('ACTIVITY')).toBe(false)
    expect(isAllowedCertificateSerialType('PARTICIPATION')).toBe(false)
  })
})

describe('isFormTemplateCertificateSerialSubject', () => {
  it('is true only for 양식 관리 sample downloads', () => {
    expect(
      isFormTemplateCertificateSerialSubject({
        certificateType: 'document-3',
        issuanceSource: 'FORM_TEMPLATE',
      })
    ).toBe(true)
    expect(
      isFormTemplateCertificateSerialSubject({
        programId: 5001,
        subjectId: 7001,
        certificateType: 'document-3',
      })
    ).toBe(false)
  })
})
