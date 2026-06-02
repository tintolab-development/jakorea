/**
 * 일반 프로그램 Mock 데이터 (`/programs/general`)
 *
 * 1) 기존 그럴싸한 프로그램명 6건 (예정/진행/완료 UI·캘린더용)
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
        : '설문 있음(하위 3항목)'
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

const now = new Date()
const getDate = (daysAgo: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
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

/** 기존 목록·캘린더용 — 실제 후원사/프로그램명 스타일 */
const REALISTIC_GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = [
  {
    id: 'general-prog-scheduled-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    mainTitle: 'HSBC/HKU Business Case Competition 2026',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '프로그램 진행 예정(모집 전) 샘플 1',
    startDate: getDate(60),
    endDate: getDate(30),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(45),
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
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    mainTitle: '대학생경제교육봉사단 UJAT 36기',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '프로그램 진행 예정(모집 중) 샘플 2',
    startDate: getDate(58),
    endDate: getDate(26),
    applicationStartDate: getDate(92),
    applicationEndDate: getDate(42),
    status: 'pending',
    lifecycleStatus: 'recruiting_instructors' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: false,
    generalParticipantTypes: ['individual', 'teacher_instructor'],
    generalSurveyMenuKeys: [...SURVEY_MENU_FULL],
    generalProgramAudience: 'individual',
  },
  {
    id: 'general-prog-in-progress-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    mainTitle: 'Growth to Professional 2026',
    type: 'offline',
    format: 'workshop',
    category: 'instructor' as ProgramCategory,
    description: '프로그램 진행 중 샘플 1 (교사/강사)',
    startDate: getDate(45),
    endDate: getDate(15),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(30),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 18,
    instructors: 12,
    instructorCapacity: 20,
    participatingSchoolCount: 6,
    participatingStudentCount: 180,
    scheduleTimeEnabled: false,
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    generalSurveyMenuKeys: [],
  },
  {
    id: 'general-prog-in-progress-2',
    capacity: 35,
    sponsorId: SPONSOR_ID,
    title: '2026년 한국씨티은행-JA Korea 특별한 JOB탐 참가자 모집',
    mainTitle: '특별한 JOB탐',
    type: 'offline',
    format: 'seminar',
    category: 'volunteer' as ProgramCategory,
    description: '프로그램 진행 중 샘플 2 (봉사자)',
    startDate: getDate(43),
    endDate: getDate(12),
    applicationStartDate: getDate(86),
    applicationEndDate: getDate(28),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 24,
    generalVolunteers: 8,
    staffVolunteers: 4,
    participatingSchoolCount: 10,
    participatingStudentCount: 320,
    scheduleTimeEnabled: true,
    generalParticipantTypes: ['individual', 'volunteer'],
    generalVolunteerInterviewEnabled: true,
    interviewStartDate: getDate(50),
    interviewEndDate: getDate(40),
    interviewMethod: '대면 면접',
    generalSurveyMenuKeys: ['survey', 'satisfaction', 'lecture_evaluation'],
  },
  {
    id: 'general-prog-completed-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-함께 성장JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    mainTitle: 'SAP-함께 성장JA!',
    type: 'offline',
    format: 'seminar',
    category: 'school' as ProgramCategory,
    description: '프로그램 진행 완료 샘플 1',
    startDate: getDate(120),
    endDate: getDate(90),
    applicationStartDate: getDate(150),
    applicationEndDate: getDate(100),
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
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참가자 모집',
    mainTitle: 'Global Career Discovery',
    type: 'offline',
    format: 'seminar',
    category: 'individual' as ProgramCategory,
    description: '프로그램 진행 완료 샘플 2',
    startDate: getDate(118),
    endDate: getDate(88),
    applicationStartDate: getDate(152),
    applicationEndDate: getDate(98),
    status: 'completed',
    lifecycleStatus: 'document_processing_completed' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 22,
    scheduleTimeEnabled: false,
    generalParticipantTypes: ['individual', 'volunteer'],
    generalVolunteerInterviewEnabled: false,
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
  'education_after_textbook',
  'education_after_textbook',
  'education_after_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
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
      applicationStartDate: getDate(150),
      applicationEndDate: getDate(100),
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
      applicationStartDate: getDate(150),
      applicationEndDate: getDate(100),
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
      applicationStartDate: getDate(150),
      applicationEndDate: getDate(100),
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
    startDate: getDate(isCompleted ? 120 : isScheduled ? 58 : 44),
    endDate: getDate(isCompleted ? 90 : isScheduled ? 26 : 12),
    applicationStartDate: getDate(isCompleted ? 150 : 88),
    applicationEndDate: getDate(isCompleted ? 100 : 40),
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
    applicationStartDate: getDate(150),
    applicationEndDate: getDate(100),
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
  return {
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
    startDate: getDate(44),
    endDate: getDate(14),
    applicationStartDate: getDate(89),
    applicationEndDate: getDate(29),
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
}

const LNB_GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = [
  buildLnbCaseSeed(
    16,
    { hasInstructor: true, volunteerMode: 'interview_2depth', surveyMode: 'full' },
    {
      capacity: 36,
      category: 'instructor' as ProgramCategory,
      startDate: getDate(42),
      endDate: getDate(12),
      applicationStartDate: getDate(85),
      applicationEndDate: getDate(27),
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
      startDate: getDate(43),
      endDate: getDate(13),
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
      startDate: getDate(43),
      endDate: getDate(13),
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
      startDate: getDate(45),
      endDate: getDate(15),
      applicationStartDate: getDate(90),
      applicationEndDate: getDate(30),
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
      startDate: getDate(118),
      endDate: getDate(88),
      applicationStartDate: getDate(152),
      applicationEndDate: getDate(98),
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
      startDate: getDate(58),
      endDate: getDate(28),
      applicationStartDate: getDate(88),
      applicationEndDate: getDate(43),
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
      startDate: getDate(56),
      endDate: getDate(26),
      applicationStartDate: getDate(86),
      applicationEndDate: getDate(41),
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
      startDate: getDate(44),
      endDate: getDate(14),
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
      startDate: getDate(117),
      endDate: getDate(87),
      applicationStartDate: getDate(151),
      applicationEndDate: getDate(97),
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
    } = seed
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

  const local = readGeneralRegistrationLocalSavePrograms().filter(
    lp => !seeded.some(s => s.id === lp.id)
  )
  generalProgramsCache = [...seeded, ...local]

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
