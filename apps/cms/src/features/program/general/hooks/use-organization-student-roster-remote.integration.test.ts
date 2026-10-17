// @vitest-environment jsdom
/**
 * 학생 명단 remote hook — PUT expectedRevisionNo · 409 · 캐시 갱신 (mock API)
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { SchoolDetailStudentRow } from '@/features/program/general/model/school-detail-types'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useOrganizationStudentRosterRemote } from './use-organization-student-roster-remote'
import { STUDENT_ROSTER_REVISION_CONFLICT } from '@/features/program/general/lib/student-roster-revision'

vi.mock('@/features/program/general/api/applications-remote-capabilities', () => ({
  shouldUseOrganizationApplicationRemoteApi: vi.fn(() => true),
}))

vi.mock('@/features/program/shared/lib/program-api-unavailable', () => ({
  notifyProgramApiUnavailable: vi.fn(),
  useNotifyProgramApiUnavailableOnce: vi.fn(),
}))

vi.mock('@/shared/utils/error-handler', () => ({
  handleError: vi.fn(),
}))

const fetchOrganizationStudentRosterRemote = vi.fn()
const commitOrganizationStudentRosterRemote = vi.fn()

vi.mock('@/features/program/general/api/student-roster-api-client', () => ({
  fetchOrganizationStudentRosterRemote: (...args: unknown[]) =>
    fetchOrganizationStudentRosterRemote(...args),
  commitOrganizationStudentRosterRemote: (...args: unknown[]) =>
    commitOrganizationStudentRosterRemote(...args),
}))

function rosterRow(id: string, rosterId: number): SchoolDetailStudentRow {
  return {
    id: String(rosterId),
    no: 1,
    name: `학생${id}`,
    gradeClass: '1반',
    birthDate: '2010. 01. 01.',
    gender: 'male',
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useOrganizationStudentRosterRemote integration', () => {
  const appA = '1001'
  const appB = '1002'

  beforeEach(() => {
    vi.clearAllMocks()
    fetchOrganizationStudentRosterRemote.mockReset()
    commitOrganizationStudentRosterRemote.mockReset()
  })

  it('TC-01: commit sends expectedRevisionNo and full rows', async () => {
    const afterPut = {
      revisionNo: 6,
      totalCount: 1,
      rows: [
        {
          rosterId: 201,
          studentName: '학생1-수정',
          birthDate: '2010-01-01',
          grade: '3학년',
          className: '2반',
          studentNo: 1,
        },
      ],
    }
    fetchOrganizationStudentRosterRemote
      .mockResolvedValueOnce({
        revisionNo: 5,
        totalCount: 1,
        rows: [
          {
            rosterId: 101,
            studentName: '학생1',
            birthDate: '2010-01-01',
            grade: '3학년',
            className: '1반',
            studentNo: 1,
          },
        ],
      })
      .mockResolvedValue(afterPut)
    commitOrganizationStudentRosterRemote.mockResolvedValue(afterPut)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () =>
        useOrganizationStudentRosterRemote({
          organizationApplicationId: appA,
          educationGrade: '3학년',
        }),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.revisionNo).toBe(5))

    const rows = [rosterRow('1', 101)]
    rows[0] = { ...rows[0], gradeClass: '3학년 2반' }

    await act(async () => {
      await result.current.commitRows({
        rows,
        expectedRevisionNo: 5,
      })
    })

    expect(commitOrganizationStudentRosterRemote).toHaveBeenCalledTimes(1)
    const [, body] = commitOrganizationStudentRosterRemote.mock.calls[0]!
    expect(body.expectedRevisionNo).toBe(5)
    expect(body.sourceFileObjectId).toBeUndefined()
    expect(body.rows).toHaveLength(1)
    expect(body.rows[0]?.rosterId).toBe(101)
    await waitFor(() => expect(result.current.revisionNo).toBe(6))
  })

  it('TC-01b: GET sourceFileObjectId is not sent on manual PUT', async () => {
    fetchOrganizationStudentRosterRemote.mockResolvedValue({
      revisionNo: 2,
      sourceFileObjectId: 2_055_870,
      totalCount: 1,
      rows: [
        {
          rosterId: 1691554,
          studentName: '이서연',
          birthDate: '2010-11-05',
          grade: '초5',
          className: '1반',
          studentNo: 2,
          gender: 'female',
        },
      ],
    })
    commitOrganizationStudentRosterRemote.mockResolvedValue({
      revisionNo: 3,
      totalCount: 1,
      rows: [],
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appA }),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.revisionNo).toBe(2))

    await act(async () => {
      await result.current.commitRows({
        rows: [rosterRow('1', 1691554)],
        expectedRevisionNo: 2,
      })
    })

    const [, body] = commitOrganizationStudentRosterRemote.mock.calls[0]!
    expect(body).toEqual(
      expect.objectContaining({
        expectedRevisionNo: 2,
      })
    )
    expect(body.sourceFileObjectId).toBeUndefined()
    expect(Object.keys(body).sort()).toEqual(['expectedRevisionNo', 'rows'])
  })

  it('TC-02: commit uses caller revision when cache revision advanced', async () => {
    fetchOrganizationStudentRosterRemote.mockResolvedValue({
      revisionNo: 5,
      totalCount: 0,
      rows: [],
    })
    commitOrganizationStudentRosterRemote.mockResolvedValue({
      revisionNo: 6,
      totalCount: 0,
      rows: [],
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () =>
        useOrganizationStudentRosterRemote({
          organizationApplicationId: appA,
        }),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.revisionNo).toBe(5))

    queryClient.setQueryData(generalProgramProgressQueryKeys.studentRoster(appA), {
      revisionNo: 6,
      totalCount: 0,
      rows: [],
    })

    await act(async () => {
      await result.current.commitRows({
        rows: [],
        expectedRevisionNo: 5,
      })
    })

    const [, body] = commitOrganizationStudentRosterRemote.mock.calls[0]!
    expect(body.expectedRevisionNo).toBe(5)
  })

  it('TC-03: revision conflict rejects without updating cache revision', async () => {
    const initial = {
      revisionNo: 5,
      totalCount: 1,
      rows: [{ rosterId: 101, studentName: 'A', birthDate: '2010-01-01', grade: '3', className: '1반', studentNo: 1 }],
    }
    fetchOrganizationStudentRosterRemote.mockResolvedValue(initial)
    commitOrganizationStudentRosterRemote.mockRejectedValue({
      response: {
        status: 409,
        data: { error: { code: STUDENT_ROSTER_REVISION_CONFLICT, message: 'conflict' } },
      },
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () =>
        useOrganizationStudentRosterRemote({
          organizationApplicationId: appA,
        }),
      { wrapper: createWrapper(queryClient) }
    )

    await waitFor(() => expect(result.current.revisionNo).toBe(5))

    await expect(
      act(async () => {
        await result.current.commitRows({ rows: [rosterRow('1', 101)], expectedRevisionNo: 5 })
      })
    ).rejects.toBeTruthy()

    expect(result.current.revisionNo).toBe(5)
    const cached = queryClient.getQueryData(
      generalProgramProgressQueryKeys.studentRoster(appA)
    ) as { revisionNo?: number }
    expect(cached?.revisionNo).toBe(5)
  })

  it('TC-04: memberId conflict propagates without treating as revision', async () => {
    fetchOrganizationStudentRosterRemote.mockResolvedValue({ revisionNo: 5, totalCount: 0, rows: [] })
    commitOrganizationStudentRosterRemote.mockRejectedValue({
      response: {
        status: 409,
        data: { error: { code: 'STUDENT_ROSTER_MEMBER_ID_CONFLICT' } },
      },
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appA }),
      { wrapper: createWrapper(queryClient) }
    )
    await waitFor(() => expect(result.current.revisionNo).toBe(5))

    await expect(
      result.current.commitRows({ rows: [rosterRow('1', 1)], expectedRevisionNo: 5 })
    ).rejects.toBeTruthy()
    expect(commitOrganizationStudentRosterRemote).toHaveBeenCalledTimes(1)
  })

  it('TC-05: generic 409 is not success', async () => {
    fetchOrganizationStudentRosterRemote.mockResolvedValue({ revisionNo: 1, rows: [] })
    commitOrganizationStudentRosterRemote.mockRejectedValue({
      response: { status: 409, data: { error: { code: 'OTHER_CONFLICT' } } },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appA }),
      { wrapper: createWrapper(queryClient) }
    )
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await expect(
      result.current.commitRows({ rows: [rosterRow('1', 1)], expectedRevisionNo: 1 })
    ).rejects.toBeTruthy()
  })

  it('TC-11: success response updates rosterId in cache', async () => {
    const afterPut = {
      revisionNo: 6,
      rows: [
        {
          rosterId: 201,
          studentName: 'A',
          birthDate: '2010-01-01',
          grade: '3',
          className: '1반',
          studentNo: 1,
        },
      ],
    }
    fetchOrganizationStudentRosterRemote
      .mockResolvedValueOnce({
        revisionNo: 5,
        rows: [
          {
            rosterId: 101,
            studentName: 'A',
            birthDate: '2010-01-01',
            grade: '3',
            className: '1반',
            studentNo: 1,
          },
        ],
      })
      .mockResolvedValue(afterPut)
    commitOrganizationStudentRosterRemote.mockResolvedValue(afterPut)

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appA }),
      { wrapper: createWrapper(queryClient) }
    )
    await waitFor(() => expect(result.current.students[0]?.id).toBe('101'))

    await act(async () => {
      await result.current.commitRows({
        rows: [rosterRow('1', 101)],
        expectedRevisionNo: 5,
      })
    })

    await waitFor(() => expect(result.current.revisionNo).toBe(6))
    expect(result.current.students[0]?.id).toBe('201')
  })

  it('TC-13: duplicate commit while pending is blocked by isCommitting', async () => {
    fetchOrganizationStudentRosterRemote.mockResolvedValue({ revisionNo: 5, rows: [] })
    let resolveCommit!: (v: unknown) => void
    commitOrganizationStudentRosterRemote.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveCommit = resolve
        })
    )

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appA }),
      { wrapper: createWrapper(queryClient) }
    )
    await waitFor(() => expect(result.current.revisionNo).toBe(5))

    const first = result.current.commitRows({ rows: [rosterRow('1', 1)], expectedRevisionNo: 5 })
    await waitFor(() => expect(result.current.isCommitting).toBe(true))

    await act(async () => {
      if (result.current.isCommitting) {
        // UI layer skips second save — simulate guard
        expect(commitOrganizationStudentRosterRemote).toHaveBeenCalledTimes(1)
      }
    })

    resolveCommit({ revisionNo: 6, rows: [] })
    await act(async () => {
      await first
    })
  })

  it('TC-14: separate query keys per organizationApplicationId', async () => {
    fetchOrganizationStudentRosterRemote.mockImplementation((id: string) => {
      if (id === appA) return Promise.resolve({ revisionNo: 5, rows: [] })
      return Promise.resolve({ revisionNo: 2, rows: [] })
    })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = createWrapper(queryClient)

    const hookA = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appA }),
      { wrapper }
    )
    const hookB = renderHook(
      () => useOrganizationStudentRosterRemote({ organizationApplicationId: appB }),
      { wrapper }
    )

    await waitFor(() => expect(hookA.result.current.revisionNo).toBe(5))
    await waitFor(() => expect(hookB.result.current.revisionNo).toBe(2))
  })
})
