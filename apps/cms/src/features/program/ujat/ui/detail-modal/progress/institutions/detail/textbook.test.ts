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
    expect(supply.bookCount).toBeNull()
  })

  it('준비 수량은 학년 학급별 학생 수 합계(1인 1권)이고 서버 키트·권수는 쓰지 않는다', () => {
    const supply = calculateGradeTextbookSupply({
      gradeLabel: '2학년',
      classCount: 3,
      classes: [
        { classNo: 1, studentCount: 28 },
        { classNo: 2, studentCount: 24 },
        { classNo: 3, studentCount: 0 },
      ],
      textbookName: '경제야 놀자',
      kitCount: 3,
      bookCount: 72,
      textbookDeliveryStatus: 'PREPARING',
    })
    expect(supply).toEqual({ textbookName: '경제야 놀자', bookCount: 52, status: 'preparing' })
    expect(formatGradeTextbookSupplyDisplay(supply)).toBe('경제야 놀자 | 52권')
  })

  it('학생 수가 없으면 교재명만 표시한다', () => {
    const supply = calculateGradeTextbookSupply({
      gradeLabel: '3학년',
      classCount: 1,
      classes: [],
      textbookName: '경제야 놀자',
    })
    expect(formatGradeTextbookSupplyDisplay(supply)).toBe('경제야 놀자')
  })
})
