import { describe, expect, it } from 'vitest'
import {
  bulkAttendanceScheduleIdsCacheKey,
  ensureAttendancesByScheduleIdKeys,
  groupAttendancesByScheduleId,
  normalizeBulkAttendanceScheduleIds,
} from './program-attendance-bulk'

describe('normalizeBulkAttendanceScheduleIds', () => {
  it('undefined는 프로그램 전체 조회', () => {
    expect(normalizeBulkAttendanceScheduleIds(undefined)).toEqual({ kind: 'all' })
  })

  it('빈 배열은 전체 조회로 확장하지 않음', () => {
    expect(normalizeBulkAttendanceScheduleIds([])).toEqual({ kind: 'empty' })
  })

  it('중복 제거·정렬', () => {
    expect(normalizeBulkAttendanceScheduleIds(['3', 1, 3, 2])).toEqual({
      kind: 'filtered',
      scheduleIds: [1, 2, 3],
    })
  })
})

describe('groupAttendancesByScheduleId', () => {
  it('scheduleId별 그룹화', () => {
    const grouped = groupAttendancesByScheduleId([
      { scheduleId: 1, participantId: 10, status: 'PRESENT' },
      { scheduleId: 1, participantId: 11, status: 'ABSENT' },
      { scheduleId: 2, participantId: 10, status: 'LATE' },
    ])
    expect(grouped['1']).toHaveLength(2)
    expect(grouped['2']).toHaveLength(1)
  })

  it('1365 필드 보존', () => {
    const grouped = groupAttendancesByScheduleId([
      {
        scheduleId: 5,
        participantId: 1,
        volunteer1365Minutes: 120,
        volunteer1365DurationLabel: '2시간',
      },
    ])
    expect(grouped['5']?.[0]?.volunteer1365Minutes).toBe(120)
    expect(grouped['5']?.[0]?.volunteer1365DurationLabel).toBe('2시간')
  })

  it('미기록 null status 유지', () => {
    const grouped = groupAttendancesByScheduleId([
      { scheduleId: 1, participantId: 2, status: null },
    ])
    expect(grouped['1']?.[0]?.status).toBeNull()
  })
})

describe('ensureAttendancesByScheduleIdKeys', () => {
  it('요청 일정에 빈 배열 키를 채운다', () => {
    const next = ensureAttendancesByScheduleIdKeys({ '1': [] }, [1, 2])
    expect(next['2']).toEqual([])
  })
})

describe('bulkAttendanceScheduleIdsCacheKey', () => {
  it('필터 키는 정렬된 id 문자열', () => {
    expect(
      bulkAttendanceScheduleIdsCacheKey({
        kind: 'filtered',
        scheduleIds: [1, 2, 3],
      })
    ).toBe('1,2,3')
  })
})
