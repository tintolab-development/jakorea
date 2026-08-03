/**
 * 일반 프로그램 Mock 데이터 (`/programs/general`)
 *
 * 1) 캘린더 QA용 7건 — `【예정·캘린더】` / `【진행·캘린더】` / `【완료·캘린더】` 접두 + 고정 일정
 * 2) 유형 케이스 8종(행 7~14) + 15행(교육·IPS 일정별 상이) — `【유형·NN】` 접두
 * 3) LNB 조합 9건(행 16~24) — `【LNB·NN】` 접두 (`general-prog-lnb-16` … `24`)
 */

import type {
  GeneralProgramAudienceKind,
  GeneralProgramEducationStructure,
  GeneralProgramParticipantType,
  GeneralProgramSessionRoundKind,
  GeneralProgramSurveyMenuKey,
  Program,
  ProgramCategory,
  ProgramLifecycleStatus,
  ProgramRound,
  TargetLevel,
} from '../../types/domain'
import { MINIMAL_INDIVIDUAL_LECTURE_ASSIGN_SCHEDULE_LINES } from '@/features/program/general/lib/individual-lecture-assign-demo'
import {
  buildGeneralProgramVariantTitle,
  GENERAL_PROGRAM_VARIANTS,
  generalProgramVariantIdSuffix,
  type GeneralProgramVariant,
} from '@/features/program/general/lib/variant'
import {
  buildGeneralOrgCurriculumMultiEduIpsPerScheduleProgramSeedFields,
  buildGeneralOrgCurriculumMultiProgramSeedFields,
  buildGeneralOrgCurriculumSingleProgramSeedFields,
  buildGeneralOrgScheduleSingleProgramSeedFields,
  GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_ID,
  GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID,
  GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'
import {
  mockApplicationPeriod,
  mockOperationPeriod,
  mockRecruitmentCaseFromLifecycle,
  mockOperationCaseFromLifecycle,
  mockRelativeIso,
} from './mock-program-period'
import { mockSponsors } from './sponsors'

const SPONSOR_ID = mockSponsors[0]?.id ?? 'sponsor-1'

/** 기관 프로그램 공통 — 기관 신청·진행 현황 LNB는 항상 노출 */
const BASE_PARTICIPANT_TYPES: GeneralProgramParticipantType[] = ['school_institution']

/** 설문 2depth 있음 — 설문 진행 항목 3종 전체 */
const SURVEY_MENU_FULL: GeneralProgramSurveyMenuKey[] = [
  'survey',
  'satisfaction',
  'lecture_evaluation',
]

const SURVEY_MENU_SINGLE: GeneralProgramSurveyMenuKey[] = ['survey']

/** 스크린샷 유형 구분 표 행 7~14 ↔ `GENERAL_PROGRAM_VARIANTS` 인덱스 */
const TYPE_CASE_ROW_BASE = 7

function typeCaseRowForVariantIndex(index: number): number {
  return TYPE_CASE_ROW_BASE + index
}

function formatTypeCaseTitle(row: number, title: string): string {
  return `【유형·${row}】${title}`
}

type LnbVolunteerMode = 'none' | 'no_interview' | 'interview_2depth'
type LnbSurveyMode = 'none' | 'single' | 'full'

type LnbMatrixConfig = {
  hasInstructor: boolean
  volunteerMode: LnbVolunteerMode
  surveyMode: LnbSurveyMode
}

function formatLnbCaseTitle(row: number, config: LnbMatrixConfig): string {
  const instructorLabel = config.hasInstructor ? '강사 있음' : '강사 없음'
  const volunteerLabel =
    config.volunteerMode === 'none'
      ? '봉사자 없음'
      : config.volunteerMode === 'no_interview'
        ? '봉사자 있음(면접 없음)'
        : '봉사자 있음(면접 2depth)'
  const surveyLabel =
    config.surveyMode === 'none'
      ? '설문 없음'
      : config.surveyMode === 'single'
        ? '설문 있음(하위 1항목)'
        : '설문 있음(하위 4항목)'
  return `【LNB·${row}】${instructorLabel} · ${volunteerLabel} · ${surveyLabel}`
}

function lnbSurveyMenuKeys(mode: LnbSurveyMode): GeneralProgramSurveyMenuKey[] {
  if (mode === 'none') return []
  if (mode === 'single') return [...SURVEY_MENU_SINGLE]
  return [...SURVEY_MENU_FULL]
}

function lnbParticipantTypes(config: LnbMatrixConfig): GeneralProgramParticipantType[] {
  const types: GeneralProgramParticipantType[] = [...BASE_PARTICIPANT_TYPES]
  if (config.hasInstructor) types.push('teacher_instructor')
  if (config.volunteerMode !== 'none') types.push('volunteer')
  return types
}

const getDate = (daysAgo: number, endOfDay = false) => mockRelativeIso(daysAgo, endOfDay)

/** lifecycle 기준 모집·운영 기간 (모집 예정/중/마감 넓은 창) */
function periodsFromLifecycle(
  lifecycle: ProgramLifecycleStatus | undefined,
  spreadDays = 0
): Pick<
  Program,
  'startDate' | 'endDate' | 'applicationStartDate' | 'applicationEndDate'
> {
  return {
    ...mockApplicationPeriod(mockRecruitmentCaseFromLifecycle(lifecycle), spreadDays),
    ...mockOperationPeriod(mockOperationCaseFromLifecycle(lifecycle), spreadDays),
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 캘린더뷰 QA용 고정 날짜 (KST) — `getDate()` 상대값 대신 탭별 월·일정 구분 */
function calendarDemoIso(year: number, month: number, day: number, endOfDay = false): string {
  return `${year}-${pad2(month)}-${pad2(day)}T${endOfDay ? '23:59:59' : '00:00:00'}+09:00`
}

function formatCalendarDemoTitle(prefix: string, name: string): string {
  return `【${prefix}】${name}`
}

const CALENDAR_DEMO_IN_PROGRESS_A_COMMON_INFO: NonNullable<Program['generalCommonInfo']> = {
  educationScheduleLines: [
    '26년 6월 10일(수) 09:30 ~ 11:30',
    '26년 6월 17일(수) 13:00 ~ 15:00',
  ],
  calendarSurveySchedules: [
    {
      id: 'survey-start',
      title: '설문조사 시작',
      startDate: calendarDemoIso(2026, 6, 5),
    },
    {
      id: 'survey-end',
      title: '설문조사 종료',
      endDate: calendarDemoIso(2026, 6, 12, true),
    },
  ],
  calendarAssignmentSchedules: [
    {
      id: 'assignment-due',
      title: '1회차 과제 제출 마감',
      dueDate: calendarDemoIso(2026, 6, 24, true),
    },
  ],
}

const CALENDAR_DEMO_SCHEDULED_INDIVIDUAL_COMMON_INFO: NonNullable<Program['generalCommonInfo']> = {
  educationScheduleLines: [...MINIMAL_INDIVIDUAL_LECTURE_ASSIGN_SCHEDULE_LINES],
}

const CALENDAR_DEMO_IN_PROGRESS_B_COMMON_INFO: NonNullable<Program['generalCommonInfo']> = {
  educationScheduleLines: ['26년 6월 12일(금) 10:00 ~ 12:00'],
  scheduleDetails: [
    {
      scheduleLabel: '세부 일정 01',
      name: '오리엔테이션',
    },
  ],
  calendarSurveySchedules: [
    {
      id: 'satisfaction-start',
      title: '만족도 조사 시작',
      startDate: calendarDemoIso(2026, 6, 8),
    },
  ],
  calendarAssignmentSchedules: [
    {
      id: 'assignment-due',
      title: '과제 제출 마감',
      dueDate: calendarDemoIso(2026, 6, 19, true),
    },
  ],
}

function buildProgramStartEndTime(seed: number): { startTime: string; endTime: string } {
  const templates = [
    { startH: 9, startM: 0, durationM: 150 },
    { startH: 10, startM: 30, durationM: 90 },
    { startH: 13, startM: 0, durationM: 120 },
    { startH: 14, startM: 0, durationM: 30 },
    { startH: 15, startM: 30, durationM: 120 },
    { startH: 16, startM: 0, durationM: 120 },
  ] as const
  const t = templates[seed % templates.length]
  const startTotal = t.startH * 60 + t.startM
  const endTotal = Math.min(startTotal + t.durationM, 24 * 60)
  const endH = Math.floor(endTotal / 60)
  const endM = endTotal % 60
  return {
    startTime: `${pad2(t.startH)}:${pad2(t.startM)}`,
    endTime: `${pad2(endH)}:${pad2(endM)}`,
  }
}

const createRounds = (
  programId: string,
  capacity: number,
  curriculumLabel: string,
  sessionRound: GeneralProgramSessionRoundKind = 'single',
  classCount?: number
): ProgramRound[] => {
  const roundCount = sessionRound === 'multi' ? 2 : 1
  return Array.from({ length: roundCount }, (_, i) => ({
    id: `${programId}-round-${i + 1}`,
    programId,
    roundNumber: i + 1,
    startDate: new Date(2026, 2, 1 + i * 14).toISOString(),
    endDate: new Date(2026, 2, 15 + i * 14).toISOString(),
    capacity,
    status: 'active' as const,
    deliveryType: 'offline' as const,
    curriculum: roundCount > 1 ? `${curriculumLabel} ${i + 1}회차` : curriculumLabel,
    ...(classCount != null ? { classCount } : {}),
  }))
}

type GeneralProgramSeed = Omit<Program, 'id' | 'rounds' | 'createdAt' | 'updatedAt'> & {
  id: string
  capacity: number
  scheduleTimeEnabled?: boolean
  generalParticipantTypes: GeneralProgramParticipantType[]
  generalVolunteerInterviewEnabled?: boolean
  generalSurveyMenuKeys?: GeneralProgramSurveyMenuKey[]
  generalProgramAudience?: GeneralProgramAudienceKind
  generalProgramEducationStructure?: GeneralProgramEducationStructure
  generalProgramSessionRound?: GeneralProgramSessionRoundKind
  /** `createRounds`에 전달 — seed에서 rounds를 직접 넣지 않을 때 사용 */
  sessionRoundForRounds?: GeneralProgramSessionRoundKind
  /** `createRounds` 1회차 `classCount` (참여자 모집 mock 등) */
  roundClassCount?: number
  createdAt?: string
  updatedAt?: string
}

/** 일반 프로그램(개인) — 상세 수정 모드 QA용 진행 예정 상태 */
const INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE =
  'planned' as ProgramLifecycleStatus

function isIndividualGeneralProgramSeed(seed: {
  generalProgramAudience?: GeneralProgramAudienceKind
  generalParticipantTypes?: GeneralProgramParticipantType[]
}): boolean {
  if (seed.generalProgramAudience === 'individual') return true
  const types = seed.generalParticipantTypes ?? []
  return types.includes('individual') && !types.includes('school_institution')
}

function applyIndividualGeneralProgramScheduledState<T extends GeneralProgramSeed>(seed: T): T {
  if (!isIndividualGeneralProgramSeed(seed)) return seed
  return {
    ...seed,
    status: 'pending',
    lifecycleStatus: INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
  }
}

function applyIndividualGeneralProgramScheduledProgram(program: Program): Program {
  if (!isIndividualGeneralProgramSeed(program)) return program
  return {
    ...program,
    status: 'pending',
    lifecycleStatus: INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
  }
}

/** 기존 목록·캘린더용 — `【예정·캘린더】` 등 접두 + 고정 일정으로 탭별 QA 구분 */
const REALISTIC_GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = [
  {
    id: 'general-prog-scheduled-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('예정·캘린더·A', 'HSBC Business Case 2026'),
    mainTitle: 'HSBC Business Case 2026',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '캘린더 QA — 예정 탭: 6/20 운영 시작만 표시',
    startDate: calendarDemoIso(2026, 6, 20),
    endDate: calendarDemoIso(2026, 9, 30, true),
    applicationStartDate: calendarDemoIso(2026, 5, 1),
    applicationEndDate: calendarDemoIso(2026, 5, 31, true),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: true,
    generalParticipantTypes: ['school_institution'],
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
  },
  {
    id: 'general-prog-scheduled-2',
    capacity: 40,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('예정·캘린더·B', 'UJAT 36기'),
    mainTitle: 'UJAT 36기',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '캘린더 QA — 예정 탭: 7/5 운영 시작만 표시',
    startDate: calendarDemoIso(2026, 7, 5),
    endDate: calendarDemoIso(2026, 10, 15, true),
    applicationStartDate: calendarDemoIso(2026, 5, 10),
    applicationEndDate: calendarDemoIso(2026, 6, 10, true),
    status: 'pending',
    lifecycleStatus: INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
    businessArea: '경제금융',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: false,
    generalParticipantTypes: ['individual', 'teacher_instructor'],
    generalParticipantInterviewEnabled: true,
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'multi',
    instructorApplicationStartDate: calendarDemoIso(2026, 4, 1),
    instructorApplicationEndDate: calendarDemoIso(2026, 4, 30, true),
    generalCommonInfo: CALENDAR_DEMO_SCHEDULED_INDIVIDUAL_COMMON_INFO,
  },
  {
    id: 'general-prog-in-progress-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('진행·캘린더·A', 'Growth to Professional 2026'),
    mainTitle: 'Growth to Professional 2026',
    type: 'offline',
    format: 'workshop',
    category: 'instructor' as ProgramCategory,
    description: '캘린더 QA — 6/10·6/17 교육, 6/5 설문, 6/24 과제',
    startDate: calendarDemoIso(2026, 5, 1),
    endDate: calendarDemoIso(2026, 8, 31, true),
    applicationStartDate: calendarDemoIso(2026, 3, 1),
    applicationEndDate: calendarDemoIso(2026, 3, 31, true),
    instructorApplicationStartDate: calendarDemoIso(2026, 4, 1),
    instructorApplicationEndDate: calendarDemoIso(2026, 4, 20, true),
    status: 'active',
    lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 18,
    instructors: 12,
    instructorCapacity: 20,
    participatingSchoolCount: 6,
    participatingStudentCount: 180,
    scheduleTimeEnabled: false,
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    generalSurveyMenuKeys: ['survey', 'satisfaction'],
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalCommonInfo: CALENDAR_DEMO_IN_PROGRESS_A_COMMON_INFO,
  },
  {
    id: 'general-prog-in-progress-2',
    capacity: 35,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('진행·캘린더·B', '특별한 JOB탐'),
    mainTitle: '특별한 JOB탐',
    type: 'offline',
    format: 'seminar',
    category: 'volunteer' as ProgramCategory,
    description: '캘린더 QA — 6/12 오리엔테이션, 6/8 만족도, 6/19 과제',
    startDate: calendarDemoIso(2026, 5, 15),
    endDate: calendarDemoIso(2026, 8, 15, true),
    applicationStartDate: calendarDemoIso(2026, 3, 15),
    applicationEndDate: calendarDemoIso(2026, 4, 15, true),
    volunteerApplicationStartDate: calendarDemoIso(2026, 4, 20),
    volunteerApplicationEndDate: calendarDemoIso(2026, 5, 5, true),
    status: 'pending',
    lifecycleStatus: INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
    businessArea: '진로취업',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 0,
    generalVolunteers: 8,
    scheduleTimeEnabled: true,
    generalParticipantTypes: ['individual', 'volunteer'],
    generalParticipantInterviewEnabled: true,
    generalVolunteerInterviewEnabled: true,
    interviewStartDate: calendarDemoIso(2026, 5, 8),
    interviewEndDate: calendarDemoIso(2026, 5, 12, true),
    interviewMethod: '대면 면접',
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    generalCommonInfo: CALENDAR_DEMO_IN_PROGRESS_B_COMMON_INFO,
  },
  {
    id: 'general-prog-in-progress-3',
    capacity: 32,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('진행·캘린더·C', '기관·봉사자 면접 QA'),
    mainTitle: '기관·봉사자 면접 QA',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description:
      '캘린더 QA — 기관 신청 + 봉사자 신청 LNB(면접 2depth: 서류/합격/2차 면접)',
    startDate: calendarDemoIso(2026, 5, 1),
    endDate: calendarDemoIso(2026, 8, 31, true),
    applicationStartDate: calendarDemoIso(2026, 3, 1),
    applicationEndDate: calendarDemoIso(2026, 3, 31, true),
    volunteerApplicationStartDate: calendarDemoIso(2026, 4, 1),
    volunteerApplicationEndDate: calendarDemoIso(2026, 4, 25, true),
    status: 'active',
    lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 16,
    instructors: 8,
    instructorCapacity: 12,
    generalVolunteers: 10,
    participatingSchoolCount: 5,
    participatingStudentCount: 150,
    scheduleTimeEnabled: true,
    generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
    generalVolunteerInterviewEnabled: true,
    interviewStartDate: calendarDemoIso(2026, 4, 28),
    interviewEndDate: calendarDemoIso(2026, 5, 3, true),
    interviewMethod: '대면 면접',
    generalSurveyMenuKeys: ['survey', 'satisfaction'],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
  },
  {
    id: 'general-prog-completed-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('완료·캘린더·A', 'SAP 함께 성장JA'),
    mainTitle: 'SAP 함께 성장JA',
    type: 'offline',
    format: 'seminar',
    category: 'school' as ProgramCategory,
    description: '캘린더 QA — 완료 탭: 5/15 운영 종료만 표시',
    startDate: calendarDemoIso(2026, 1, 10),
    endDate: calendarDemoIso(2026, 5, 15, true),
    applicationStartDate: calendarDemoIso(2025, 11, 1),
    applicationEndDate: calendarDemoIso(2025, 12, 15, true),
    status: 'completed',
    lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 28,
    scheduleTimeEnabled: true,
    generalParticipantTypes: ['school_institution', 'teacher_instructor', 'volunteer'],
    generalVolunteerInterviewEnabled: false,
    generalSurveyMenuKeys: [],
  },
  {
    id: 'general-prog-completed-2',
    capacity: 28,
    sponsorId: SPONSOR_ID,
    title: formatCalendarDemoTitle('완료·캘린더·B', 'Global Career Discovery'),
    mainTitle: 'Global Career Discovery',
    type: 'offline',
    format: 'seminar',
    category: 'individual' as ProgramCategory,
    description: '캘린더 QA — 완료 탭: 5/28 운영 종료만 표시',
    startDate: calendarDemoIso(2026, 2, 1),
    endDate: calendarDemoIso(2026, 5, 28, true),
    applicationStartDate: calendarDemoIso(2025, 11, 15),
    applicationEndDate: calendarDemoIso(2026, 1, 10, true),
    status: 'pending',
    lifecycleStatus: INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
    businessArea: '진로취업',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: false,
    generalParticipantTypes: ['individual', 'volunteer'],
    generalParticipantInterviewEnabled: false,
    generalVolunteerInterviewEnabled: false,
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    generalSurveyMenuKeys: ['survey'],
  },
]

/** LNB·설문·강사·봉사(면접) 전부 포함 — 8종 유형 mock 공통 */
const FULL_LNB_PARTICIPANT_TYPES = {
  organization: ['school_institution', 'teacher_instructor', 'volunteer'] as const,
  individual: ['individual', 'teacher_instructor', 'volunteer'] as const,
}

const TYPE_VARIANT_LIFECYCLE: ProgramLifecycleStatus[] = [
  'recruiting_students',
  'recruiting_instructors',
  INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
  INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
  'education_after_textbook',
  'recruiting_students',
  INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
  INDIVIDUAL_GENERAL_PROGRAM_SCHEDULED_LIFECYCLE,
]

function isOrgScheduleSingleVariant(variant: GeneralProgramVariant): boolean {
  return (
    variant.audience === 'organization' &&
    variant.educationStructure === 'schedule' &&
    variant.sessionRound === 'single'
  )
}

function isOrgCurriculumSingleVariant(variant: GeneralProgramVariant): boolean {
  return (
    variant.audience === 'organization' &&
    variant.educationStructure === 'curriculum' &&
    variant.sessionRound === 'single'
  )
}

function isOrgCurriculumMultiVariant(variant: GeneralProgramVariant): boolean {
  return (
    variant.audience === 'organization' &&
    variant.educationStructure === 'curriculum' &&
    variant.sessionRound === 'multi'
  )
}

function buildTypeVariantSeed(
  variant: GeneralProgramVariant,
  index: number
): GeneralProgramSeed {
  const variantTitle = buildGeneralProgramVariantTitle(variant)
  const typeCaseRow = typeCaseRowForVariantIndex(index)
  const title = formatTypeCaseTitle(typeCaseRow, variantTitle)
  const id = `general-prog-type-${generalProgramVariantIdSuffix(variant)}`

  if (isOrgCurriculumMultiVariant(variant)) {
    const screenshot = buildGeneralOrgCurriculumMultiProgramSeedFields()
    return {
      id: GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_ID,
      capacity: 30,
      sponsorId: SPONSOR_ID,
      title: formatTypeCaseTitle(typeCaseRow, screenshot.title),
      mainTitle: screenshot.mainTitle,
      titleEn: screenshot.titleEn,
      type: 'online',
      format: 'course',
      category: 'school' as ProgramCategory,
      description: `유형 mock — ${screenshot.title} (공통 정보 스크린샷 기준)`,
      startDate: '2025-12-08T00:00:00+09:00',
      endDate: '2026-12-30T23:59:59+09:00',
      ...mockApplicationPeriod('closed', 0),
      status: 'active',
      lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
      businessArea: '진로취업',
      targetLevel: 'high' as TargetLevel,
      approvedStudentCount: screenshot.approvedStudentCount,
      instructors: screenshot.instructors,
      instructorCapacity: screenshot.instructorCapacity,
      generalVolunteers: screenshot.generalVolunteers,
      participatingSchoolCount: screenshot.participatingSchoolCount,
      scheduleTimeEnabled: false,
      institutionType: 'inside_school',
      educationProcess: 'Traditional (Paper)',
      ipOwned: 'Jointly',
      courseDeliveredBy: 'JA',
      partnerInvolvement: false,
      ips: 'Prepare',
      createdAt: '2025-12-08T09:15:00+09:00',
      updatedAt: '2025-12-08T17:55:00+09:00',
      createdByName: '홍길동',
      updatedByName: '이순신',
      generalParticipantTypes: [
        ...FULL_LNB_PARTICIPANT_TYPES.organization,
      ] as GeneralProgramParticipantType[],
      generalVolunteerInterviewEnabled: true,
      interviewStartDate: getDate(48),
      interviewEndDate: getDate(38),
      interviewMethod: '대면 면접',
      generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
      generalProgramAudience: variant.audience,
      generalProgramEducationStructure: variant.educationStructure,
      generalProgramSessionRound: variant.sessionRound,
      sessionRoundForRounds: variant.sessionRound,
      generalCommonInfo: screenshot.generalCommonInfo,
    }
  }

  if (isOrgScheduleSingleVariant(variant)) {
    const screenshot = buildGeneralOrgScheduleSingleProgramSeedFields()
    return {
      id: GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
      capacity: 30,
      sponsorId: SPONSOR_ID,
      title: formatTypeCaseTitle(typeCaseRow, screenshot.title),
      mainTitle: screenshot.mainTitle,
      titleEn: screenshot.titleEn,
      type: 'online',
      format: 'workshop',
      category: 'school' as ProgramCategory,
      description: `유형 mock — ${screenshot.title} (공통 정보 스크린샷 기준)`,
      startDate: '2025-12-08T00:00:00+09:00',
      endDate: '2026-12-30T23:59:59+09:00',
      ...mockApplicationPeriod('closed', 0),
      status: 'active',
      lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
      businessArea: '진로취업',
      targetLevel: 'high' as TargetLevel,
      approvedStudentCount: screenshot.approvedStudentCount,
      instructors: screenshot.instructors,
      instructorCapacity: screenshot.instructorCapacity,
      generalVolunteers: screenshot.generalVolunteers,
      participatingSchoolCount: screenshot.participatingSchoolCount,
      scheduleTimeEnabled: false,
      institutionType: 'inside_school',
      educationProcess: 'Traditional (Paper)',
      ipOwned: 'Jointly',
      courseDeliveredBy: 'JA',
      partnerInvolvement: false,
      ips: 'Succeed',
      createdAt: '2025-12-08T09:15:00+09:00',
      updatedAt: '2025-12-08T17:55:00+09:00',
      createdByName: '홍길동',
      updatedByName: '이순신',
      generalParticipantTypes: [
        ...FULL_LNB_PARTICIPANT_TYPES.organization,
      ] as GeneralProgramParticipantType[],
      generalVolunteerInterviewEnabled: true,
      interviewStartDate: getDate(48),
      interviewEndDate: getDate(38),
      interviewMethod: '대면 면접',
      generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
      generalProgramAudience: variant.audience,
      generalProgramEducationStructure: variant.educationStructure,
      generalProgramSessionRound: variant.sessionRound,
      sessionRoundForRounds: variant.sessionRound,
      generalCommonInfo: screenshot.generalCommonInfo,
    }
  }

  if (isOrgCurriculumSingleVariant(variant)) {
    const screenshot = buildGeneralOrgCurriculumSingleProgramSeedFields()
    return {
      id: GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID,
      capacity: 30,
      sponsorId: SPONSOR_ID,
      title: formatTypeCaseTitle(typeCaseRow, screenshot.title),
      mainTitle: screenshot.mainTitle,
      titleEn: screenshot.titleEn,
      type: 'online',
      format: 'course',
      category: 'school' as ProgramCategory,
      description: `유형 mock — ${screenshot.title} (공통 정보 스크린샷 기준)`,
      startDate: '2025-12-08T00:00:00+09:00',
      endDate: '2026-12-30T23:59:59+09:00',
      ...mockApplicationPeriod('closed', 0),
      status: 'active',
      lifecycleStatus: 'education_in_progress' as ProgramLifecycleStatus,
      businessArea: '진로취업',
      targetLevel: 'high' as TargetLevel,
      approvedStudentCount: screenshot.approvedStudentCount,
      instructors: screenshot.instructors,
      instructorCapacity: screenshot.instructorCapacity,
      generalVolunteers: screenshot.generalVolunteers,
      participatingSchoolCount: screenshot.participatingSchoolCount,
      scheduleTimeEnabled: false,
      institutionType: 'inside_school',
      educationProcess: 'Traditional (Paper)',
      ipOwned: 'Jointly',
      courseDeliveredBy: 'JA',
      partnerInvolvement: false,
      ips: 'Prepare',
      createdAt: '2025-12-08T09:15:00+09:00',
      updatedAt: '2025-12-08T17:55:00+09:00',
      createdByName: '홍길동',
      updatedByName: '이순신',
      generalParticipantTypes: [
        ...FULL_LNB_PARTICIPANT_TYPES.organization,
      ] as GeneralProgramParticipantType[],
      generalVolunteerInterviewEnabled: true,
      interviewStartDate: getDate(48),
      interviewEndDate: getDate(38),
      interviewMethod: '대면 면접',
      generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
      generalProgramAudience: variant.audience,
      generalProgramEducationStructure: variant.educationStructure,
      generalProgramSessionRound: variant.sessionRound,
      sessionRoundForRounds: variant.sessionRound,
      generalCommonInfo: screenshot.generalCommonInfo,
      district: '특성화고등학교 3학년',
      studentListRequired: 'required',
      roundClassCount: 4,
      contactPhone: '02-6085-6028',
      contactEmail: 'cc@jakorea.org',
      resultAnnouncementDate: '2026-01-26T00:00:00+09:00',
      resultAnnouncementMethod: '홈페이지 공지 및 담당교사 개별 안내',
    }
  }

  const lifecycleStatus = TYPE_VARIANT_LIFECYCLE[index] ?? 'education_after_textbook'
  const isCompleted = ['education_completed', 'document_processing_completed'].includes(
    lifecycleStatus
  )
  const isScheduled = ['recruiting_students', 'recruiting_instructors'].includes(lifecycleStatus)
  const isIndividualAudience = variant.audience === 'individual'
  const period = periodsFromLifecycle(lifecycleStatus, index)

  return {
    id,
    capacity: 30 + index,
    sponsorId: SPONSOR_ID,
    title,
    mainTitle: title,
    type: 'offline',
    format: variant.educationStructure === 'curriculum' ? 'course' : 'workshop',
    category: (variant.audience === 'organization' ? 'school' : 'individual') as ProgramCategory,
    description: `유형 mock · 행 ${typeCaseRow} — ${variantTitle} (강사·봉사·설문 LNB 전체)`,
    ...period,
    status: isCompleted ? 'completed' : isScheduled ? 'pending' : 'active',
    lifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: isScheduled ? 0 : 20 + index,
    instructors: 8,
    instructorCapacity: 15,
    generalVolunteers: 6,
    scheduleTimeEnabled: index % 2 === 0,
    generalParticipantTypes: [
      ...FULL_LNB_PARTICIPANT_TYPES[variant.audience],
    ] as GeneralProgramParticipantType[],
    ...(isIndividualAudience
      ? {
          generalParticipantInterviewEnabled: true,
          generalCommonInfo: {
            ...(variant.educationStructure === 'schedule'
              ? {
                  scheduleDetails: [
                    {
                      scheduleLabel: '세부 일정 01',
                      name: '1차 교육',
                      participationMethodLabel: '팀',
                    },
                  ],
                }
              : {}),
          },
        }
      : {}),
    generalVolunteerInterviewEnabled: true,
    interviewStartDate: getDate(48),
    interviewEndDate: getDate(38),
    interviewMethod: '대면 면접',
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
    generalProgramAudience: variant.audience,
    generalProgramEducationStructure: variant.educationStructure,
    generalProgramSessionRound: variant.sessionRound,
    sessionRoundForRounds: variant.sessionRound,
  }
}

/** 프로그램 유형 8종 — title = `일반 프로그램 (기관/개인)_…` */
const TYPE_VARIANT_GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = GENERAL_PROGRAM_VARIANTS.map(
  (variant, index) => buildTypeVariantSeed(variant, index)
)

function buildOrgCurriculumMultiEduIpsPerScheduleSeed(): GeneralProgramSeed {
  const variant: GeneralProgramVariant = {
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
  }
  const screenshot = buildGeneralOrgCurriculumMultiEduIpsPerScheduleProgramSeedFields()
  return {
    id: GENERAL_PROGRAM_ORG_CURRICULUM_MULTI_EDU_IPS_PER_SCHEDULE_ID,
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: formatTypeCaseTitle(15, screenshot.title),
    mainTitle: screenshot.mainTitle,
    titleEn: screenshot.titleEn,
    type: 'online',
    format: 'course',
    category: 'school' as ProgramCategory,
    description: `유형 mock · 행 15 — ${screenshot.title} (교육 형태·IPS 일정 별 상이)`,
    startDate: '2025-12-08T00:00:00+09:00',
    endDate: '2026-12-30T23:59:59+09:00',
    ...mockApplicationPeriod('closed', 2),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: screenshot.approvedStudentCount,
    instructors: screenshot.instructors,
    instructorCapacity: screenshot.instructorCapacity,
    generalVolunteers: screenshot.generalVolunteers,
    participatingSchoolCount: screenshot.participatingSchoolCount,
    scheduleTimeEnabled: false,
    institutionType: 'inside_school',
    educationProcess: 'Traditional (Paper)',
    ipOwned: 'Jointly',
    courseDeliveredBy: 'JA',
    partnerInvolvement: false,
    ips: 'Prepare',
    createdAt: '2025-12-08T09:15:00+09:00',
    updatedAt: '2025-12-08T17:55:00+09:00',
    createdByName: '홍길동',
    updatedByName: '이순신',
    generalParticipantTypes: [
      ...FULL_LNB_PARTICIPANT_TYPES.organization,
    ] as GeneralProgramParticipantType[],
    generalVolunteerInterviewEnabled: true,
    interviewStartDate: getDate(48),
    interviewEndDate: getDate(38),
    interviewMethod: '대면 면접',
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
    generalProgramAudience: variant.audience,
    generalProgramEducationStructure: variant.educationStructure,
    generalProgramSessionRound: variant.sessionRound,
    sessionRoundForRounds: variant.sessionRound,
    generalCommonInfo: screenshot.generalCommonInfo,
  }
}

function buildLnbVolunteerFields(
  matrix: LnbMatrixConfig
): Pick<
  GeneralProgramSeed,
  | 'generalVolunteerInterviewEnabled'
  | 'interviewStartDate'
  | 'interviewEndDate'
  | 'interviewMethod'
> {
  if (matrix.volunteerMode === 'none') return {}
  if (matrix.volunteerMode === 'no_interview') {
    return { generalVolunteerInterviewEnabled: false }
  }
  return {
    generalVolunteerInterviewEnabled: true,
    interviewStartDate: getDate(50),
    interviewEndDate: getDate(40),
    interviewMethod: '대면 면접',
  }
}

/** LNB 메뉴 조합 — 스크린샷 구분 표 행 16~24 */
function buildLnbCaseSeed(
  row: number,
  matrix: LnbMatrixConfig,
  overrides: Partial<GeneralProgramSeed> = {}
): GeneralProgramSeed {
  const title = formatLnbCaseTitle(row, matrix)
  const base: Omit<
    GeneralProgramSeed,
    'startDate' | 'endDate' | 'applicationStartDate' | 'applicationEndDate'
  > = {
    id: `general-prog-lnb-${row}`,
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title,
    mainTitle: `LNB-${row}`,
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: `LNB mock · 행 ${row}`,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: row % 2 === 0,
    generalParticipantTypes: lnbParticipantTypes(matrix),
    generalSurveyMenuKeys: lnbSurveyMenuKeys(matrix.surveyMode),
    ...buildLnbVolunteerFields(matrix),
    ...overrides,
  }
  const period = periodsFromLifecycle(base.lifecycleStatus, row - 16)
  return {
    ...base,
    ...period,
  }
}

const LNB_GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = [
  buildLnbCaseSeed(
    16,
    { hasInstructor: true, volunteerMode: 'interview_2depth', surveyMode: 'full' },
    {
      capacity: 36,
      category: 'instructor' as ProgramCategory,
      approvedStudentCount: 24,
      instructors: 12,
      instructorCapacity: 20,
      generalVolunteers: 10,
      participatingSchoolCount: 8,
      participatingStudentCount: 240,
      scheduleTimeEnabled: false,
      interviewStartDate: getDate(35),
      interviewEndDate: getDate(28),
    }
  ),
  buildLnbCaseSeed(
    17,
    { hasInstructor: true, volunteerMode: 'no_interview', surveyMode: 'full' },
    {
      category: 'instructor' as ProgramCategory,
      approvedStudentCount: 22,
      instructors: 10,
      instructorCapacity: 15,
      generalVolunteers: 8,
      participatingSchoolCount: 5,
      scheduleTimeEnabled: true,
    }
  ),
  buildLnbCaseSeed(
    18,
    { hasInstructor: false, volunteerMode: 'interview_2depth', surveyMode: 'full' },
    {
      format: 'seminar',
      category: 'volunteer' as ProgramCategory,
      businessArea: '진로취업',
      targetLevel: 'middle' as TargetLevel,
      approvedStudentCount: 22,
      generalVolunteers: 6,
      participatingSchoolCount: 5,
      scheduleTimeEnabled: true,
    }
  ),
  buildLnbCaseSeed(
    19,
    { hasInstructor: false, volunteerMode: 'no_interview', surveyMode: 'none' },
    {
      capacity: 32,
      category: 'volunteer' as ProgramCategory,
      approvedStudentCount: 20,
      generalVolunteers: 6,
      scheduleTimeEnabled: false,
    }
  ),
  buildLnbCaseSeed(
    20,
    { hasInstructor: false, volunteerMode: 'no_interview', surveyMode: 'single' },
    {
      capacity: 28,
      format: 'seminar',
      category: 'volunteer' as ProgramCategory,
      businessArea: '진로취업',
      targetLevel: 'college' as TargetLevel,
      status: 'completed',
      lifecycleStatus: 'document_processing_completed' as ProgramLifecycleStatus,
      approvedStudentCount: 22,
      generalVolunteers: 12,
      scheduleTimeEnabled: true,
    }
  ),
  buildLnbCaseSeed(
    21,
    { hasInstructor: true, volunteerMode: 'none', surveyMode: 'none' },
    {
      category: 'instructor' as ProgramCategory,
      status: 'pending',
      lifecycleStatus: 'recruiting_instructors' as ProgramLifecycleStatus,
      scheduleTimeEnabled: false,
    }
  ),
  buildLnbCaseSeed(
    22,
    { hasInstructor: false, volunteerMode: 'interview_2depth', surveyMode: 'none' },
    {
      format: 'seminar',
      category: 'volunteer' as ProgramCategory,
      businessArea: '진로취업',
      targetLevel: 'college' as TargetLevel,
      status: 'pending',
      lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
      scheduleTimeEnabled: true,
    }
  ),
  buildLnbCaseSeed(
    23,
    { hasInstructor: true, volunteerMode: 'interview_2depth', surveyMode: 'none' },
    {
      capacity: 32,
      category: 'instructor' as ProgramCategory,
      approvedStudentCount: 18,
      instructors: 10,
      instructorCapacity: 15,
      generalVolunteers: 8,
      scheduleTimeEnabled: true,
      interviewStartDate: getDate(38),
      interviewEndDate: getDate(32),
      interviewMethod: '화상 면접',
    }
  ),
  buildLnbCaseSeed(
    24,
    { hasInstructor: false, volunteerMode: 'interview_2depth', surveyMode: 'single' },
    {
      capacity: 28,
      format: 'seminar',
      category: 'volunteer' as ProgramCategory,
      businessArea: '진로취업',
      targetLevel: 'college' as TargetLevel,
      status: 'completed',
      lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
      approvedStudentCount: 26,
      generalVolunteers: 10,
      scheduleTimeEnabled: false,
      interviewStartDate: getDate(36),
      interviewEndDate: getDate(30),
    }
  ),
]

const GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = [
  ...REALISTIC_GENERAL_PROGRAM_SEEDS,
  ...TYPE_VARIANT_GENERAL_PROGRAM_SEEDS,
  buildOrgCurriculumMultiEduIpsPerScheduleSeed(),
  ...LNB_GENERAL_PROGRAM_SEEDS,
]

import { readGeneralRegistrationLocalSavePrograms } from '@/features/program/general/lib/registration-local-save'

let generalProgramsCache: Program[] | null = null

/** 상세 화면 저장 — 시드 mock 위에 병합 (API 연동 전) */
const generalProgramDetailSaves = new Map<string, Program>()

export function saveGeneralProgramDetailSnapshot(program: Program): void {
  generalProgramDetailSaves.set(program.id, JSON.parse(JSON.stringify(program)) as Program)
  invalidateGeneralProgramsCache()
}

function applyGeneralProgramDetailSaves(programs: Program[]): Program[] {
  return programs.map(program => generalProgramDetailSaves.get(program.id) ?? program)
}

export function invalidateGeneralProgramsCache(): void {
  generalProgramsCache = null
}

export function getGeneralPrograms(): Program[] {
  const seeded = GENERAL_PROGRAM_SEEDS.map((seed, index) => {
    const {
      id,
      capacity,
      scheduleTimeEnabled,
      mainTitle,
      sessionRoundForRounds,
      roundClassCount,
      generalProgramAudience,
      generalProgramEducationStructure,
      generalProgramSessionRound,
      createdAt: seedCreatedAt,
      updatedAt: seedUpdatedAt,
      ...rest
    } = applyIndividualGeneralProgramScheduledState(seed)
    const createdAt = seedCreatedAt ?? getDate(30)
    const updatedAt = seedUpdatedAt ?? createdAt
    const timeFields =
      scheduleTimeEnabled === false ? {} : buildProgramStartEndTime(index)
    const curriculumLabel = mainTitle
      ? `${mainTitle} 커리큘럼`
      : '일반 프로그램 커리큘럼'
    const roundKind =
      sessionRoundForRounds ?? generalProgramSessionRound ?? 'single'
    return {
      ...rest,
      mainTitle,
      id,
      generalProgramAudience,
      generalProgramEducationStructure,
      generalProgramSessionRound,
      rounds: createRounds(id, capacity, curriculumLabel, roundKind, roundClassCount),
      ...timeFields,
      createdAt,
      updatedAt,
    } as Program
  })

  const local = readGeneralRegistrationLocalSavePrograms()
    .filter(lp => !seeded.some(s => s.id === lp.id))
    .map(applyIndividualGeneralProgramScheduledProgram)
  generalProgramsCache = applyGeneralProgramDetailSaves([...seeded, ...local])

  return generalProgramsCache
}

export function getGeneralProgramById(id: string): Program | undefined {
  return getGeneralPrograms().find(p => p.id === id)
}

/** LNB mock 전용 id 접두사 */
export function isGeneralLnbMockProgramId(programId: string): boolean {
  return programId.startsWith('general-prog-lnb-')
}

/** 유형 8종 mock id 접두사 */
export function isGeneralTypeVariantMockProgramId(programId: string): boolean {
  return programId.startsWith('general-prog-type-')
}

/**
 * 봉사자 신청 목록 LNB QA용 프로그램 id (일반 상세 mock)
 * - `generalParticipantTypes`에 `volunteer` 포함 시 LNB 노출
 * - `generalVolunteerInterviewEnabled === true`(또는 면접 일정) 시 2depth 메뉴
 */
/** 개인 참여자 신청 LNB QA용 프로그램 id */
export const GENERAL_PARTICIPANT_APPLICATION_QA = {
  /** 개인 + 면접 2depth */
  individualWithInterview2Depth: 'general-prog-scheduled-2',
  /** 개인 + 봉사 + 참여자·봉사 면접 2depth */
  individualWithBothInterviews: 'general-prog-in-progress-2',
  /** 개인 + 면접 없음 */
  individualNoInterview: 'general-prog-completed-2',
} as const

export const GENERAL_VOLUNTEER_APPLICATION_QA = {
  /** 개인 + 봉사 + 면접 2depth */
  individualWithInterview2Depth: 'general-prog-in-progress-2',
  /** 개인 + 봉사 + 면접 없음(1depth) */
  individualNoInterview: 'general-prog-completed-2',
  /** 기관 + 봉사 + 면접 없음(1depth) */
  organizationNoInterview: 'general-prog-completed-1',
  /** 기관 + 봉사 + 면접 2depth */
  organizationWithInterview2Depth: 'general-prog-in-progress-3',
  /** LNB 조합 mock — 면접 2depth */
  lnbInterview2Depth: 'general-prog-lnb-16',
  /** LNB 조합 mock — 면접 없음 */
  lnbNoInterview: 'general-prog-lnb-17',
  /** LNB 조합 mock — 봉사자 없음(대조) */
  lnbNoVolunteer: 'general-prog-lnb-21',
} as const
