import { describe, expect, it } from 'vitest'
import {
  isCrimeConsentPdfPreviewSrc,
  isCrimeConsentUploadFile,
} from '@/features/template/lib/agreement-crime-consent-settings'

describe('isCrimeConsentUploadFile', () => {
  it('allows pdf and image mime types', () => {
    expect(isCrimeConsentUploadFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toBe(
      true
    )
    expect(isCrimeConsentUploadFile(new File(['x'], 'a.png', { type: 'image/png' }))).toBe(true)
    expect(isCrimeConsentUploadFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))).toBe(true)
  })

  it('allows pdf/image by file name when mime is empty', () => {
    expect(isCrimeConsentUploadFile(new File(['x'], 'form.PDF', { type: '' }))).toBe(true)
    expect(isCrimeConsentUploadFile(new File(['x'], 'scan.JPEG', { type: '' }))).toBe(true)
  })

  it('rejects other documents', () => {
    expect(isCrimeConsentUploadFile(new File(['x'], 'a.docx', { type: '' }))).toBe(false)
    expect(
      isCrimeConsentUploadFile(
        new File(['x'], 'a.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      )
    ).toBe(false)
  })
})

describe('isCrimeConsentPdfPreviewSrc', () => {
  it('detects pdf from mime, file name, and data url', () => {
    expect(isCrimeConsentPdfPreviewSrc('blob:http://localhost/1', 'a.png', 'application/pdf')).toBe(
      true
    )
    expect(isCrimeConsentPdfPreviewSrc('blob:http://localhost/1', 'a.pdf')).toBe(true)
    expect(isCrimeConsentPdfPreviewSrc('data:application/pdf;base64,AAA')).toBe(true)
  })

  it('does not treat images as pdf', () => {
    expect(isCrimeConsentPdfPreviewSrc('data:image/png;base64,AAA', 'a.png')).toBe(false)
  })
})
