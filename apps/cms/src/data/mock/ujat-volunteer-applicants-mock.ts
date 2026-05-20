/**
 * UJAT 프로그램 — 봉사자 1차 서류 심사 대상자 mock
 */

import {
  UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS,
  UJAT_VOLUNTEER_GRADE_OPTIONS,
  UJAT_VOLUNTEER_PREFERRED_REGIONS,
  UJAT_VOLUNTEER_REGION_SORT_ORDER,
  type UjatDocumentScreeningStatus,
  type UjatInterviewAssignmentStatus,
  type UjatManagerEvaluation,
  type UjatSecondInterviewScreeningStatus,
  UJAT_SECOND_INTERVIEW_SCREENING_STATUS_ORDER,
  type UjatVolunteerApplicationType,
  type UjatVolunteerGrade,
  type UjatVolunteerPreferredRegion,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export type {
  UjatDocumentScreeningStatus,
  UjatSecondInterviewScreeningStatus,
  UjatVolunteerApplicationType,
  UjatVolunteerRecruitHalf,
}

export type UjatVolunteerInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export type UjatVolunteerPreviousUjatActivity = {
  term: string
  year: string
  certificateFileName: string
  certificateFileUrl?: string
}

export interface UjatVolunteerApplicantRow {
  id: string
  no: number
  name: string
  grade: UjatVolunteerGrade
  preferredRegion: UjatVolunteerPreferredRegion
  contact: string
  email: string
  contactRaw: string
  emailRaw: string
  hasEducationExperience: boolean
  applicationType: UjatVolunteerApplicationType
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  managerAEvaluation: UjatManagerEvaluation
  managerBEvaluation: UjatManagerEvaluation
  documentScreeningStatus: UjatDocumentScreeningStatus
  /** 면접 가능 일정 수 (정렬용) */
  interviewSlotCount: number
  interviewAssignmentStatus: UjatInterviewAssignmentStatus
  programId: string
  half: UjatVolunteerRecruitHalf
  englishName: string
  id1365: string
  gender: string
  birthDate: string
  age: number
  universityName: string
  major: string
  applicationRoute: string
  scheduleChangeCancelCount: number
  interviewAvailability: UjatVolunteerInterviewAvailabilityDay[]
  previousUjatActivity?: UjatVolunteerPreviousUjatActivity
  /** 2차 면접 배정 일시 (면접일 배정 완료 시) */
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  secondInterviewScreeningStatus?: UjatSecondInterviewScreeningStatus
  totalScore?: number | null
}

const NAMES = [
  '김민준',
  '이서연',
  '박지훈',
  '최유나',
  '정하은',
  '강도윤',
  '조수아',
  '윤예진',
  '장현우',
  '임채원',
  '한승민',
  '오지아',
  '신동혁',
  '권소희',
  '황태양',
  '서다은',
  '문준호',
  '배수빈',
  '류하준',
  '노지민',
  '안서윤',
  '홍민재',
  '양하린',
  '구본승',
  '남예은',
]

const APPLICATION_ROUTES = [
  '인스타그램',
  '학교 안내 및 에브리타임',
  '링커리어',
  '올콘',
  '캠퍼스픽',
] as const

const UNIVERSITIES = [
  '서울대학교',
  '연세대학교',
  '고려대학교',
  '성균관대학교',
  '한양대학교',
] as const

const ESSAY_INTRO =
  'JA Korea 경제교육 봉사에 지원하게 된 계기와 본인의 강점을 중심으로 자기소개를 작성합니다.'
const ESSAY_EDU =
  '초등·중등 대상 과외 및 학원 보조 강사 경험이 있으며, 학생과의 소통에 자신이 있습니다.'
const ESSAY_NECESSITY =
  '초등학생에게 경제 개념을 일상 언어로 전달하는 것이 사회적 역량 형성에 중요하다고 생각합니다.'
const ESSAY_JA =
  '중학교 시절 JA Korea 프로그램을 수료한 경험이 있으며, 당시 배운 내용을 봉사로 전달하고 싶습니다.'

const DEMO_SCREENSHOT_ROW: Partial<UjatVolunteerApplicantRow> = {
  name: '박틴토',
  englishName: 'Park Tinto',
  id1365: 'park_tt915',
  gender: '남성',
  birthDate: '2000.09.15',
  age: 25,
  universityName: '**대학교',
  major: '회계학과 전공, 경영학과 복수전공',
  applicationRoute: '인스타그램',
  scheduleChangeCancelCount: 1,
  documentScreeningStatus: 'pass',
  managerAEvaluation: 'unreviewed',
  managerBEvaluation: 'pass',
  hasEducationExperience: true,
  applicationType: 'ujat-graduate',
  preferredRegion: '서울',
  previousUjatActivity: {
    term: '30',
    year: '2023',
    certificateFileName: '홍길동_UJAT 30기 수료증.jpg',
  },
  grade: '1학년',
  contactRaw: '010-1234-0000',
  emailRaw: 'tjintolab@naver.com',
  essayIntro:
    '안녕하세요. 경제·금융에 관심이 많은 대학생 박틴토입니다. JA Korea의 초등 경제교육 봉사에 지원하게 되었습니다. 학생들과 소통하며 경제 개념을 쉽게 전달하는 역량을 키우고 싶습니다.',
  essayEducationExperience:
    '초등학생 대상 과외 6개월, 중학생 수학 보조 강사 3개월 경험이 있습니다. 수업 준비와 피드백에 익숙합니다.',
  essayNecessity:
    '초등학생 시기에 형성되는 경제 사고력은 평생에 걸쳐 영향을 미칩니다. JA Korea 프로그램은 체험 중심 교육으로 학생들의 참여를 높일 수 있다고 생각합니다.',
  essayJaExperience:
    '중학교 2학년 때 JA Korea 경제금융교육을 수강했으며, 당시 배운 내용이 대학 전공 선택에도 영향을 주었습니다.',
  interviewAssignmentStatus: 'assigned',
  assignedInterviewDateLabel: '26. 03. 09(월)',
  assignedInterviewTime: '09:00 ~ 09:30',
  secondInterviewScreeningStatus: 'waiting',
  totalScore: null,
  interviewAvailability: [
    {
      dateLabel: '26. 03. 09(월)',
      slots: ['09:00 ~ 09:30', '11:00 ~ 11:30'],
    },
    {
      dateLabel: '26. 03. 23(월)',
      slots: ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'],
    },
  ],
}

const INTERVIEW_TIME_SLOTS = ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'] as const

const INTERVIEW_DATE_LABELS = [
  '26. 03. 09(월)',
  '26. 03. 10(화)',
  '26. 03. 11(수)',
  '26. 03. 12(목)',
  '26. 03. 13(금)',
  '26. 03. 16(월)',
  '26. 03. 17(화)',
  '26. 03. 23(월)',
] as const

function buildAssignedInterviewFields(
  seed: number,
  interviewAvailability: UjatVolunteerInterviewAvailabilityDay[]
): Pick<
  UjatVolunteerApplicantRow,
  | 'assignedInterviewDateLabel'
  | 'assignedInterviewTime'
  | 'secondInterviewScreeningStatus'
  | 'totalScore'
> {
  const firstDay = interviewAvailability[0]
  const firstSlot = firstDay?.slots[0]
  const dateLabel =
    firstDay?.dateLabel ?? INTERVIEW_DATE_LABELS[seed % INTERVIEW_DATE_LABELS.length]
  const time = firstSlot ?? INTERVIEW_TIME_SLOTS[seed % INTERVIEW_TIME_SLOTS.length]
  const status =
    UJAT_SECOND_INTERVIEW_SCREENING_STATUS_ORDER[
      seed % UJAT_SECOND_INTERVIEW_SCREENING_STATUS_ORDER.length
    ]
  const scoreSeed = seed % 11
  const totalScore =
    scoreSeed === 0 ? null : scoreSeed <= 7 ? 70 + scoreSeed * 3 : 90 + (scoreSeed - 7)

  return {
    assignedInterviewDateLabel: dateLabel,
    assignedInterviewTime: time,
    secondInterviewScreeningStatus: status,
    totalScore,
  }
}

function resolveInterviewAssignmentStatus(
  seed: number,
  documentScreeningStatus: UjatDocumentScreeningStatus
): UjatInterviewAssignmentStatus {
  if (documentScreeningStatus !== 'pass') {
    return seed % 3 === 0 ? 'waiting' : 'withdrawn'
  }
  if (seed % 12 === 0) return 'waiting'
  if (seed % 17 === 0) return 'withdrawn'
  return 'assigned'
}

function buildPreviousUjatActivity(
  seed: number,
  name: string
): UjatVolunteerPreviousUjatActivity | undefined {
  if (seed % 4 !== 0) return undefined
  const term = String(28 + (seed % 5))
  const year = String(2019 + (seed % 6))
  return {
    term,
    year,
    certificateFileName: `${name}_UJAT ${term}기 수료증.jpg`,
  }
}

function maskContact(raw: string): string {
  return raw.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
}

function maskEmail(raw: string): string {
  const [local, domain] = raw.split('@')
  if (!domain) return raw
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}***@${domain}`
}

function hashSeed(programId: string, half: UjatVolunteerRecruitHalf, index: number): number {
  let h = 0
  const s = `${programId}:${half}:${index}`
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function countInterviewSlots(days: UjatVolunteerInterviewAvailabilityDay[]): number {
  return days.reduce((sum, day) => sum + day.slots.length, 0)
}

function buildInterviewAvailability(seed: number): UjatVolunteerInterviewAvailabilityDay[] {
  const dayCount = (seed % 3) + 1
  return Array.from({ length: dayCount }, (_, dayIndex) => {
    const month = String(3 + (seed % 2)).padStart(2, '0')
    const date = String(9 + dayIndex * 14).padStart(2, '0')
    const weekdays = ['토', '일', '금'] as const
    const slotSets = [
      ['09:00 ~ 09:30', '14:00 ~ 14:30'],
      ['15:00 ~ 15:30', '09:00 ~ 09:30'],
      ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'],
    ] as const
    return {
      dateLabel: `24. ${month}. ${date}(${weekdays[dayIndex % weekdays.length]})`,
      slots: [...slotSets[(seed + dayIndex) % slotSets.length]],
    }
  })
}

function buildRow(
  programId: string,
  half: UjatVolunteerRecruitHalf,
  index: number
): UjatVolunteerApplicantRow {
  const seed = hashSeed(programId, half, index)
  const name = NAMES[index % NAMES.length]
  const grade = UJAT_VOLUNTEER_GRADE_OPTIONS[seed % UJAT_VOLUNTEER_GRADE_OPTIONS.length]
  const preferredRegion =
    UJAT_VOLUNTEER_PREFERRED_REGIONS[seed % UJAT_VOLUNTEER_PREFERRED_REGIONS.length]
  const hasEducationExperience = seed % 3 !== 0
  const applicationType: UjatVolunteerApplicationType = seed % 4 === 0 ? 'ujat-graduate' : 'new'
  const documentScreeningStatus: UjatDocumentScreeningStatus =
    seed % 4 === 0 ? 'fail' : seed % 4 === 1 ? 'pending' : 'pass'
  const interviewAssignmentStatus = resolveInterviewAssignmentStatus(seed, documentScreeningStatus)
  const evaluationOptions: UjatManagerEvaluation[] = ['pass', 'neutral', 'fail', 'unreviewed']
  const managerAEvaluation = evaluationOptions[seed % evaluationOptions.length]
  const managerBEvaluation = evaluationOptions[(seed * 3) % evaluationOptions.length]
  const interviewAvailability = buildInterviewAvailability(seed)
  const interviewSlotCount = countInterviewSlots(interviewAvailability)
  const phoneSuffix = String(1000 + (seed % 9000)).padStart(4, '0')
  const rawContact = `010-1234-${phoneSuffix}`
  const rawEmail = `${name.replace(/\s/g, '').toLowerCase()}${index}@example.com`
  const birthYear = 1998 + (seed % 8)
  const birthMonth = String(1 + (seed % 12)).padStart(2, '0')
  const birthDay = String(1 + (seed % 28)).padStart(2, '0')
  const birthDate = `${birthYear}.${birthMonth}.${birthDay}`
  const age = 2026 - birthYear

  const row: UjatVolunteerApplicantRow = {
    id: `ujat-vol-${half}-${programId}-${index}`,
    no: index + 1,
    name,
    grade,
    preferredRegion,
    contact: maskContact(rawContact),
    email: maskEmail(rawEmail),
    contactRaw: rawContact,
    emailRaw: rawEmail,
    hasEducationExperience,
    applicationType,
    essayIntro: applicationType === 'ujat-graduate' ? '' : `${ESSAY_INTRO} (${name})`,
    essayEducationExperience: applicationType === 'ujat-graduate' ? '' : ESSAY_EDU,
    essayNecessity: applicationType === 'ujat-graduate' ? '' : ESSAY_NECESSITY,
    essayJaExperience: applicationType === 'ujat-graduate' ? '' : ESSAY_JA,
    managerAEvaluation,
    managerBEvaluation,
    documentScreeningStatus,
    interviewSlotCount,
    programId,
    half,
    englishName: `Applicant ${index + 1}`,
    id1365: `vol_${programId.slice(0, 6)}_${index}`,
    gender: seed % 2 === 0 ? '남성' : '여성',
    birthDate,
    age,
    universityName: UNIVERSITIES[seed % UNIVERSITIES.length],
    major: seed % 2 === 0 ? '경영학과 전공' : '회계학과 전공, 경영학과 복수전공',
    applicationRoute: APPLICATION_ROUTES[seed % APPLICATION_ROUTES.length],
    scheduleChangeCancelCount: seed % 5 === 0 ? 1 : 0,
    interviewAvailability,
    interviewAssignmentStatus,
    previousUjatActivity:
      applicationType === 'ujat-graduate' ? buildPreviousUjatActivity(seed, name) : undefined,
    ...(interviewAssignmentStatus === 'assigned'
      ? buildAssignedInterviewFields(seed, interviewAvailability)
      : {}),
  }

  if (index === 0) {
    const demoAvailability = DEMO_SCREENSHOT_ROW.interviewAvailability ?? interviewAvailability
    return {
      ...row,
      ...DEMO_SCREENSHOT_ROW,
      id: row.id,
      no: row.no,
      programId,
      half,
      contact: maskContact(DEMO_SCREENSHOT_ROW.contactRaw ?? rawContact),
      email: maskEmail(DEMO_SCREENSHOT_ROW.emailRaw ?? rawEmail),
      interviewAvailability: demoAvailability,
      interviewSlotCount: countInterviewSlots(demoAvailability),
      interviewAssignmentStatus:
        DEMO_SCREENSHOT_ROW.interviewAssignmentStatus ?? interviewAssignmentStatus,
    }
  }

  return row
}

const cache = new Map<string, UjatVolunteerApplicantRow[]>()

export function getUjatVolunteerApplicants(
  programId: string,
  half: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  const key = `${programId}:${half}`
  const existing = cache.get(key)
  if (existing) return existing.map(row => ({ ...row }))

  const count = 72 + (hashSeed(programId, half, 0) % 8)
  const rows = Array.from({ length: count }, (_, i) => buildRow(programId, half, i))
  cache.set(key, rows)
  return rows.map(row => ({ ...row }))
}

export function findUjatVolunteerApplicantById(
  programId: string,
  half: UjatVolunteerRecruitHalf,
  applicantId: string
): UjatVolunteerApplicantRow | undefined {
  return getUjatVolunteerApplicants(programId, half).find(row => row.id === applicantId)
}

export function sortUjatVolunteerApplicants(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    if (a.hasEducationExperience !== b.hasEducationExperience) {
      return a.hasEducationExperience ? -1 : 1
    }
    if (a.interviewSlotCount !== b.interviewSlotCount) {
      return a.interviewSlotCount - b.interviewSlotCount
    }
    const ra = UJAT_VOLUNTEER_REGION_SORT_ORDER[a.preferredRegion] ?? 99
    const rb = UJAT_VOLUNTEER_REGION_SORT_ORDER[b.preferredRegion] ?? 99
    if (ra !== rb) return ra - rb
    return a.no - b.no
  })
}

/** 1차 서류 합격자 목록 — 면접 가능 일정 수 오름차순 */
export function sortUjatVolunteerDocPassedApplicants(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    if (a.interviewSlotCount !== b.interviewSlotCount) {
      return a.interviewSlotCount - b.interviewSlotCount
    }
    const ra = UJAT_VOLUNTEER_REGION_SORT_ORDER[a.preferredRegion] ?? 99
    const rb = UJAT_VOLUNTEER_REGION_SORT_ORDER[b.preferredRegion] ?? 99
    if (ra !== rb) return ra - rb
    return a.no - b.no
  })
}

export function getUjatVolunteerDocPassedApplicants(
  programId: string,
  half: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  return sortUjatVolunteerDocPassedApplicants(
    getUjatVolunteerApplicants(programId, half).filter(
      row => row.documentScreeningStatus === 'pass'
    )
  )
}

export function sortUjatVolunteerInterview2Applicants(
  rows: UjatVolunteerApplicantRow[]
): UjatVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    const dateA = a.assignedInterviewDateLabel ?? ''
    const dateB = b.assignedInterviewDateLabel ?? ''
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    const timeA = a.assignedInterviewTime ?? ''
    const timeB = b.assignedInterviewTime ?? ''
    if (timeA !== timeB) return timeA.localeCompare(timeB)
    return b.no - a.no
  })
}

export function getUjatVolunteerInterview2Applicants(
  programId: string,
  half: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  return sortUjatVolunteerInterview2Applicants(
    getUjatVolunteerApplicants(programId, half).filter(
      row =>
        row.documentScreeningStatus === 'pass' &&
        row.interviewAssignmentStatus === 'assigned' &&
        row.assignedInterviewDateLabel &&
        row.assignedInterviewTime
    )
  )
}

export function patchUjatVolunteerSecondInterviewScreeningStatus(
  rows: UjatVolunteerApplicantRow[],
  ids: string[],
  status: UjatSecondInterviewScreeningStatus
): UjatVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row =>
    idSet.has(row.id) ? { ...row, secondInterviewScreeningStatus: status } : row
  )
}

export function formatUjatVolunteerApplicationType(type: UjatVolunteerApplicationType): string {
  return UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}
