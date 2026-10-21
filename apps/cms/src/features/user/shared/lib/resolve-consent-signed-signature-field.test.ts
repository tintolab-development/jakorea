import { describe, expect, it } from 'vitest'
import {
  resolveConsentSignedSignatureField,
  resolveConsentSignedSignatureFieldKey,
} from './resolve-consent-signed-signature-field'

describe('resolveConsentSignedSignatureField', () => {
  it('signed + fileObjectId가 있는 첫 필드를 고른다', () => {
    expect(
      resolveConsentSignedSignatureField([
        { fieldKey: 'final', signed: true, signatureFileObjectId: 12 },
        { fieldKey: 'other', signed: true, signatureFileObjectId: 13 },
      ])
    ).toEqual({ fieldKey: 'final', signatureFileObjectId: 12 })
  })

  it('fileId가 없어도 signed fieldKey는 사용한다', () => {
    expect(
      resolveConsentSignedSignatureFieldKey([{ fieldKey: 'final', signed: true }])
    ).toBe('final')
  })

  it('signed 플래그 없이 signedAt·fileId만 있어도 사용한다', () => {
    expect(
      resolveConsentSignedSignatureField([
        { fieldKey: 'agreement-portrait-system-signature', signatureFileObjectId: 55 },
      ])
    ).toEqual({
      fieldKey: 'agreement-portrait-system-signature',
      signatureFileObjectId: 55,
    })
  })

  it('빈 배열·undefined는 null', () => {
    expect(resolveConsentSignedSignatureField(undefined)).toBeNull()
    expect(resolveConsentSignedSignatureField([])).toBeNull()
  })

  it('명시적 unsigned이거나 fieldKey가 없으면 null', () => {
    expect(
      resolveConsentSignedSignatureField([
        { fieldKey: 'final', signed: false, signatureFileObjectId: 12 },
      ])
    ).toBeNull()
    expect(
      resolveConsentSignedSignatureField([{ signed: true, signatureFileObjectId: 12 }])
    ).toBeNull()
  })
})
