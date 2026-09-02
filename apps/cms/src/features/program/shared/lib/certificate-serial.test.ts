import { describe, expect, it } from 'vitest'
import {
  CERTIFICATE_SERIAL_PLACEHOLDER,
  formatCertificateSerial,
  isCertificateSerialPlaceholder,
  mockCertificateSerial,
} from './certificate-serial'

describe('isCertificateSerialPlaceholder', () => {
  it('treats empty and 00000 as not issued', () => {
    expect(isCertificateSerialPlaceholder(undefined)).toBe(true)
    expect(isCertificateSerialPlaceholder('')).toBe(true)
    expect(isCertificateSerialPlaceholder(CERTIFICATE_SERIAL_PLACEHOLDER)).toBe(true)
    expect(isCertificateSerialPlaceholder('26-JA-00017')).toBe(false)
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
