/**
 * CMS 4유형 시드 스냅샷 (Platform 홈 목록 카테고리 정합).
 * 모집·운영 기간: 기준일 = **런타임 오늘** (CMS `mock-program-period` 와 동일 오프셋).
 *
 * 배지 케이스 (`getRecruitmentStatus` / Platform lifecycle 매핑):
 * - 모집 예정: D+60 ~ D+240
 * - 모집 중: D-120 ~ D+120
 * - 모집 마감: D-300 ~ D-45
 *
 * - 일반 8 / 1사1교 8 / 교육받은 교사 8 / Gemini featured 3 / 상세 케이스 4
 * Platform 탭: youth / institution / instructor
 * 상세 케이스 SSOT: case-instructor, case-volunteer, ujat volunteer/participant
 */

import type {
  CmsCurriculumSession,
  CmsLifecycleStatus,
  CmsProgramCommonInfo,
  CmsProgramLike,
  CmsRegistrationCaseKind,
  CmsScheduleDetail,
  CmsSessionRound,
} from '../model/cms-program.types'

export type CmsRegistrationFixture = CmsProgramLike & {
  registrationCase: CmsRegistrationCaseKind
}

/** 기준일: 런타임 오늘 (CMS mock 과 동일) */
/** CMS `getDate(daysAgo)` 와 동일 — daysAgo>0 과거, <0 미래 */
function cmsGetDate(daysAgo: number, endOfDay = false): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  return date.toISOString()
}

/** CMS mock-program-period 모집 창 (daysAgo) */
const APP_PERIOD = {
  scheduled: { start: -60, end: -240 },
  recruiting: { start: 120, end: -120 },
  closed: { start: 300, end: 45 },
} as const

const OP_PERIOD = {
  scheduled: { start: -90, end: -300 },
  recruiting: { start: -30, end: -210 },
  closed: { start: 60, end: -90 },
  closedCompleted: { start: 200, end: 60 },
} as const

type AppCase = keyof typeof APP_PERIOD
type OpCase = keyof typeof OP_PERIOD

function appPeriod(caseKind: AppCase, spread = 0) {
  const base = APP_PERIOD[caseKind]
  return {
    applicationStartDate: cmsGetDate(base.start - spread),
    applicationEndDate: cmsGetDate(base.end - spread, true),
  }
}

function opPeriod(caseKind: OpCase, spread = 0) {
  const base = OP_PERIOD[caseKind]
  return {
    startDate: cmsGetDate(base.start - spread),
    endDate: cmsGetDate(base.end - spread, true),
  }
}

function periodBundle(app: AppCase, op: OpCase, spread = 0) {
  return { ...appPeriod(app, spread), ...opPeriod(op, spread) }
}

const FULL_LNB_ORG = ['school_institution', 'teacher_instructor', 'volunteer'] as const
const FULL_LNB_IND = ['individual', 'teacher_instructor', 'volunteer'] as const
const COMPANY_SCHOOL_PARTICIPANTS = ['school_institution', 'teacher_instructor'] as const

function formatTypeCaseTitle(row: number, title: string): string {
  return `【유형·${row}】${title}`
}

function typeRow(index: number): number {
  return 7 + index
}

function generalVariantTitle(
  audience: 'organization' | 'individual',
  educationStructure: 'curriculum' | 'schedule',
  sessionRound: 'single' | 'multi'
): string {
  const a = audience === 'organization' ? '기관' : '개인'
  const e = educationStructure === 'curriculum' ? '커리큘럼형' : '일정형'
  const s = sessionRound === 'single' ? '단일 회차' : '복수 회차'
  return `일반 프로그램 (${a})_${e}_${s}`
}

type TypeSeedArgs = {
  registrationCase: Extract<CmsRegistrationCaseKind, `general-${string}`>
  idSuffix: string
  index: number
  audience: 'organization' | 'individual'
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  /** special org screenshot seeds */
  special?: 'org-curriculum' | 'org-schedule'
  lifecycleStatus: CmsLifecycleStatus
  type: CmsProgramLike['type']
  businessArea: string
  targetLevel: CmsProgramLike['targetLevel']
  useRelativeDates: boolean
  /** 개인 팀 신청 폼(teamInfo) mock — CMS participationMethod */
  participationMethod?: 'individual' | 'team'
}

const CURRICULUM_SINGLE_SESSIONS: CmsCurriculumSession[] = [
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
]

const CURRICULUM_MULTI_SESSIONS: CmsCurriculumSession[] = [
  {
    sessionLabel: '1회차',
    title: '2',
    description:
      '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
    assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
  },
  {
    sessionLabel: '2회차',
    title: '2',
    description:
      '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
    assignmentPeriod: '26년 4월 20일(월) ~ 26년 4월 27일(월)',
  },
]

const DEFAULT_EDUCATION_SCHEDULE_LINES = [
  '2026년 4월 20일(월) 9:30 ~ 12:20',
  '2026년 4월 27일(월) 13:00 ~ 15:50',
] as const

const SCHEDULE_SINGLE_DETAILS: CmsScheduleDetail[] = [
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
]

const SCHEDULE_SINGLE_LINES = [
  '2026년 4월 20일(월) 09:30 ~ 12:20',
  '2026년 4월 20일(월) 13:00 ~ 15:50',
  '2026년 4월 27일(월) 09:30 ~ 12:20',
  '2026년 4월 27일(월) 13:00 ~ 15:50',
] as const

const SCHEDULE_MULTI_DETAILS: CmsScheduleDetail[] = [
  {
    scheduleLabel: '행사 일정 01',
    name: '오리엔테이션',
    scheduleDateLabel: '2026년 3월 2일(월) 10:00 ~ 12:00',
  },
  {
    scheduleLabel: '행사 일정 02',
    name: '국내대회',
    scheduleDateLabel: '2026년 3월 11일(수) 10:00 ~ 12:00',
  },
]

const SCHEDULE_MULTI_LINES = [
  '2026년 4월 20일(월) 09:30 ~ 12:20',
  '2026년 4월 27일(월) 13:00 ~ 15:50',
] as const

function buildGeneralCommonInfo(
  educationStructure: 'curriculum' | 'schedule',
  sessionRound: CmsSessionRound,
  educationFormLabel: string
): CmsProgramCommonInfo {
  if (educationStructure === 'schedule') {
    if (sessionRound === 'multi') {
      return {
        educationFormLabel,
        sponsorDisplayName: 'JA Korea',
        scheduleDetails: SCHEDULE_MULTI_DETAILS.map(row => ({ ...row })),
        educationScheduleLines: [...SCHEDULE_MULTI_LINES],
      }
    }
    return {
      educationFormLabel,
      sponsorDisplayName: 'JA Korea',
      scheduleDetails: SCHEDULE_SINGLE_DETAILS.map(row => ({ ...row })),
      educationScheduleLines: [...SCHEDULE_SINGLE_LINES],
    }
  }

  if (sessionRound === 'multi') {
    return {
      educationFormLabel,
      sponsorDisplayName: 'JA Korea',
      curriculumSessions: CURRICULUM_MULTI_SESSIONS.map(row => ({ ...row })),
      educationScheduleLines: [...DEFAULT_EDUCATION_SCHEDULE_LINES],
    }
  }

  return {
    educationFormLabel,
    sponsorDisplayName: 'JA Korea',
    curriculumSessions: CURRICULUM_SINGLE_SESSIONS.map(row => ({ ...row })),
    educationScheduleLines: [...DEFAULT_EDUCATION_SCHEDULE_LINES],
  }
}

function buildTypeFixture(args: TypeSeedArgs): CmsRegistrationFixture {
  const variantTitle = generalVariantTitle(
    args.audience,
    args.educationStructure,
    args.sessionRound
  )
  const row = typeRow(args.index)
  const titleInner =
    args.special === 'org-curriculum' || args.special === 'org-schedule'
      ? variantTitle
      : variantTitle
  const title = formatTypeCaseTitle(row, titleInner)
  const id = `general-prog-type-${args.idSuffix}`
  const isOrg = args.audience === 'organization'

  const absoluteOps = {
    startDate: '2025-12-08T00:00:00+09:00',
    endDate: '2026-12-30T23:59:59+09:00',
    ...appPeriod('closed'),
  }

  const recruitCase: AppCase =
    args.lifecycleStatus === 'planned' ||
    args.lifecycleStatus === 'instructor_recruitment_planned'
      ? 'scheduled'
      : args.lifecycleStatus === 'recruiting_students' ||
          args.lifecycleStatus === 'recruiting_instructors'
        ? 'recruiting'
        : 'closed'

  const opCase: OpCase =
    recruitCase === 'scheduled'
      ? 'scheduled'
      : recruitCase === 'recruiting'
        ? 'recruiting'
        : args.lifecycleStatus === 'education_completed' ||
            args.lifecycleStatus === 'document_processing_completed' ||
            args.lifecycleStatus === 'matching_completed'
          ? 'closedCompleted'
          : 'closed'

  const relativeOps = periodBundle(recruitCase, opCase, args.index)

  const dates = args.useRelativeDates ? relativeOps : absoluteOps
  const educationFormLabel =
    args.type === 'online' ? '온라인' : args.type === 'hybrid' ? '온/오프라인' : '오프라인'

  const commonInfo = buildGeneralCommonInfo(
    args.educationStructure,
    args.sessionRound,
    educationFormLabel
  )
  commonInfo.announcementTitle = title
  if (args.participationMethod) {
    commonInfo.participationMethod = args.participationMethod
  }

  return {
    registrationCase: args.registrationCase,
    registrationKind: 'general',
    id,
    title,
    mainTitle: args.special
      ? '한국씨티은행-JA Korea 특별한 JOB담'
      : title,
    description: args.special
      ? `유형 mock — ${variantTitle} (공통 정보 스크린샷 기준)`
      : `유형 mock · 행 ${row} — ${variantTitle} (강사·봉사·설문 LNB 전체)`,
    type: args.type,
    category: isOrg ? 'school' : 'individual',
    ...dates,
    lifecycleStatus: args.lifecycleStatus,
    businessArea: args.businessArea,
    targetLevel: args.targetLevel,
    district: args.special === 'org-curriculum' && args.sessionRound === 'single'
      ? '특성화고등학교 3학년'
      : undefined,
    generalParticipantTypes: isOrg ? [...FULL_LNB_ORG] : [...FULL_LNB_IND],
    generalProgramAudience: args.audience,
    generalProgramEducationStructure: args.educationStructure,
    generalProgramSessionRound: args.sessionRound,
    generalCommonInfo: commonInfo,
  }
}

/**
 * CMS GENERAL_PROGRAM_VARIANTS 순서 (index 0~7).
 * special: org curriculum single/multi, org schedule single → 절대 기간 + education_in_progress
 */
export const GENERAL_REGISTRATION_FIXTURES: CmsRegistrationFixture[] = [
  buildTypeFixture({
    registrationCase: 'general-org-curriculum-single',
    idSuffix: 'org-curriculum-single',
    index: 0,
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    special: 'org-curriculum',
    lifecycleStatus: 'education_in_progress',
    type: 'online',
    businessArea: '진로취업',
    targetLevel: 'high',
    useRelativeDates: false,
  }),
  buildTypeFixture({
    registrationCase: 'general-org-curriculum-multi',
    idSuffix: 'org-curriculum-multi',
    index: 1,
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    special: 'org-curriculum',
    lifecycleStatus: 'education_in_progress',
    type: 'online',
    businessArea: '진로취업',
    targetLevel: 'high',
    useRelativeDates: false,
  }),
  buildTypeFixture({
    registrationCase: 'general-ind-curriculum-single',
    idSuffix: 'ind-curriculum-single',
    index: 2,
    audience: 'individual',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    lifecycleStatus: 'planned',
    type: 'offline',
    businessArea: '경제금융',
    targetLevel: 'high',
    useRelativeDates: true,
  }),
  buildTypeFixture({
    registrationCase: 'general-ind-curriculum-multi',
    idSuffix: 'ind-curriculum-multi',
    index: 3,
    audience: 'individual',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    lifecycleStatus: 'planned',
    type: 'offline',
    businessArea: '경제금융',
    targetLevel: 'high',
    useRelativeDates: true,
    /** 개인_팀 신청 폼 SSOT — CMS participationMethod=team */
    participationMethod: 'team',
  }),
  buildTypeFixture({
    registrationCase: 'general-org-schedule-single',
    idSuffix: 'org-schedule-single',
    index: 4,
    audience: 'organization',
    educationStructure: 'schedule',
    sessionRound: 'single',
    special: 'org-schedule',
    lifecycleStatus: 'education_in_progress',
    type: 'online',
    businessArea: '진로취업',
    targetLevel: 'high',
    useRelativeDates: false,
  }),
  buildTypeFixture({
    registrationCase: 'general-org-schedule-multi',
    idSuffix: 'org-schedule-multi',
    index: 5,
    audience: 'organization',
    educationStructure: 'schedule',
    sessionRound: 'multi',
    lifecycleStatus: 'recruiting_students',
    type: 'offline',
    businessArea: '경제금융',
    targetLevel: 'high',
    useRelativeDates: true,
  }),
  buildTypeFixture({
    registrationCase: 'general-ind-schedule-single',
    idSuffix: 'ind-schedule-single',
    index: 6,
    audience: 'individual',
    educationStructure: 'schedule',
    sessionRound: 'single',
    lifecycleStatus: 'planned',
    type: 'offline',
    businessArea: '경제금융',
    targetLevel: 'high',
    useRelativeDates: true,
  }),
  buildTypeFixture({
    registrationCase: 'general-ind-schedule-multi',
    idSuffix: 'ind-schedule-multi',
    index: 7,
    audience: 'individual',
    educationStructure: 'schedule',
    sessionRound: 'multi',
    lifecycleStatus: 'planned',
    type: 'offline',
    businessArea: '경제금융',
    targetLevel: 'high',
    useRelativeDates: true,
  }),
]

type EconomySeed = {
  id: string
  title: string
  mainTitle: string
  lifecycleStatus: CmsLifecycleStatus
  targetLevel: NonNullable<CmsProgramLike['targetLevel']>
  district: string
  /** 동일 케이스 내 일자 분산 */
  spreadDays?: number
  appCase: AppCase
  opCase: OpCase
}

/** CMS COMPANY_SCHOOL_CASE_PROGRAMS index 0~7 — 모집기간은 lifecycle 배지 정합 */
const ECONOMY_SEEDS: EconomySeed[] = [
  {
    id: 'economy-prog-001',
    title: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    mainTitle: 'HSBC/HKU Business Case Competition 2026',
    lifecycleStatus: 'planned',
    targetLevel: 'elementary',
    district: '홍콩·국내 병행 (온·오프라인)',
    appCase: 'scheduled',
    opCase: 'scheduled',
  },
  {
    id: 'economy-prog-002',
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    mainTitle: '2026 JA Korea 대학생경제교육봉사단',
    lifecycleStatus: 'recruiting_students',
    targetLevel: 'high',
    district: '전국',
    appCase: 'recruiting',
    opCase: 'recruiting',
  },
  {
    id: 'economy-prog-003',
    title: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    mainTitle: 'Growth to Professional 2026',
    lifecycleStatus: 'recruiting_instructors',
    targetLevel: 'high',
    district: '서울 영등포구',
    spreadDays: 7,
    appCase: 'recruiting',
    opCase: 'recruiting',
  },
  {
    id: 'economy-prog-004',
    title: '2026년 JA Korea 초등 경제교육 모집 안내',
    mainTitle: '2026년 JA Korea 초등 경제교육',
    lifecycleStatus: 'matching_completed',
    targetLevel: 'elementary',
    district: '경기 성남시',
    appCase: 'closed',
    opCase: 'closedCompleted',
  },
  {
    id: 'economy-prog-005',
    title: '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    mainTitle: 'SAP-함께 성장하JA! IT·SW 멘토링',
    lifecycleStatus: 'education_before_textbook',
    targetLevel: 'high',
    district: '서울 판교 (집합)',
    spreadDays: 5,
    appCase: 'closed',
    opCase: 'closed',
  },
  {
    id: 'economy-prog-006',
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
    mainTitle: 'Global Career Discovery 원데이 멘토링',
    lifecycleStatus: 'education_after_textbook',
    targetLevel: 'high',
    district: '서울 강남구',
    spreadDays: 10,
    appCase: 'closed',
    opCase: 'closed',
  },
  {
    id: 'economy-prog-007',
    title: '2026년 JA Korea 경제금융교육 전문강사단 모집',
    mainTitle: '2026년 JA Korea 경제금융교육 전문강사단',
    lifecycleStatus: 'education_completed',
    targetLevel: 'high',
    district: '전국',
    appCase: 'closed',
    opCase: 'closedCompleted',
  },
  {
    id: 'economy-prog-008',
    title: '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    lifecycleStatus: 'document_processing_completed',
    targetLevel: 'high',
    district: '서울 중구',
    spreadDays: 14,
    appCase: 'closed',
    opCase: 'closedCompleted',
  },
]

function buildEconomyFixture(seed: EconomySeed): CmsRegistrationFixture {
  const dates = periodBundle(seed.appCase, seed.opCase, seed.spreadDays ?? 0)
  return {
    registrationCase: 'economy-company-school',
    registrationKind: 'economy',
    id: seed.id,
    title: seed.title,
    mainTitle: seed.mainTitle,
    description: seed.title,
    type: 'offline',
    category: 'school',
    ...dates,
    lifecycleStatus: seed.lifecycleStatus,
    businessArea: '경제금융',
    targetLevel: seed.targetLevel,
    district: seed.district,
    generalParticipantTypes: [...COMPANY_SCHOOL_PARTICIPANTS],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      announcementTitle: seed.title,
      educationFormLabel: '오프라인',
      sponsorDisplayName:
        seed.id === 'economy-prog-008' ? '한국씨티은행' : 'JA Korea',
      educationScheduleLines: ['2026. 03. 01 ~ 2026. 12. 30'],
      curriculumSessions: [
        {
          sessionLabel: '1차시',
          title: '1단원 나를 알리는 기술',
          description: '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
        },
        {
          sessionLabel: '2차시',
          title: '2단원 나를 보여주는 기술',
          description: '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
        },
      ],
    },
  }
}

export const ECONOMY_REGISTRATION_FIXTURES: CmsRegistrationFixture[] =
  ECONOMY_SEEDS.map(buildEconomyFixture)

/** @deprecated 호환용 — 첫 1사1교 시드 */
export const ECONOMY_REGISTRATION_FIXTURE = ECONOMY_REGISTRATION_FIXTURES[0]!

/**
 * CMS TRAINED_TEACHERS_TITLES (SSOT)
 * economy-prog index i → trained-teachers-prog-(i+1) (dates/lifecycle inherit)
 */
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

function buildTrainedTeachersFixture(
  economySeed: EconomySeed,
  index: number
): CmsRegistrationFixture {
  const id = `trained-teachers-prog-${String(index + 1).padStart(3, '0')}`
  const title = TRAINED_TEACHERS_TITLES[index]!
  const structure: NonNullable<CmsProgramLike['generalProgramEducationStructure']> =
    index < 4 ? 'curriculum' : 'schedule'
  const sessionRound: NonNullable<CmsProgramLike['generalProgramSessionRound']> =
    index % 2 === 0 ? 'single' : 'multi'

  return {
    registrationCase: 'trained-teachers-program',
    registrationKind: 'trainedTeachers',
    id,
    title,
    mainTitle: title,
    description: title,
    type: index < 4 ? 'online' : 'offline',
    category: 'instructor',
    ...periodBundle(
      economySeed.appCase,
      economySeed.opCase,
      economySeed.spreadDays ?? index
    ),
    lifecycleStatus: economySeed.lifecycleStatus,
    businessArea: '경제금융',
    targetLevel: economySeed.targetLevel,
    district: economySeed.district,
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: structure,
    generalProgramSessionRound: sessionRound,
    generalCommonInfo: {
      announcementTitle: title,
      educationFormLabel: index < 4 ? '온라인' : '오프라인',
      sponsorDisplayName: 'JA Korea',
      educationScheduleLines: ['2026. 04. 03(금) ~ 2026. 11. 20(금)'],
      curriculumSessions: [
        {
          sessionLabel: '1차시',
          title: '1단원 교사 경제교육 개요',
          description: '학교 현장 경제·금융 교육 목표와 교안 구성을 안내합니다.',
        },
        {
          sessionLabel: '2차시',
          title: '2단원 수업 실습',
          description: '단원별 활동 설계와 수업 시뮬레이션을 진행합니다.',
        },
      ],
    },
  }
}

export const TRAINED_TEACHERS_REGISTRATION_FIXTURES: CmsRegistrationFixture[] =
  ECONOMY_SEEDS.map(buildTrainedTeachersFixture)

/**
 * Gemini featured 3 — 모집 예정/중/마감 넓은 창 (오늘 기준).
 */
type GeminiFeaturedSeed = {
  id: string
  title: string
  lifecycleStatus: CmsLifecycleStatus
  appCase: AppCase
  opCase: OpCase
}

const GEMINI_FEATURED_SEEDS: GeminiFeaturedSeed[] = [
  {
    id: 'gvt-recruitment-scheduled',
    title: '(Google for Education & JA Korea)Gemini Academy Coding Bootcamp',
    lifecycleStatus: 'planned',
    appCase: 'scheduled',
    opCase: 'scheduled',
  },
  {
    id: 'gvt-recruitment-in-progress',
    title:
      '(Google for Education & JA Korea) Gemini Academy 2025 찾아가는 연수 신청',
    lifecycleStatus: 'recruiting_students',
    appCase: 'recruiting',
    opCase: 'recruiting',
  },
  {
    id: 'gvt-recruitment-ended',
    title:
      '(Google for Education & JA Korea) Gemini Academy AI for Education Workshop',
    lifecycleStatus: 'matching_completed',
    appCase: 'closed',
    opCase: 'closedCompleted',
  },
]

function buildGeminiFixture(seed: GeminiFeaturedSeed): CmsRegistrationFixture {
  return {
    registrationCase: 'gemini-recruitment',
    registrationKind: 'gemini',
    id: seed.id,
    title: seed.title,
    mainTitle: seed.title,
    description:
      'Google for Education과 JA Korea가 함께하는 Gemini Academy 찾아가는 연수로, 특성화고등학교 학생에게 AI·커리어 역량 교육을 제공합니다.',
    type: 'online',
    category: 'school',
    ...periodBundle(seed.appCase, seed.opCase),
    lifecycleStatus: seed.lifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'high',
    district: '온라인 (ZOOM)',
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    recruitmentGuide:
      '1. 연수 일정 : 2026년 4월 20일(월) ~ 5월 25일(월)\n2. 교육 대상 : 특성화고등학교 3학년\n3. 연수 방법 : Zoom 온라인\n4. 혜택 : 수료증, 모바일 커피 쿠폰',
    applicationMethod: '페이지 내 [신청하기] 버튼으로 신청 양식을 제출해 주세요.',
    attachmentFileNames: [
      '2026_Gemini_Academy_찾아가는연수_안내.pdf',
      '2026_Gemini_Academy_신청서.hwp',
    ],
    generalCommonInfo: {
      announcementTitle: seed.id === 'gvt-recruitment-in-progress' ? 'Gemini Academy' : seed.title,
      educationFormLabel: '온라인',
      sponsorDisplayName: 'Google',
      educationTargetDetailLabel: '특성화고등학교 3학년',
      sessionCountLabel: '15기',
      educationScheduleLines: [
        '2026년 4월 20일(월) 09:30 ~ 12:20',
        '2026년 5월 25일(월) 13:00 ~ 15:50',
      ],
      scheduleDetails: [
        {
          scheduleLabel: '세부 일정 01',
          name: 'LinkedIn·이력서 멘토링',
          scheduleDateLabel: '2026년 4월 20일(월) 09:30 ~ 12:20',
        },
        {
          scheduleLabel: '세부 일정 02',
          name: '모의 면접·멘토 토크',
          scheduleDateLabel: '2026년 5월 25일(월) 13:00 ~ 15:50',
        },
      ],
    },
  }
}

export const GEMINI_RECRUITMENT_FIXTURES: CmsRegistrationFixture[] =
  GEMINI_FEATURED_SEEDS.map(buildGeminiFixture)

/** Case 1 강사 — SSOT id: case-instructor-recruitment */
export const CASE_INSTRUCTOR_FIXTURE: CmsRegistrationFixture = {
  registrationCase: 'case-instructor-recruitment',
  registrationKind: 'general',
  id: 'case-instructor-recruitment',
  title: '2026년 JA Korea 경제금융교육 전문강사단 모집',
  mainTitle: '2026년 JA Korea 경제금융교육 전문강사단',
  description:
    'JA Korea 프로그램을 현장에서 진행할 대학생·휴학생 강사를 모집합니다. 오리엔테이션 이수 후 상·하반기 활동을 수행합니다.',
  type: 'offline',
  category: 'instructor',
  ...periodBundle('recruiting', 'recruiting'),
  lifecycleStatus: 'recruiting_instructors',
  businessArea: '교육기부',
  targetLevel: 'university',
  district: '서울, 경기, 인천, 강원, 충청, 전라, 경상, 제주',
  generalParticipantTypes: ['teacher_instructor'],
  generalProgramAudience: 'individual',
  generalProgramEducationStructure: 'curriculum',
  generalProgramSessionRound: 'single',
  documentPassAnnouncementDate: '2026-04-28T00:00:00.000Z',
  interviewStartDate: '2026-05-01T00:00:00.000Z',
  interviewEndDate: '2026-05-10T00:00:00.000Z',
  finalPassAnnouncementDate: '2026-05-20T00:00:00.000Z',
  recruitmentGuide:
    '1. 대상: 대학(원)생·휴학생\n2. 활동: 상반기·하반기 강의 진행\n3. 특전: 수료증, 활동비\n4. 선발: 서류 → 면접 → 최종',
  applicationMethod: '온라인 신청서 제출 후 서류·면접 심사',
  attachmentFileNames: [
    '[강사] 2026 JA Korea 전문강사단 안내.pdf',
    '[강사] 2026 JA Korea 전문강사단 신청서.pdf',
  ],
  generalCommonInfo: {
    announcementTitle: '2026년 JA Korea 경제금융교육 전문강사단 모집',
    educationFormLabel: '오프라인',
    sponsorDisplayName: 'JA Korea',
    recruitmentAffiliationLabel:
      'UJAT 서울, UJAT 경기, UJAT 강원, UJAT 충청, UJAT 전라, UJAT 경상, UJAT 제주',
    educationTargetDetailLabel: '대학생 / 휴학생',
    educationScheduleLines: [
      '상반기 활동: 2026.04.03 ~ 2026.06.30',
      '하반기 활동: 2026.09.01 ~ 2026.11.20',
    ],
    curriculumSessions: [
      {
        sessionLabel: '1차시',
        title: '강사 오리엔테이션',
        description: '프로그램 목표, 교안, 안전·개인정보 지침을 안내합니다.',
      },
      {
        sessionLabel: '2차시',
        title: '현장 강의 실습',
        description: '모의 수업과 피드백으로 강의 역량을 점검합니다.',
      },
    ],
  },
}

/** Case 2 봉사자 — SSOT id: case-volunteer-recruitment */
export const CASE_VOLUNTEER_FIXTURE: CmsRegistrationFixture = (() => {
  const dates = periodBundle('recruiting', 'recruiting')
  return {
    registrationCase: 'case-volunteer-recruitment',
    registrationKind: 'general',
    id: 'case-volunteer-recruitment',
    title: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 봉사자 모집',
    mainTitle: '한국씨티은행-JA Korea 특별한 JOB담',
    description:
      '한국씨티은행과 JA Korea가 함께하는 특별한 JOB담 운영을 지원할 봉사자를 모집합니다. 사전 교육 이수 후 현장·온라인 진행을 돕습니다.',
    type: 'hybrid',
    category: 'volunteer',
    ...dates,
    lifecycleStatus: 'recruiting_volunteers',
    businessArea: '진로취업',
    targetLevel: 'high',
    district: '각 학교, 서울시 강서구 (JA Korea 사무실)',
    generalParticipantTypes: ['volunteer'],
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    volunteerTarget: '고등학생 대상 프로그램 운영 봉사자 (대학생 우대)',
    volunteerTargetDetail: '전공 무관, 1365 봉사시간 등록 가능',
    volunteerApplicationStartDate: '2026-01-03T00:00:00.000Z',
    volunteerApplicationEndDate: '2026-01-28T00:00:00.000Z',
    documentPassAnnouncementDate: '2026-02-03T00:00:00.000Z',
    interviewStartDate: '2026-02-09T00:00:00.000Z',
    interviewEndDate: '2026-02-15T00:00:00.000Z',
    finalPassAnnouncementDate: '2026-02-20T00:00:00.000Z',
    recruitmentGuide:
      '1. 대상: 운영 봉사자\n2. 혜택: 수료증, 1365 봉사시간 등록\n3. 선발: 서류 → 면접 → 최종',
    otherNotes: '봉사시간 등록을 위해 1365 아이디를 준비해 주세요.',
    applicationMethod: '온라인 신청 및 첨부 서류 제출',
    attachmentFileNames: [
      '[봉사자] 2026 JOB담 봉사 참가안내.pdf',
      '[봉사자] 2026 JOB담 봉사 신청서.docx',
    ],
    generalCommonInfo: {
      announcementTitle: '2026년 한국씨티은행 - JA Korea 특별한 JOB담 봉사자 모집',
      educationFormLabel: '온/오프라인',
      sponsorDisplayName: '한국씨티은행',
      educationTargetDetailLabel: '고등학교 2~3학년 프로그램 운영 지원',
      educationScheduleLines: [
        '2026.04.03(금) 09:00 ~ 12:20',
        '2026.04.22(수) 13:00 ~ 15:50',
      ],
      curriculumSessions: [
        {
          sessionLabel: '1차시',
          title: '나를 찾는 기술',
          description: '진로 탐색·이력서 초안 작성을 지원합니다.',
        },
        {
          sessionLabel: '2차시',
          title: '나를 보여주는 기술',
          description: '모의 면접·피드백 운영을 지원합니다.',
        },
      ],
    },
  }
})()

const UJAT_EIGHT_REGIONS =
  '경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역 초등학교'

/** Case 3 UJAT 봉사자 — CMS ujat-progress-volunteer-recruiting 정합 */
export const UJAT_VOLUNTEER_FIXTURE: CmsRegistrationFixture = {
  registrationCase: 'ujat-volunteer-recruitment',
  registrationKind: 'ujat',
  id: 'ujat-progress-volunteer-recruiting',
  title: '2028년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집',
  mainTitle: '2028년 JA Korea 초등 경제교육 대상 학교',
  description:
    'JA Korea 초등 경제교육 프로그램은 초등학생들에게 경제·금융 개념을 체험 중심으로 전달하는 프로그램입니다. 대학생경제교육봉사단(UJAT) 봉사자를 모집합니다.',
  type: 'offline',
  category: 'volunteer',
  startDate: '2028-04-03T00:00:00.000Z',
  endDate: '2028-11-20T00:00:00.000Z',
  applicationStartDate: '2027-12-08T00:00:00.000Z',
  applicationEndDate: '2028-01-16T00:00:00.000Z',
  lifecycleStatus: 'recruiting_volunteers',
  ujatProgressStatus: 'VOLUNTEER_RECRUITING',
  businessArea: '경제금융',
  targetLevel: 'university',
  district: UJAT_EIGHT_REGIONS,
  generalParticipantTypes: ['volunteer'],
  generalProgramAudience: 'individual',
  generalProgramEducationStructure: 'curriculum',
  generalProgramSessionRound: 'multi',
  volunteerTarget: '대학(원)생',
  volunteerTargetDetail: '전공무관, 휴학생 지원 가능',
  volunteerApplicationStartDate: '2028-03-10T00:00:00.000Z',
  volunteerApplicationEndDate: '2028-04-20T00:00:00.000Z',
  documentPassAnnouncementDate: '2028-04-25T00:00:00.000Z',
  interviewStartDate: '2028-05-01T00:00:00.000Z',
  interviewEndDate: '2028-05-10T00:00:00.000Z',
  finalPassAnnouncementDate: '2028-05-20T00:00:00.000Z',
  resultAnnouncementDate: '2028-01-26T00:00:00.000Z',
  recruitmentGuide:
    '1. 신청 자격: 대학(원)생\n2. 신청 방법: 홈페이지 온라인 신청\n3. 선발: 서류 심사 및 면접\n4. 활동: 상·하반기 초등 경제교육',
  otherNotes: '면접 일정은 개별 안내 예정',
  applicationMethod: '홈페이지 온라인 신청',
  attachmentFileNames: [
    '[UJAT 봉사자] 2028 대학생경제교육봉사단 안내.pdf',
    '[UJAT 봉사자] 2028 봉사단 신청서.pdf',
  ],
  rounds: [
    {
      id: 'ujat-progress-volunteer-recruiting-round-1',
      roundNumber: 1,
      startDate: '2028-04-03T00:00:00.000Z',
      endDate: '2028-06-19T00:00:00.000Z',
      curriculum: '상반기 36차시',
    },
    {
      id: 'ujat-progress-volunteer-recruiting-round-2',
      roundNumber: 2,
      startDate: '2028-09-11T00:00:00.000Z',
      endDate: '2028-11-20T00:00:00.000Z',
      curriculum: '하반기 36차시',
    },
  ],
  generalCommonInfo: {
    announcementTitle:
      '2028년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집',
    educationFormLabel: '오프라인',
    sponsorDisplayName: 'JA Korea',
    recruitmentAffiliationLabel:
      'UJAT 서울, UJAT 경기, UJAT 인천, UJAT 광주, UJAT 대구, UJAT 대전, UJAT 부산, UJAT 전북',
    educationTargetDetailLabel: '대학(원)생',
    educationScheduleLines: [
      '상반기: 2028.04.03 ~ 2028.06.19',
      '하반기: 2028.09.11 ~ 2028.11.20',
    ],
    curriculumSessions: [
      {
        sessionLabel: '1회차',
        title: '상반기 봉사 오리엔테이션',
        description: '지역 배정, 교안, 학교 연계 일정을 안내합니다.',
        assignmentPeriod: '2028년 4월 3일(월) ~ 2028년 4월 10일(월)',
      },
      {
        sessionLabel: '2회차',
        title: '하반기 봉사 활동',
        description: '초등 경제교육 현장 수업을 진행합니다.',
        assignmentPeriod: '2028년 9월 11일(월) ~ 2028년 11월 20일(월)',
      },
    ],
  },
}

/** Case 4 UJAT 참여자(기관) — CMS ujat-progress-participant-recruiting 정합 */
export const UJAT_PARTICIPANT_FIXTURE: CmsRegistrationFixture = {
  registrationCase: 'ujat-participant-recruitment',
  registrationKind: 'ujat',
  id: 'ujat-progress-participant-recruiting',
  title: '2029년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집',
  mainTitle: '2029년 JA Korea 초등 경제교육 대상 학교',
  description:
    'JA Korea 초등 경제교육 프로그램은 초등학생들에게 경제·금융 개념을 체험 중심으로 전달하는 프로그램입니다. 참여 학교를 모집합니다.',
  type: 'offline',
  category: 'school',
  startDate: '2029-04-03T00:00:00.000Z',
  endDate: '2029-11-20T00:00:00.000Z',
  applicationStartDate: '2028-12-08T00:00:00.000Z',
  applicationEndDate: '2029-01-16T00:00:00.000Z',
  lifecycleStatus: 'recruiting_students',
  ujatProgressStatus: 'PARTICIPANT_RECRUITING',
  businessArea: '경제금융',
  targetLevel: 'elementary',
  district: UJAT_EIGHT_REGIONS,
  generalParticipantTypes: ['school_institution'],
  generalProgramAudience: 'organization',
  generalProgramEducationStructure: 'curriculum',
  generalProgramSessionRound: 'multi',
  resultAnnouncementDate: '2029-01-26T00:00:00.000Z',
  recruitmentGuide:
    '1. 신청 자격: 해당 지역 초등학교\n2. 신청 방법: 홈페이지 온라인 신청\n3. 선발: 선착순 및 서류 심사',
  applicationMethod: '홈페이지 온라인 신청 (담당교사)',
  attachmentFileNames: [
    '[교육생·기관] 2029 초등 경제교육 학교 모집 안내.pdf',
    '[교육생·기관] 2029 참여 학교 신청서.pdf',
  ],
  rounds: [
    {
      id: 'ujat-progress-participant-recruiting-round-1',
      roundNumber: 1,
      startDate: '2029-04-03T00:00:00.000Z',
      endDate: '2029-06-19T00:00:00.000Z',
      curriculum: '상반기 교육',
    },
    {
      id: 'ujat-progress-participant-recruiting-round-2',
      roundNumber: 2,
      startDate: '2029-09-11T00:00:00.000Z',
      endDate: '2029-11-20T00:00:00.000Z',
      curriculum: '하반기 교육',
    },
  ],
  generalCommonInfo: {
    announcementTitle:
      '2029년 JA Korea 초등 경제교육 대상 학교 및 대학생경제교육봉사단 모집',
    educationFormLabel: '오프라인',
    sponsorDisplayName: 'JA Korea',
    educationTargetDetailLabel: '지역 초등학교',
    educationScheduleLines: [
      '상반기: 2029.04.03 ~ 2029.06.19',
      '하반기: 2029.09.11 ~ 2029.11.20',
    ],
    curriculumSessions: [
      {
        sessionLabel: '1회차',
        title: '상반기 초등 경제교육',
        description: '교재·교구·강사 파견으로 체험형 수업을 진행합니다.',
      },
      {
        sessionLabel: '2회차',
        title: '하반기 초등 경제교육',
        description: '지속 학습을 위한 심화 활동을 진행합니다.',
      },
    ],
  },
}

export const DETAIL_CASE_FIXTURES: CmsRegistrationFixture[] = [
  CASE_INSTRUCTOR_FIXTURE,
  CASE_VOLUNTEER_FIXTURE,
  UJAT_VOLUNTEER_FIXTURE,
  UJAT_PARTICIPANT_FIXTURE,
]

/** 홈 목록 mock: 일반 8 + 1사1교 8 + 교육받은 교사 8 + Gemini 3 + 상세 케이스 4 = 31 */
export const CMS_PLATFORM_PROGRAM_FIXTURES: CmsRegistrationFixture[] = [
  ...GENERAL_REGISTRATION_FIXTURES,
  ...ECONOMY_REGISTRATION_FIXTURES,
  ...TRAINED_TEACHERS_REGISTRATION_FIXTURES,
  ...GEMINI_RECRUITMENT_FIXTURES,
  ...DETAIL_CASE_FIXTURES,
]

export function getCmsRegistrationFixtureById(
  id: string
): CmsRegistrationFixture | undefined {
  return CMS_PLATFORM_PROGRAM_FIXTURES.find(fixture => fixture.id === id)
}

export function getCmsRegistrationFixturesByCase(
  registrationCase: CmsRegistrationCaseKind
): CmsRegistrationFixture[] {
  return CMS_PLATFORM_PROGRAM_FIXTURES.filter(
    fixture => fixture.registrationCase === registrationCase
  )
}
