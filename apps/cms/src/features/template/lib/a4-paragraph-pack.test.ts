import { describe, expect, it } from 'vitest'
import {
  A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX,
} from '@/features/template/lib/a4-document-pagination-constants'
import {
  countTrailingAgreementClosingStackToMoveWith,
  packParagraphsByHeights,
} from '@/features/template/lib/a4-paragraph-pack'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { AGREEMENT_PORTRAIT_PARAGRAPH_IDS } from '@/features/template/model/writing-form-draft.schema'

function body(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'agreement_explanation_text',
    requiredMark: false,
    paragraphTitle: id,
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    bodyPlaceholder: '',
    bodyText: id,
    answerRequired: false,
  }
}

function confirm(): WritingFormParagraph {
  return {
    id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
    kind: 'description',
    variant: 'closing',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    body: '확인했습니다.',
  }
}

function date(): WritingFormParagraph {
  return {
    id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
    kind: 'description',
    variant: 'system',
    systemPreset: 'agreement_date',
    requiredMark: true,
    paragraphTitle: '날짜 유형',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
  }
}

function signature(): WritingFormParagraph {
  return {
    id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
    kind: 'description',
    variant: 'system',
    systemPreset: 'agreement_signature',
    requiredMark: true,
    paragraphTitle: '서명란 유형',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
  }
}

describe('countTrailingAgreementClosingStackToMoveWith', () => {
  it('peels confirm+date before signature', () => {
    expect(
      countTrailingAgreementClosingStackToMoveWith([body('a'), confirm(), date()], signature())
    ).toBe(2)
  })

  it('peels date only when confirm is absent', () => {
    expect(countTrailingAgreementClosingStackToMoveWith([body('a'), date()], signature())).toBe(1)
  })

  it('peels confirm before date', () => {
    expect(countTrailingAgreementClosingStackToMoveWith([body('a'), confirm()], date())).toBe(1)
  })
})

describe('packParagraphsByHeights closing keep-together', () => {
  it('moves confirm+date+signature together when signature alone would overflow', () => {
    const paragraphs = [body('intro'), body('table'), confirm(), date(), signature()]
    const heights = new Map<string, number>([
      ['intro', 700],
      ['table', 700],
      [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing, 80],
      [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate, 80],
      [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature, 80],
    ])
    // intro+table+gaps ≈ 1432, +confirm+date ≈ 1592, +signature(80) exceeds 1650
    expect(A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX).toBe(1650)

    const { pages } = packParagraphsByHeights(paragraphs, heights, true, 32)

    expect(pages).toHaveLength(2)
    expect(pages[0]!.map(p => p.id)).toEqual(['intro', 'table'])
    expect(pages[1]!.map(p => p.id)).toEqual([
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
    ])
  })

  it('does not orphan signature alone on page 2', () => {
    const paragraphs = [body('intro'), confirm(), date(), signature()]
    const heights = new Map<string, number>([
      ['intro', 1500],
      [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing, 40],
      [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate, 40],
      [AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature, 100],
    ])

    const { pages } = packParagraphsByHeights(paragraphs, heights, true, 32)
    const signaturePage = pages.find(page =>
      page.some(p => p.id === AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature)
    )
    expect(signaturePage?.map(p => p.id)).toEqual([
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
      AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
    ])
  })
})
