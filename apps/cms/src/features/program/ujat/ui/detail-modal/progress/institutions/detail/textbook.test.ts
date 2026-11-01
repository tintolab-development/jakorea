import { describe, expect, it } from 'vitest'
import {
  calculateGradeTextbookSupply,
  formatGradeTextbookSupplyDisplay,
} from './textbook'

describe('UJAT 진행 기관 교재', () => {
  it('서버 null이면 계산하지 않고 - 를 표시한다', () => {
    const supply = calculateGradeTextbookSupply({
      gradeLabel: '6학년',
      classCount: 2,
      classes: [{ classNo: 1, studentCount: 24 }],
      textbookName: null,
      kitCount: null,
      bookCount: null,
      textbookDeliveryStatus: null,
    })
    expect(supply).toEqual({
      textbookName: '-',
      kitCount: null,
      bookCount: null,
      status: null,
    })
    expect(formatGradeTextbookSupplyDisplay(supply)).toBe('-')
  })

  it('학년 라벨로 교재명을 채우지 않는다', () => {
    const supply = calculateGradeTextbookSupply({
      gradeLabel: '1학년',
      classCount: 1,
      classes: [{ classNo: 1, studentCount: 24 }],
    })
    expect(supply.textbookName).toBe('-')
    expect(supply.kitCount).toBeNull()
  })
})
