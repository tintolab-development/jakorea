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

  it('routes lecture report deadline events to the lecture-report tab, not write', () => {
    const queryClient = new QueryClient()
    const event: MypageScheduleEvent = {
      id: 'LECTURE_REPORT_DEADLINE:10',
      programName: '강의',
      title: '강의보고서 제출 마감',
      time: '종일',
      type: 'lecture_report_deadline',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      applicationId: '12',
      assignmentId: '10',
      reportStatus: 'AVAILABLE',
    }

    expect(resolveMypageScheduleEventDetailPath(queryClient, event)).toBe(
      '/mypage/lectures/INSTRUCTOR/12?section=lecture-report',
    )
  })

  it('opens submitted lecture report as preview when assignmentId is present', () => {
    const queryClient = new QueryClient()
    const event: MypageScheduleEvent = {
      id: 'LECTURE_REPORT_DEADLINE:10',
      programName: '강의',
      title: '강의보고서 제출 마감',
      time: '종일',
      type: 'lecture_report_deadline',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      applicationId: '12',
      assignmentId: '10',
      reportStatus: 'SUBMITTED',
    }

    expect(resolveMypageScheduleEventDetailPath(queryClient, event)).toBe(
      '/mypage/lectures/INSTRUCTOR/12?section=lecture-report&lectureReportPreviewAssignmentId=10',
    )
  })

  it('routes assignment, survey, receipt, and program events to matching tabs', () => {
    const queryClient = new QueryClient()
    const base = {
      programName: '프로그램',
      title: '일정',
      time: '',
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      applicationId: '501',
      applicationType: 'INDIVIDUAL' as const,
    }

    expect(
      resolveMypageScheduleEventDetailPath(queryClient, {
        ...base,
        id: 'a',
        type: 'assignment',
        formBindingId: '9',
      }),
    ).toBe('/mypage/education/INDIVIDUAL/501?section=assignment&formBindingId=9')
    expect(
      resolveMypageScheduleEventDetailPath(queryClient, {
        ...base,
        id: 's',
        type: 'survey',
        formBindingId: '2',
      }),
    ).toBe('/mypage/education/INDIVIDUAL/501?section=survey&formBindingId=2')
    expect(
      resolveMypageScheduleEventDetailPath(queryClient, {
        ...base,
        id: 'sat',
        type: 'satisfaction',
        formBindingId: '3',
      }),
    ).toBe('/mypage/education/INDIVIDUAL/501?section=satisfaction&formBindingId=3')
    expect(
      resolveMypageScheduleEventDetailPath(queryClient, { ...base, id: 'r', type: 'receipt' }),
    ).toBe('/mypage/education/INDIVIDUAL/501?section=settlement')
  })

  it('does not send instructor receipt deadlines to settlement (지급조서)', () => {
    const queryClient = new QueryClient()
    const event: MypageScheduleEvent = {
      id: 'EXPENSE_RECEIPT_DEADLINE:INSTRUCTOR:12',
      programName: '강의',
      title: '영수증 신청 마감',
      time: '종일',
      type: 'receipt',
      startDate: '2026-11-30',
      endDate: '2026-11-30',
      applicationId: '12',
      applicationType: 'INSTRUCTOR',
    }

    expect(resolveMypageScheduleEventDetailPath(queryClient, event)).toBeNull()
  })
})
