import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchUjatAllocationMatrix,
  fetchUjatAssignmentSubmissions,
  fetchUjatAttendancesByScheduleIds,
  fetchUjatPartnerAssignments,
} from '@/features/program/ujat/api/education-execution-api'
import { fetchUjatOrganizationScheduleAssignments } from '@/features/program/ujat/api/temporary-schedule-api'
import { fetchProgramAbsenceReasons } from '@/features/program/general/api/absence-reasons'
import { loadVolunteerAssignmentProgress } from './assignment-progress-load'
import { UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE } from './assignment-progress-adapter'

vi.mock('@/features/program/ujat/api/education-execution-api', () => ({
  fetchUjatAllocationMatrix: vi.fn(),
  fetchUjatAssignmentSubmissions: vi.fn(),
  fetchUjatAttendancesByScheduleIds: vi.fn(),
  fetchUjatPartnerAssignments: vi.fn(),
}))

vi.mock('@/features/program/ujat/api/temporary-schedule-api', () => ({
  fetchUjatOrganizationScheduleAssignments: vi.fn(),
}))

vi.mock('@/features/program/general/api/absence-reasons', () => ({
  fetchProgramAbsenceReasons: vi.fn(),
}))

describe('loadVolunteerAssignmentProgress', () => {
  beforeEach(() => {
    vi.mocked(fetchUjatAllocationMatrix).mockReset()
    vi.mocked(fetchUjatAssignmentSubmissions).mockReset()
    vi.mocked(fetchUjatAttendancesByScheduleIds).mockReset()
    vi.mocked(fetchUjatPartnerAssignments).mockReset()
    vi.mocked(fetchUjatOrganizationScheduleAssignments).mockReset()
    vi.mocked(fetchProgramAbsenceReasons).mockReset()
    vi.mocked(fetchUjatOrganizationScheduleAssignments).mockResolvedValue({ content: [] })
  })

  it('memberId에 해당하는 participantId가 없으면 빈 묶음을 반환하고 배정 API를 호출하지 않는다', async () => {
    vi.mocked(fetchUjatAllocationMatrix).mockResolvedValue({
      volunteers: [{ participantId: 7, memberId: 70 }],
      columns: [{ scheduleId: 10 }],
    })

    const result = await loadVolunteerAssignmentProgress({
      programId: '42',
      memberId: '99',
      semesterType: 'FIRST_HALF',
      educationRegionCode: 'SEOUL',
    })

    expect(result.participantId).toBeNull()
    expect(result.bundle).toEqual(UNRESOLVED_VOLUNTEER_ASSIGNMENT_BUNDLE)
    expect(fetchUjatPartnerAssignments).not.toHaveBeenCalled()
    expect(fetchUjatAssignmentSubmissions).not.toHaveBeenCalled()
    expect(fetchProgramAbsenceReasons).not.toHaveBeenCalled()
  })

  it('해석된 봉사자의 일정에 파트너 배정·출결·불참 사유를 조회한다', async () => {
    vi.mocked(fetchUjatAllocationMatrix).mockResolvedValue({
      educationRegionCode: 'SEOUL',
      columns: [{ columnKey: 'col-1', scheduleId: 10, educationStartAt: '2026-05-08' }],
      volunteers: [{ participantId: 7, memberId: 70, volunteerName: '이봉사', cells: [] }],
    })
    vi.mocked(fetchUjatAssignmentSubmissions).mockResolvedValue({ sessions: [] })
    vi.mocked(fetchUjatPartnerAssignments).mockResolvedValue([])
    vi.mocked(fetchUjatAttendancesByScheduleIds).mockResolvedValue({ '10': [] })
    vi.mocked(fetchProgramAbsenceReasons).mockResolvedValue([])

    const result = await loadVolunteerAssignmentProgress({
      programId: '42',
      memberId: '70',
      semesterType: 'FIRST_HALF',
    })

    expect(result.participantId).toBe(7)
    expect(fetchUjatAssignmentSubmissions).toHaveBeenCalledWith('42', {
      semesterType: 'FIRST_HALF',
      educationRegionCode: 'SEOUL',
    })
    expect(fetchUjatPartnerAssignments).toHaveBeenCalledWith('42', 10)
    expect(fetchUjatAttendancesByScheduleIds).toHaveBeenCalledWith('42', [10])
    expect(fetchUjatOrganizationScheduleAssignments).toHaveBeenCalledWith('42', {
      educationRegionCode: 'SEOUL',
    })
    expect(fetchProgramAbsenceReasons).toHaveBeenCalledWith(42)
    expect(result.bundle.rows).toHaveLength(1)
    expect(result.bundle.attendanceSummary.completionStatus).toBe('교육 진행 전')
  })
})
