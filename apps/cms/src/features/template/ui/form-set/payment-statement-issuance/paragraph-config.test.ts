import { describe, expect, it } from 'vitest'
import {
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
            lectureDateDisplay: '2026. 08. 15(토)',
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
