/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'

const { customInstanceMock, notifyMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
  notifyMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

vi.mock('@/features/program/shared/lib/program-api-unavailable', () => ({
  useNotifyProgramApiUnavailableOnce: notifyMock,
}))

vi.mock('@/features/program/general/api/individual-settlement-review-remote', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/program/general/api/individual-settlement-review-remote')>()
  return { ...actual, isIndividualSettlementReviewRemoteEnabled: () => true }
})

import { useVolunteerReceiptSettlementList } from './use-volunteer-receipt-settlement-list'

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function page(items: unknown[]) {
  return { success: true, data: { items, page: 0, size: 100, totalPages: 1 } }
}

const session = (scheduleId: number): ParticipatingSchoolSession => ({
  round: 1,
  date: '2026.11.06',
  dayOfWeek: '금',
  duration: '60분',
  format: '오프라인',
  classNum: '1회차',
  timeRange: '10:00 ~ 11:00',
  resolvedScheduleId: scheduleId,
})

describe('useVolunteerReceiptSettlementList', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
    notifyMock.mockReset()
  })

  it('UJAT: shows only that volunteer application settlements, without assigned sessions', async () => {
    customInstanceMock.mockResolvedValueOnce(
      page([
        {
          settlementApplicationId: 11,
          programScheduleId: 187580,
          scheduleName: '2026.11.06(금)',
          status: 'SUBMITTED',
          totalAmount: 8000,
          applicationType: 'VOLUNTEER',
          volunteerApplicationId: 1691646,
        },
        {
          settlementApplicationId: 12,
          programScheduleId: 187580,
          status: 'SUBMITTED',
          applicationType: 'VOLUNTEER',
          volunteerApplicationId: 1691675,
        },
      ])
    )
    const client = new QueryClient()
    const { result } = renderHook(
      () =>
        useVolunteerReceiptSettlementList({
          programId: '186495',
          target: { kind: 'volunteerApplication', volunteerApplicationId: '1691646' },
          unavailableNoticeKey: 'test',
        }),
      { wrapper: wrapper(client) }
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows.map(row => row.settlementApplicationId)).toEqual([11])
    expect(result.current.summary.submitted).toBe(1)
    expect(result.current.reviewKey).toBe('volunteer-application:1691646')
    expect(customInstanceMock.mock.calls[0]?.[0].params).toMatchObject({
      programId: 186495,
      applicationType: 'VOLUNTEER',
    })
  })

  it('general: queries by participantId and lays rows on assigned sessions', async () => {
    customInstanceMock.mockResolvedValueOnce(
      page([
        {
          settlementApplicationId: 21,
          programScheduleId: 501,
          status: 'APPROVED',
          applicationType: 'VOLUNTEER',
          volunteerApplicationId: 900,
        },
      ])
    )
    const client = new QueryClient()
    const { result } = renderHook(
      () =>
        useVolunteerReceiptSettlementList({
          programId: '186408',
          target: { kind: 'participant', participantId: '55' },
          assignedSessions: [session(501), session(502)],
          unavailableNoticeKey: 'test',
        }),
      { wrapper: wrapper(client) }
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.rows.map(row => [row.programScheduleId, row.settlementApplicationId])).toEqual([
      [501, 21],
      [502, null],
    ])
    expect(customInstanceMock.mock.calls[0]?.[0].params).toMatchObject({
      participantId: 55,
      applicationType: 'VOLUNTEER',
    })
  })

  it('does not query a mock (non-numeric) volunteer id', () => {
    const client = new QueryClient()
    const { result } = renderHook(
      () =>
        useVolunteerReceiptSettlementList({
          programId: '186495',
          target: { kind: 'volunteerApplication', volunteerApplicationId: '' },
          unavailableNoticeKey: 'test',
        }),
      { wrapper: wrapper(client) }
    )
    expect(result.current.isLoading).toBe(false)
    expect(result.current.rows).toEqual([])
    expect(customInstanceMock).not.toHaveBeenCalled()
  })
})
