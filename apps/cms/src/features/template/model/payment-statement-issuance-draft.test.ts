import { describe, expect, it } from 'vitest'
import {
  createPaymentStatementIssuanceDocumentDraft,
  createPaymentStatementIssuanceDraft,
  isPaymentStatementLegacyCalcInfoParagraph,
  migratePaymentStatementIssuanceParagraphs,
  PAYMENT_STATEMENT_ISSUANCE_IDS,
} from '@/features/template/model/payment-statement-issuance-draft'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import type {
  HorizontalTableParagraph,
  WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'

const ids = PAYMENT_STATEMENT_ISSUANCE_IDS

function findTable(draft: WritingFormDraft, id: string): HorizontalTableParagraph | undefined {
  const p = draft.paragraphs.find(paragraph => paragraph.id === id)
  return p?.kind === 'single_item' && p.variant === 'horizontal_table' ? p : undefined
}

/** 시안 반영 전 서버 저장본 — 문서 draft와 같은 7단락 구성 */
function legacySavedDraft(): WritingFormDraft {
  return createPaymentStatementIssuanceDocumentDraft()
}

describe('createPaymentStatementIssuanceDraft (시안 5767:46455 좌측 캔버스)', () => {
  it('단락 순서가 제목·기본 정보·강사비 산출 내역·교통비·숙박비·근무일지·날짜·회장이다', () => {
    expect(createPaymentStatementIssuanceDraft().paragraphs.map(p => p.id)).toEqual([
      ids.title,
      ids.tableBasic,
      ids.tableCalcInfo,
      ids.tableTransport,
      ids.tableAccommodation,
      ids.tableWorkLog,
      ids.closingDate,
      ids.closingSignature,
    ])
  })

  it('강사비 산출 내역은 정산 신청서와 같은 제목·설명·5항목이다', () => {
    const calcInfo = findTable(createPaymentStatementIssuanceDraft(), ids.tableCalcInfo)
    expect(calcInfo?.paragraphTitle).toBe('강사비 산출 내역')
    expect(calcInfo?.paragraphDescription).toBe('강사비는 사전에 책정된 금액으로 지급됩니다.')
    expect(calcInfo?.dataRows.map(row => row[0])).toEqual([
      '강사비 유형',
      '강사비 책정',
      '사업소득자 여부',
      '교육 진행 차시',
      '총 강사비',
    ])
    expect(calcInfo != null && isPaymentStatementLegacyCalcInfoParagraph(calcInfo)).toBe(false)
  })

  it('교통비·숙박비 신청은 시안 설명·하단 안내를 쓴다', () => {
    const draft = createPaymentStatementIssuanceDraft()
    const transport = findTable(draft, ids.tableTransport)
    const accommodation = findTable(draft, ids.tableAccommodation)
    expect(transport?.paragraphTitle).toBe('교통비 신청')
    expect(transport?.paragraphDescription).toBe(
      '강의 진행을 위한 교통비에 한해 신청이 가능합니다.'
    )
    expect(transport?.showBottomText).toBe(true)
    expect(transport?.bottomText).toContain('편도 30km 이상')
    expect(accommodation?.paragraphTitle).toBe('숙박비 신청')
    expect(accommodation?.paragraphDescription).toBe(
      '사전에 안내된 경우에만 지급되며 임의 신청 건은 반려될 수 있습니다.'
    )
    expect(accommodation?.showBottomText).toBe(true)
    expect(accommodation?.bottomText).toContain('150,000원')
  })
})

describe('createPaymentStatementIssuanceDocumentDraft (실제 발급 문서)', () => {
  it('발급 데이터가 채워지는 산출 정보 7항목·산출 행 표를 유지하고 교통비·숙박비는 넣지 않는다', () => {
    const draft = createPaymentStatementIssuanceDocumentDraft()
    const idList = draft.paragraphs.map(p => p.id)
    expect(idList).toContain(ids.tableCalcLines)
    expect(idList).not.toContain(ids.tableTransport)
    expect(idList).not.toContain(ids.tableAccommodation)
    const calcInfo = findTable(draft, ids.tableCalcInfo)
    expect(calcInfo != null && isPaymentStatementLegacyCalcInfoParagraph(calcInfo)).toBe(true)
  })
})

describe('migratePaymentStatementIssuanceParagraphs', () => {
  it('예전 저장본을 시안 구성으로 보정한다', () => {
    const next = migratePaymentStatementIssuanceParagraphs(legacySavedDraft())
    expect(next.paragraphs.map(p => p.id)).toEqual(
      createPaymentStatementIssuanceDraft().paragraphs.map(p => p.id)
    )
    const calcInfo = findTable(next, ids.tableCalcInfo)
    expect(calcInfo?.paragraphTitle).toBe('강사비 산출 내역')
    expect(calcInfo?.paragraphDescription).toBe('강사비는 사전에 책정된 금액으로 지급됩니다.')
    expect(calcInfo?.dataRows).toHaveLength(5)
  })

  it('관리자가 바꾼 제목·설명은 유지한다', () => {
    const legacy = legacySavedDraft()
    const edited: WritingFormDraft = {
      ...legacy,
      paragraphs: legacy.paragraphs.map(p =>
        p.id === ids.tableCalcInfo
          ? { ...p, paragraphTitle: '강사비', paragraphDescription: '안내' }
          : p
      ),
    }
    const calcInfo = findTable(migratePaymentStatementIssuanceParagraphs(edited), ids.tableCalcInfo)
    expect(calcInfo?.paragraphTitle).toBe('강사비')
    expect(calcInfo?.paragraphDescription).toBe('안내')
    expect(calcInfo?.dataRows).toHaveLength(5)
  })

  it('이미 시안 구성이면 그대로 둔다(멱등)', () => {
    const seed = createPaymentStatementIssuanceDraft()
    expect(migratePaymentStatementIssuanceParagraphs(seed)).toBe(seed)
  })

  it('서버 조회 보정(normalizeWritingFormDraftFromApi)에도 적용된다', () => {
    const next = normalizeWritingFormDraftFromApi(
      'document-payment-order-issue',
      legacySavedDraft()
    )
    expect(next.paragraphs.some(p => p.id === ids.tableCalcLines)).toBe(false)
    expect(next.paragraphs.some(p => p.id === ids.tableTransport)).toBe(true)
  })
})
