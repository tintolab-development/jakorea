import { afterEach, describe, expect, it } from 'vitest'
import {
  hydrateMissingVolunteerInterviewOverlay,
  listFilledVolunteerInterviewExceptionBlockIds,
  listVolunteerInterviewExceptionBlockIds,
  reconcileVolunteerInterviewExceptionBlockKeys,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

afterEach(() => {
  resetGeneralRecruitOverlayStoreForTests()
})

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

describe('listFilledVolunteerInterviewExceptionBlockIds', () => {
  it('persistMissing 기본값만 있는 빈 예외 블록은 뺀다', () => {
    const ids = listFilledVolunteerInterviewExceptionBlockIds(
      {
        'recruit.volunteer.interview.exception.10.exceptionDate': '2026-11-13',
        'recruit.volunteer.interview.exception.10.selectedSlotKeys': ['1-2'],
        'recruit.volunteer.interview.exception.20.timeUnit': '30',
        'recruit.volunteer.interview.exception.20.exclusionState': { excludeNone: false },
      },
      'recruit'
    )

    expect(ids).toEqual([10])
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

describe('hydrateMissingVolunteerInterviewOverlay', () => {
  it('네임스페이스 밖의 canonical 형제 키도 명시하면 복원한다', () => {
    const rangeSealKey = 'recruit.volunteer.h1.interviewRangeSeal'
    const rangeSeal = {
      start: '2026-10-29T15:00:00.000Z',
      end: '2026-10-29T15:00:00.000Z',
    }

    hydrateMissingVolunteerInterviewOverlay({
      source: {
        [rangeSealKey]: rangeSeal,
        'recruit.volunteer.h1.interview.exception.10.exceptionDate': '2026-10-30',
      },
      store: 'recruit',
      namespace: 'recruit.volunteer.h1.interview',
      additionalKeys: [rangeSealKey],
    })

    expect(getGeneralRecruitOverlayRecord()[rangeSealKey]).toEqual(rangeSeal)
    expect(
      getGeneralRecruitOverlayRecord()['recruit.volunteer.h1.interview.exception.10.exceptionDate']
    ).toBe('2026-10-30')
  })

  it('live 값이 있으면 저장된 값으로 덮어쓰지 않는다', () => {
    const rangeSealKey = 'recruit.volunteer.h1.interviewRangeSeal'
    const liveRangeSeal = {
      start: '2026-11-01T15:00:00.000Z',
      end: '2026-11-01T15:00:00.000Z',
    }

    patchGeneralRecruitOverlay({ [rangeSealKey]: liveRangeSeal })
    hydrateMissingVolunteerInterviewOverlay({
      source: {
        [rangeSealKey]: {
          start: '2026-10-29T15:00:00.000Z',
          end: '2026-10-29T15:00:00.000Z',
        },
      },
      store: 'recruit',
      namespace: 'recruit.volunteer.h1.interview',
      additionalKeys: [rangeSealKey],
    })

    expect(getGeneralRecruitOverlayRecord()[rangeSealKey]).toEqual(liveRangeSeal)
  })
})
