/** @vitest-environment jsdom */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bulkUpsertUjatAttendances,
  postUjatDirectAssignment,
  postUjatPartnerAssignmentCancel,
  postUjatPartnerAssignmentConfirm,
} from '@/features/program/ujat/api/education-execution-api'
import { queryKeys } from '@/features/program/ujat/api/query-keys'
import { loadVolunteerAssignmentProgress } from './assignment-progress-load'
import { useVolunteerAssignmentProgress } from './use-assignment-progress'
import type { UjatVolunteerAssignmentProgressRow } from './assignment-types'

const alerts = vi.hoisted(() => ({ showAlert: vi.fn() }))

vi.mock('@/shared/ui', () => ({
  useCmsAlert: () => ({ showAlert: alerts.showAlert }),
}))

vi.mock('@/features/program/shared/lib/program-api-unavailable', () => ({
  useNotifyProgramApiUnavailableOnce: vi.fn(),
}))

vi.mock('@/features/program/ujat/api/applications-remote-capabilities', () => ({
  shouldUseUjatApplicationsRemoteApi: () => true,
}))

vi.mock('./assignment-progress-load', () => ({
  loadVolunteerAssignmentProgress: vi.fn(),
}))

vi.mock('@/features/program/ujat/api/education-execution-api', () => ({
  postUjatPartnerAssignmentCancel: vi.fn(),
  postUjatPartnerAssignmentConfirm: vi.fn(),
  postUjatDirectAssignment: vi.fn(),
  bulkUpsertUjatAttendances: vi.fn(),
}))

const row: UjatVolunteerAssignmentProgressRow = {
  id: 'col-1',
  scheduleLabel: '2026.05.08(금)',
  role: 'none',
  assignedInstitution: { kind: 'dash' },
  partner: { kind: 'dash' },
  classDisplay: { kind: 'dash' },
  attendance: { kind: 'dash' },
  educationPlanSubmitted: false,
  educationLogSubmitted: false,
  educationProgress: 'dash',
  isWithdrawn: false,
  scheduleId: 10,
  participantId: 7,
  educationSlotId: null,
  assignmentGroupId: 'grp-1',
  organizationApplicationId: 3,
}

function renderProgressHook(client: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(
    () =>
      useVolunteerAssignmentProgress({
        programId: '42',
        half: 'h1',
        memberId: '70',
        regionKey: 'seoul',
      }),
    { wrapper }
  )
}

describe('useVolunteerAssignmentProgress mutations', () => {
  beforeEach(() => {
    alerts.showAlert.mockReset()
    vi.mocked(loadVolunteerAssignmentProgress).mockReset().mockResolvedValue({
      participantId: 7,
      educationRegionCode: 'SEOUL',
      bundle: {
        rows: [row],
        attendanceSummary: { completionStatus: '교육 진행 전', lateCountLabel: '0회' },
        absenceReasons: [],
      },
      assignOptionsByRowId: {},
    })
    vi.mocked(postUjatDirectAssignment).mockReset().mockResolvedValue({} as never)
    vi.mocked(postUjatPartnerAssignmentConfirm).mockReset().mockResolvedValue({} as never)
    vi.mocked(postUjatPartnerAssignmentCancel).mockReset().mockResolvedValue({} as never)
    vi.mocked(bulkUpsertUjatAttendances).mockReset().mockResolvedValue({})
  })

  it('교육 배정 성공 시 직접 배정·파트너 확정 후 쿼리를 무효화한다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderProgressHook(client)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.confirmAssignment({
        row,
        mode: 'education',
        classValue: '501',
        partnerId: '8',
        classLabel: '3-1',
      })
    })

    expect(postUjatDirectAssignment).toHaveBeenCalledWith('42', 501, { participantId: 7 })
    expect(postUjatPartnerAssignmentConfirm).toHaveBeenCalledWith(
      '42',
      10,
      expect.objectContaining({
        primaryParticipantId: 7,
        secondaryParticipantId: 8,
        educationSlotId: 501,
        classLabel: '3-1',
      })
    )
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.volunteerAssignmentProgressRoot('42'),
    })
    expect(result.current.bundle.rows).toEqual([row])
  })

  it('배정 실패 시 토스트만 띄우고 이전 행과 캐시 무효화를 하지 않는다', async () => {
    vi.mocked(postUjatDirectAssignment).mockRejectedValue(new Error('fail'))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderProgressHook(client)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current
        .confirmAssignment({
          row,
          mode: 'education',
          classValue: '501',
          partnerId: '8',
          classLabel: '3-1',
        })
        .catch(() => undefined)
    })

    // d1e0e2ae1부터 오류 안내는 `readApiErrorAlertMessage` — 응답 envelope가 없으면 Error.message, 그마저 없으면 fallback
    expect(alerts.showAlert).toHaveBeenCalledWith({
      title: '오류',
      content: 'fail',
    })
    expect(invalidateQueries).not.toHaveBeenCalled()
    expect(postUjatPartnerAssignmentConfirm).not.toHaveBeenCalled()
    expect(result.current.bundle.rows).toEqual([row])
  })

  it('출결 정정은 bulk upsert 후 배정 쿼리를 무효화한다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const invalidateQueries = vi.spyOn(client, 'invalidateQueries')
    const { result } = renderProgressHook(client)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.correctAttendance(row, {
        status: 'absence',
        attendanceTime: null,
        reason: '',
        evidenceFileName: null,
      })
    })

    expect(bulkUpsertUjatAttendances).toHaveBeenCalledWith('42', {
      scheduleId: 10,
      attendances: [
        {
          participantId: 7,
          status: 'ABSENT',
          absenceReason: null,
          arrivalTime: null,
        },
      ],
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.absenceReasons('42'),
    })
  })

  it('배정 취소는 cancel API를 호출한다', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderProgressHook(client)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.cancelAssignment(row, {
        reason: '일정 변경',
        timing: 'IMMEDIATE',
        scheduledAt: null,
      })
    })

    expect(postUjatPartnerAssignmentCancel).toHaveBeenCalledWith('42', 10, 'grp-1', {
      reason: '일정 변경',
      timing: 'IMMEDIATE',
      scheduledAt: null,
    })
  })
})
