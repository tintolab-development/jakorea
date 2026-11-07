import { describe, expect, it } from 'vitest'
import {
  isSensitiveConsentDocumentLabel,
  resolveMemberConsentTemplateByLabel,
} from './member-consent-template-map'

describe('resolveMemberConsentTemplateByLabel', () => {
  it('UI 라벨을 동의서 템플릿으로 매핑한다', () => {
    expect(resolveMemberConsentTemplateByLabel('초상권 수집·이용 동의')).toMatchObject({
      templateId: 'agreement-portrait',
    })
    expect(resolveMemberConsentTemplateByLabel('교육진행자 서약서')).toMatchObject({
      templateId: 'agreement-expense',
    })
    expect(resolveMemberConsentTemplateByLabel('성범죄경력 조회 동의서')).toMatchObject({
      templateId: 'agreement-crime',
      modalTitle: '성범죄경력 조회 동의서',
    })
    expect(resolveMemberConsentTemplateByLabel('행정정보 공동이용 동의서')).toMatchObject({
      templateId: 'agreement-notice',
      modalTitle: '행정정보 공동이용 동의서',
    })
    // 구 라벨 별칭도 계속 매칭
    expect(resolveMemberConsentTemplateByLabel('성범죄 경력 조회 동의서')?.templateId).toBe(
      'agreement-crime'
    )
    expect(resolveMemberConsentTemplateByLabel('행정정보 공동이용 사전동의서')?.templateId).toBe(
      'agreement-notice'
    )
  })

  it('marks sex-offense and administrative consents as sensitive download targets', () => {
    expect(isSensitiveConsentDocumentLabel('성범죄경력 조회 동의서')).toBe(true)
    expect(isSensitiveConsentDocumentLabel('행정정보 공동이용 동의서')).toBe(true)
    expect(isSensitiveConsentDocumentLabel('초상권 수집·이용 동의')).toBe(false)
    expect(isSensitiveConsentDocumentLabel('교육진행자 서약서')).toBe(false)
  })
})
