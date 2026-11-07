import { describe, expect, it } from 'vitest'
import { unwrapDashboardBody } from './unwrap-dashboard-body'
import {
  normalizeDashboardProgramIds,
  toDashboardQueryParams,
} from './dashboard-api-client'

describe('unwrapDashboardBody', () => {
  it('최상위 programCount DTO는 래퍼로 보지 않는다', () => {
    const dto = { version: 'v9', programCount: 2, memberCount: 100, unreadNotificationCount: 0 }
    expect(unwrapDashboardBody(dto)).toEqual(dto)
  })

  it('{ success, data } envelope만 벗긴다', () => {
    expect(
      unwrapDashboardBody({
        success: true,
        data: { version: 'v9', programCount: 2, memberCount: 100, unreadNotificationCount: 0 },
      })
    ).toEqual({ version: 'v9', programCount: 2, memberCount: 100, unreadNotificationCount: 0 })
  })

  it('items가 최상위에 있으면 data 중첩을 가정하지 않는다', () => {
    const dto = { items: [], totalCount: 0 }
    expect(unwrapDashboardBody(dto)).toEqual(dto)
  })
})

describe('normalizeDashboardProgramIds / toDashboardQueryParams', () => {
  it('빈 배열은 전체 조회로 생략한다', () => {
    expect(normalizeDashboardProgramIds([])).toBeUndefined()
    expect(toDashboardQueryParams({ programIds: [] })).toEqual({})
  })

  it('동일 집합은 순서·중복과 무관하게 같은 query를 만든다', () => {
    expect(toDashboardQueryParams({ programIds: ['b', 'a', 'b'] })).toEqual(
      toDashboardQueryParams({ programIds: ['a', 'b'] })
    )
    expect(normalizeDashboardProgramIds(['2', '1'])).toEqual(['1', '2'])
  })
})
