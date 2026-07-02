import type { Program } from '@/types/domain'
import { getCompanySchoolPrograms } from './economy-programs'
import { readTrainedTeachersRegistrationLocalSavePrograms } from '@/features/program/general/lib/registration-local-save'

const TRAINED_TEACHERS_TITLES = [
  '2026년 신한은행 - JA Korea 청소년 경제금융교육프로그램',
  '2026 SAP-함께 성장하니JA! 하계 고등학생 모집 안내',
  '2026 JA Korea 초등 교사 경제교육 직무연수',
  '2026 JA Korea 중등 교사 디지털 금융교육 연수',
  '2026 JA Korea 교사 경제교육 심화 과정',
  '2026 JA Korea 학교 금융교육 리더 교사 과정',
  '2026 JA Korea 진로·경제교육 교사 워크숍',
  '2026 JA Korea 교육받은 교사 프로그램 성과 공유회',
] as const

let trainedTeachersProgramsCache: Program[] | null = null

type TrainedTeachersCommonInfo = NonNullable<Program['generalCommonInfo']>

/** 교육받은 교사 공통 정보 케이스 — 프로그램 top-level + generalCommonInfo 오버레이 */
interface TrainedTeachersCommonInfoCase {
  program?: Partial<Program>
  commonInfo?: Partial<TrainedTeachersCommonInfo>
}

/** 케이스 공통 KPI — 스크린샷 (참여자 30 / 교육받은 교사 80 / 학교 100 / 학급 100) */
const TRAINED_TEACHERS_CASE_KPI: NonNullable<TrainedTeachersCommonInfo['kpi']> = {
  finalParticipants: 30,
  instructorCount: 0,
  volunteerCount: 0,
  finalSchools: 100,
  finalClasses: 100,
}

const CURRICULUM_SESSION_1_DESCRIPTION =
  '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.'
const CURRICULUM_SESSION_2_DESCRIPTION =
  '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.'

/**
 * 케이스 매트릭스 (스크린샷 순서)
 * - 001 커리큘럼형·단일·기간 선택 — 교사 연수 ON, 교육일지 있음
 * - 002 커리큘럼형·복수·날짜 지정 — 과제 설정, 교육일지 있음
 * - 003 커리큘럼형·단일·기간 선택 — IPS 차시 별 상이, 교육일지 없음
 * - 004 커리큘럼형·복수·기간 선택 — 교육 형태+IPS 회차 별 상이(2단)
 * - 005 일정형·단일·날짜 지정 — 진행 그룹 A/B, 교육일지 있음
 * - 006 일정형·복수 — 행사 일정 별 진행 일정+과제 설정 (일정 설정 섹션 비노출)
 * - 007 일정형·단일·기간 선택 — 그룹 구분 없음
 * - 008 일정형·복수 — 교육 형태·IPS 일정 별 상이 + 교사 연수 ON
 */
export const TRAINED_TEACHERS_COMMON_INFO_CASES: Record<string, TrainedTeachersCommonInfoCase> = {
  'trained-teachers-prog-001': {
    program: {
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
      educationFormScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      educationJournalEnabled: true,
      teacherTrainingEnabled: true,
      teacherTrainingSchedule: {
        scheduleDateLabel: '26년 4월 1일(수) 14:00 ~ 15:00',
        title: '1단원 나를 알리는 기술',
        description: CURRICULUM_SESSION_1_DESCRIPTION,
        educationFormLabel: '온라인',
      },
      curriculumSessions: [
        {
          sessionLabel: '1차시',
          title: '1단원 나를 알리는 기술',
          description: CURRICULUM_SESSION_1_DESCRIPTION,
        },
        {
          sessionLabel: '2차시',
          title: '2단원 나를 보여주는 기술',
          description: CURRICULUM_SESSION_2_DESCRIPTION,
        },
      ],
      scheduleDetails: undefined,
      educationScheduleMode: 'period',
      educationScheduleLines: ['26년 4월 1일(수) ~ 26년 4월 27일(월)'],
    },
  },
  'trained-teachers-prog-002': {
    program: {
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
      educationFormScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      educationJournalEnabled: true,
      teacherTrainingEnabled: false,
      curriculumSessions: [
        {
          sessionLabel: '1회차',
          title: '2',
          description: CURRICULUM_SESSION_1_DESCRIPTION,
          assignmentEnabled: true,
          assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
        },
        {
          sessionLabel: '2회차',
          title: '2',
          description: CURRICULUM_SESSION_2_DESCRIPTION,
          assignmentEnabled: true,
          assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
        },
      ],
      scheduleDetails: undefined,
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 9:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
    },
  },
  'trained-teachers-prog-003': {
    program: {
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 별 상이 | Prepare | 해당없음',
      educationFormScheduleDetail: 'common',
      ipsScheduleDetail: 'perSchedule',
      educationJournalEnabled: false,
      teacherTrainingEnabled: false,
      curriculumSessions: [
        {
          sessionLabel: '1차시',
          title: '1단원 나를 알리는 기술',
          description: CURRICULUM_SESSION_1_DESCRIPTION,
          ipsTypeSummary: 'Prepare | 해당없음',
        },
        {
          sessionLabel: '2차시',
          title: '2단원 나를 보여주는 기술',
          description: CURRICULUM_SESSION_2_DESCRIPTION,
          ipsTypeSummary: 'Succeed | Competition (대회+시상)',
        },
      ],
      scheduleDetails: undefined,
      educationScheduleMode: 'period',
      educationScheduleLines: ['26년 4월 1일(수) ~ 26년 4월 27일(월)'],
    },
  },
  'trained-teachers-prog-004': {
    program: {
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 별 상이 | Prepare | 해당없음',
      educationFormScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'perSchedule',
      educationJournalEnabled: true,
      teacherTrainingEnabled: false,
      curriculumSessions: [
        {
          sessionLabel: '1회차',
          title: '2',
          description: CURRICULUM_SESSION_1_DESCRIPTION,
          assignmentEnabled: true,
          assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
          educationFormLabel: '온라인',
          ipsTypeSummary: 'Prepare | 해당없음',
        },
        {
          sessionLabel: '2회차',
          title: '2',
          description: CURRICULUM_SESSION_2_DESCRIPTION,
          assignmentEnabled: false,
          educationFormLabel: '오프라인',
          ipsTypeSummary: 'Succeed | Competition (대회+시상)',
        },
      ],
      scheduleDetails: undefined,
      educationScheduleMode: 'period',
      educationScheduleLines: ['26년 4월 20일(월) ~ 26년 4월 27일(월)'],
    },
  },
  'trained-teachers-prog-005': {
    program: {
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 공통 | Succeed | Competition (대회+시상)',
      educationFormScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      educationJournalEnabled: true,
      teacherTrainingEnabled: false,
      curriculumSessions: undefined,
      scheduleDetails: [
        {
          scheduleLabel: '세부 일정 01',
          name: '오리엔테이션',
          progressTimeSummary: '그룹 A : 09:30 ~ 09:40 | 그룹 B : 13:00 ~ 13:10',
        },
        {
          scheduleLabel: '세부 일정 02',
          name: '온라인 워크숍',
          progressTimeSummary: '그룹 A : 09:30 ~ 09:40 | 그룹 B : 13:00 ~ 13:10',
        },
      ],
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
        '26년 4월 27일(월) 09:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
    },
  },
  'trained-teachers-prog-006': {
    program: {
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'multi',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
      educationFormScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      educationJournalEnabled: true,
      teacherTrainingEnabled: false,
      curriculumSessions: undefined,
      scheduleDetails: [
        {
          scheduleLabel: '행사 일정 01',
          name: '오리엔테이션',
          scheduleDateLabel: '26년 3월 7일(토) 10:30 ~ 12:00',
          assignmentEnabled: true,
          assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
        },
        {
          scheduleLabel: '행사 일정 02',
          name: '온라인 워크숍',
          scheduleDateLabel: '26년 4월 11일(토) 10:30 ~ 12:00',
          assignmentEnabled: false,
        },
      ],
      // 일정형 복수 — 교육 진행 일정 설정 섹션 비노출
      educationScheduleMode: undefined,
      educationScheduleLines: undefined,
    },
  },
  'trained-teachers-prog-007': {
    program: {
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
      educationFormScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      educationJournalEnabled: true,
      teacherTrainingEnabled: false,
      curriculumSessions: undefined,
      scheduleDetails: [
        {
          scheduleLabel: '세부 일정 01',
          name: '오리엔테이션',
          progressTimeSummary: '09:30 ~ 09:40',
        },
        {
          scheduleLabel: '세부 일정 02',
          name: '온라인 워크숍',
          progressTimeSummary: '13:00 ~ 13:10',
        },
      ],
      educationScheduleMode: 'period',
      educationScheduleLines: [
        '26년 4월 20일(월) ~ 26년 4월 27일(월)',
        '26년 5월 20일(수) ~ 26년 5월 27일(수)',
      ],
    },
  },
  'trained-teachers-prog-008': {
    program: {
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'multi',
      educatedTeachers: 80,
    },
    commonInfo: {
      educationFormLabel: '온라인',
      ipsTypeSummary: '일정 별 상이 | Prepare | 해당없음',
      educationFormScheduleDetail: 'perSchedule',
      ipsScheduleDetail: 'perSchedule',
      educationJournalEnabled: true,
      teacherTrainingEnabled: true,
      teacherTrainingSchedule: {
        scheduleDateLabel: '26년 3월 2일(월) 14:00 ~ 15:00',
        educationFormLabel: '온라인',
      },
      curriculumSessions: undefined,
      scheduleDetails: [
        {
          scheduleLabel: '행사 일정 01',
          name: '오리엔테이션',
          scheduleDateLabel: '26년 3월 7일(토) 10:30 ~ 12:00',
          assignmentEnabled: true,
          assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
          educationFormLabel: '온라인',
          ipsTypeSummary: 'Prepare | 해당없음',
        },
        {
          scheduleLabel: '행사 일정 02',
          name: '현장 탐방',
          scheduleDateLabel: '26년 4월 11일(토) 10:30 ~ 12:00',
          assignmentEnabled: false,
          educationFormLabel: '오프라인',
          ipsTypeSummary: 'Succeed | Competition (대회+시상)',
        },
      ],
      // 일정형 복수 — 교육 진행 일정 설정 섹션 비노출
      educationScheduleMode: undefined,
      educationScheduleLines: undefined,
    },
  },
}

function toTrainedTeachersProgram(base: Program, index: number): Program {
  const id = `trained-teachers-prog-${String(index + 1).padStart(3, '0')}`
  const title = TRAINED_TEACHERS_TITLES[index % TRAINED_TEACHERS_TITLES.length]
  const capacity = base.rounds[0]?.capacity ?? 30
  const caseOverlay = TRAINED_TEACHERS_COMMON_INFO_CASES[id]

  const program: Program = {
    ...base,
    id,
    title,
    mainTitle: title,
    description: title,
    category: 'school',
    targetLevel: base.targetLevel ?? 'elementary',
    approvedStudentCount: base.approvedStudentCount ?? 0,
    instructors: undefined,
    instructorCapacity: undefined,
    educatedTeachers: base.educatedTeachers ?? base.approvedStudentCount ?? 0,
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      ...base.generalCommonInfo,
      kpi: {
        finalParticipants: base.generalCommonInfo?.kpi?.finalParticipants ?? capacity,
        instructorCount: 0,
        volunteerCount: 0,
        finalSchools: base.generalCommonInfo?.kpi?.finalSchools ?? 10,
        finalClasses: base.generalCommonInfo?.kpi?.finalClasses ?? 30,
      },
      participantRecruitmentInfo: {
        ...base.generalCommonInfo?.participantRecruitmentInfo,
        preEducationNoticeRequired: true,
        maxAssignableInstructors: undefined,
      },
    },
    rounds: base.rounds.map(round => ({
      ...round,
      id: `${id}-round-${round.roundNumber}`,
      programId: id,
    })),
    posterImage: `https://picsum.photos/seed/${id}/400/300`,
    keyVisualImage: `https://picsum.photos/seed/${id}/400/300`,
  }

  if (!caseOverlay) return program

  return {
    ...program,
    ...caseOverlay.program,
    generalCommonInfo: {
      ...program.generalCommonInfo,
      kpi: TRAINED_TEACHERS_CASE_KPI,
      ...caseOverlay.commonInfo,
    },
  }
}

export function getTrainedTeachersPrograms(): Program[] {
  if (trainedTeachersProgramsCache == null) {
    trainedTeachersProgramsCache = getCompanySchoolPrograms().map(toTrainedTeachersProgram)
  }

  const localPrograms = readTrainedTeachersRegistrationLocalSavePrograms().filter(
    localProgram => !trainedTeachersProgramsCache?.some(program => program.id === localProgram.id)
  )

  return [...trainedTeachersProgramsCache, ...localPrograms]
}

export function getTrainedTeachersProgramById(id: string): Program | undefined {
  return getTrainedTeachersPrograms().find(program => program.id === id)
}

export function invalidateTrainedTeachersProgramsCache() {
  trainedTeachersProgramsCache = null
}
