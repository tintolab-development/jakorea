import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchUjatAllocationMatrix,
  fetchUjatPartnerAssignments,
} from '@/features/program/ujat/api/education-execution-api'
import { buildAssignmentScheduleSections } from './assignment-data'
import {
  attendanceManagerForScheduleFromSources,
  isoDateFromScheduleValue,
  loadInstitutionAssignmentSources,
  sameOrganizationApplicationId,
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
        classCount: 1,
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

/** 로컬 BE 검증 픽스처 — programId=186495 / org=1691554 / schedule=187580 */
const fixtureFailAssignSources: InstitutionAssignmentSources = {
  organizationApplicationId: 1691554,
  matrix: {
    programId: 186495,
    semesterType: 'SECOND_HALF',
    columns: [
      {
        columnKey: '187580:1691554',
        scheduleId: 187580,
        educationStartAt: '2026-11-05T15:00:00Z',
        organizationApplicationId: 1691554,
        classCount: 2,
        educationRegionCode: 'SEOUL',
      },
    ],
    volunteers: [],
  },
  partnerAssignmentsByScheduleId: {
    '187580': [],
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

  it('partner-assignments가 비어도 matrix cell volunteerName으로 학급 봉사자를 채운다', () => {
    const matrixOnly: InstitutionAssignmentSources = {
      organizationApplicationId: 1691554,
      matrix: {
        columns: [
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            educationStartAt: '2026-11-05T15:00:00Z',
            classCount: 2,
          },
        ],
        volunteers: [
          {
            participantId: 11,
            volunteerName: '홍길동',
            cells: [
              {
                scheduleId: 187580,
                organizationApplicationId: 1691554,
                classLabel: '2학년 1반',
                attendanceManager: true,
              },
            ],
          },
          {
            participantId: 12,
            volunteerName: '김봉사',
            cells: [
              {
                scheduleId: 187580,
                organizationApplicationId: 1691554,
                classLabel: '2학년 1반',
              },
            ],
          },
        ],
      },
      partnerAssignmentsByScheduleId: {
        '187580': [],
      },
    }

    expect(volunteersForClassFromSources(matrixOnly, 187580, '2학년', 1)).toEqual({
      volunteerA: '홍길동',
      volunteerB: '김봉사',
    })
    expect(attendanceManagerForScheduleFromSources(matrixOnly, 187580)).toBe('홍길동')
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
        { id: '100-2026-05-08', dateDisplay: '2026.05.08(금)', classLabels: [] },
      ],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const [section] = buildAssignmentScheduleSections(detail, sources)
    expect(section?.attendanceManagerLabel).toBe('김봉사')
    expect(section?.isoDate).toBe('2026-05-08')
  })

  it('로컬 임시 배정이 없으면 partner-assignments 학급으로 행을 채운다', () => {
    const detail = {
      institutionId: '100',
      half: 'h1',
      confirmedScheduleRows: [
        { id: '100-2026-05-08', dateDisplay: '2026.05.08(금)', classLabels: [] },
      ],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const [section] = buildAssignmentScheduleSections(detail, sources)
    expect(section?.rows).toEqual([
      expect.objectContaining({
        gradeLabel: '3학년',
        classNo: 1,
        classLabel: '1반',
        volunteerA: '김봉사',
        volunteerB: '이봉사',
        gradeRowSpan: 1,
      }),
    ])
    expect(section?.totalClassCount).toBe(1)
    expect(section?.assignmentEmptyMessage).toBeNull()
  })

  it('confirmedScheduleRows가 없어도 matrix 컬럼으로 일정 섹션을 만든다', () => {
    const detail = {
      institutionId: '100',
      half: 'h1',
      confirmedScheduleRows: [],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const sections = buildAssignmentScheduleSections(detail, sources)
    expect(sections).toHaveLength(1)
    expect(sections[0]?.isoDate).toBe('2026-05-08')
    expect(sections[0]?.attendanceManagerLabel).toBe('김봉사')
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

  it('organizationApplicationId 숫자/문자열을 동일 기관으로 매칭한다', () => {
    expect(sameOrganizationApplicationId(1691554, '1691554')).toBe(true)
    expect(sameOrganizationApplicationId('1691554', 1691554)).toBe(true)
    expect(sameOrganizationApplicationId(1691554, 1691555)).toBe(false)
  })

  it('educationStartAt UTC는 Asia/Seoul 달력일로 변환한다 (slice 금지)', () => {
    expect(isoDateFromScheduleValue('2026-11-05T15:00:00Z')).toBe('2026-11-06')
    expect(isoDateFromScheduleValue('2026-05-08')).toBe('2026-05-08')
  })

  it('BE read-model 샘플: 2026-11-06 카드에 A/B·담당자·교재를 채운다', () => {
    const beSample: InstitutionAssignmentSources = {
      organizationApplicationId: 1691554,
      matrix: {
        programId: 186495,
        semesterType: 'SECOND_HALF',
        columns: [
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            educationStartAt: '2026-11-05T15:00:00Z',
            organizationRegion: null,
            classCount: 2,
          },
        ],
        volunteers: [
          {
            participantId: 1695055,
            volunteerName: '안재원',
            cells: [
              {
                scheduleId: 187580,
                organizationApplicationId: 1691554,
                classLabel: '2학년 1반',
                attendanceManager: true,
                assignmentStatus: 'ASSIGNED',
              },
            ],
          },
          {
            participantId: 1695054,
            volunteerName: '백소리',
            cells: [
              {
                scheduleId: 187580,
                organizationApplicationId: 1691554,
                classLabel: '2학년 1반',
                attendanceManager: false,
                assignmentStatus: 'ASSIGNED',
              },
            ],
          },
          {
            participantId: 1695056,
            volunteerName: '김민수',
            cells: [
              {
                scheduleId: 187580,
                organizationApplicationId: 1691554,
                classLabel: '2학년 2반',
                attendanceManager: false,
                assignmentStatus: 'ASSIGNED',
              },
            ],
          },
          {
            participantId: 1695057,
            volunteerName: '이서연',
            cells: [
              {
                scheduleId: 187580,
                organizationApplicationId: 1691554,
                classLabel: '2학년 2반',
                attendanceManager: false,
                assignmentStatus: 'ASSIGNED',
              },
            ],
          },
        ],
      },
      partnerAssignmentsByScheduleId: {
        '187580': [
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            classLabel: '2학년 1반',
            primaryParticipantId: 1695055,
            secondaryParticipantId: 1695054,
            attendanceManagerParticipantId: 1695055,
            status: 'ASSIGNED',
          },
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            classLabel: '2학년 2반',
            primaryParticipantId: 1695056,
            secondaryParticipantId: 1695057,
            attendanceManagerParticipantId: 1695055,
            status: 'ASSIGNED',
          },
        ],
      },
    }

    const detail = {
      institutionId: '1691554',
      half: 'h2',
      confirmedScheduleRows: [],
      applicationDetail: {
        gradeBlocks: [
          {
            gradeLabel: '2',
            classCount: 2,
            classes: [
              { classNo: 1, studentCount: 20 },
              { classNo: 2, studentCount: 21 },
            ],
            textbookName: 'UJAT 초등 경제교육 교재 05',
            kitCount: 2,
            bookCount: 41,
            textbookDeliveryStatus: 'PREPARING',
          },
          {
            gradeLabel: '6',
            classCount: 1,
            classes: [{ classNo: 8, studentCount: 20 }],
            textbookName: null,
            kitCount: null,
            bookCount: null,
          },
        ],
      },
    } as unknown as UjatEducationProgressInstitutionDetail

    const [section] = buildAssignmentScheduleSections(detail, beSample)
    expect(section?.isoDate).toBe('2026-11-06')
    expect(section?.attendanceManagerLabel).toBe('안재원')
    expect(section?.rows).toEqual([
      expect.objectContaining({
        gradeLabel: '2학년',
        classNo: 1,
        volunteerA: '안재원',
        volunteerB: '백소리',
        textbookName: 'UJAT 초등 경제교육 교재 05',
        textbookQuantityLabel: '2키트 (41권)',
      }),
      expect.objectContaining({
        gradeLabel: '2학년',
        classNo: 2,
        volunteerA: '김민수',
        volunteerB: '이서연',
        textbookName: 'UJAT 초등 경제교육 교재 05',
        textbookQuantityLabel: '2키트 (41권)',
      }),
    ])
  })

  it('classLabel 2-1 / 2 1 표기도 partner·matrix와 매칭한다', () => {
    expect(volunteersForClassFromSources(sources, 10, '3학년', 1)).toEqual({
      volunteerA: '김봉사',
      volunteerB: '이봉사',
    })

    const hyphenSources: InstitutionAssignmentSources = {
      ...sources,
      partnerAssignmentsByScheduleId: {
        '10': [
          {
            scheduleId: 10,
            organizationApplicationId: 100,
            classLabel: '3 1',
            primaryParticipantId: 7,
            secondaryParticipantId: 8,
            attendanceManagerParticipantId: 7,
            status: 'ASSIGNED',
          },
        ],
      },
    }
    expect(volunteersForClassFromSources(hyphenSources, 10, '3학년', 1)).toEqual({
      volunteerA: '김봉사',
      volunteerB: '이봉사',
    })
  })

  it('FAIL-ASSIGN 픽스처: matrix 일정은 보이고 배정 empty는 미배정 copy', () => {
    const detail = {
      institutionId: '1691554',
      half: 'h2',
      confirmedScheduleRows: [],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const sections = buildAssignmentScheduleSections(detail, fixtureFailAssignSources)
    expect(sections).toHaveLength(1)
    expect(sections[0]?.isoDate).toBe('2026-11-06')
    expect(sections[0]?.dateDisplay).toContain('2026.11.06')
    expect(sections[0]?.rows).toEqual([])
    expect(sections[0]?.totalClassCount).toBe(2)
    expect(sections[0]?.assignmentEmptyMessage).toBe('확정 학급 2개 · 봉사자 미배정')
    expect(sections[0]?.attendanceManagerLabel).toBe('미정')
  })

  it('CANCELLED만 있는 일정은 temporary-schedule 학급이 있어도 A/B를 invent 하지 않는다', () => {
    const cancelledOnly: InstitutionAssignmentSources = {
      organizationApplicationId: 1691554,
      matrix: {
        columns: [
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            educationStartAt: '2026-11-05T15:00:00Z',
            organizationRegion: null,
            classCount: 2,
          },
        ],
        volunteers: [
          { participantId: 1695055, volunteerName: '안재원', cells: [] },
          { participantId: 1695054, volunteerName: '백소리', cells: [] },
        ],
      },
      partnerAssignmentsByScheduleId: {
        '187580': [
          {
            scheduleId: 187580,
            organizationApplicationId: 1691554,
            classLabel: '2학년 1반',
            primaryParticipantId: 1695055,
            secondaryParticipantId: 1695054,
            attendanceManagerParticipantId: 1695055,
            status: 'CANCELLED',
            cancelledAt: '2026-11-01T00:00:00Z',
          },
        ],
      },
    }

    const detail = {
      institutionId: '1691554',
      half: 'h2',
      confirmedScheduleRows: [
        {
          id: '1691554-2026-11-06',
          dateDisplay: '2026.11.06(금)',
          classLabels: ['2학년 1반', '2학년 2반'],
        },
      ],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const [section] = buildAssignmentScheduleSections(detail, cancelledOnly)
    expect(section?.isoDate).toBe('2026-11-06')
    expect(section?.attendanceManagerLabel).toBe('미정')
    expect(section?.rows).toEqual([
      expect.objectContaining({
        gradeLabel: '2학년',
        classNo: 1,
        volunteerA: '-',
        volunteerB: '-',
      }),
      expect.objectContaining({
        gradeLabel: '2학년',
        classNo: 2,
        volunteerA: '-',
        volunteerB: '-',
      }),
    ])
  })

  it('org columns가 없으면 일정 섹션 0건 (일정 없음 empty 분기)', () => {
    const detail = {
      institutionId: '1691554',
      half: 'h1',
      confirmedScheduleRows: [],
      applicationDetail: { gradeBlocks: [] },
    } as unknown as UjatEducationProgressInstitutionDetail

    const emptyHalf: InstitutionAssignmentSources = {
      organizationApplicationId: 1691554,
      matrix: {
        programId: 186495,
        semesterType: 'FIRST_HALF',
        columns: [],
        volunteers: [],
      },
      partnerAssignmentsByScheduleId: {},
    }

    expect(buildAssignmentScheduleSections(detail, emptyHalf)).toEqual([])
  })

  it('문자열 organizationApplicationId 컬럼도 기관 일정으로 로드한다', async () => {
    vi.mocked(fetchUjatAllocationMatrix).mockResolvedValue({
      columns: [
        {
          scheduleId: 187580,
          // runtime JSON이 문자열로 올 수 있는 경로 방어
          organizationApplicationId: '1691554' as unknown as number,
          educationStartAt: '2026-11-05T15:00:00Z',
          classCount: 2,
        },
      ],
      volunteers: [],
    })
    vi.mocked(fetchUjatPartnerAssignments).mockResolvedValue([])

    const loaded = await loadInstitutionAssignmentSources({
      programId: '186495',
      organizationApplicationId: 1691554,
      semesterType: 'SECOND_HALF',
    })

    expect(fetchUjatPartnerAssignments).toHaveBeenCalledWith('186495', 187580, 1691554)
    expect(loaded.partnerAssignmentsByScheduleId['187580']).toEqual([])
  })
})
