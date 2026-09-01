/**
 * CMS 등록 케이스 시드 (Platform 목록·상세·신청).
 * 모집·운영 기간: 기준일 = **런타임 오늘** (CMS `mock-program-period` 와 동일 오프셋).
 *
 * 30건: 일반 16 + 1사1교 2 + 교육받은 교사 8 + UJAT 2 + Gemini 2
 * 일반: 강사+봉사 체크, 기관×교육형태 2, 개인×참여방식 2, 커리큘럼/일정×단일/복수
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

function generalVariantTitle(
  audience: 'organization' | 'individual',
  educationStructure: 'curriculum' | 'schedule',
  sessionRound: 'single' | 'multi',
  titleExtra?: '참여자선택' | '개인' | '팀'
): string {
  const a = audience === 'organization' ? '기관' : '개인'
  const e = educationStructure === 'curriculum' ? '커리큘럼형' : '일정형'
  const s = sessionRound === 'single' ? '단일 회차' : '복수 회차'
  const base = `일반 프로그램 (${a})_${e}_${s}`
  return titleExtra ? `${base}_${titleExtra}` : base
}

type TypeSeedArgs = {
  registrationCase: Extract<CmsRegistrationCaseKind, `general-${string}`>
  idSuffix: string
  index: number
  audience: 'organization' | 'individual'
  educationStructure: 'curriculum' | 'schedule'
  sessionRound: 'single' | 'multi'
  titleExtra?: '참여자선택' | '개인' | '팀'
  educationFormLabel: string
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
        educationScheduleMode: 'date',
        scheduleDetails: SCHEDULE_MULTI_DETAILS.map(row => ({ ...row })),
        educationScheduleLines: [...SCHEDULE_MULTI_LINES],
      }
    }
    return {
      educationFormLabel,
      sponsorDisplayName: 'JA Korea',
      educationScheduleMode: 'date',
      maxScheduleCount: 3,
      scheduleDetails: SCHEDULE_SINGLE_DETAILS.map(row => ({ ...row })),
      educationScheduleLines: [...SCHEDULE_SINGLE_LINES],
    }
  }

  if (sessionRound === 'multi') {
    return {
      educationFormLabel,
      sponsorDisplayName: 'JA Korea',
      educationScheduleMode: 'period',
      maxScheduleCount: 3,
      curriculumSessions: CURRICULUM_MULTI_SESSIONS.map(row => ({ ...row })),
      educationScheduleLines: [...DEFAULT_EDUCATION_SCHEDULE_LINES],
    }
  }

  return {
    educationFormLabel,
    sponsorDisplayName: 'JA Korea',
    educationScheduleMode: 'period',
    maxScheduleCount: 3,
    curriculumSessions: CURRICULUM_SINGLE_SESSIONS.map(row => ({ ...row })),
    educationScheduleLines: [...DEFAULT_EDUCATION_SCHEDULE_LINES],
  }
}

function buildTypeFixture(args: TypeSeedArgs): CmsRegistrationFixture {
  const title = generalVariantTitle(
    args.audience,
    args.educationStructure,
    args.sessionRound,
    args.titleExtra
  )
  const id = `general-prog-type-${args.idSuffix}`
  const isOrg = args.audience === 'organization'
  const dates = periodBundle('recruiting', 'recruiting', args.index)
  const commonInfo = buildGeneralCommonInfo(
    args.educationStructure,
    args.sessionRound,
    args.educationFormLabel
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
    mainTitle: title,
    description: title,
    type: args.educationFormLabel === '온라인' ? 'online' : 'offline',
    category: isOrg ? 'school' : 'individual',
    ...dates,
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    targetLevel: 'high',
    generalParticipantTypes: isOrg ? [...FULL_LNB_ORG] : [...FULL_LNB_IND],
    generalProgramAudience: args.audience,
    generalProgramEducationStructure: args.educationStructure,
    generalProgramSessionRound: args.sessionRound,
    generalCommonInfo: commonInfo,
    ...(args.idSuffix === 'org-curriculum-multi'
      ? {
          attachmentFileNames: ['프로그램 안내문.pdf', '개인정보 수집이용 동의서.pdf'],
        }
      : {}),
  }
}

const GENERAL_TYPE_SEEDS: TypeSeedArgs[] = [
  {
    registrationCase: 'general-org-curriculum-single',
    idSuffix: 'org-curriculum-single',
    index: 0,
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    educationFormLabel: '오프라인',
  },
  {
    registrationCase: 'general-org-curriculum-single-participant-choice',
    idSuffix: 'org-curriculum-single-participant-choice',
    index: 1,
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    titleExtra: '참여자선택',
    educationFormLabel: '참여자 선택',
  },
  {
    registrationCase: 'general-org-curriculum-multi',
    idSuffix: 'org-curriculum-multi',
    index: 2,
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    educationFormLabel: '오프라인',
  },
  {
    registrationCase: 'general-org-curriculum-multi-participant-choice',
    idSuffix: 'org-curriculum-multi-participant-choice',
    index: 3,
    audience: 'organization',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    titleExtra: '참여자선택',
    educationFormLabel: '참여자 선택',
  },
  {
    registrationCase: 'general-org-schedule-single',
    idSuffix: 'org-schedule-single',
    index: 4,
    audience: 'organization',
    educationStructure: 'schedule',
    sessionRound: 'single',
    educationFormLabel: '오프라인',
  },
  {
    registrationCase: 'general-org-schedule-single-participant-choice',
    idSuffix: 'org-schedule-single-participant-choice',
    index: 5,
    audience: 'organization',
    educationStructure: 'schedule',
    sessionRound: 'single',
    titleExtra: '참여자선택',
    educationFormLabel: '참여자 선택',
  },
  {
    registrationCase: 'general-org-schedule-multi',
    idSuffix: 'org-schedule-multi',
    index: 6,
    audience: 'organization',
    educationStructure: 'schedule',
    sessionRound: 'multi',
    educationFormLabel: '오프라인',
  },
  {
    registrationCase: 'general-org-schedule-multi-participant-choice',
    idSuffix: 'org-schedule-multi-participant-choice',
    index: 7,
    audience: 'organization',
    educationStructure: 'schedule',
    sessionRound: 'multi',
    titleExtra: '참여자선택',
    educationFormLabel: '참여자 선택',
  },
  {
    registrationCase: 'general-ind-curriculum-single',
    idSuffix: 'ind-curriculum-single',
    index: 8,
    audience: 'individual',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    titleExtra: '개인',
    educationFormLabel: '오프라인',
    participationMethod: 'individual',
  },
  {
    registrationCase: 'general-ind-curriculum-single-team',
    idSuffix: 'ind-curriculum-single-team',
    index: 9,
    audience: 'individual',
    educationStructure: 'curriculum',
    sessionRound: 'single',
    titleExtra: '팀',
    educationFormLabel: '오프라인',
    participationMethod: 'team',
  },
  {
    registrationCase: 'general-ind-curriculum-multi-individual',
    idSuffix: 'ind-curriculum-multi-individual',
    index: 10,
    audience: 'individual',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    titleExtra: '개인',
    educationFormLabel: '오프라인',
    participationMethod: 'individual',
  },
  {
    registrationCase: 'general-ind-curriculum-multi',
    idSuffix: 'ind-curriculum-multi',
    index: 11,
    audience: 'individual',
    educationStructure: 'curriculum',
    sessionRound: 'multi',
    titleExtra: '팀',
    educationFormLabel: '오프라인',
    participationMethod: 'team',
  },
  {
    registrationCase: 'general-ind-schedule-single',
    idSuffix: 'ind-schedule-single',
    index: 12,
    audience: 'individual',
    educationStructure: 'schedule',
    sessionRound: 'single',
    titleExtra: '개인',
    educationFormLabel: '오프라인',
    participationMethod: 'individual',
  },
  {
    registrationCase: 'general-ind-schedule-single-team',
    idSuffix: 'ind-schedule-single-team',
    index: 13,
    audience: 'individual',
    educationStructure: 'schedule',
    sessionRound: 'single',
    titleExtra: '팀',
    educationFormLabel: '오프라인',
    participationMethod: 'team',
  },
  {
    registrationCase: 'general-ind-schedule-multi',
    idSuffix: 'ind-schedule-multi',
    index: 14,
    audience: 'individual',
    educationStructure: 'schedule',
    sessionRound: 'multi',
    titleExtra: '개인',
    educationFormLabel: '오프라인',
    participationMethod: 'individual',
  },
  {
    registrationCase: 'general-ind-schedule-multi-team',
    idSuffix: 'ind-schedule-multi-team',
    index: 15,
    audience: 'individual',
    educationStructure: 'schedule',
    sessionRound: 'multi',
    titleExtra: '팀',
    educationFormLabel: '오프라인',
    participationMethod: 'team',
  },
]

export const GENERAL_REGISTRATION_FIXTURES: CmsRegistrationFixture[] =
  GENERAL_TYPE_SEEDS.map(buildTypeFixture)

function sharedCurriculumSessions(
  firstTitle: string,
  firstDescription: string,
  secondTitle: string,
  secondDescription: string
): CmsCurriculumSession[] {
  return [
    { sessionLabel: '1차시', title: firstTitle, description: firstDescription },
    { sessionLabel: '2차시', title: secondTitle, description: secondDescription },
  ]
}

function buildEconomyFixture(
  id: string,
  title: string,
  registrationCase: Extract<CmsRegistrationCaseKind, 'economy-company-school' | 'economy-participant-choice'>,
  educationFormLabel: string,
  spread: number
): CmsRegistrationFixture {
  return {
    registrationCase,
    registrationKind: 'economy',
    id,
    title,
    mainTitle: title,
    description: title,
    type: 'offline',
    category: 'school',
    ...periodBundle('recruiting', 'recruiting', spread),
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    targetLevel: 'elementary',
    district: '전국',
    generalParticipantTypes: [...COMPANY_SCHOOL_PARTICIPANTS],
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalCommonInfo: {
      announcementTitle: title,
      educationFormLabel,
      sponsorDisplayName: 'JA Korea',
      educationScheduleLines: ['2026. 03. 01 ~ 2026. 12. 30'],
      curriculumSessions: sharedCurriculumSessions(
        '1단원 나를 알리는 기술',
        '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
        '2단원 나를 보여주는 기술',
        '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.'
      ),
    },
  }
}

export const ECONOMY_REGISTRATION_FIXTURES: CmsRegistrationFixture[] = [
  buildEconomyFixture(
    'economy-prog-001',
    '1사1교 프로그램_교육형태고정',
    'economy-company-school',
    '오프라인',
    0
  ),
  buildEconomyFixture(
    'economy-prog-participant-choice',
    '1사1교 프로그램_참여자선택',
    'economy-participant-choice',
    '참여자 선택',
    3
  ),
]

/** @deprecated 호환용 — 첫 1사1교 시드 */
export const ECONOMY_REGISTRATION_FIXTURE = ECONOMY_REGISTRATION_FIXTURES[0]!

const TRAINED_TEACHERS_SEEDS: Array<{
  id: string
  title: string
  structure: NonNullable<CmsProgramLike['generalProgramEducationStructure']>
  sessionRound: NonNullable<CmsProgramLike['generalProgramSessionRound']>
  educationFormLabel: string
}> = [
  {
    id: 'trained-teachers-prog-001',
    title: '교육받은 교사 프로그램 (커리큘럼형)_단일 회차',
    structure: 'curriculum',
    sessionRound: 'single',
    educationFormLabel: '오프라인',
  },
  {
    id: 'trained-teachers-prog-002',
    title: '교육받은 교사 프로그램 (커리큘럼형)_단일 회차_참여자선택',
    structure: 'curriculum',
    sessionRound: 'single',
    educationFormLabel: '참여자 선택',
  },
  {
    id: 'trained-teachers-prog-003',
    title: '교육받은 교사 프로그램 (커리큘럼형)_복수 회차',
    structure: 'curriculum',
    sessionRound: 'multi',
    educationFormLabel: '오프라인',
  },
  {
    id: 'trained-teachers-prog-004',
    title: '교육받은 교사 프로그램 (커리큘럼형)_복수 회차_참여자선택',
    structure: 'curriculum',
    sessionRound: 'multi',
    educationFormLabel: '참여자 선택',
  },
  {
    id: 'trained-teachers-prog-005',
    title: '교육받은 교사 프로그램 (일정형)_단일 회차',
    structure: 'schedule',
    sessionRound: 'single',
    educationFormLabel: '오프라인',
  },
  {
    id: 'trained-teachers-prog-006',
    title: '교육받은 교사 프로그램 (일정형)_단일 회차_참여자선택',
    structure: 'schedule',
    sessionRound: 'single',
    educationFormLabel: '참여자 선택',
  },
  {
    id: 'trained-teachers-prog-007',
    title: '교육받은 교사 프로그램 (일정형)_복수 회차',
    structure: 'schedule',
    sessionRound: 'multi',
    educationFormLabel: '오프라인',
  },
  {
    id: 'trained-teachers-prog-008',
    title: '교육받은 교사 프로그램 (일정형)_복수 회차_참여자선택',
    structure: 'schedule',
    sessionRound: 'multi',
    educationFormLabel: '참여자 선택',
  },
]

export const TRAINED_TEACHERS_REGISTRATION_FIXTURES: CmsRegistrationFixture[] =
  TRAINED_TEACHERS_SEEDS.map((seed, index) => ({
    registrationCase: 'trained-teachers-program' as const,
    registrationKind: 'trainedTeachers' as const,
    id: seed.id,
    title: seed.title,
    mainTitle: seed.title,
    description: seed.title,
    type: seed.educationFormLabel === '오프라인' ? 'offline' : 'online',
    category: 'instructor',
    ...periodBundle('recruiting', 'recruiting', index),
    lifecycleStatus: 'recruiting_students' as CmsLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as const,
    district: '전국',
    generalParticipantTypes: ['school_institution'] as const,
    generalProgramAudience: 'organization' as const,
    generalProgramEducationStructure: seed.structure,
    generalProgramSessionRound: seed.sessionRound,
    generalCommonInfo: {
      announcementTitle: seed.title,
      educationFormLabel: seed.educationFormLabel,
      sponsorDisplayName: 'JA Korea',
      educationScheduleLines: ['2026. 04. 03(금) ~ 2026. 11. 20(금)'],
      curriculumSessions: sharedCurriculumSessions(
        '1단원 교사 경제교육 개요',
        '학교 현장 경제·금융 교육 목표와 교안 구성을 안내합니다.',
        '2단원 수업 실습',
        '단원별 활동 설계와 수업 시뮬레이션을 진행합니다.'
      ),
    },
  }))

function buildGeminiFixture(args: {
  registrationCase: Extract<CmsRegistrationCaseKind, 'gemini-recruitment' | 'gemini-instructor'>
  id: string
  title: string
  category: 'school' | 'instructor'
  participantTypes: CmsProgramLike['generalParticipantTypes']
}): CmsRegistrationFixture {
  const isInstructor = args.category === 'instructor'
  return {
    registrationCase: args.registrationCase,
    registrationKind: 'gemini',
    id: args.id,
    title: args.title,
    mainTitle: args.title,
    description: args.title,
    type: 'online',
    category: args.category,
    ...periodBundle('recruiting', 'recruiting', isInstructor ? 2 : 0),
    lifecycleStatus: isInstructor ? 'recruiting_instructors' : 'recruiting_students',
    businessArea: '진로취업',
    targetLevel: 'high',
    district: '온라인 (ZOOM)',
    generalParticipantTypes: args.participantTypes,
    generalProgramAudience: isInstructor ? 'individual' : 'organization',
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    recruitmentGuide: isInstructor
      ? '1. 대상 : 연수 진행 강사\n2. 신청 : 페이지 내 [신청하기]'
      : '1. 연수 방법 : Zoom 온라인\n2. 신청 : 페이지 내 [신청하기]',
    applicationMethod: '페이지 내 [신청하기] 버튼으로 신청 양식을 제출해 주세요.',
    generalCommonInfo: {
      announcementTitle: args.title,
      educationFormLabel: '온라인',
      sponsorDisplayName: 'JA Korea',
      educationTargetDetailLabel: isInstructor ? '연수 강사' : '특성화고등학교 3학년',
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

export const GEMINI_RECRUITMENT_FIXTURES: CmsRegistrationFixture[] = [
  buildGeminiFixture({
    registrationCase: 'gemini-recruitment',
    id: 'gemini-prog-institution',
    title: 'Gemini 프로그램_기관',
    category: 'school',
    participantTypes: ['school_institution'],
  }),
  buildGeminiFixture({
    registrationCase: 'gemini-instructor',
    id: 'gemini-prog-instructor',
    title: 'Gemini 프로그램_강사',
    category: 'instructor',
    participantTypes: ['teacher_instructor'],
  }),
]

const UJAT_EIGHT_REGIONS =
  '경기, 광주, 대구, 대전, 부산, 서울, 인천, 전북 지역 초등학교'

export const UJAT_VOLUNTEER_FIXTURE: CmsRegistrationFixture = {
  registrationCase: 'ujat-volunteer-recruitment',
  registrationKind: 'ujat',
  id: 'ujat-prog-volunteer',
  title: 'UJAT 프로그램_봉사 모집',
  mainTitle: 'UJAT 프로그램_봉사 모집',
  description: 'UJAT 프로그램_봉사 모집',
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
  interviewEnabled: true,
  contactPhone: '02-6085-6028',
  contactEmail: 'ujat@jakorea.org',
  resultAnnouncementDate: '2028-01-26T00:00:00.000Z',
  recruitmentGuide: '1. 신청 자격: 대학(원)생\n2. 신청 방법: 홈페이지 온라인 신청',
  otherNotes: '면접 일정은 개별 안내 예정',
  applicationMethod: '홈페이지 온라인 신청',
  ujatPublicEducationSchedules: [
    { label: '사전교육(발대식)', value: '2028.03.28(금) 13:00 ~ 17:00' },
    {
      label: '교육 진행',
      value: '상반기 2028.04.03 ~ 2028.06.19 / 하반기 2028.09.11 ~ 2028.11.20',
    },
    { label: '해단식', value: '2028.11.27(금) 14:00 ~ 16:00' },
  ],
  rounds: [
    {
      id: 'ujat-prog-volunteer-round-1',
      roundNumber: 1,
      startDate: '2028-04-03T00:00:00.000Z',
      endDate: '2028-06-19T00:00:00.000Z',
      curriculum: '상반기 36차시',
    },
    {
      id: 'ujat-prog-volunteer-round-2',
      roundNumber: 2,
      startDate: '2028-09-11T00:00:00.000Z',
      endDate: '2028-11-20T00:00:00.000Z',
      curriculum: '하반기 36차시',
    },
  ],
  generalCommonInfo: {
    announcementTitle: 'UJAT 프로그램_봉사 모집',
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

export const UJAT_PARTICIPANT_FIXTURE: CmsRegistrationFixture = {
  registrationCase: 'ujat-participant-recruitment',
  registrationKind: 'ujat',
  id: 'ujat-prog-school',
  title: 'UJAT 프로그램_학교 모집',
  mainTitle: 'UJAT 프로그램_학교 모집',
  description: 'UJAT 프로그램_학교 모집',
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
  recruitmentGuide: '1. 신청 자격: 해당 지역 초등학교\n2. 신청 방법: 홈페이지 온라인 신청',
  applicationMethod: '홈페이지 온라인 신청 (담당교사)',
  learningSupportContent: '교재, 교구, 강사(봉사자) 파견, 수업 지원 자료 제공',
  contactPhone: '02-6085-6028',
  contactEmail: 'school@jakorea.org',
  notes: '금요일 1~4교시 일정이 가능한 학교만 신청해 주세요.',
  ujatPublicEducationSchedules: [
    { label: '상반기', value: '2029.04.03 ~ 2029.06.19' },
    { label: '하반기', value: '2029.09.11 ~ 2029.11.20' },
  ],
  rounds: [
    {
      id: 'ujat-prog-school-round-1',
      roundNumber: 1,
      startDate: '2029-04-03T00:00:00.000Z',
      endDate: '2029-06-19T00:00:00.000Z',
      curriculum: '상반기 교육',
    },
    {
      id: 'ujat-prog-school-round-2',
      roundNumber: 2,
      startDate: '2029-09-11T00:00:00.000Z',
      endDate: '2029-11-20T00:00:00.000Z',
      curriculum: '하반기 교육',
    },
  ],
  generalCommonInfo: {
    announcementTitle: 'UJAT 프로그램_학교 모집',
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

export const UJAT_REGISTRATION_FIXTURES: CmsRegistrationFixture[] = [
  UJAT_PARTICIPANT_FIXTURE,
  UJAT_VOLUNTEER_FIXTURE,
]

/** 홈 목록 mock: 일반 16 + 1사1교 2 + 교육받은 교사 8 + Gemini 2 + UJAT 2 = 30 */
export const CMS_PLATFORM_PROGRAM_FIXTURES: CmsRegistrationFixture[] = [
  ...GENERAL_REGISTRATION_FIXTURES,
  ...ECONOMY_REGISTRATION_FIXTURES,
  ...TRAINED_TEACHERS_REGISTRATION_FIXTURES,
  ...GEMINI_RECRUITMENT_FIXTURES,
  ...UJAT_REGISTRATION_FIXTURES,
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
