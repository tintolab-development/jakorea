import { describe, expect, it } from 'vitest'
import { buildListQueryApiFilters } from './user-list-table.config'

describe('buildListQueryApiFilters', () => {
  it('강사 탭 — rolesExactAnyOf 와 서버 필터를 넣는다', () => {
    const api = buildListQueryApiFilters({
      kind: 'instructors',
      search: '홍길동',
      jaEvaluationGrade: 'A',
      settlementStatus: '계좌 지급 완료',
      createdAtFrom: '2026-01-01',
      createdAtTo: '2026-01-31',
    })
    expect(api.role).toBe('INSTRUCTOR')
    expect(api.rolesExactAnyOf).toBe('general+instructor,instructor+school_teacher')
    expect(api.jaEvaluationGrade).toBe('A')
    expect(api.settlementStatus).toBe('계좌 지급 완료')
    expect(api.search).toBe('홍길동')
  })

  it('학교 탭 — regionSido/regionSigungu 를 넣고 role=SCHOOL', () => {
    const api = buildListQueryApiFilters({
      kind: 'institutions',
      search: '테스트고',
      institutionSido: '서울특별시',
      institutionSigungu: '중구',
      createdAtFrom: '2026-02-01',
      createdAtTo: '2026-02-28',
    })
    expect(api.role).toBe('SCHOOL')
    expect(api.regionSido).toBe('서울특별시')
    expect(api.regionSigungu).toBe('중구')
    expect(api.createdAtFrom).toBe('2026-02-01')
  })
})
