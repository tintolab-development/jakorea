import { describe, expect, it } from 'vitest'
import {
  getFormTemplateSeedDraft,
  normalizeWritingFormDraftFromApi,
} from '@/features/template/lib/form-template-seed-registry'
import { createPaymentStatementIssuanceDraft } from '@/features/template/model/payment-statement-issuance-draft'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

const EMPTY_DRAFT = normalizeWritingFormDraft({
  schemaVersion: 1,
  formSettings: { titleNumbering: 'none' },
  paragraphs: [],
})

describe('normalizeWritingFormDraftFromApi', () => {
  it.each([
    'application-participant-school',
    'application-trained-teachers',
    'application-economy',
  ])('seeds 희망 교육 형태 in %s 기본 정보', templateCode => {
    const seed = getFormTemplateSeedDraft(templateCode)
    const basicInfo = seed?.paragraphs.find(paragraph => paragraph.id.includes('seed-basic-info'))
    expect(basicInfo).toMatchObject({ systemFieldKeys: ['educationFormat'] })
  })

  it.each([
    'application-participant-school',
    'application-trained-teachers',
    'application-economy',
  ])('backfills 희망 교육 형태 metadata in legacy %s draft', templateCode => {
    const seed = getFormTemplateSeedDraft(templateCode)
    expect(seed).not.toBeNull()

    const legacyDraft = {
      ...seed!,
      paragraphs: seed!.paragraphs.map(paragraph => {
        if (
          !paragraph.id.includes('seed-basic-info') ||
          paragraph.kind !== 'single_item' ||
          paragraph.variant !== 'horizontal_table'
        ) {
          return paragraph
        }
        const { systemFieldKeys: _systemFieldKeys, ...legacyParagraph } = paragraph as typeof paragraph & {
          systemFieldKeys?: string[]
        }
        return legacyParagraph
      }),
    }
    const next = normalizeWritingFormDraftFromApi(templateCode, legacyDraft)
    const basicInfo = next.paragraphs.find(paragraph => paragraph.id.includes('seed-basic-info'))

    expect(basicInfo).toMatchObject({ systemFieldKeys: ['educationFormat'] })
  })

  it('does not seed-fill empty paragraphs for certificate Payload D codes', () => {
    const next = normalizeWritingFormDraftFromApi('document-3', EMPTY_DRAFT)
    expect(next.paragraphs).toHaveLength(0)
  })

  it('seed-fills empty paragraphs for Payload A issuance codes', () => {
    const next = normalizeWritingFormDraftFromApi('document-payment-order-issue', EMPTY_DRAFT)
    expect(next.paragraphs.length).toBeGreaterThan(0)
  })

  it('preserves non-empty paragraphs from API', () => {
    const seed = createPaymentStatementIssuanceDraft()
    const fromApi = normalizeWritingFormDraft({
      ...seed,
      paragraphs: [seed.paragraphs[0]!],
    })
    const next = normalizeWritingFormDraftFromApi('document-payment-order-issue', fromApi)
    expect(next.paragraphs).toHaveLength(1)
    expect(next.paragraphs[0]?.id).toBe(seed.paragraphs[0]?.id)
  })
})
