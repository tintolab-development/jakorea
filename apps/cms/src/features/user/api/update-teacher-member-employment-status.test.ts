import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchTeacherMemberDetailRemote = vi.fn()
const updateTeacherEmploymentStatusRemote = vi.fn()

vi.mock('@/features/user/api/members-api-client', () => ({
  fetchTeacherMemberDetailRemote: (...args: unknown[]) =>
    fetchTeacherMemberDetailRemote(...args),
  updateTeacherEmploymentStatusRemote: (...args: unknown[]) =>
    updateTeacherEmploymentStatusRemote(...args),
}))

import { updateTeacherMemberEmploymentStatusAndRefresh } from './update-teacher-member-employment-status'

describe('updateTeacherMemberEmploymentStatusAndRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('재직 현황 PATCH 후 교사 상세 GET으로 화면 데이터를 갱신한다', async () => {
    fetchTeacherMemberDetailRemote.mockResolvedValue({
      member: {
        memberId: 42,
        uuid: 'teacher-uuid',
        email: 'teacher@example.com',
        name: '김교사',
        roles: ['SCHOOL_TEACHER'],
        status: 'ACTIVE',
      },
      organizationId: 12,
      organizationName: '진월초등학교',
      employmentStatus: 'ON_LEAVE',
    })
    updateTeacherEmploymentStatusRemote.mockResolvedValue({
      memberId: 42,
      employmentStatus: 'ON_LEAVE',
    })

    const user = await updateTeacherMemberEmploymentStatusAndRefresh({
      memberId: 42,
      organizationId: 12,
      employmentStatus: 'ON_LEAVE',
    })

    expect(updateTeacherEmploymentStatusRemote).toHaveBeenCalledWith(12, 42, 'ON_LEAVE')
    expect(fetchTeacherMemberDetailRemote).toHaveBeenCalledWith(42)
    expect(user.listMetrics?.employmentStatusLabel).toBe('휴직')
    expect(user.organizationId).toBe(12)
  })

  it('organizationId가 없으면 교사 상세에서 보완한 뒤 PATCH한다', async () => {
    fetchTeacherMemberDetailRemote
      .mockResolvedValueOnce({
        member: {
          memberId: 42,
          uuid: 'teacher-uuid',
          roles: ['SCHOOL_TEACHER'],
          status: 'ACTIVE',
        },
        organizationId: 12,
        organizationName: '진월초등학교',
        employmentStatus: 'ACTIVE',
      })
      .mockResolvedValueOnce({
        member: {
          memberId: 42,
          uuid: 'teacher-uuid',
          roles: ['SCHOOL_TEACHER'],
          status: 'ACTIVE',
        },
        organizationId: 12,
        organizationName: '진월초등학교',
        employmentStatus: 'TRANSFERRED',
      })
    updateTeacherEmploymentStatusRemote.mockResolvedValue({
      memberId: 42,
      employmentStatus: 'TRANSFERRED',
    })

    const user = await updateTeacherMemberEmploymentStatusAndRefresh({
      memberId: 42,
      employmentStatus: 'TRANSFERRED',
    })

    expect(updateTeacherEmploymentStatusRemote).toHaveBeenCalledWith(12, 42, 'TRANSFERRED')
    expect(user.listMetrics?.employmentStatusLabel).toBe('전근')
  })
})
