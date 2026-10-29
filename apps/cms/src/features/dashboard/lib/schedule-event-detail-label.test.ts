import { describe, expect, it } from 'vitest'
import { buildScheduleEventDetailLabel } from './schedule-event-detail-label'

describe('buildScheduleEventDetailLabel', () => {
  it('기관 1곳: 기관명 회차 일정명', () => {
    expect(
      buildScheduleEventDetailLabel({
        type: 'education',
        organizationName: '강서초등학교',
        organizationCount: 1,
        sessionNo: 1,
        scheduleName: '교육',
      })
    ).toBe('강서초등학교 1회차 교육')
  })

  it('기관 여러 곳: 첫 기관명 외 N곳', () => {
    expect(
      buildScheduleEventDetailLabel({
        type: 'education',
        organizationName: '강서초등학교',
        organizationCount: 3,
        sessionNo: 2,
        scheduleName: '교육',
      })
    ).toBe('강서초등학교 외 2곳 2회차 교육')
  })

  it('기관 정보 없음(BE 필드 미제공): 회차 일정명', () => {
    expect(buildScheduleEventDetailLabel({ type: 'education', sessionNo: 3, scheduleName: '발대식' })).toBe(
      '3회차 발대식'
    )
  })

  it('회차 없음: 회차 부분 생략', () => {
    expect(
      buildScheduleEventDetailLabel({ type: 'education', organizationName: '강서초등학교', scheduleName: '교육' })
    ).toBe('강서초등학교 교육')
  })

  it('자동 기본명(공통 교육 예정 N)은 일정명에서 제외', () => {
    expect(
      buildScheduleEventDetailLabel({
        type: 'education',
        organizationName: '강서초등학교',
        sessionNo: 1,
        scheduleName: '공통 교육 예정 1',
      })
    ).toBe('강서초등학교 1회차')
  })

  it('표시할 내용이 없으면 undefined', () => {
    expect(buildScheduleEventDetailLabel({ type: 'education', scheduleName: '공통 교육 예정 2' })).toBeUndefined()
    expect(
      buildScheduleEventDetailLabel({ type: 'education', sessionNo: 0, organizationName: '  ', scheduleName: null })
    ).toBeUndefined()
  })

  it('모집 일정: 일정명만', () => {
    expect(
      buildScheduleEventDetailLabel({
        type: 'recruitment_start',
        organizationName: '강서초등학교',
        sessionNo: 1,
        scheduleName: '참여자 모집 시작',
      })
    ).toBe('참여자 모집 시작')
    expect(buildScheduleEventDetailLabel({ type: 'recruitment_deadline', scheduleName: '' })).toBeUndefined()
  })
})

describe('mapScheduleItem detailLabel', () => {
  it('BE 기관 필드 없이도 회차·일정명으로 라벨 생성', async () => {
    const { mapScheduleItem } = await import('@/features/dashboard/api/adapters/dashboard-adapters')
    const event = mapScheduleItem({
      scheduleId: 1,
      programId: 2,
      startAt: '2026-11-06T09:38:00Z',
      sessionNo: 1,
      scheduleName: '교육',
      programNameKo: '경제교육',
    })
    expect(event?.detailLabel).toBe('1회차 교육')
    expect(event?.organizationName).toBeNull()
  })

  it('BE 기관 필드가 오면 기관명 포함', async () => {
    const { mapScheduleItem } = await import('@/features/dashboard/api/adapters/dashboard-adapters')
    const event = mapScheduleItem({
      scheduleId: 1,
      programId: 2,
      startAt: '2026-11-06T09:38:00Z',
      sessionNo: 1,
      scheduleName: '교육',
      organizationName: '강서초등학교',
      organizationCount: 2,
    })
    expect(event?.detailLabel).toBe('강서초등학교 외 1곳 1회차 교육')
  })
})
