import { describe, expect, it } from 'vitest'
import {
  resolveLectureSessionSegmentDisplay,
  toLectureSessionCellSegment,
} from './payment-order-calculation-basis-detail'

/**
 * 교육 진행 일자 칸 뒤 조각 — 서버 지급조서 PDF(PaymentStatementServerPdfRenderer)와 같은 규칙.
 * 시안 8248:147086 `YYYY.MM.DD(요일) │ 뒤 조각`, 뒤 조각이 없으면 날짜만.
 */
describe('교육 진행 일자 칸 뒤 조각 (BE PDF 규칙과 동일)', () => {
  const cases: Array<[input: string | null | undefined, segment: string, cell: string]> = [
    ['2026-09-01', '-', ''],
    ['2026-09-01 · 2회차', '2회차', '2회차'],
    ['2026-09-01 10:00~12:00 · 3차시', '3차시', '3차시'],
    ['2026-09-01 10:00~12:00', '-', ''],
    ['사전교육', '사전교육', '사전교육'],
    [null, '-', ''],
    [undefined, '-', ''],
    ['  ', '-', ''],
  ]

  it.each(cases)('%j → 뒤 조각 %j · 칸 %j', (input, segment, cell) => {
    expect(resolveLectureSessionSegmentDisplay(input)).toBe(segment)
    expect(toLectureSessionCellSegment(input)).toBe(cell)
  })

  it('이미 뒤 조각만 있는 값·일정명은 그대로 둔다 (회차↔차시 변환 없음)', () => {
    expect(toLectureSessionCellSegment('2회차')).toBe('2회차')
    expect(toLectureSessionCellSegment('3차시')).toBe('3차시')
    expect(toLectureSessionCellSegment('오전반 특강')).toBe('오전반 특강')
  })

  it('표시용 빈 값(-·—·–)은 칸에 그리지 않는다', () => {
    expect(toLectureSessionCellSegment('-')).toBe('')
    expect(toLectureSessionCellSegment('—')).toBe('')
    expect(toLectureSessionCellSegment('–')).toBe('')
  })
})
