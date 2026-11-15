import { describe, expect, it } from 'vitest'
import {
  canBatchConfirmDetailLine,
  filterDetailRows,
  type DetailAppliedFilters,
  type PaymentOrderDetailLineRow,
} from './use-payment-order-detail-lines'

const applied = (keyword: string): DetailAppliedFilters => ({
  keyword,
  institutionName: '',
  status: 'all',
  dateRange: null,
})

/** 프로그램 상세 라인 — 프로그램명에 「정산」이 들어 있지만 신청자명에는 없다 */
const programDetailRows = [
  { instructorName: '최수아', programName: '⭐️⭐️⭐️ 정산', institutionName: '-' },
  { instructorName: '강하은', programName: '⭐️⭐️⭐️ 정산', institutionName: '-' },
] as unknown as PaymentOrderDetailLineRow[]

describe('filterDetailRows — 상세 이름 검색', () => {
  it('서버 조회 뒤에도 신청자명 기준으로 다시 거른다(프로그램명 단어로 전원이 나오지 않는다)', () => {
    expect(filterDetailRows(programDetailRows, 'program', applied('정산'), true)).toHaveLength(0)
  })

  it('서버 조회 뒤 신청자명이 맞는 행만 남긴다', () => {
    const rows = filterDetailRows(programDetailRows, 'program', applied('하은'), true)
    expect(rows).toHaveLength(1)
    expect((rows[0] as { instructorName: string }).instructorName).toBe('강하은')
  })

  it('신청자 상세는 프로그램명 기준, 대소문자 구분 없이 거른다', () => {
    const instructorDetailRows = [
      { instructorName: '이건희', programName: 'JA Economics', institutionName: '-' },
      { instructorName: '이건희', programName: '개커복날', institutionName: '-' },
    ] as unknown as PaymentOrderDetailLineRow[]
    const rows = filterDetailRows(instructorDetailRows, 'instructor', applied('economics'), true)
    expect(rows).toHaveLength(1)
  })

  it('키워드가 없으면 그대로 둔다', () => {
    expect(filterDetailRows(programDetailRows, 'program', applied('  '), true)).toHaveLength(2)
  })
})

describe('canBatchConfirmDetailLine — 영수증 행도 일괄 확인 대상', () => {
  const receipt = (overrides: Record<string, unknown> = {}) =>
    ({
      rowType: 'INDIVIDUAL_SETTLEMENT_APPLICATION',
      individualSettlementApplicationId: 3,
      revisionNo: 2,
      availableActions: ['APPROVE', 'REJECT'],
      ...overrides,
    }) as unknown as PaymentOrderDetailLineRow

  it('APPROVE가 있고 신청 ID·차수가 있으면 확인 가능', () => {
    expect(canBatchConfirmDetailLine(receipt())).toBe(true)
  })

  it('승인된 영수증(VIEW만)이나 차수가 없으면 확인 불가', () => {
    expect(canBatchConfirmDetailLine(receipt({ availableActions: ['VIEW'] }))).toBe(false)
    expect(canBatchConfirmDetailLine(receipt({ revisionNo: undefined }))).toBe(false)
  })

  it('강사 행은 기존 지급조서 확인 판정을 따른다', () => {
    const instructor = (actions: string[]) =>
      ({ availableActions: actions, statementStatus: 'WAITING_CONFIRM' }) as unknown as PaymentOrderDetailLineRow
    expect(canBatchConfirmDetailLine(instructor(['CONFIRM_PAYMENT_STATEMENT']))).toBe(true)
    expect(canBatchConfirmDetailLine(instructor(['VIEW']))).toBe(false)
  })
})

describe('canBatchConfirmDetailLine — 확정 전 강사 정산 신청서 행', () => {
  const application = (overrides: Record<string, unknown> = {}) =>
    ({
      rowType: 'SETTLEMENT_APPLICATION',
      settlementApplicationId: 26,
      statementStatus: 'WAITING_CONFIRM',
      availableActions: [
        'VIEW',
        'BULK_CONFIRM_PAYMENT_STATEMENT',
        'CONFIRM_SETTLEMENT_APPLICATION',
        'REJECT_SETTLEMENT_APPLICATION',
        'REQUEST_CORRECTION',
      ],
      ...overrides,
    }) as unknown as PaymentOrderDetailLineRow

  it('BULK_CONFIRM_PAYMENT_STATEMENT가 있으면 확인 가능', () => {
    expect(canBatchConfirmDetailLine(application())).toBe(true)
  })

  it('BULK 코드가 없으면(정정 요청·반려·BE 미배포) 확인 불가 — statementStatus로 추정하지 않는다', () => {
    expect(
      canBatchConfirmDetailLine(
        application({ availableActions: ['VIEW', 'CONFIRM_SETTLEMENT_APPLICATION'] })
      )
    ).toBe(false)
  })

  it('신청서 ID가 없으면 확인 불가', () => {
    expect(canBatchConfirmDetailLine(application({ settlementApplicationId: undefined }))).toBe(
      false
    )
  })
})
