import { describe, expect, it } from 'vitest'
import { resolveMemberConsentTemplateByLabel } from './member-consent-template-map'

describe('resolveMemberConsentTemplateByLabel', () => {
  it('UI 라벨을 동의서 템플릿으로 매핑한다', () => {
    expect(resolveMemberConsentTemplateByLabel('초상권 수집·이용 동의')).toMatchObject({
      templateId: 'agreement-portrait',
    })
    expect(resolveMemberConsentTemplateByLabel('교육진행자 서약서')).toMatchObject({
      templateId: 'agreement-expense',
    })
    expect(resolveMemberConsentTemplateByLabel('성범죄 경력 조회 동의서')).toMatchObject({
      templateId: 'agreement-crime',
    })
  })
})
