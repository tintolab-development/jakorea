import { describe, expect, it } from 'vitest'
import {
  buildIssuanceFormSectionsFromApiItems,
  buildWritingFormSectionsFromApiItems,
} from '@/features/template/api/adapters/form-template-adapters'
import type { FormTemplateListItemResponse } from '@/shared/api/generated/forms-surveys/schemas'

function listItem(
  partial: Pick<FormTemplateListItemResponse, 'templateCode'> &
    Partial<FormTemplateListItemResponse>
): FormTemplateListItemResponse {
  return {
    templateName: partial.templateName,
    category: partial.category,
    updatedAt: partial.updatedAt ?? '2026-01-15T00:00:00Z',
    latestVersionId: partial.latestVersionId ?? 1,
    ...partial,
  }
}

describe('buildWritingFormSectionsFromApiItems', () => {
  it('groups writing templates by category without mock merge', () => {
    const sections = buildWritingFormSectionsFromApiItems([
      listItem({
        templateCode: 'registration-general',
        templateName: '일반 프로그램 등록 폼 (API)',
        category: 'REGISTRATION',
      }),
      listItem({
        templateCode: 'survey-default',
        templateName: '설문조사 (API)',
        category: 'SURVEY',
      }),
    ])

    const registration = sections.find(section => section.key === 'registration')
    expect(registration?.rows.find(row => row.id === 'registration-general')?.templateName).toBe(
      '일반 프로그램 등록 폼 (API)'
    )
    expect(registration?.rows.some(row => row.id === 'registration-economy')).toBe(false)
    expect(registration?.rows).toHaveLength(1)
  })

  it('shows user-created application/recruitment copies and hides registration copies', () => {
    const sections = buildWritingFormSectionsFromApiItems([
      listItem({
        templateCode: 'application-participant-individual',
        templateName: '참여자 신청 (카탈로그)',
        category: 'APPLICATION',
      }),
      listItem({
        templateCode: 'application-participant-individual-copy-99',
        templateName: '참여자 신청 (복제)',
        category: 'APPLICATION',
        systemTemplate: false,
      }),
      listItem({
        templateCode: 'recruitment-instructor-copy-1',
        templateName: '강사 모집 (복제)',
        category: 'RECRUITMENT',
        systemTemplate: false,
      }),
      listItem({
        templateCode: 'registration-general-copy-1',
        templateName: '일반 등록 (복제)',
        category: 'REGISTRATION',
        systemTemplate: false,
      }),
      listItem({
        templateCode: 'survey-custom-01',
        templateName: '커스텀 설문',
        category: 'SURVEY',
        systemTemplate: false,
      }),
    ])

    const applicationForm = sections.find(section => section.key === 'application_form')
    const recruitment = sections.find(section => section.key === 'application')
    const registration = sections.find(section => section.key === 'registration')
    const survey = sections.find(section => section.key === 'survey')

    expect(applicationForm?.rows.map(row => row.id)).toEqual([
      'application-participant-individual',
      'application-participant-individual-copy-99',
    ])
    expect(recruitment?.rows.some(row => row.id === 'recruitment-instructor-copy-1')).toBe(true)
    expect(registration?.rows.some(row => row.id.includes('copy'))).toBe(false)
    expect(survey?.rows.some(row => row.id === 'survey-custom-01')).toBe(true)
  })

  it('places receipt pre-consent in the agreement section', () => {
    const sections = buildWritingFormSectionsFromApiItems([
      listItem({
        templateCode: 'agreement-third-party',
        templateName: '지급조서 사전 동의서',
        category: 'AGREEMENT',
      }),
      listItem({
        templateCode: 'agreement-receipt-pre-consent',
        templateName: '영수증 발급 사전 동의서',
        category: 'AGREEMENT',
      }),
    ])
    const agreement = sections.find(section => section.key === 'agreement')
    expect(agreement?.rows.map(row => row.id)).toEqual([
      'agreement-third-party',
      'agreement-receipt-pre-consent',
    ])
  })

  it('places copy codes into the catalog section even when API category is missing', () => {
    const sections = buildWritingFormSectionsFromApiItems([
      listItem({
        templateCode: 'recruitment-instructor-copy-1735689600123',
        templateName: '강사 모집 (신규)',
        systemTemplate: false,
      }),
      listItem({
        templateCode: 'application-instructor-copy',
        templateName: '강사 신청 (신규)',
        systemTemplate: false,
      }),
    ])

    const recruitment = sections.find(section => section.key === 'application')
    const applicationForm = sections.find(section => section.key === 'application_form')
    expect(recruitment?.rows.some(row => row.id === 'recruitment-instructor-copy-1735689600123')).toBe(
      true
    )
    expect(applicationForm?.rows.some(row => row.id === 'application-instructor-copy')).toBe(true)
  })
})

describe('buildIssuanceFormSectionsFromApiItems', () => {
  it('groups issuance templates into report and document sections without mock merge', () => {
    const sections = buildIssuanceFormSectionsFromApiItems([
      listItem({
        templateCode: 'issuance-3',
        templateName: '강의보고서 (API)',
        category: 'REPORT',
      }),
      listItem({
        templateCode: 'document-3',
        templateName: '수료증 (API)',
        category: 'DOCUMENT',
      }),
    ])

    const report = sections.find(section => section.key === 'issuance-report')
    const document = sections.find(section => section.key === 'issuance-document')

    expect(report?.rows.find(row => row.id === 'issuance-3')?.templateName).toBe('강의보고서 (API)')
    expect(report?.rows.some(row => row.id === 'issuance-1')).toBe(false)
    expect(report?.rows.some(row => row.id === 'issuance-2')).toBe(false)
    expect(report?.rows).toHaveLength(1)
    expect(document?.rows.find(row => row.id === 'document-3')?.templateName).toBe('수료증 (API)')
    expect(document?.rows.some(row => row.id === 'document-payment-order-issue')).toBe(false)
    expect(document?.rows).toHaveLength(1)
  })

  it('hides Notion-excluded issuance catalog codes from the list', () => {
    const sections = buildIssuanceFormSectionsFromApiItems([
      listItem({
        templateCode: 'issuance-1',
        templateName: 'UJAT 결과리포트 (API)',
        category: 'REPORT',
      }),
      listItem({
        templateCode: 'document-2',
        templateName: '휴가 인증서 (API)',
        category: 'DOCUMENT',
      }),
    ])

    const report = sections.find(section => section.key === 'issuance-report')
    const document = sections.find(section => section.key === 'issuance-document')

    expect(report?.rows.some(row => row.id === 'issuance-1')).toBe(false)
    expect(document?.rows.some(row => row.id === 'document-2')).toBe(false)
  })

  it('maps BE category enum ISSUANCE/CERTIFICATE for unknown templateCode', () => {
    const sections = buildIssuanceFormSectionsFromApiItems([
      listItem({
        templateCode: 'issuance-new-report',
        templateName: '신규 보고서',
        category: 'ISSUANCE',
      }),
      listItem({
        templateCode: 'document-new-cert',
        templateName: '신규 인증서',
        category: 'CERTIFICATE',
      }),
    ])

    const report = sections.find(section => section.key === 'issuance-report')
    const document = sections.find(section => section.key === 'issuance-document')

    expect(report?.rows.some(row => row.id === 'issuance-new-report')).toBe(true)
    expect(document?.rows.some(row => row.id === 'document-new-cert')).toBe(true)
  })
})
