import { describe, expect, it } from 'vitest'
import { UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS } from './types'
import { UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X } from './columns'

const CELL_PADDING_X = 16
/** Pretendard 14 Medium 한글 평균 폭 근사 — Figma 120열(총 교육 학급) 기준 */
const HEADER_CHAR_PX = 12

function headerFits(title: string, columnWidth: number) {
  const contentPx = [...title].length * HEADER_CHAR_PX
  return contentPx + CELL_PADDING_X * 2 <= columnWidth
}

describe('UJAT 임시 배정 기관 확인 테이블 열 폭', () => {
  it('열 폭 합은 Figma 가로 스크롤 최소값 1926과 같다', () => {
    expect(UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS).toHaveLength(6)
    expect(UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X).toBe(
      80 + 260 + 160 + 466 + 120 * 6 + 120 + 120
    )
    expect(UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X).toBe(1926)
  })

  it('헤더·뱃지 문구는 좌우 16px 패딩을 포함해도 열 폭 안에 들어간다', () => {
    expect(headerFits('일정 확인 현황', 160)).toBe(true)
    expect(headerFits('교육 진행 확정 일정', 466)).toBe(true)
    expect(headerFits('총 교육 학급', 120)).toBe(true)
    expect(headerFits('기관 확인 완료', 160)).toBe(true)
    expect(headerFits('기관 확인 중', 160)).toBe(true)
    expect(headerFits('2학급', 120)).toBe(true)
  })
})
