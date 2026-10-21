import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  createProgramInstructorParticipantRemote,
  createProgramParticipantRemote,
  fetchAttendancesByScheduleIdsRemote,
  fetchEmployeeVolunteerCountsRemote,
  fetchProgramAttendancesBulkRemote,
  fetchProgramParticipantsRemote,
  patchParticipantTextbookDeliveryRemote,
  putEmployeeVolunteerCountsRemote,
  putParticipantAssignedOrganizationsRemote,
} from './program-progress-api-client'

describe('fetchProgramAttendancesBulkRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('scheduleIds를 반복 query로 직렬화한다', async () => {
    vi.mocked(customInstance).mockResolvedValue([])
    await fetchProgramAttendancesBulkRemote('14201', [14302, 14301, 14301])
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/program-execution/programs/14201/attendances?scheduleIds=14301&scheduleIds=14302',
      method: 'GET',
    })
  })

  it('빈 scheduleIds는 HTTP 호출 없이 []', async () => {
    const result = await fetchProgramAttendancesBulkRemote('14201', [])
    expect(result).toEqual([])
    expect(customInstance).not.toHaveBeenCalled()
  })

  it('scheduleIds 미지정은 프로그램 전체 조회 URL', async () => {
    vi.mocked(customInstance).mockResolvedValue([{ scheduleId: 1 }])
    await fetchProgramAttendancesBulkRemote('14201')
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/program-execution/programs/14201/attendances',
      method: 'GET',
    })
  })
})

describe('fetchAttendancesByScheduleIdsRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('Bulk GET 오류를 전파한다', async () => {
    vi.mocked(customInstance).mockRejectedValue(new Error('403'))
    await expect(fetchAttendancesByScheduleIdsRemote('p1', [10])).rejects.toThrow('403')
  })

  it('동일 programId·scheduleIds in-flight 요청은 HTTP 1회', async () => {
    let resolveGate!: (value: unknown) => void
    const gate = new Promise<unknown>(resolve => {
      resolveGate = resolve
    })
    vi.mocked(customInstance).mockImplementation(() => gate)
    const first = fetchAttendancesByScheduleIdsRemote('p1', [2, 1])
    const second = fetchAttendancesByScheduleIdsRemote('p1', [1, 2])
    resolveGate([])
    await Promise.all([first, second])
    expect(customInstance).toHaveBeenCalledTimes(1)
  })

  it('응답에 없는 scheduleId에 빈 출석 버킷을 합성하지 않는다', async () => {
    vi.mocked(customInstance).mockResolvedValue([
      { scheduleId: 10, participantId: 77, status: 'PRESENT' },
    ])

    await expect(fetchAttendancesByScheduleIdsRemote('p1', [10, 11])).resolves.toEqual({
      '10': [{ scheduleId: 10, participantId: 77, status: 'PRESENT' }],
    })
  })
})

describe('fetchProgramParticipantsRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('applicationStatus REJECTED 행은 진행 현황 목록에서 제외한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      items: [
        { participantId: 1, applicationStatus: 'APPROVED', memberName: '승인' },
        { participantId: 2, applicationStatus: 'REJECTED', memberName: '승인취소' },
      ],
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
    })

    await expect(fetchProgramParticipantsRemote('168001', { participantType: 'INDIVIDUAL' })).resolves.toEqual(
      {
        items: [{ participantId: 1, applicationStatus: 'APPROVED', memberName: '승인' }],
        page: 0,
        size: 20,
        totalElements: 1,
        totalPages: 1,
      }
    )
  })
})

describe('createProgramInstructorParticipantRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('INSTRUCTOR participant 등록 body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 1,
      programId: 170002,
      memberId: 190010,
      participantType: 'INSTRUCTOR',
      participantStatus: 'APPROVED',
      sourceApplicationId: null,
    })

    await createProgramInstructorParticipantRemote('170002', {
      participantType: 'INSTRUCTOR',
      memberId: 190010,
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/170002/participants',
      method: 'POST',
      data: { participantType: 'INSTRUCTOR', memberId: 190010 },
    })
  })
})

describe('registerVolunteerParticipantRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('POST volunteer-participants/register body를 보낸다', async () => {
    const { registerVolunteerParticipantRemote } = await import(
      '@/features/program/general/api/program-progress-api-client'
    )
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 1,
      volunteerApplicationId: 2,
      sourceApplicationId: 2,
      volunteerKind: 'GENERAL',
      participantStatus: 'APPROVED',
    })

    await registerVolunteerParticipantRemote('168001', {
      memberId: 190084,
      volunteerKind: 'GENERAL',
      registrationChannel: 'CMS_PROGRESS_ADD',
      personalInfoConsent: 'AGREE',
      thirdPartyConsent: 'AGREE',
      jaProgramExperienceConsentRequest: 'NOT_REQUESTED',
      freeTextItems: {
        items: [{ id: 'intro', label: '1.', bodyText: 'x' }],
      },
      reason: 'CMS 참여 봉사자 추가 등록',
    })

    expect(customInstance).toHaveBeenCalled()
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/programs/168001/volunteer-participants/register',
        method: 'POST',
        data: expect.objectContaining({
          memberId: 190084,
          volunteerKind: 'GENERAL',
        }),
      })
    )
  })
})

describe('employee volunteer counts remote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('GET employee-volunteer-counts를 숫자 programId로 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      programId: 168001,
      entries: [],
    })

    await fetchEmployeeVolunteerCountsRemote('168001', 42)

    expect(vi.mocked(customInstance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/programs/168001/employee-volunteer-counts',
        method: 'GET',
        params: { organizationApplicationId: 42 },
      })
    )
  })

  it('PUT employee-volunteer-counts body를 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      success: true,
      data: { programId: 168001, entries: [] },
    })

    await putEmployeeVolunteerCountsRemote('168001', {
      organizationApplicationId: 42,
      entries: [
        {
          scheduleId: 1,
          newVolunteerCount: 2,
          reparticipationVolunteerCount: 1,
          expectedRevision: 0,
        },
      ],
      reason: 'CMS 참여 봉사자 임직원 자원봉사자 인원 등록',
    })

    expect(vi.mocked(customInstance).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        url: '/api/admin/programs/168001/employee-volunteer-counts',
        method: 'PUT',
        data: expect.objectContaining({
          organizationApplicationId: 42,
          reason: 'CMS 참여 봉사자 임직원 자원봉사자 인원 등록',
        }),
      })
    )
  })
})

describe('createProgramParticipantRemote volunteer', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('VOLUNTEER participant 등록 body에 volunteerKind를 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 41001,
      programId: 168001,
      memberId: 190033,
      participantType: 'VOLUNTEER',
      volunteerKind: 'GENERAL',
    })

    await createProgramParticipantRemote('168001', {
      participantType: 'VOLUNTEER',
      memberId: 190033,
      volunteerKind: 'GENERAL',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/participants',
      method: 'POST',
      data: { participantType: 'VOLUNTEER', memberId: 190033, volunteerKind: 'GENERAL' },
    })
  })
})

describe('patchParticipantTextbookDeliveryRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('교재 배송 PATCH body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      participantId: 31001,
      textbookDeliveryStatus: 'DELIVERED',
    })

    await patchParticipantTextbookDeliveryRemote('168001', '31001', {
      textbookDeliveryStatus: 'DELIVERED',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/participants/31001/textbook-delivery',
      method: 'PATCH',
      data: { textbookDeliveryStatus: 'DELIVERED' },
    })
  })
})

describe('putParticipantAssignedOrganizationsRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('기관형 봉사 배정 PUT body만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ revision: 2 })

    await putParticipantAssignedOrganizationsRemote('168001', '41001', {
      organizationApplicationIds: [8801, 8802],
      expectedRevision: 0,
      reason: '봉사 배정',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/programs/168001/participants/41001/assigned-organizations',
      method: 'PUT',
      data: {
        organizationApplicationIds: [8801, 8802],
        expectedRevision: 0,
        reason: '봉사 배정',
      },
    })
  })
})
