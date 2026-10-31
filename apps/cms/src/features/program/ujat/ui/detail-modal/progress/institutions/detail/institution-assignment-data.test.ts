import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchUjatAllocationMatrix,
  fetchUjatPartnerAssignments,
} from '@/features/program/ujat/api/education-execution-api'
import { buildAssignmentScheduleSections } from './assignment-data'
import {
  attendanceManagerForScheduleFromSources,
  loadInstitutionAssignmentSources,
  volunteersForClassFromSources,
  type InstitutionAssignmentSources,
} from './institution-assignment-data'
import type { UjatEducationProgressInstitutionDetail } from './types'

vi.mock('@/features/program/ujat/api/education-execution-api', () => ({
  fetchUjatAllocationMatrix: vi.fn(),
  fetchUjatPartnerAssignments: vi.fn(),
}))

const sources: InstitutionAssignmentSources = {
  organizationApplicationId: 100,
  matrix: {
    columns: [
      {
        scheduleId: 10,
        organizationApplicationId: 100,
        educationStartAt: '2026-05-08T09:00:00',
      },
    ],
    volunteers: [
      { participantId: 7, volunteerName: '김봉사' },
      { participantId: 8, volunteerName: '이봉사' },
    ],
  },
  partnerAssignmentsByScheduleId: {
    '10': [
      {
        scheduleId: 10,
        organizationApplicationId: 100,
        classLabel: '3-1',
        primaryParticipantId: 7,
        secondaryParticipantId: 8,
        attendanceManagerParticipantId: 7,
        status: 'ASSIGNED',
      },
      {
        scheduleId: 10,
        organizationApplicationId: 100,
        classLabel: '3-2',
        primaryParticipantId: 8,
        secondaryParticipantId: null,
        attendanceManagerParticipantId: 7,
        status: 'CANCELLED',
        cancelledAt: '2026-05-01T00:00:00Z',
      },
    ],
  },
}

describe('institution assignment sources', () => {
  beforeEach(() => {
    vi.mocked(fetchUjatAllocationMatrix).mockReset()
    vi.mocked(fetchUjatPartnerAssignments).mockReset()
  })

  it('학급 라벨과 출결 담당자를 배정 API 이름으로 채운다', () => {
    expect(volunteersForClassFromSources(sources, 10, '3학년', 1)).toEqual({
      volunteerA: '김봉사',
      volunteerB: '이봉사',
    })
    expect(attendanceManagerForScheduleFromSources(sources, 10)).toBe('김봉사')
  })

  it('취소된 배정은 학급 봉사자로 쓰지 않는다', () => {
    expect(volunteersForClassFromSources(sources, 10, '3학년', 2)).toEqual({
      volunteerA: '-',
      volunteerB: '-',
    })
  })

  it('일정 섹션의 출결 담당자는 매트릭스 교육일 기준으로 찾는다', () => {
    const detail = {
      institutionId: '100',
      half: 'h1',
      confirmedScheduleRows: [
        { id: '100-2026-05-08', dateDisplay: '2026.05.08 (금)', classLabels: [] },
      ],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const [section] = buildAssignmentScheduleSections(detail, sources)
    expect(section?.attendanceManagerLabel).toBe('김봉사')
    expect(section?.isoDate).toBe('2026-05-08')
  })

  it('기관 신청에 해당하는 일정만 파트너 배정을 조회한다', async () => {
    vi.mocked(fetchUjatAllocationMatrix).mockResolvedValue({
      columns: [
        { scheduleId: 10, organizationApplicationId: 100, educationStartAt: '2026-05-08' },
        { scheduleId: 11, organizationApplicationId: 200, educationStartAt: '2026-05-15' },
      ],
      volunteers: [],
    })
    vi.mocked(fetchUjatPartnerAssignments).mockResolvedValue([])

    const loaded = await loadInstitutionAssignmentSources({
      programId: '42',
      organizationApplicationId: 100,
      semesterType: 'FIRST_HALF',
    })

    expect(fetchUjatAllocationMatrix).toHaveBeenCalledWith('42', { semesterType: 'FIRST_HALF' })
    expect(fetchUjatPartnerAssignments).toHaveBeenCalledTimes(1)
    expect(fetchUjatPartnerAssignments).toHaveBeenCalledWith('42', 10, 100)
    expect(loaded.partnerAssignmentsByScheduleId['10']).toEqual([])
    expect(loaded.partnerAssignmentsByScheduleId['11']).toBeUndefined()
  })
})
