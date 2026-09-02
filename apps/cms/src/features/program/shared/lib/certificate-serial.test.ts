import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_SERIAL_PLACEHOLDER,
  formatCertificateSerial,
  isAllowedCertificateSerialType,
  isCertificateSerialPlaceholder,
  isIssuedCertificateSerial,
  mockCertificateSerial,
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

describe('isAllowedCertificateSerialType', () => {
  it('allows the four template codes and rejects COMPLETION/ACTIVITY', () => {
    expect(isAllowedCertificateSerialType('document-3')).toBe(true)
    expect(isAllowedCertificateSerialType('document-participation-certificate')).toBe(true)
    expect(isAllowedCertificateSerialType('document-4')).toBe(true)
    expect(isAllowedCertificateSerialType('document-5')).toBe(true)
    expect(isAllowedCertificateSerialType('COMPLETION')).toBe(false)
    expect(isAllowedCertificateSerialType('ACTIVITY')).toBe(false)
  })
})

describe('formatCertificateSerial', () => {
  it('pads sequence to 5 digits with year suffix', () => {
    expect(formatCertificateSerial(17, new Date('2026-09-02'))).toBe('26-JA-00017')
  })

  it('does not emit the template placeholder 00000', () => {
    expect(formatCertificateSerial(0, new Date('2026-01-01'))).toBe('26-JA-00001')
  })
})

describe('mockCertificateSerial', () => {
  it('is stable for the same subject', () => {
    const subject = {
      programId: 'prog-1',
      subjectId: 'student-9',
      certificateType: 'document-3',
    }
    expect(mockCertificateSerial(subject)).toBe(mockCertificateSerial(subject))
    expect(mockCertificateSerial(subject)).not.toBe(CERTIFICATE_SERIAL_PLACEHOLDER)
  })

  it('differs when certificate type differs', () => {
    const base = { programId: 'p', subjectId: 's', certificateType: 'document-3' }
    expect(mockCertificateSerial(base)).not.toBe(
      mockCertificateSerial({ ...base, certificateType: 'document-participation-certificate' })
    )
  })
})
