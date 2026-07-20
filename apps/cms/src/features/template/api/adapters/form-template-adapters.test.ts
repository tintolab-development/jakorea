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
  it('groups writing templates by category and merges API names', () => {
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
    expect(registration?.rows.some(row => row.id === 'registration-economy')).toBe(true)
  })
})

describe('buildIssuanceFormSectionsFromApiItems', () => {
  it('groups issuance templates into report and document sections', () => {
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
    expect(report?.rows.some(row => row.id === 'issuance-1')).toBe(true)
    expect(document?.rows.find(row => row.id === 'document-3')?.templateName).toBe('수료증 (API)')
    expect(document?.rows.some(row => row.id === 'document-payment-order-issue')).toBe(true)
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
