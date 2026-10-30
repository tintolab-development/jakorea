import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

vi.mock('@/features/data-management/api/unwrap-api-body', () => ({
  unwrapApiBody: vi.fn((value: unknown) => value),
}))

import {
  createInstructorAssignmentRemote,
  fetchInstructorAssignmentCalendarRemote,
} from './instructor-assignments-api-client'

describe('createInstructorAssignmentRemote notify payload', () => {
  beforeEach(() => {
    vi.mocked(customInstanceMock).mockReset()
    vi.mocked(customInstanceMock).mockResolvedValue({ id: 1 })
  })

  it('즉시 배정은 timing을 생략한다', async () => {
    await createInstructorAssignmentRemote('9', {
      instructorMemberId: 3,
      scheduleId: 8,
    })
    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/programs/9/instructor-assignments',
      method: 'POST',
      data: {
        instructorMemberId: 3,
        scheduleId: 8,
      },
    })
  })

  it('예약 배정은 SCHEDULED + scheduledAt을 create에 포함한다', async () => {
    await createInstructorAssignmentRemote('9', {
      instructorMemberId: 3,
      scheduleId: 8,
      timing: 'SCHEDULED',
      scheduledAt: '2026-11-01T00:00:00Z',
    })
    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/programs/9/instructor-assignments',
      method: 'POST',
      data: {
        instructorMemberId: 3,
        scheduleId: 8,
        timing: 'SCHEDULED',
        scheduledAt: '2026-11-01T00:00:00Z',
      },
    })
  })
})

describe('fetchInstructorAssignmentCalendarRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstanceMock).mockReset()
  })

  it('canonical 경로에 instructorMemberId를 그대로 전달하고 direct items를 반환한다', async () => {
    const response = {
      items: [
        {
          instructorMemberId: 190001,
          lectureDate: '2026-11-07',
          organizationApplicationId: null,
          assignmentId: 186700,
          scheduleId: 186800,
          activeYn: true,
        },
      ],
    }
    vi.mocked(customInstanceMock).mockResolvedValue(response)

    await expect(
      fetchInstructorAssignmentCalendarRemote('186339', { instructorMemberId: 190001 })
    ).resolves.toEqual(response)

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/programs/186339/instructor-assignment-calendar',
      method: 'GET',
      params: { instructorMemberId: 190001 },
    })
  })

  it('선택적 날짜 파라미터와 빈 items를 그대로 처리한다', async () => {
    vi.mocked(customInstanceMock).mockResolvedValue({ items: [] })

    await expect(
      fetchInstructorAssignmentCalendarRemote('186339', {
        from: '2026-11-01',
        to: '2026-11-30',
      })
    ).resolves.toEqual({ items: [] })

    expect(customInstanceMock).toHaveBeenCalledWith({
      url: '/api/admin/programs/186339/instructor-assignment-calendar',
      method: 'GET',
      params: { from: '2026-11-01', to: '2026-11-30' },
    })
  })

  it('인증·권한·리소스 오류를 빈 성공 응답으로 변환하지 않는다', async () => {
    const error = {
      response: {
        status: 403,
        data: { error: { code: 'ASSIGNMENT_SCOPE_FORBIDDEN' } },
      },
    }
    vi.mocked(customInstanceMock).mockRejectedValue(error)

    await expect(
      fetchInstructorAssignmentCalendarRemote('186339', { instructorMemberId: 190001 })
    ).rejects.toBe(error)
  })
})
