import { describe, expect, it } from 'vitest'
import {
  buildUjatAcknowledgedScheduleNavigateState,
  canAcknowledgeDisplayedUjatSchedule,
  hasUjatScheduleRevisionDrift,
  isPositiveIntegerRevision,
  isValidUjatAcknowledgedScheduleForApplication,
  readUjatAcknowledgedScheduleFromLocationState,
  UJAT_ACKNOWLEDGED_SCHEDULE_STATE_KEY,
} from '../src/features/mypage/education/applications/lib/ujat-acknowledged-schedule'

describe('ujat acknowledged schedule', () => {
  it('R101: 유효한 location state를 읽는다', () => {
    const state = buildUjatAcknowledgedScheduleNavigateState({
      applicationId: '1691467',
      assignmentRevision: 1,
    })
    expect(readUjatAcknowledgedScheduleFromLocationState(state)).toEqual({
      applicationId: '1691467',
      assignmentRevision: 1,
    })
  })

  it('R105: revision undefined/null/NaN은 유효하지 않다', () => {
    expect(isPositiveIntegerRevision(undefined)).toBe(false)
    expect(isPositiveIntegerRevision(null)).toBe(false)
    expect(isPositiveIntegerRevision(Number.NaN)).toBe(false)
    expect(
      readUjatAcknowledgedScheduleFromLocationState({
        [UJAT_ACKNOWLEDGED_SCHEDULE_STATE_KEY]: {
          applicationId: '1',
          assignmentRevision: Number.NaN,
        },
      }),
    ).toBeNull()
  })

  it('R110: 신청 ID가 다르면 확인 revision을 쓰지 않는다', () => {
    expect(
      isValidUjatAcknowledgedScheduleForApplication(
        { applicationId: 'A', assignmentRevision: 1 },
        'B',
      ),
    ).toBe(false)
  })

  it('R102/R106: 서버 revision이 바뀌면 drift로 판단한다', () => {
    const acknowledged = { applicationId: '1', assignmentRevision: 1 }
    expect(hasUjatScheduleRevisionDrift(acknowledged, 2)).toBe(true)
    expect(hasUjatScheduleRevisionDrift(acknowledged, 1)).toBe(false)
  })

  it('R103/R104: location state 없으면 확인 revision을 읽지 않는다', () => {
    expect(readUjatAcknowledgedScheduleFromLocationState(null)).toBeNull()
    expect(readUjatAcknowledgedScheduleFromLocationState(undefined)).toBeNull()
    expect(readUjatAcknowledgedScheduleFromLocationState({})).toBeNull()
    expect(isValidUjatAcknowledgedScheduleForApplication(null, '1691467')).toBe(false)
  })

  it('revision만 있으면 확인 가능(배정 카드·slots 불필요)', () => {
    expect(
      canAcknowledgeDisplayedUjatSchedule({
        assignmentRevision: 1,
        temporarySchedule: { slots: [] },
      }),
    ).toBe(true)
    expect(
      canAcknowledgeDisplayedUjatSchedule({
        assignmentRevision: undefined,
        temporarySchedule: {
          slots: [{ scheduleId: 1, scheduleStartAt: '2027-03-12T10:00:00+09:00' }],
        },
      }),
    ).toBe(false)
  })
})
