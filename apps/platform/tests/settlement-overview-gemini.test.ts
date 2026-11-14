import { describe, expect, it } from 'vitest'
import {
  buildSummary,
  kstMonthKey,
  mapGeminiSettlementItem,
} from '../src/features/mypage/settlement/api/client'
import { filterSettlementListItems } from '../src/features/mypage/settlement/lib/filter-items'

describe('mapGeminiSettlementItem', () => {
  it('계좌 지급 완료 실적: 목록 금액은 산정 강사비, 합계 금액은 실지급액, 이체일·인정 차시', () => {
    const item = mapGeminiSettlementItem({
      reportId: 185951,
      programName: '제미나이 아카데미',
      institutionName: 'QA 대학교',
      trainingDate: '2026-04-17',
      startAt: '2026-04-17T01:00:00Z',
      endAt: '2026-04-17T03:00:00Z',
      recognizedClassCount: 2,
      calculatedAmount: 170000,
      statementStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      netPaymentAmount: 164390,
      paidAt: '2026-11-09T13:51:48Z',
    })
    expect(item).toMatchObject({
      id: 'gemini-185951',
      programName: '제미나이 아카데미',
      organizationName: 'QA 대학교',
      status: 'paid',
      sessionLabel: '2차시',
      appliedAmount: 170000,
      summaryAmount: 164390,
      paidAt: '2026-11-09T13:51:48Z',
    })
    expect(item?.statusUnavailable).toBeUndefined()
  })

  it('정산 전 유효 실적은 확인 대기 중, 시각이 없으면 연수일 KST 자정', () => {
    const item = mapGeminiSettlementItem({
      reportId: 1,
      trainingDate: '2026-08-05',
      calculatedAmount: 170000,
    })
    expect(item).toMatchObject({
      status: 'waiting_confirm',
      startsAt: '2026-08-05T00:00:00+09:00',
      endsAt: '2026-08-05T00:00:00+09:00',
      appliedAmount: 170000,
      sessionLabel: '',
      programName: '제미나이 아카데미',
      organizationName: '-',
    })
  })

  it('강사비 0원은 금액 0·상태 없음, 미설정은 금액 null·상태 없음', () => {
    expect(
      mapGeminiSettlementItem({ reportId: 2, trainingDate: '2026-04-08', calculatedAmount: 0 }),
    ).toMatchObject({ appliedAmount: 0, summaryAmount: null, statusUnavailable: true })
    expect(
      mapGeminiSettlementItem({ reportId: 3, trainingDate: '2026-04-09', calculatedAmount: null }),
    ).toMatchObject({ appliedAmount: null, summaryAmount: null, statusUnavailable: true })
  })

  it('실적 id나 일자가 없으면 행을 만들지 않는다', () => {
    expect(mapGeminiSettlementItem({ trainingDate: '2026-04-09', calculatedAmount: 1 })).toBeNull()
    expect(mapGeminiSettlementItem({ reportId: 4, calculatedAmount: 1 })).toBeNull()
  })
})

describe('buildSummary — 제미나이 포함', () => {
  const instructorPaidOctober = {
    id: '6',
    programName: '-',
    organizationName: '-',
    startsAt: '2026-10-26T00:30:00Z',
    endsAt: '2026-10-26T02:30:00Z',
    sessionLabel: '',
    status: 'paid' as const,
    appliedAmount: 145920,
  }
  const geminiPaid = mapGeminiSettlementItem({
    reportId: 185950,
    trainingDate: '2026-04-16',
    startAt: '2026-04-16T01:00:00Z',
    endAt: '2026-04-16T03:00:00Z',
    calculatedAmount: 170000,
    statementStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    netPaymentAmount: 155040,
    paidAt: '2026-11-09T13:51:48Z',
  })!
  const geminiConfirmedNovember = mapGeminiSettlementItem({
    reportId: 9,
    trainingDate: '2026-11-03',
    calculatedAmount: 100000,
    statementStatus: 'CONFIRMED',
    netPaymentAmount: 96700,
  })!
  const geminiZero = mapGeminiSettlementItem({
    reportId: 10,
    trainingDate: '2026-11-04',
    calculatedAmount: 0,
    statementStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    netPaymentAmount: 0,
    paidAt: '2026-11-09T00:00:00Z',
  })!
  const items = [instructorPaidOctober, geminiPaid, geminiConfirmedNovember, geminiZero]

  it('총 완료금에 제미나이 지급 완료 실지급액을 더한다', () => {
    expect(buildSummary(items, '2026-11').totalPaidAmount).toBe(145920 + 155040)
  })

  it('제미나이 월 완료금은 연수일이 아니라 이체 완료일(KST) 월로 집계한다', () => {
    expect(buildSummary(items, '2026-11').monthPaidAmount).toBe(155040)
    expect(buildSummary(items, '2026-04').monthPaidAmount).toBeNull()
    // 기존 강사 지급조서 행은 교육일 기준 그대로
    expect(buildSummary(items, '2026-10').monthPaidAmount).toBe(145920)
  })

  it('예정금은 지급조서 확인 완료 실지급액, 0원·미설정 행은 합계에서 뺀다', () => {
    expect(buildSummary(items, '2026-11').monthExpectedAmount).toBe(96700)
  })

  it('0원·미설정 행은 상태 필터에서 빠지고 전체에서만 보인다', () => {
    const params = { q: '', month: '2026-11' }
    expect(
      filterSettlementListItems(items, { ...params, status: 'paid' }).map(item => item.id),
    ).toEqual([])
    expect(
      filterSettlementListItems(items, { ...params, status: 'all' }).map(item => item.id),
    ).toEqual(['gemini-9', 'gemini-10'])
  })
})

describe('kstMonthKey', () => {
  it('UTC 말일 늦은 시각은 KST 다음 달', () => {
    expect(kstMonthKey('2026-10-31T16:00:00Z')).toBe('2026-11')
    expect(kstMonthKey('not-a-date')).toBe('')
  })
})
