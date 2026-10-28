import { describe, expect, it } from 'vitest'
import {
  FILTER_CONTROL_MAX_WIDTH_PX,
  FILTER_CONTROL_WIDE_FIELD_WIDTH_PX,
  isFilterFieldPctWidth,
} from '@/shared/components/table-filter-group-field-width'
import { GEMINI_APPROVED_TRAINING_FILTER_FIELDS } from './approved/filter-fields'
import { GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS } from './approved/instructor-application-filter-fields'
import { GEMINI_PERFORMANCE_FILTER_FIELDS } from './performance/filter-fields'
import { GEMINI_RECRUITMENT_FILTER_FIELDS } from './recruitment/filter-fields'

describe('Gemini list filter fields', () => {
  it.each([
    ['recruitment', GEMINI_RECRUITMENT_FILTER_FIELDS],
    ['approved', GEMINI_APPROVED_TRAINING_FILTER_FIELDS],
    ['performance', GEMINI_PERFORMANCE_FILTER_FIELDS],
    ['instructor-application', GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS],
  ] as const)('%s 필드는 퍼센트 비율 폭을 쓰지 않는다', (_name, fields) => {
    expect(fields.some(isFilterFieldPctWidth)).toBe(false)
    for (const field of fields) {
      expect(typeof field.width).toBe('number')
    }
  })

  it('단일 검색·셀렉트는 240, dateRange는 500이다', () => {
    const dateRange = GEMINI_PERFORMANCE_FILTER_FIELDS.find(field => field.type === 'dateRange')
    const search = GEMINI_PERFORMANCE_FILTER_FIELDS.find(field => field.type === 'search')

    expect(search?.width).toBe(FILTER_CONTROL_MAX_WIDTH_PX)
    expect(dateRange?.width).toBe(FILTER_CONTROL_WIDE_FIELD_WIDTH_PX)
  })
})
