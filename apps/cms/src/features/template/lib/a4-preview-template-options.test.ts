import { describe, expect, it } from 'vitest'
import {
  isCertificateIssuanceTemplate,
  isCertificateIssuanceTemplateName,
  shouldUseA4PreviewForIssuanceTemplate,
} from '@/features/template/lib/a4-preview-template-options'

describe('isCertificateIssuanceTemplate', () => {
  it('matches Payload D by templateCode even when API renames templateName', () => {
    expect(
      isCertificateIssuanceTemplate({
        templateCode: 'document-3',
        templateName: '수료증 (API)',
      })
    ).toBe(true)
    expect(
      isCertificateIssuanceTemplate({
        templateCode: 'document-participation-certificate',
        templateName: '참여인증서 (API)',
      })
    ).toBe(true)
  })

  it('falls back to catalog templateName when templateCode is missing', () => {
    expect(isCertificateIssuanceTemplate({ templateName: '수료증' })).toBe(true)
    expect(isCertificateIssuanceTemplate({ templateName: '수료증 (API)' })).toBe(false)
  })

  it('does not treat Payload A document templates as certificates', () => {
    expect(
      isCertificateIssuanceTemplate({
        templateCode: 'document-payment-order-issue',
        templateName: '지급조서(발급용)',
      })
    ).toBe(false)
  })
})

describe('shouldUseA4PreviewForIssuanceTemplate', () => {
  it('skips A4 preview for certificate templateCode', () => {
    expect(
      shouldUseA4PreviewForIssuanceTemplate({
        templateCode: 'document-3',
        templateName: '수료증 (API)',
      })
    ).toBe(false)
  })

  it('uses A4 preview for Payload A', () => {
    expect(
      shouldUseA4PreviewForIssuanceTemplate({
        templateCode: 'document-payment-order-issue',
        templateName: '지급조서(발급용)',
      })
    ).toBe(true)
  })

  it('keeps string overload for legacy name-only callers', () => {
    expect(shouldUseA4PreviewForIssuanceTemplate('수료증')).toBe(false)
    expect(shouldUseA4PreviewForIssuanceTemplate('지급조서(발급용)')).toBe(true)
    expect(isCertificateIssuanceTemplateName('수료증')).toBe(true)
  })
})
