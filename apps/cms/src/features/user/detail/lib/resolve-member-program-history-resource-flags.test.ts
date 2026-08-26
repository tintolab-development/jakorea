import { describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import {
  fetchMemberProgramHistoryTabResources,
  resolveActiveProgramHistoryTabLoading,
  resolveMemberProgramHistoryResourceFlags,
} from './resolve-member-program-history-resource-flags'

vi.mock('@/features/user/api/hooks/use-member-detail-subresource-queries', () => ({
  fetchMemberApplicationsQuery: vi.fn().mockResolvedValue([]),
  fetchMemberProgramHistoryQuery: vi.fn().mockResolvedValue({
    volunteerHistories: [],
    enrollmentFromHistory: [],
  }),
}))

import {
  fetchMemberApplicationsQuery,
  fetchMemberProgramHistoryQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'

describe('resolveMemberProgramHistoryResourceFlags', () => {
  it('history 탭 밖에서는 모두 false', () => {
    expect(
      resolveMemberProgramHistoryResourceFlags({
        historyTabActive: false,
        programsChild: 'enrollment',
        hasProgramsChildMenu: true,
      })
    ).toEqual({ loadApplications: false, loadProgramHistory: false })
  })

  it('수강 child — applications만', () => {
    expect(
      resolveMemberProgramHistoryResourceFlags({
        historyTabActive: true,
        programsChild: 'enrollment',
        hasProgramsChildMenu: true,
      })
    ).toEqual({ loadApplications: true, loadProgramHistory: false })
  })

  it('강의 child — applications만', () => {
    expect(
      resolveMemberProgramHistoryResourceFlags({
        historyTabActive: true,
        programsChild: 'lecture',
        hasProgramsChildMenu: true,
      })
    ).toEqual({ loadApplications: true, loadProgramHistory: false })
  })

  it('교사(school_teacher) + 강의 child — fetch 없음', () => {
    expect(
      resolveMemberProgramHistoryResourceFlags({
        historyTabActive: true,
        programsChild: 'lecture',
        hasProgramsChildMenu: true,
        instructorMemberProfile: 'school_teacher',
      })
    ).toEqual({ loadApplications: false, loadProgramHistory: false })
  })

  it('봉사 child — program-history만', () => {
    expect(
      resolveMemberProgramHistoryResourceFlags({
        historyTabActive: true,
        programsChild: 'volunteer',
        hasProgramsChildMenu: true,
      })
    ).toEqual({ loadApplications: false, loadProgramHistory: true })
  })
})

describe('resolveActiveProgramHistoryTabLoading', () => {
  it('활성 child에 해당하는 loading만 반환', () => {
    expect(
      resolveActiveProgramHistoryTabLoading({
        programsChild: 'volunteer',
        hasProgramsChildMenu: true,
        enrollmentTabLoading: true,
        lectureTabLoading: true,
        volunteerTabLoading: false,
      })
    ).toBe(false)
  })
})

describe('fetchMemberProgramHistoryTabResources', () => {
  it('수강 child — applications fetch만', async () => {
    const queryClient = {} as QueryClient

    await fetchMemberProgramHistoryTabResources(queryClient, {
      memberId: 42,
      userId: 'user-42',
      historyTabActive: true,
      programsChild: 'enrollment',
      hasProgramsChildMenu: true,
    })

    expect(fetchMemberApplicationsQuery).toHaveBeenCalledWith(queryClient, 42, 'user-42')
    expect(fetchMemberProgramHistoryQuery).not.toHaveBeenCalled()
  })

  it('봉사 child — program-history fetch만', async () => {
    const queryClient = {} as QueryClient
    vi.mocked(fetchMemberApplicationsQuery).mockClear()
    vi.mocked(fetchMemberProgramHistoryQuery).mockClear()

    await fetchMemberProgramHistoryTabResources(queryClient, {
      memberId: 7,
      userId: 'user-7',
      historyTabActive: true,
      programsChild: 'volunteer',
      hasProgramsChildMenu: true,
    })

    expect(fetchMemberApplicationsQuery).not.toHaveBeenCalled()
    expect(fetchMemberProgramHistoryQuery).toHaveBeenCalledWith(queryClient, 7, 'user-7')
  })

  it('history 탭 밖이면 fetch하지 않음', async () => {
    const queryClient = {} as QueryClient
    vi.mocked(fetchMemberApplicationsQuery).mockClear()
    vi.mocked(fetchMemberProgramHistoryQuery).mockClear()

    await fetchMemberProgramHistoryTabResources(queryClient, {
      memberId: 1,
      userId: 'user-1',
      historyTabActive: false,
      programsChild: 'enrollment',
      hasProgramsChildMenu: true,
    })

    expect(fetchMemberApplicationsQuery).not.toHaveBeenCalled()
    expect(fetchMemberProgramHistoryQuery).not.toHaveBeenCalled()
  })
})
