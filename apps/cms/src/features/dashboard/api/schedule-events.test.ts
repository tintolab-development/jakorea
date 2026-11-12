/**
 * 대시보드 프로그램 일정 — 운영·모집 일정 포함 조회(QA-0382)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchSchedulesMock } = vi.hoisted(() => ({ fetchSchedulesMock: vi.fn() }))

vi.mock('@/shared/config/real-api-modules', async importOriginal => ({
  ...(await importOriginal<typeof import('@/shared/config/real-api-modules')>()),
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/entities/user/api/auth-service', async importOriginal => ({
  ...(await importOriginal<typeof import('@/entities/user/api/auth-service')>()),
  hasRemoteAdminSession: () => true,
}))

vi.mock('@/features/dashboard/api/dashboard-api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@/features/dashboard/api/dashboard-api-client')>()),
  fetchDashboardProgramSchedulesRemote: fetchSchedulesMock,
}))

import {
  buildDashboardScheduleEventsParams,
  getDashboardScheduleEvents,
} from '@/features/dashboard/api/admin-dashboard-service'
import { mapScheduleItem } from '@/features/dashboard/api/adapters/dashboard-adapters'

describe('buildDashboardScheduleEventsParams', () => {
  it('includeOperationalEvents=true를 query에 싣는다', () => {
    expect(
      buildDashboardScheduleEventsParams({
        programIds: ['3', '1'],
        dateFrom: '2026-11-01',
        dateTo: '2026-11-30',
        programType: 'general',
        includeOperationalEvents: true,
      })
    ).toEqual({
      programIds: '1,3',
      dateFrom: '2026-11-01',
      dateTo: '2026-11-30',
      programType: 'general',
      includeOperationalEvents: 'true',
    })
  })

  it('옵션이 없으면 includeOperationalEvents를 보내지 않는다', () => {
    expect(buildDashboardScheduleEventsParams({ dateFrom: '2026-11-01' })).toEqual({
      dateFrom: '2026-11-01',
    })
  })
})

describe('getDashboardScheduleEvents', () => {
  beforeEach(() => {
    fetchSchedulesMock.mockReset()
  })

  it('운영·모집 일정을 함께 요청하고 scheduleId 없는 운영 행도 매핑한다', async () => {
    fetchSchedulesMock.mockResolvedValue({
      items: [
        {
          scheduleId: null,
          programId: 7,
          programNameKo: '경제교육',
          scheduleName: '운영 시작',
          startAt: null,
          allDay: true,
          eventType: 'BUSINESS_START',
          eventKey: 'BUSINESS_START:7',
          eventLabel: '운영 시작',
          eventDate: '2026-11-03',
        },
      ],
    })

    const events = await getDashboardScheduleEvents({
      dateFrom: '2026-11-01',
      dateTo: '2026-11-30',
      includeOperationalEvents: true,
    })

    expect(fetchSchedulesMock).toHaveBeenCalledWith({
      dateFrom: '2026-11-01',
      dateTo: '2026-11-30',
      includeOperationalEvents: 'true',
    })
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      id: 'BUSINESS_START:7',
      type: 'operation',
      eventLabel: '운영 시작',
      dateKey: '2026-11-03',
      time: '종일',
      programId: '7',
    })
  })
})

describe('mapScheduleItem eventType (QA-0382)', () => {
  it('운영 시작(종일)은 UTC로 밀리지 않고 eventDate 날짜 칸에 둔다', () => {
    const event = mapScheduleItem({
      programId: 1,
      programNameKo: '경제교육',
      startAt: '2026-11-02T15:00:00Z',
      allDay: true,
      eventType: 'BUSINESS_END',
      eventKey: 'BUSINESS_END:1',
      eventLabel: '운영 종료',
      eventDate: '2026-11-03',
    })
    expect(event).toMatchObject({ type: 'operation', dateKey: '2026-11-03', time: '종일' })
  })

  it('모집 시작·종료는 기존 모집 유형으로 매핑한다', () => {
    const start = mapScheduleItem({
      programId: 1,
      startAt: '2026-11-05T05:00:00Z',
      allDay: false,
      eventType: 'RECRUITMENT_START',
      eventKey: 'RECRUITMENT_START:9',
      eventLabel: '모집 시작',
      eventDate: null,
      recruitmentType: 'PARTICIPANT',
    })
    const end = mapScheduleItem({
      programId: 1,
      startAt: '2026-11-20T05:00:00Z',
      allDay: false,
      eventType: 'RECRUITMENT_END',
      eventKey: 'RECRUITMENT_END:9',
      eventLabel: '모집 종료',
      eventDate: null,
    })
    expect(start).toMatchObject({ id: 'RECRUITMENT_START:9', type: 'recruitment_start' })
    expect(end).toMatchObject({ id: 'RECRUITMENT_END:9', type: 'recruitment_deadline' })
  })

  it('교육 회차는 eventType이 EDUCATION이면 교육으로 둔다(이름에 모집이 있어도)', () => {
    const event = mapScheduleItem({
      scheduleId: 11,
      programId: 1,
      startAt: '2026-11-06T01:00:00Z',
      scheduleName: '모집 시작 안내 교육',
      eventType: 'EDUCATION',
      eventKey: 'EDUCATION:11',
    })
    expect(event).toMatchObject({ id: 'EDUCATION:11', type: 'education' })
  })

  it('eventKey·scheduleId가 모두 없으면 버린다', () => {
    expect(mapScheduleItem({ programId: 1, startAt: '2026-11-06T01:00:00Z' })).toBeNull()
  })
})
