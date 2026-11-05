import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QueryClient } from '@tanstack/react-query'
import {
  bulkUpsertUjatAttendances,
  postUjatDirectAssignment,
  postUjatPartnerAssignmentCancel,
  postUjatPartnerAssignmentConfirm,
  putUjatAttendanceManager,
} from '@/features/program/ujat/api/education-execution-api'
import { queryKeys } from '@/features/program/ujat/api/query-keys'
import {
  cancelVolunteerAssignment,
  confirmVolunteerAssignment,
  correctVolunteerAttendance,
  invalidateVolunteerAssignmentQueries,
  updateVolunteerScheduleRole,
  volunteerAssignmentInvalidationQueryKeys,
} from './assignment-progress-actions'

vi.mock('@/features/program/ujat/api/education-execution-api', () => ({
  postUjatPartnerAssignmentCancel: vi.fn(),
  postUjatPartnerAssignmentConfirm: vi.fn(),
  postUjatDirectAssignment: vi.fn(),
  bulkUpsertUjatAttendances: vi.fn(),
  putUjatAttendanceManager: vi.fn(),
}))

describe('volunteer assignment mutations', () => {
  beforeEach(() => {
    vi.mocked(postUjatPartnerAssignmentCancel).mockReset().mockResolvedValue({} as never)
    vi.mocked(postUjatPartnerAssignmentConfirm).mockReset().mockResolvedValue({} as never)
    vi.mocked(postUjatDirectAssignment).mockReset().mockResolvedValue({} as never)
    vi.mocked(bulkUpsertUjatAttendances).mockReset().mockResolvedValue({})
    vi.mocked(putUjatAttendanceManager).mockReset().mockResolvedValue(undefined)
  })

  it('배정 취소는 partner assignment cancel을 호출한다', async () => {
    await cancelVolunteerAssignment({
      programId: '42',
      scheduleId: 10,
      assignmentGroupId: 'grp-1',
      reason: '일정 변경',
      timing: 'IMMEDIATE',
      scheduledAt: null,
    })

    expect(postUjatPartnerAssignmentCancel).toHaveBeenCalledWith('42', 10, 'grp-1', {
      reason: '일정 변경',
      timing: 'IMMEDIATE',
      scheduledAt: null,
    })
  })

  it('미발송 취소는 빈 body로 cancel을 호출한다', async () => {
    await cancelVolunteerAssignment({
      programId: '42',
      scheduleId: 10,
      assignmentGroupId: 'grp-1',
    })

    expect(postUjatPartnerAssignmentCancel).toHaveBeenCalledWith('42', 10, 'grp-1', {})
  })

  it('교육 배정은 직접 배정 후 파트너 확정을 호출한다', async () => {
    await confirmVolunteerAssignment({
      programId: '42',
      mode: 'education',
      scheduleId: 10,
      participantId: 7,
      partnerParticipantId: 8,
      educationSlotId: 501,
      organizationApplicationId: 3,
      classLabel: '3-1',
    })

    expect(postUjatDirectAssignment).toHaveBeenCalledWith('42', 501, { participantId: 7 })
    expect(postUjatPartnerAssignmentConfirm).toHaveBeenCalledWith('42', 10, {
      primaryParticipantId: 7,
      secondaryParticipantId: 8,
      educationSlotId: 501,
      organizationApplicationId: 3,
      classLabel: '3-1',
    })
  })

  it('파트너 배정은 확정 API만 호출하고 secondary 본인을 유지한다', async () => {
    await confirmVolunteerAssignment({
      programId: '42',
      mode: 'partner',
      scheduleId: 10,
      participantId: 7,
      partnerParticipantId: 8,
      selfIsSecondary: true,
      educationSlotId: 501,
      classLabel: '3-1',
    })

    expect(postUjatDirectAssignment).not.toHaveBeenCalled()
    expect(postUjatPartnerAssignmentConfirm).toHaveBeenCalledWith('42', 10, {
      primaryParticipantId: 8,
      secondaryParticipantId: 7,
      educationSlotId: 501,
      organizationApplicationId: null,
      classLabel: '3-1',
    })
  })

  it('출결 정정은 bulk upsert에 사유·도착 시간을 담는다', async () => {
    await correctVolunteerAttendance({
      programId: '42',
      scheduleId: 10,
      participantId: 7,
      payload: {
        status: 'late',
        attendanceTime: '9:05',
        reason: '',
        evidenceFileName: null,
      },
    })
    await correctVolunteerAttendance({
      programId: '42',
      scheduleId: 10,
      participantId: 7,
      payload: {
        status: 'excused_absence',
        attendanceTime: null,
        reason: '병원',
        evidenceFileName: 'note.pdf',
        evidenceFileObjectIds: [99],
      },
    })

    expect(bulkUpsertUjatAttendances).toHaveBeenNthCalledWith(1, '42', {
      scheduleId: 10,
      attendances: [
        {
          participantId: 7,
          status: 'LATE',
          absenceReason: null,
          arrivalTime: '09:05',
        },
      ],
    })
    expect(bulkUpsertUjatAttendances).toHaveBeenNthCalledWith(2, '42', {
      scheduleId: 10,
      attendances: [
        {
          participantId: 7,
          status: 'EXCUSED',
          absenceReason: '병원',
          arrivalTime: null,
          fileObjectIds: [99],
        },
      ],
    })
  })

  it('confirm 409 CONFLICT는 성공으로 처리한다', async () => {
    vi.mocked(postUjatPartnerAssignmentConfirm).mockRejectedValueOnce({
      response: { data: { error: { code: 'UJAT_PARTNER_ASSIGNMENT_CONFLICT' } } },
    })

    await expect(
      confirmVolunteerAssignment({
        programId: '42',
        mode: 'partner',
        scheduleId: 10,
        participantId: 7,
        partnerParticipantId: 8,
        educationSlotId: 501,
      })
    ).resolves.toEqual({})
  })

  it('출결 담당 지정은 attendance-manager PUT에 기관 열과 participantId를 보낸다', async () => {
    await updateVolunteerScheduleRole({
      programId: '42',
      scheduleId: 10,
      organizationApplicationId: 1691554,
      participantId: 7,
      role: 'attendance_manager',
    })
    expect(putUjatAttendanceManager).toHaveBeenCalledWith('42', 10, {
      organizationApplicationId: 1691554,
      participantId: 7,
    })
  })

  it('해당 없음은 attendance-manager PUT에 participantId null을 보낸다', async () => {
    await updateVolunteerScheduleRole({
      programId: '42',
      scheduleId: 10,
      organizationApplicationId: 1691554,
      participantId: 7,
      role: 'none',
    })
    expect(putUjatAttendanceManager).toHaveBeenCalledWith('42', 10, {
      organizationApplicationId: 1691554,
      participantId: null,
    })
  })

  it('성공 후 봉사자 배정·파트너·불참 사유 쿼리를 무효화한다', async () => {
    const invalidateQueries = vi.fn().mockResolvedValue(undefined)
    const queryClient = { invalidateQueries } as unknown as QueryClient
    const keys = volunteerAssignmentInvalidationQueryKeys({
      programId: '42',
      educationRegionCode: 'SEOUL',
      semesterType: 'FIRST_HALF',
    })

    expect(keys.map(key => key[0])).toEqual(Array(keys.length).fill('cms'))
    expect(queryKeys.volunteerAssignmentProgress('42', '70', 'FIRST_HALF', 'SEOUL')).toEqual([
      'cms',
      'programs',
      'ujat',
      'execution',
      'volunteer-assignment-progress',
      '42',
      '70',
      'FIRST_HALF',
      'SEOUL',
    ])
    expect(queryKeys.partnerAssignments('42', '10')).toEqual([
      'cms',
      'programs',
      'ujat',
      'execution',
      'partner-assignments',
      '42',
      '10',
    ])
    expect(queryKeys.absenceReasons('42')).toEqual([
      'cms',
      'programs',
      'ujat',
      'execution',
      'absence-reasons',
      '42',
    ])

    await invalidateVolunteerAssignmentQueries(queryClient, {
      programId: '42',
      educationRegionCode: 'SEOUL',
      semesterType: 'FIRST_HALF',
    })

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.volunteerAssignmentProgressRoot('42'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.partnerAssignmentsRoot('42'),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: queryKeys.absenceReasons('42'),
    })
  })
})
