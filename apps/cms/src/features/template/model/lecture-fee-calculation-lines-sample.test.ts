import { describe, expect, it } from 'vitest'
import {
  LECTURE_FEE_CALCULATION_LINES_SAMPLE,
  LECTURE_FEE_CALCULATION_LINES_SAMPLE_DATE_PLACEHOLDER,
  LECTURE_FEE_CALCULATION_LINES_SAMPLE_INSTITUTION_PLACEHOLDER,
} from './lecture-fee-calculation-lines-sample'

describe('LECTURE_FEE_CALCULATION_LINES_SAMPLE (양식 관리 지급조서 견본)', () => {
  const lines = LECTURE_FEE_CALCULATION_LINES_SAMPLE.blocks.flatMap(block => block.lines)

  it('shows every amount, including withholding (QA-0290)', () => {
    expect(lines.some(line => line.amountDisplayOverride != null)).toBe(false)
    expect(JSON.stringify(LECTURE_FEE_CALCULATION_LINES_SAMPLE)).not.toContain('NN,NNN')
  })

  it('totals gross payment minus deductions (QA-0290)', () => {
    const gross = lines.filter(line => line.amount > 0).reduce((sum, line) => sum + line.amount, 0)
    const deduction = lines
      .filter(line => line.amount < 0)
      .reduce((sum, line) => sum + Math.abs(line.amount), 0)
    expect(gross).toBe(415_000)
    expect(deduction).toBe(36_520)
    expect(LECTURE_FEE_CALCULATION_LINES_SAMPLE.totalAmount).toBe(gross - deduction)
    expect(LECTURE_FEE_CALCULATION_LINES_SAMPLE.totalAmount).toBe(
      lines.reduce((sum, line) => sum + line.amount, 0)
    )
  })

  it('uses placeholders instead of a real institution name and date (QA-0171)', () => {
    const [block] = LECTURE_FEE_CALCULATION_LINES_SAMPLE.blocks
    expect(block?.institutionName).toBe(LECTURE_FEE_CALCULATION_LINES_SAMPLE_INSTITUTION_PLACEHOLDER)
    expect(block?.lectureDateDisplay).toBe(LECTURE_FEE_CALCULATION_LINES_SAMPLE_DATE_PLACEHOLDER)
    const serialized = JSON.stringify(LECTURE_FEE_CALCULATION_LINES_SAMPLE)
    expect(serialized).not.toContain('강서초등학교')
    expect(serialized).not.toMatch(/\d{4}\. \d{2}\. \d{2}/)
  })
})
