import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import { createInstructorAssignmentRemote } from './instructor-assignments-api-client'

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
