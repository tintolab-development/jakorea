import { describe, expect, it } from 'vitest'
import { buildUjatProgressYearFieldOptions, UJAT_PROGRESS_YEAR_ALL } from './progress-year-options'

describe('buildUjatProgressYearFieldOptions', () => {
  it('API 연도 순서를 유지하고 전체만 앞에 둔다', () => {
    expect(buildUjatProgressYearFieldOptions([2026, 2025])).toEqual([
      { label: '전체', value: UJAT_PROGRESS_YEAR_ALL },
      { label: '2026년', value: 2026 },
      { label: '2025년', value: 2025 },
    ])
  })

  it('빈 배열이면 연도 선택지를 만들지 않는다', () => {
    expect(buildUjatProgressYearFieldOptions([])).toEqual([
      { label: '전체', value: UJAT_PROGRESS_YEAR_ALL },
    ])
  })
})
