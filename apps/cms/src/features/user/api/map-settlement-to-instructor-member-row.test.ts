import { describe, expect, it } from 'vitest'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import {
  mapSettlementItemToInstructorMemberRow,
  mapSettlementsToInstructorMemberRows,
} from './map-settlement-to-instructor-member-row'

function baseItem(overrides: Partial<SettlementListItemResponse> = {}): SettlementListItemResponse {
  return {
    settlementId: 100,
    programNameKo: '테스트 프로그램',
    ...overrides,
  }
}

describe('mapSettlementItemToInstructorMemberRow statementId', () => {
  it('목록 DTO의 statementId를 우선 사용한다', () => {
    const join = new Map<number, number>([[100, 999]])
    const row = mapSettlementItemToInstructorMemberRow(
      baseItem({ statementId: 42 }),
      0,
      join
    )
    expect(row?.statementId).toBe(42)
  })

  it('목록에 없으면 join Map을 사용한다', () => {
    const join = new Map<number, number>([[100, 77]])
    const row = mapSettlementItemToInstructorMemberRow(baseItem(), 0, join)
    expect(row?.statementId).toBe(77)
  })

  it('둘 다 없으면 statementId는 undefined', () => {
    const row = mapSettlementItemToInstructorMemberRow(baseItem(), 0)
    expect(row?.statementId).toBeUndefined()
  })
})

describe('mapSettlementsToInstructorMemberRows', () => {
  it('여러 행에 statementId 매핑을 적용한다', () => {
    const rows = mapSettlementsToInstructorMemberRows(
      [baseItem({ settlementId: 1, statementId: 10 }), baseItem({ settlementId: 2 })],
      new Map([[2, 20]])
    )
    expect(rows[0]?.statementId).toBe(10)
    expect(rows[1]?.statementId).toBe(20)
  })
})
