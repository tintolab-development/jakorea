/**
 * CMS 4유형 시드 스냅샷 (Platform 홈 목록 카테고리 정합).
 * 모집·운영 기간: 기준일 = **런타임 오늘** (CMS `mock-program-period` 와 동일 오프셋).
 *
 * 배지 케이스 (`getRecruitmentStatus` / Platform lifecycle 매핑):
 * - 모집 예정: D+60 ~ D+240
 * - 모집 중: D-120 ~ D+120
 * - 모집 마감: D-300 ~ D-45
 *
 * - 일반 8 / 1사1교 8 / 교육받은 교사 8 / Gemini featured 3
 * Platform 탭: youth / institution / instructor
 */

import type {
  CmsLifecycleStatus,
  CmsProgramLike,
  CmsRegistrationCaseKind,
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
    generalCommonInfo: {
      announcementTitle: title,
      educationFormLabel: args.type === 'online' ? '온라인' : args.type === 'hybrid' ? '온/오프라인' : '오프라인',
      sponsorDisplayName: 'JA Korea',
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
      sponsorDisplayName: 'JA Korea',
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
      'Google for Education과 JA Korea가 함께하는 Gemini Academy 찾아가는 연수',
    type: 'offline',
    category: 'school',
    ...periodBundle(seed.appCase, seed.opCase),
    lifecycleStatus: seed.lifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'high',
    district: '특성화고등학교 3학년',
    generalParticipantTypes: ['school_institution'],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    recruitmentGuide:
      '1. 연수 일정 : 2025년 8월 1일(금) ~ 12월 19일(금)\n2. 교육 대상 : 특성화고등학교 3학년',
    attachmentFileNames: [
      '2026_Gemini_Academy_찾아가는연수_안내.pdf',
      '2026_Gemini_Academy_신청서.hwp',
    ],
    generalCommonInfo: {
      announcementTitle: seed.title,
      educationFormLabel: '오프라인',
      sponsorDisplayName: 'JA Korea · Google for Education',
      educationScheduleLines: ['2025. 08. 01 ~ 2025. 12. 19'],
    },
  }
}

export const GEMINI_RECRUITMENT_FIXTURES: CmsRegistrationFixture[] =
  GEMINI_FEATURED_SEEDS.map(buildGeminiFixture)

/** 홈 목록 mock: 일반 8 + 1사1교 8 + 교육받은 교사 8 + Gemini featured 3 = 27 */
export const CMS_PLATFORM_PROGRAM_FIXTURES: CmsRegistrationFixture[] = [
  ...GENERAL_REGISTRATION_FIXTURES,
  ...ECONOMY_REGISTRATION_FIXTURES,
  ...TRAINED_TEACHERS_REGISTRATION_FIXTURES,
  ...GEMINI_RECRUITMENT_FIXTURES,
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
