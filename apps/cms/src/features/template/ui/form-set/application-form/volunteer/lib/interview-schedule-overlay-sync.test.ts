import { describe, expect, it } from 'vitest'
import {
  listVolunteerInterviewExceptionBlockIds,
  reconcileVolunteerInterviewExceptionBlockKeys,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'

describe('listVolunteerInterviewExceptionBlockIds', () => {
  it('예외 블록 id만 추가 순서로 읽는다', () => {
    const ids = listVolunteerInterviewExceptionBlockIds(
      {
        'recruit.volunteer.interview.exceptionDate': '2026-03-01',
        'recruit.volunteer.interview.exception.20.exceptionDate': '2026-03-02',
        'recruit.volunteer.interview.exception.10.selectedSlotKeys': ['1-2'],
        'recruit.volunteer.h1.interview.exception.30.exceptionDate': '2026-03-03',
      },
      'recruit'
    )

    expect(ids).toEqual([20, 10])
  })
})

describe('reconcileVolunteerInterviewExceptionBlockKeys', () => {
  it('다시 열 때 저장된 id를 유지한다', () => {
    expect(
      reconcileVolunteerInterviewExceptionBlockKeys({
        previous: [],
        saved: [10, 20],
        count: 2,
      })
    ).toEqual([10, 20])
  })

  it('개수가 아직 0이어도 저장된 예외 일정을 보여 준다', () => {
    expect(
      reconcileVolunteerInterviewExceptionBlockKeys({
        previous: [],
        saved: [10],
        count: 0,
      })
    ).toEqual([10])
  })

  it('저장된 블록보다 많이 추가하면 새 id만 붙인다', () => {
    const next = reconcileVolunteerInterviewExceptionBlockKeys({
      previous: [10],
      saved: [10],
      count: 2,
    })

    expect(next[0]).toBe(10)
    expect(next).toHaveLength(2)
    expect(next[1]).not.toBe(10)
  })

  it('복원된 블록은 개수가 따라오기 전에 잘라내지 않는다', () => {
    expect(
      reconcileVolunteerInterviewExceptionBlockKeys({
        previous: [10, 20],
        saved: [10, 20],
        count: 1,
      })
    ).toEqual([10, 20])
  })
})
