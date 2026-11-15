import { describe, expect, it } from 'vitest'
import type { SettlementApplicationDocumentResponse } from '@/shared/api/generated/settlement/schemas'
import {
  buildReceiptSettlementDocumentFileName,
  buildReceiptSettlementPreviewOptions,
  groupReceiptSettlementLinesIntoBlocks,
  RECEIPT_SETTLEMENT_PAYMENT_PURPOSE,
} from './map-receipt-settlement-document-to-preview-options'

const document: SettlementApplicationDocumentResponse = {
  documentType: 'RECEIPT_SETTLEMENT',
  title: 'JA KOREA 정산 신청서',
  revisionNo: 1,
  submittedAt: '2026-11-10T00:00:00Z',
  status: 'APPROVED',
  basicInfo: {
    name: '김제이',
    englishName: 'Jei Kim',
    residentNumberMasked: null,
    affiliation: null,
    homeAddress: '서울특별시 강서구 화곡동',
    homeAddressDetail: '123-456',
    bank: '농협',
    accountNumberMasked: '***-***-**6789',
    accountHolder: '김제이',
    paymentPurpose: null,
  },
  calcInfo: null,
  lines: [
    { educationDate: '2026-01-28', sessionLabel: '2회차', direction: 'PAYMENT', category: '교통비', description: '왕복', amount: 79600 },
    { educationDate: '2026-01-28', sessionLabel: '2회차', direction: 'PAYMENT', category: '식사비', description: null, amount: 30000 },
    { educationDate: '2026-01-29', sessionLabel: '3회차', direction: 'PAYMENT', category: '활동비', description: null, amount: 150000 },
  ],
  total: { amount: 259600, formulaLabel: '교통비 + 식사비 + 활동비' },
  attachments: [],
} as unknown as SettlementApplicationDocumentResponse

describe('buildReceiptSettlementPreviewOptions', () => {
  it('같은 교육 진행 일자·회차는 한 블록으로 묶고 응답 순서를 지킨다', () => {
    const blocks = groupReceiptSettlementLinesIntoBlocks(document.lines ?? [], 7)
    expect(blocks).toHaveLength(2)
    expect(blocks[0]?.lectureDateDisplay).toBe('2026.01.28(수)')
    expect(blocks[0]?.lectureSessionDisplay).toBe('2회차')
    expect(blocks[0]?.lines.map(l => l.itemLabel)).toEqual(['교통비', '식사비'])
    expect(blocks[1]?.lines.map(l => l.itemLabel)).toEqual(['활동비'])
  })

  it('항목 설명은 category, 구분은 description이며 금액은 응답 그대로다', () => {
    const [block] = groupReceiptSettlementLinesIntoBlocks(document.lines ?? [], 7)
    expect(block?.lines[0]).toMatchObject({ itemLabel: '교통비', description: '왕복', amount: 79600 })
    expect(block?.lines[1]?.description).toBe('')
  })

  it('공제 행은 공제 종류로 둔다', () => {
    const [block] = groupReceiptSettlementLinesIntoBlocks(
      [{ educationDate: '2026-01-28', sessionLabel: '2회차', direction: 'DEDUCTION', category: '원천징수', amount: -2000 }],
      1
    )
    expect(block?.lines[0]?.kind).toBe('withholding')
    expect(block?.lines[0]?.amount).toBe(-2000)
  })

  it('지급 목적이 null이면 시안 문구, 소속 null은 빈 값(화면 -), 주민번호 행·기관 열은 숨긴다', () => {
    const options = buildReceiptSettlementPreviewOptions({ document, settlementApplicationId: 7 })
    expect(options.paymentStatementBasicInfoValues?.paymentPurpose).toBe(
      RECEIPT_SETTLEMENT_PAYMENT_PURPOSE
    )
    expect(options.paymentStatementBasicInfoValues?.affiliation).toBe('')
    expect(options.paymentStatementBasicInfoValues?.accountNumber).toBe('***-***-**6789')
    expect(options.paymentStatementBasicInfoHideResidentNumberRow).toBe(true)
    expect(options.paymentStatementCalculationLines).toMatchObject({
      hideInstitutionColumn: true,
      columnPreset: 'receipt-settlement',
      formulaLabel: '교통비 + 식사비 + 활동비',
      totalAmount: 259600,
    })
    expect(options.paymentStatementDisplayMode).toBe('document')
  })

  it('응답에 지급 목적이 있으면 그 값을 쓴다', () => {
    const options = buildReceiptSettlementPreviewOptions({
      document: { ...document, basicInfo: { ...document.basicInfo, paymentPurpose: '활동비 지급' } },
      settlementApplicationId: 7,
    })
    expect(options.paymentStatementBasicInfoValues?.paymentPurpose).toBe('활동비 지급')
  })

  it('파일명은 서버 PDF 규칙과 같다', () => {
    expect(buildReceiptSettlementDocumentFileName(document)).toBe('[JA Korea] 정산 신청서_김제이_261110')
  })
})
