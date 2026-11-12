import { describe, expect, it } from 'vitest'
import { mapSecondInterviewStatusToFinalResultPayload } from '@/features/program/general/api/admin-applications-service'
import {
  isVolunteerAssignmentSlotBlocked,
  mapVolunteerAssignmentCandidatesToSlots,
  readVolunteerFinalPassAssignmentErrorAlert,
  toVolunteerFinalPassAssignments,
  toggleVolunteerAssignmentSlot,
} from './volunteer-final-pass-assignment'

const candidate = (over: Record<string, unknown> = {}) => ({
  scheduleId: 187708,
  scheduleName: '1회차',
  sessionNo: 1,
  scheduleStartAt: '2026-11-21T01:00:00Z',
  scheduleEndAt: '2026-11-21T04:00:00Z',
  organizationApplicationId: 1691602,
  organizationId: 5001,
  organizationName: '제이초등학교',
  regionSido: '서울특별시',
  regionSigungu: '강남구',
  assignedVolunteerCount: 0,
  requiredVolunteerCount: null,
  ...over,
})

describe('mapVolunteerAssignmentCandidatesToSlots', () => {
  it('UTC 시각을 서울 날짜·시간으로 바꾸고 회차·지역·태그를 만든다', () => {
    const [slot] = mapVolunteerAssignmentCandidatesToSlots([candidate()])
    expect(slot).toMatchObject({
      key: '187708:1691602',
      dateKey: '2026-11-21',
      timeRange: '10:00 ~ 13:00',
      sessionLabel: '1회차',
      region: '서울특별시 강남구',
      assignedCount: 0,
      tagLabel: '2026.11.21(토) 제이초등학교',
    })
  })

  it('UTC 자정 전후로 서울 날짜가 바뀌면 서울 날짜를 쓴다', () => {
    const [slot] = mapVolunteerAssignmentCandidatesToSlots([
      candidate({ scheduleStartAt: '2026-11-20T23:30:00Z', scheduleEndAt: null }),
    ])
    expect(slot?.dateKey).toBe('2026-11-21')
    expect(slot?.timeRange).toBe('08:30')
  })

  it('회차 없음·지역 없음은 회차 생략·`-`', () => {
    const [slot] = mapVolunteerAssignmentCandidatesToSlots([
      candidate({ sessionNo: null, regionSido: null, regionSigungu: null }),
    ])
    expect(slot?.sessionLabel).toBe('')
    expect(slot?.region).toBe('-')
  })

  it('필수 id·시작 시각이 없는 행은 버린다', () => {
    expect(
      mapVolunteerAssignmentCandidatesToSlots([
        candidate({ scheduleId: undefined }),
        candidate({ organizationApplicationId: undefined }),
        candidate({ scheduleStartAt: undefined }),
      ])
    ).toEqual([])
  })
})

describe('하루 1기관 선택 규칙', () => {
  const slots = mapVolunteerAssignmentCandidatesToSlots([
    candidate(),
    candidate({ scheduleId: 187709, sessionNo: 2, scheduleStartAt: '2026-11-21T05:00:00Z' }),
    candidate({ organizationApplicationId: 1691603, organizationName: '리라초등학교' }),
    candidate({
      scheduleId: 187710,
      organizationApplicationId: 1691603,
      organizationName: '리라초등학교',
      scheduleStartAt: '2026-11-22T01:00:00Z',
    }),
  ])
  const [jeiFirst, jeiSecond, liraSameDay, liraNextDay] = slots

  it('같은 날 같은 기관의 다른 회차는 함께 고를 수 있다', () => {
    const selected = toggleVolunteerAssignmentSlot([jeiFirst!], jeiSecond!)
    expect(selected.map(s => s.key)).toEqual([jeiFirst!.key, jeiSecond!.key])
  })

  it('같은 날 다른 기관은 막고, 다른 날은 허용한다', () => {
    expect(isVolunteerAssignmentSlotBlocked(liraSameDay!, [jeiFirst!])).toBe(true)
    expect(toggleVolunteerAssignmentSlot([jeiFirst!], liraSameDay!)).toEqual([jeiFirst])
    expect(toggleVolunteerAssignmentSlot([jeiFirst!], liraNextDay!).map(s => s.key)).toEqual([
      jeiFirst!.key,
      liraNextDay!.key,
    ])
  })

  it('이미 고른 슬롯을 다시 누르면 해제한다', () => {
    expect(toggleVolunteerAssignmentSlot([jeiFirst!], jeiFirst!)).toEqual([])
  })
})

describe('toVolunteerFinalPassAssignments', () => {
  it('선택이 없으면 필드를 생략(undefined)한다', () => {
    expect(toVolunteerFinalPassAssignments([])).toBeUndefined()
  })

  it('scheduleId·organizationApplicationId만 보낸다', () => {
    const [slot] = mapVolunteerAssignmentCandidatesToSlots([candidate()])
    expect(toVolunteerFinalPassAssignments([slot!])).toEqual([
      { scheduleId: 187708, organizationApplicationId: 1691602 },
    ])
  })
})

describe('readVolunteerFinalPassAssignmentErrorAlert', () => {
  const apiError = (code: string, message: string) => ({
    response: { status: 409, data: { error: { code, message } } },
  })

  it('배정 관련 코드는 「기관 배정 실패」 + 서버 메시지 + 합격 미처리 안내', () => {
    const alert = readVolunteerFinalPassAssignmentErrorAlert(
      apiError('VOLUNTEER_ASSIGNMENT_SCHEDULE_CONFLICT', '같은 날 다른 기관에 배정되어 있습니다.')
    )
    expect(alert?.title).toBe('기관 배정 실패')
    expect(alert?.content).toContain('같은 날 다른 기관에 배정되어 있습니다.')
    expect(alert?.content).toContain('합격도 처리되지 않았습니다')
  })

  it('배정과 무관한 코드는 null(기존 합격 실패 안내 사용)', () => {
    expect(
      readVolunteerFinalPassAssignmentErrorAlert(apiError('APPLICATION_DECISION_CONFLICT', '충돌'))
    ).toBeNull()
  })
})

describe('mapSecondInterviewStatusToFinalResultPayload — assignments', () => {
  const assignments = [{ scheduleId: 187708, organizationApplicationId: 1691602 }]

  it('PASS에만 assignments를 싣는다', () => {
    expect(
      mapSecondInterviewStatusToFinalResultPayload('pass', undefined, undefined, assignments)
    ).toMatchObject({ result: 'PASS', assignments })
    expect(
      mapSecondInterviewStatusToFinalResultPayload('reserve1', undefined, undefined, assignments)
    ).not.toHaveProperty('assignments')
    expect(
      mapSecondInterviewStatusToFinalResultPayload('fail', '사유', undefined, assignments)
    ).not.toHaveProperty('assignments')
  })

  it('빈 배열이면 필드를 생략한다(합격만 처리)', () => {
    expect(mapSecondInterviewStatusToFinalResultPayload('pass', undefined, undefined, [])).not.toHaveProperty(
      'assignments'
    )
  })
})
