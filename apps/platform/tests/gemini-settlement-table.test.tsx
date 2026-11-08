import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GeminiSettlementTable } from '../src/features/mypage/education/settlements/ui/gemini-settlement-table'
import { EducationSettlementSummary } from '../src/features/mypage/education/settlements/ui/summary'

describe('GeminiSettlementTable', () => {
  it('Figma 정산 현황 열과 서버 순서대로 행을 그린다', () => {
    const html = renderToStaticMarkup(
      <GeminiSettlementTable
        rows={[
          {
            scheduleId: 2,
            institutionName: '서울등현초등학교',
            grade: '5학년',
            trainingDate: '2026-01-09',
            trainingTimeText: '10:00~11:20',
            recognizedClassCount: 3,
          },
          {
            scheduleId: 1,
            institutionName: '강서초등학교',
            grade: null,
            trainingDate: '2026-01-09',
            trainingStartTime: '09:00:00',
            trainingEndTime: '12:20:00',
            recognizedClassCount: 1,
          },
        ]}
      />
    )
    for (const header of [
      '기관명',
      '교육 학년',
      '교육 진행 일정',
      '정산 처리 현황',
      '정산 예정 금액',
    ]) {
      expect(html).toContain(`<th scope="col">${header}</th>`)
    }
    expect(html).toContain('2건')
    expect(html).toContain('<span>-</span></td><td>-</td>')
    expect(html).toContain('2026년 1월 9일(금) 10:00~11:20 | 3차시')
    expect(html).toContain('2026년 1월 9일(금) 09:00~12:20 | 1차시')
    expect(html.indexOf('서울등현초등학교')).toBeLessThan(html.indexOf('강서초등학교'))
  })

  it('행 settlementStatusLabel·expectedAmount를 쓰고 없으면 -', () => {
    const html = renderToStaticMarkup(
      <GeminiSettlementTable
        rows={[
          {
            scheduleId: 1,
            institutionName: '서울등현초등학교',
            accountPaymentStatus: 'PAID',
            settlementStatusLabel: '계좌 지급 완료',
            expectedAmount: 220000,
          },
          {
            scheduleId: 2,
            institutionName: '강서초등학교',
            accountPaymentStatus: 'WAITING',
            settlementStatusLabel: '확인 대기 중',
            expectedAmount: 0,
          },
          {
            scheduleId: 3,
            institutionName: '강서초등학교',
            accountPaymentStatus: null,
            settlementStatusLabel: null,
            expectedAmount: null,
          },
        ]}
      />
    )
    const rows = html.split('<tr>').slice(2)
    expect(rows[0]).toMatch(/class="[^"]*statusPaid[^"]*">계좌 지급 완료<\/span>/)
    expect(rows[0]).toContain('<td>220,000원</td>')
    expect(rows[1]).toContain('<span>확인 대기 중</span>')
    expect(rows[1]).not.toContain('statusPaid')
    expect(rows[1]).toContain('<td>0원</td>')
    expect(rows[2]).toContain('<span>-</span>')
    expect(rows[2]).toMatch(/<td>-<\/td><\/tr>/)
  })
})

describe('EducationSettlementSummary gemini', () => {
  const base = {
    processLabel: '확인진행중',
    completedCount: '3',
    totalCount: '7',
    businessIncomeLabel: '해당 없음',
    layout: 'gemini' as const,
  }

  it('강사비 책정 기준을 차시별로 구분선과 함께 나열한다', () => {
    const html = renderToStaticMarkup(
      <EducationSettlementSummary
        {...base}
        feeGradeLabel=""
        feeBasisItems={['1차시 0원', '2차시 170,000원', '3차시 220,000원', '4차시 270,000원']}
      />
    )
    const order = [
      '확인진행중',
      '프로그램 진행 회차',
      '해당 없음',
      '1차시 0원',
      '2차시 170,000원',
      '4차시 270,000원',
    ]
    const positions = order.map(text => html.indexOf(text))
    expect(positions.every(position => position >= 0)).toBe(true)
    expect([...positions].sort((a, b) => a - b)).toEqual(positions)
    expect(html.match(/feeBasisDivider/g)?.length).toBe(3)
  })

  it('항목이 없으면 lectureFeeBasis 한 줄을 그대로 보인다', () => {
    const html = renderToStaticMarkup(
      <EducationSettlementSummary
        {...base}
        feeGradeLabel="인정 2차시 고정 강사비 170000원"
        feeBasisItems={[]}
      />
    )
    expect(html).toContain('인정 2차시 고정 강사비 170000원')
    expect(html).not.toContain('feeBasisDivider')
  })
})
