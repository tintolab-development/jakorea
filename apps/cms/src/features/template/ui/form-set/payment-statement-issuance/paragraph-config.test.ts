import { describe, expect, it } from 'vitest'
import { createPaymentStatementIssuanceDraft, PAYMENT_STATEMENT_ISSUANCE_IDS } from '@/features/template/model/payment-statement-issuance-draft'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  maskPaymentStatementIssuanceClosingDateForAuthoring,
  PAYMENT_STATEMENT_ISSUANCE_CLOSING_DATE_PLACEHOLDER,
  resolvePaymentStatementIssuanceDocumentParagraphBodyOptions,
} from './paragraph-config'

describe('resolvePaymentStatementIssuanceDocumentParagraphBodyOptions', () => {
  it('옵션이 없으면 최강사·강서초 샘플을 넣지 않는다', () => {
    const resolved = resolvePaymentStatementIssuanceDocumentParagraphBodyOptions()
    const serialized = JSON.stringify(resolved)

    expect(resolved.paymentStatementDisplayMode).toBe('document')
    expect(resolved.paymentStatementBasicInfoValues?.nameKo).toBe('')
    expect(resolved.paymentStatementBasicInfoValues?.residentFront).toBe('')
    expect(resolved.paymentStatementBasicInfoValues?.addressDetail).toBe('')
    expect(resolved.paymentStatementCalculationLines?.blocks).toEqual([])
    expect(serialized).not.toContain('최강사')
    expect(serialized).not.toContain('Choi Kang-sa')
    expect(serialized).not.toContain('JA빌딩')
    expect(serialized).not.toContain('850320')
    expect(serialized).not.toContain('강서초등학교')
    expect(serialized).not.toContain('3급 강사비')
  })

  it('호출 옵션의 성명·산출 라인을 샘플 없이 유지한다', () => {
    const resolved = resolvePaymentStatementIssuanceDocumentParagraphBodyOptions({
      paymentStatementBasicInfoValues: { nameKo: '홍길동', nameEn: '' },
      paymentStatementCalculationLines: {
        blocks: [
          {
            institutionName: '진월초등학교',
            lectureDateDisplay: '2026.08.15(토)',
            lectureSessionDisplay: '3차시',
            lines: [],
          },
        ],
        formulaLabel: '정산 항목 합계',
        totalAmount: 0,
      },
    })

    expect(resolved.paymentStatementBasicInfoValues?.nameKo).toBe('홍길동')
    expect(resolved.paymentStatementCalculationLines?.blocks[0]?.institutionName).toBe(
      '진월초등학교'
    )
    expect(JSON.stringify(resolved)).not.toContain('최강사')
    expect(JSON.stringify(resolved)).not.toContain('강서초등학교')
  })
})

describe('maskPaymentStatementIssuanceClosingDateForAuthoring', () => {
  function closingBody(draft: ReturnType<typeof createPaymentStatementIssuanceDraft>) {
    const p = draft.paragraphs.find(x => x.id === PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate)
    return p != null && 'body' in p ? p.body : undefined
  }

  it('양식 관리 견본의 고정 발급일을 자리 표시로 바꾼다', () => {
    const draft = normalizeWritingFormDraft(createPaymentStatementIssuanceDraft())
    expect(closingBody(draft)).toMatch(/^\d{4}년 \d{2}월 \d{2}일$/)
    const masked = maskPaymentStatementIssuanceClosingDateForAuthoring(draft)
    expect(closingBody(masked)).toBe(PAYMENT_STATEMENT_ISSUANCE_CLOSING_DATE_PLACEHOLDER)
  })

  it('날짜가 아닌 문구는 그대로 두고, 실발급용 새 draft는 바꾸지 않는다', () => {
    const draft = normalizeWritingFormDraft(createPaymentStatementIssuanceDraft())
    const custom = {
      ...draft,
      paragraphs: draft.paragraphs.map(p =>
        p.id === PAYMENT_STATEMENT_ISSUANCE_IDS.closingDate && 'body' in p
          ? { ...p, body: '발급일 별도 기재' }
          : p
      ),
    }
    expect(maskPaymentStatementIssuanceClosingDateForAuthoring(custom)).toBe(custom)
    expect(closingBody(createPaymentStatementIssuanceDraft())).toMatch(/^\d{4}년/)
  })
})
