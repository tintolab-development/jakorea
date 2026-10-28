import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { platformQueryKeys } from '../src/shared/api/query-keys'
import { resolveMypageScheduleEventDetailPath } from '../src/features/mypage/home/lib/schedule-event-detail-path'
import type { MypageScheduleEvent } from '../src/features/mypage/home/model/schedule-types'

function seedApplications(
  queryClient: QueryClient,
  items: Array<{ id: string; programId: string; applicationType: 'INDIVIDUAL' | 'INSTRUCTOR' }>,
) {
  queryClient.setQueryData(
    platformQueryKeys.mypage.programApplications.list({
      applicationTypes: ['INDIVIDUAL'],
      statusGroup: '',
      keyword: '',
      page: 0,
      size: 20,
    }),
    { items, totalElements: items.length, totalPages: 1, currentPage: 1, serverPaged: false },
  )
}

describe('resolveMypageScheduleEventDetailPath', () => {
  it('opens education schedule tab when applicationId is on the event', () => {
    const queryClient = new QueryClient()
    const event: MypageScheduleEvent = {
      id: '10',
      programName: '프로그램',
      title: '1회차',
      time: '09:00~10:00',
      type: 'education',
      startDate: '2026-10-27',
      endDate: '2026-10-27',
      applicationId: '501',
      applicationType: 'INDIVIDUAL',
    }

    expect(resolveMypageScheduleEventDetailPath(queryClient, event)).toBe(
      '/mypage/education/INDIVIDUAL/501?section=schedule',
    )
  })

  it('resolves application from programId in the list cache', () => {
    const queryClient = new QueryClient()
    seedApplications(queryClient, [{ id: '88', programId: '186099', applicationType: 'INDIVIDUAL' }])

    const event: MypageScheduleEvent = {
      id: '10',
      programName: '프로그램',
      title: '1회차',
      time: '종일',
      type: 'education',
      startDate: '2026-10-27',
      endDate: '2026-10-27',
      programId: '186099',
    }

    expect(resolveMypageScheduleEventDetailPath(queryClient, event)).toBe(
      '/mypage/education/INDIVIDUAL/88?section=schedule',
    )
  })

  it('routes instructor applications to lecture detail schedule tab', () => {
    const queryClient = new QueryClient()
    const event: MypageScheduleEvent = {
      id: '3',
      programName: '강의',
      title: '2회차',
      time: '14:00~16:00',
      type: 'education',
      startDate: '2026-10-27',
      endDate: '2026-10-27',
      applicationId: '12',
      applicationType: 'INSTRUCTOR',
    }

    expect(resolveMypageScheduleEventDetailPath(queryClient, event)).toBe(
      '/mypage/lectures/INSTRUCTOR/12?section=schedule',
    )
  })
})
