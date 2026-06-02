/**
 * 일반 프로그램 상세 — 공통 정보 표시 mock/파생
 */

import type { Program } from '@/types/domain'
import { getGeneralSurveyMenuItems } from '@/features/program/general/lib/detail-meta'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
  buildGeneralProgramVariantTitle,
  resolveGeneralProgramVariantFromProgram,
  type GeneralProgramVariant,
} from '@/features/program/general/lib/variant'
import { TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'

const PARTICIPANT_LABEL_BY_VALUE = Object.fromEntries(
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.map(o => [o.value, o.label])
) as Record<string, string>

/** 기관_커리큘럼형_단일 회차 유형 mock id */
export const GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID =
  'general-prog-type-org-curriculum-single' as const

export const GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_VARIANT: GeneralProgramVariant = {
  audience: 'organization',
  educationStructure: 'curriculum',
  sessionRound: 'single',
}

/** 기관_커리큘럼형_복수 회차 유형 mock id */
export const GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID =
  'general-prog-type-org-curriculum-multi' as const

/** 기관_커리큘럼형_복수 회차 — 교육 형태·IPS 일정 별 상이 데모 mock id */
export const GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_ID =
  'general-prog-type-org-curriculum-multi-edu-ips-per-schedule' as const

export const GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_VARIANT: GeneralProgramVariant = {
  audience: 'organization',
  educationStructure: 'curriculum',
  sessionRound: 'multi',
}

/** 기관_일정형_단일 회차 유형 mock id */
export const GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID =
  'general-prog-type-org-schedule-single' as const

/** 기관_일정형_복수 회차 — 행사 일정·과제 설정 스크린샷 mock id */
export const GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID =
  'general-prog-type-org-schedule-multi' as const

export const GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_VARIANT: GeneralProgramVariant = {
  audience: 'organization',
  educationStructure: 'schedule',
  sessionRound: 'single',
}

/** 스크린샷·유형 mock — 기관_일정형_단일 회차 공통 정보 */
export const GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_COMMON_INFO_MOCK: NonNullable<
  Program['generalCommonInfo']
> = {
  announcementTitle: '2026년 한국씨티은행-JA Korea 특별한 JOB담 모집 안내',
  detailedProgramName: '해당없음',
  sponsorDisplayName: '한국씨티은행',
  sponsorManagementId: 'sponsor-list-131',
  sponsorManagerLine: 'OO팀 이순신 책임 | 010-1234-5678',
  venueDetail: '-',
  educationFormLabel: '온라인',
  ipsTypeSummary: '일정 공통 | Succeed | Competition (대회+시상)',
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
  educationScheduleLines: [
    '26년 4월 20일(월) 09:30 ~ 12:20',
    '26년 4월 20일(월) 13:00 ~ 15:50',
    '26년 4월 27일(월) 09:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
  wageGradeRows: [
    { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 450,000원' },
    { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 350,000원' },
    { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 250,000원' },
  ],
  paymentItems: '교통비(일반), 숙박비(일반), 자원봉사자 활동비',
  deductionItems: '일용근로자 원천징수세액',
  kpi: {
    finalParticipants: 30,
    instructorCount: 80,
    volunteerCount: 80,
    finalSchools: 100,
    finalClasses: 100,
  },
}

/** 스크린샷·유형 mock — 기관_커리큘럼형_단일 회차 공통 정보 */
export const GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK: NonNullable<
  Program['generalCommonInfo']
> = {
  announcementTitle: '2026년 한국씨티은행-JA Korea 특별한 JOB담 모집 안내',
  detailedProgramName: '특별한 JOB담',
  sponsorDisplayName: '한국씨티은행',
  sponsorManagementId: 'sponsor-list-131',
  sponsorManagerLine: 'OO팀 이순신 책임 | 010-1234-5678',
  venueDetail: '-',
  educationFormLabel: '온라인',
  ipsTypeSummary: '일정 공통 | Prepare | 해당없음',
  curriculumSessions: [
    {
      sessionLabel: '1차시',
      title: '1단원 나를 알리는 기술',
      description:
        '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
    },
    {
      sessionLabel: '2차시',
      title: '2단원 나를 보여주는 기술',
      description:
        '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
    },
  ],
  educationScheduleLines: [
    '26년 4월 20일(월) 9:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
  wageGradeRows: [
    { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 450,000원' },
    { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 350,000원' },
    { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 250,000원' },
  ],
  paymentItems: '교통비(일반), 숙박비(일반), 자원봉사자 활동비',
  deductionItems: '일용근로자 원천징수세액',
  kpi: {
    finalParticipants: 30,
    instructorCount: 80,
    volunteerCount: 80,
    finalSchools: 100,
    finalClasses: 100,
  },
  participantRecruitmentInfo: {
    announcementPublished: true,
    preEducationNoticeRequired: true,
    certificateIssuanceProvided: true,
    maxAssignableInstructors: 2,
    maxClassCount: 4,
    maxSessionsPerDay: 8,
    maxScheduleCount: 3,
    operationPeriodLabel: '2026. 04. 03(금) - 2026. 11. 20(금)',
    recruitmentPeriodLabel: '2025. 12. 08(월) - 2026. 01. 16(금)',
    finalAnnouncementLabel: '2026. 01. 26 (금) | 홈페이지 공지 및 담당교사 개별 안내',
    contactOrganizationName: 'JA Korea',
  },
}

/** 스크린샷·유형 mock — 기관_일정형_복수 회차 (교육 형태·참여·IPS 일정 별 상이 → 행사 일정 + 과제 설정) */
export const GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_COMMON_INFO_MOCK: NonNullable<
  Program['generalCommonInfo']
> = {
  ...GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_COMMON_INFO_MOCK,
  educationFormScheduleDetail: 'perSchedule',
  participationScheduleDetail: 'perSchedule',
  ipsScheduleDetail: 'perSchedule',
  scheduleCurriculumPreEducation: false,
  scheduleDetails: [
    {
      scheduleLabel: '행사 일정 01',
      name: '',
      scheduleDateLabel: '26년 4월 20일(월)',
      assignmentEnabled: false,
      assignmentPeriod: '',
    },
    {
      scheduleLabel: '행사 일정 02',
      name: '',
      scheduleDateLabel: '',
      assignmentEnabled: false,
      assignmentPeriod: '',
    },
  ],
  educationScheduleLines: [
    '26년 4월 20일(월) 09:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
}

const MULTI_ROUND_CURRICULUM_SESSIONS_MOCK: NonNullable<
  Program['generalCommonInfo']
>['curriculumSessions'] = [
  {
    sessionLabel: '1회차',
    title: '2',
    description:
      '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
    assignmentEnabled: true,
    assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
  },
  {
    sessionLabel: '2회차',
    title: '2',
    description:
      '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
    assignmentEnabled: true,
    assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
  },
]

/** 스크린샷·유형 mock — 기관_커리큘럼형_복수 회차 공통 정보 */
export const GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK: NonNullable<
  Program['generalCommonInfo']
> = {
  ...GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK,
  curriculumSessions: MULTI_ROUND_CURRICULUM_SESSIONS_MOCK,
  educationScheduleLines: [
    '26년 4월 20일(월) 9:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
}

const MULTI_ROUND_PER_SCHEDULE_CURRICULUM_SESSIONS_MOCK: NonNullable<
  Program['generalCommonInfo']
>['curriculumSessions'] = [
  {
    sessionLabel: '1회차',
    title: '2',
    description:
      '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
    assignmentEnabled: true,
    assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
    educationFormLabel: '온라인',
    ipsTypeSummary: 'Prepare | 해당없음',
  },
  {
    sessionLabel: '2회차',
    title: '2',
    description:
      '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
    assignmentEnabled: true,
    assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
    educationFormLabel: '오프라인',
    ipsTypeSummary: 'Prepare | 해당없음',
  },
]

/** 기관_커리큘럼형_복수 회차 — 교육 형태·IPS 일정 별 상이 공통 정보 */
export const GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_COMMON_INFO_MOCK: NonNullable<
  Program['generalCommonInfo']
> = {
  ...GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK,
  educationFormScheduleDetail: 'perSchedule',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'perSchedule',
  ipsTypeSummary: '일정 별 상이 | Prepare | 해당없음',
  curriculumSessions: MULTI_ROUND_PER_SCHEDULE_CURRICULUM_SESSIONS_MOCK,
}

function buildCurriculumSessionsFromRounds(
  program: Program,
  variant: GeneralProgramVariant | null
): NonNullable<Program['generalCommonInfo']>['curriculumSessions'] {
  const isMulti =
    variant?.educationStructure === 'curriculum' && variant.sessionRound === 'multi'

  if (isMulti) {
    return program.rounds.map((r, i) => ({
      sessionLabel: `${i + 1}회차`,
      title: '2',
      description:
        r.curriculum?.includes('|')
          ? r.curriculum.split('|').slice(1).join('|').trim()
          : (r.curriculum?.replace(/^\d+회차\s*/, '').trim() ?? '-'),
      assignmentEnabled: true,
      assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
    }))
  }

  return program.rounds.map((r, i) => ({
    sessionLabel: `${i + 1}차시`,
    title: r.curriculum?.split('|')[0]?.trim() ?? `${i + 1}회차`,
    description: r.curriculum?.includes('|')
      ? r.curriculum.split('|').slice(1).join('|').trim()
      : (r.curriculum ?? '-'),
  }))
}

/** 목록·상세 헤더·breadcrumb — `Program.title` (유형 mock은 `일반 프로그램 (기관)_…` 형식) */
export function resolveGeneralProgramDisplayTitle(program: Program): string {
  return program.title?.trim() || '프로그램 상세'
}

export function resolveGeneralProgramListTitle(program: Program): string {
  return resolveGeneralProgramDisplayTitle(program)
}

export function formatGeneralParticipantTypesSummary(program: Program): string {
  return getGeneralParticipantTypes(program)
    .map(t => {
      if (t === 'teacher_instructor') return '강사'
      return PARTICIPANT_LABEL_BY_VALUE[t] ?? t
    })
    .join(', ')
}

export function formatGeneralSurveyItemsSummary(program: Program): string {
  const items = getGeneralSurveyMenuItems(program)
  if (items.length === 0) return '-'
  return items.map(i => i.label).join(', ')
}

export function resolveGeneralProgramCommonInfo(
  program: Program
): NonNullable<Program['generalCommonInfo']> {
  if (program.generalCommonInfo) return program.generalCommonInfo

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK
  }

  if (program.id === GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID) {
    return GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_COMMON_INFO_MOCK
  }

  if (program.id === GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID) {
    return GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_COMMON_INFO_MOCK
  }

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID) {
    return GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK
  }

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_ID) {
    return GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_COMMON_INFO_MOCK
  }

  const variant = resolveGeneralProgramVariantFromProgram(program)
  const educationStructure = variant
    ? GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS[variant.educationStructure]
    : '커리큘럼형'
  const sessionRound = variant
    ? GENERAL_PROGRAM_SESSION_ROUND_LABELS[variant.sessionRound]
    : '단일 회차'

  return {
    detailedProgramName: program.textbookName ?? program.teamDivision,
    educationFormLabel: program.type === 'online' ? '온라인' : '오프라인',
    ipsTypeSummary: program.ips ? `일정 공통 | ${program.ips} | 해당없음` : '-',
    curriculumSessions:
      variant?.educationStructure === 'schedule'
        ? undefined
        : buildCurriculumSessionsFromRounds(program, variant),
    scheduleDetails: variant?.educationStructure === 'schedule' ? [] : undefined,
    educationScheduleLines: [`${educationStructure} · ${sessionRound} (일정 mock)`],
    wageGradeRows: [
      { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 240,000원' },
    ],
    paymentItems: '교통비 (1사1교), 숙박비, 자원봉사자 활동비',
    deductionItems: '사업소득 3.3%, 기타 소득 8.8%',
    kpi: {
      finalParticipants: program.approvedStudentCount ?? 30,
      instructorCount: program.instructors ?? 80,
      volunteerCount: program.generalVolunteers ?? 80,
      finalSchools: program.participatingSchoolCount ?? 100,
      finalClasses: 100,
    },
  }
}

export function isGeneralOrgScheduleSingleProgram(program: Program): boolean {
  return program.id === GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID
}

export function isGeneralOrgCurriculumSingleProgram(program: Program): boolean {
  return program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID
}

export function isGeneralOrgCurriculumMultiProgram(program: Program): boolean {
  return program.id === GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID
}

export function isGeneralOrgCurriculumMultiEduIpsPerScheduleProgram(program: Program): boolean {
  return program.id === GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_ID
}

/** `general-programs.ts` seed — 스크린샷 mock 단일 소스 */
export function buildGeneralOrgCurriculumMultiProgramSeedFields(): {
  title: string
  mainTitle: string
  titleEn: string
  generalCommonInfo: NonNullable<Program['generalCommonInfo']>
  approvedStudentCount: number
  instructors: number
  instructorCapacity: number
  generalVolunteers: number
  participatingSchoolCount: number
} {
  const commonInfo = GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_COMMON_INFO_MOCK
  const variantTitle = buildGeneralProgramVariantTitle(GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_VARIANT)
  const kpi = commonInfo.kpi!

  return {
    title: variantTitle,
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    titleEn: 'Shining Future',
    generalCommonInfo: commonInfo,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
  }
}

/** `general-programs.ts` seed — 스크린샷 mock 단일 소스 */
export function buildGeneralOrgCurriculumMultiEduIpsPerScheduleProgramSeedFields(): {
  title: string
  mainTitle: string
  titleEn: string
  generalCommonInfo: NonNullable<Program['generalCommonInfo']>
  approvedStudentCount: number
  instructors: number
  instructorCapacity: number
  generalVolunteers: number
  participatingSchoolCount: number
} {
  const commonInfo = GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_COMMON_INFO_MOCK
  const variantTitle = buildGeneralProgramVariantTitle(GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_VARIANT)
  const kpi = commonInfo.kpi!

  return {
    title: `${variantTitle} · 교육·IPS 일정별 상이`,
    mainTitle: '특별한 JOB담 (교육·IPS 일정별 상이)',
    titleEn: 'Shining Future',
    generalCommonInfo: commonInfo,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
  }
}

/** `general-programs.ts` seed — 스크린샷 mock 단일 소스 (기관_일정형_단일 회차) */
export function buildGeneralOrgScheduleSingleProgramSeedFields(): {
  title: string
  mainTitle: string
  titleEn: string
  generalCommonInfo: NonNullable<Program['generalCommonInfo']>
  approvedStudentCount: number
  instructors: number
  instructorCapacity: number
  generalVolunteers: number
  participatingSchoolCount: number
} {
  const commonInfo = GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_COMMON_INFO_MOCK
  const variantTitle = buildGeneralProgramVariantTitle(GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_VARIANT)
  const kpi = commonInfo.kpi!

  return {
    title: variantTitle,
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    titleEn: 'Shining Future',
    generalCommonInfo: commonInfo,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
  }
}

/** `general-programs.ts` seed — 스크린샷 mock 단일 소스 */
export function buildGeneralOrgCurriculumSingleProgramSeedFields(): {
  title: string
  mainTitle: string
  titleEn: string
  generalCommonInfo: NonNullable<Program['generalCommonInfo']>
  approvedStudentCount: number
  instructors: number
  instructorCapacity: number
  generalVolunteers: number
  participatingSchoolCount: number
} {
  const commonInfo = GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_COMMON_INFO_MOCK
  const variantTitle = buildGeneralProgramVariantTitle(GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_VARIANT)
  const kpi = commonInfo.kpi!

  return {
    title: variantTitle,
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    titleEn: 'Shining Future',
    generalCommonInfo: commonInfo,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
  }
}
