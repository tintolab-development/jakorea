import type { PermissionModalNotifyTiming } from '@/shared/components/permission-modal'
import {
  GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS,
  type GeneralDocumentScreeningStatus,
  type GeneralInterviewAssignmentStatus,
  type GeneralManagerEvaluation,
  type GeneralSecondInterviewScreeningStatus,
  type GeneralVolunteerApplicationType,
} from '@/features/program/general/lib/volunteer-screening-constants'
import {
  computeGeneralInterviewTotalScore,
  sortGeneralVolunteerInterview2Applicants,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK,
  GENERAL_INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY,
  GENERAL_INTERVIEW_ASSIGNED_DATE_LABELS,
} from '@/data/mock/general-volunteer-interview-schedule-mock'
import {
  GENERAL_INSTITUTION_MEMBER_ROSTER,
  isGeneralInstitutionCaseProgramId,
} from '@/features/program/general/lib/general-institution-case-roster'

export type GeneralVolunteerInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export interface GeneralVolunteerApplicantRow {
  id: string
  /** BE 회원 ID — 봉사 신청 PK와 구분 */
  memberId?: number
  no: number
  name: string
  contact: string
  email: string
  contactRaw: string
  emailRaw: string
  id1365: string
  scheduleChangeCancelCount: number
  applicationType: GeneralVolunteerApplicationType
  hasJaVolunteerExperience: boolean
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  managerAEvaluation: GeneralManagerEvaluation
  managerBEvaluation: GeneralManagerEvaluation
  documentScreeningStatus: GeneralDocumentScreeningStatus
  documentApprovalNotifyTiming?: PermissionModalNotifyTiming
  documentRejectionNotifyTiming?: PermissionModalNotifyTiming
  interviewSlotCount: number
  interviewAssignmentStatus: GeneralInterviewAssignmentStatus
  programId: string
  englishName: string
  gender: string
  birthDate: string
  age: number
  universityName: string
  major: string
  applicationRoute: string
  interviewAvailability: GeneralVolunteerInterviewAvailabilityDay[]
  assignedInterviewDateLabel?: string
  assignedInterviewTime?: string
  secondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
  totalScore?: number | null
  managerAScore?: number | null
  managerBScore?: number | null
  interviewEvaluationRemark?: string
}

const NAMES = [
  '김민토',
  '이민토',
  '박틴토',
  '박서연',
  '최준호',
  '정하은',
  '한지우',
  '윤도현',
  '서지민',
  '오하린',
  '문태준',
  '장유진',
] as const

const INTERVIEW_DATE_LABELS = [
  '26. 09. 08(화)',
  '26. 09. 10(목)',
  '26. 09. 11(금)',
  '26. 09. 15(화)',
  '26. 09. 17(목)',
  '26. 09. 22(화)',
  '26. 09. 23(수)',
  '26. 10. 05(월)',
] as const

/**
 * 면접일 배정 캘린더 UI demo — 목록 일정 수(6개) = 팝업 연민트 3일×2슬롯
 * (GENERAL_INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY SSOT)
 */
const INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY: GeneralVolunteerInterviewAvailabilityDay[] =
  GENERAL_INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY.map(day => ({
    dateLabel: day.dateLabel,
    slots: [...day.slots],
  }))

const INTERVIEW_TIME_SLOTS = DEFAULT_GENERAL_VOLUNTEER_INTERVIEW_SCHEDULE_MOCK.availableTimeSlots
  .split(',')
  .map(slot => slot.trim())
  .filter(Boolean)

const ESSAY_INTRO =
  '경제·금융에 관심을 키우며 JA Korea 봉사에 지원했습니다. 학생들과 소통하며 경제 개념을 쉽게 전달하고 싶습니다.'
const ESSAY_EDUCATION =
  '초등학생 대상 과외와 학습 멘토링을 진행한 경험이 있으며, 수준에 맞춘 설명을 중요하게 생각합니다.'
const ESSAY_NECESSITY =
  '초등학생 시기의 경제 교육은 소비와 저축 습관을 형성하는 데 중요하다고 생각합니다.'
const ESSAY_JA =
  '중·고등학교 시절 JA Korea 경제금융교육 안내를 들었고, 대학 진학 후 프로그램에 관심을 갖게 되었습니다.'

/** 1차 서류 합격자 목록 — 면접일 배정 현황 케이스별 1건 (5=정하은 캘린더 demo) */
const DOC_PASSED_WAITING_INDICES = new Set([5])
const DOC_PASSED_ASSIGNED_INDICES = new Set([3])
const DOC_PASSED_WITHDRAWN_INDICES = new Set([26])

/** 1차 서류 심사 대상자 — 서류 불합격 케이스 1건 */
const DOC_FAILED_INDICES = new Set([17])

/** 1차 서류 심사 대상자 — 대기 케이스 1건 */
const DOC1_PENDING_INDICES = new Set([0])

/**
 * 1차 서류 심사 현황 QA 표시명 (index → name)
 */
const DOC1_STATUS_CASE_NAMES: Partial<Record<number, string>> = {
  0: '서류대기민수',
  17: '서류불합격서연',
}

/** 1차 대상자 목록에 포함할 서류 합격 demo index (합격자 탭 배정대기와 동일 행) */
const DOC1_LIST_PASS_DEMO_INDICES = new Set([5])

/** 면접일 배정 현황 QA 표시명 */
const DOC_PASSED_ASSIGNMENT_CASE_NAMES: Partial<Record<number, string>> = {
  5: '배정대기정하은',
  3: '배정완료준호',
  26: '활동포기태준',
}

/** 2차 면접 대상자 — 심사 현황별 demo 1명 (index 30~37: assigned, 25: 활동 포기) */
const INTERVIEW2_STATUS_DEMO_INDICES = new Set([30, 31, 32, 33, 34, 35, 36, 37])

/** 2차 면접 상세 — 자유 작성 항목 노출 demo (신규·JA 경험 없음) */
const INTERVIEW2_FREE_WRITE_DEMO_INDICES = new Set([30, 31])

const INTERVIEW2_STATUS_CASE_NAMES: Partial<Record<number, string>> = {
  30: '면접대기하린',
  31: '면접완료지우',
  32: '면접합격도현',
  33: '면접불합격지민',
  34: '예비일호진',
  35: '예비이서연',
  36: '예비삼준호',
  37: '예비사하은',
  25: '면접포기태준',
}

/** pass 상태이지만 1차 합격자 목록에는 넣지 않음 — 2차 면접 전용 */
const DOC_PASSED_ASSIGNED_INDICES_WITH_INTERVIEW2_DEMO = new Set([
  ...DOC_PASSED_ASSIGNED_INDICES,
  ...INTERVIEW2_STATUS_DEMO_INDICES,
])

/** 1차 서류 합격자 목록에 노출할 index만 */
const DOC_PASSED_LIST_INDICES = new Set([
  ...DOC_PASSED_WAITING_INDICES,
  ...DOC_PASSED_ASSIGNED_INDICES,
  ...DOC_PASSED_WITHDRAWN_INDICES,
])

/** 1차 서류 심사 대상자 목록에 노출할 index만 */
const DOC1_LIST_INDICES = new Set([
  ...DOC1_PENDING_INDICES,
  ...DOC_FAILED_INDICES,
  ...DOC1_LIST_PASS_DEMO_INDICES,
])

/** 2차 면접 대상자 목록 */
const INTERVIEW2_LIST_INDICES = new Set([
  ...INTERVIEW2_STATUS_DEMO_INDICES,
  25, // 면접 포기
])

const VOLUNTEER_MOCK_ROW_COUNT = 38

const INTERVIEW2_STATUS_DEMO_FIELDS: Partial<
  Record<
    number,
    Pick<
      GeneralVolunteerApplicantRow,
      | 'assignedInterviewDateLabel'
      | 'assignedInterviewTime'
      | 'secondInterviewScreeningStatus'
      | 'managerAScore'
      | 'managerBScore'
      | 'interviewEvaluationRemark'
    >
  >
> = {
  /** 면접 진행 대기 — 오늘(9/15) 이후 슬롯 */
  30: {
    assignedInterviewDateLabel: '26. 10. 20(화)',
    assignedInterviewTime: '14:00 ~ 14:30',
    secondInterviewScreeningStatus: undefined,
    managerAScore: null,
    managerBScore: null,
    interviewEvaluationRemark: '지원동기도 좋고, 교육 경험이 풍부함',
  },
  /** 면접 진행 완료 — 과거 슬롯 */
  31: {
    assignedInterviewDateLabel: '26. 09. 08(화)',
    assignedInterviewTime: '09:00 ~ 09:30',
    secondInterviewScreeningStatus: undefined,
    managerAScore: 4,
    managerBScore: 3,
  },
  /** 면접 합격 */
  32: {
    assignedInterviewDateLabel: '26. 09. 10(목)',
    assignedInterviewTime: '14:00 ~ 14:30',
    secondInterviewScreeningStatus: 'pass',
    managerAScore: 5,
    managerBScore: 4,
  },
  /** 면접 불합격 */
  33: {
    assignedInterviewDateLabel: '26. 09. 11(금)',
    assignedInterviewTime: '09:00 ~ 09:30',
    secondInterviewScreeningStatus: 'fail',
    managerAScore: 1,
    managerBScore: 2,
  },
  /** 예비 1 */
  34: {
    assignedInterviewDateLabel: '26. 09. 17(목)',
    assignedInterviewTime: '14:00 ~ 14:30',
    secondInterviewScreeningStatus: 'reserve1',
    managerAScore: 4,
    managerBScore: 4,
  },
  /** 예비 2 */
  35: {
    assignedInterviewDateLabel: '26. 09. 23(수)',
    assignedInterviewTime: '15:00 ~ 15:30',
    secondInterviewScreeningStatus: 'reserve2',
    managerAScore: 3,
    managerBScore: 3,
  },
  /** 예비 3 — 미평가 */
  36: {
    assignedInterviewDateLabel: '26. 10. 05(월)',
    assignedInterviewTime: '09:00 ~ 09:30',
    secondInterviewScreeningStatus: 'reserve3',
    managerAScore: null,
    managerBScore: null,
  },
  /** 예비 4 */
  37: {
    assignedInterviewDateLabel: '26. 10. 13(화)',
    assignedInterviewTime: '14:00 ~ 14:30',
    secondInterviewScreeningStatus: 'reserve4',
    managerAScore: 5,
    managerBScore: 5,
  },
  /** 활동 포기 */
  25: {
    assignedInterviewDateLabel: '26. 09. 22(화)',
    assignedInterviewTime: '14:00 ~ 14:30',
    secondInterviewScreeningStatus: undefined,
    managerAScore: null,
    managerBScore: null,
  },
}

const DOC_PASSED_INDICES = new Set<number>([
  ...DOC_PASSED_LIST_INDICES,
  ...DOC_PASSED_ASSIGNED_INDICES_WITH_INTERVIEW2_DEMO,
  25, // 면접2 포기
])

function hashSeed(programId: string, index: number): number {
  let h = 0
  const source = `${programId}:general-volunteer:${index}`
  for (let i = 0; i < source.length; i += 1) {
    h = (h * 31 + source.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function maskContact(raw: string): string {
  return raw.replace(/(\d{3})-(\d{4})-(\d{4})/, '$1-****-$3')
}

function maskEmail(raw: string): string {
  const [local, domain] = raw.split('@')
  if (!domain) return raw
  return `${local.slice(0, 2)}***@${domain}`
}

function buildInterviewAvailability(
  seed: number,
  index: number
): GeneralVolunteerInterviewAvailabilityDay[] {
  const slotCount = 1 + (seed % 3)
  const slots = Array.from({ length: slotCount }, (_, slotIndex) =>
    INTERVIEW_TIME_SLOTS[(seed + slotIndex) % INTERVIEW_TIME_SLOTS.length]
  )
  const firstDate = INTERVIEW_DATE_LABELS[seed % INTERVIEW_DATE_LABELS.length]

  const days: GeneralVolunteerInterviewAvailabilityDay[] = [{ dateLabel: firstDate, slots }]

  if (index <= 4) {
    days.push({
      dateLabel: '26. 09. 23(수)',
      slots: ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'],
    })
  }

  return days
}

function buildId1365(name: string, no: number): string {
  const romanized = name === '박틴토' ? 'park_tt' : `vol_${no}`
  return `${romanized}***`
}

function countInterviewSlots(days: GeneralVolunteerInterviewAvailabilityDay[]): number {
  return days.reduce((sum, day) => sum + day.slots.length, 0)
}

function resolveDocumentStatus(index: number): GeneralDocumentScreeningStatus {
  if (DOC1_PENDING_INDICES.has(index)) return 'pending'
  if (DOC_FAILED_INDICES.has(index)) return 'fail'
  if (DOC_PASSED_INDICES.has(index) || DOC1_LIST_PASS_DEMO_INDICES.has(index)) return 'pass'
  /** 목록 미노출 행 */
  return 'fail'
}

function resolveInterviewAssignmentStatus(
  index: number,
  documentScreeningStatus: GeneralDocumentScreeningStatus
): GeneralInterviewAssignmentStatus {
  if (documentScreeningStatus !== 'pass') return 'waiting'
  if (DOC_PASSED_WAITING_INDICES.has(index)) return 'waiting'
  if (DOC_PASSED_WITHDRAWN_INDICES.has(index) || index === 25) return 'withdrawn'
  if (DOC_PASSED_ASSIGNED_INDICES_WITH_INTERVIEW2_DEMO.has(index)) return 'assigned'
  return 'waiting'
}

function volunteerIndexFromId(id: string): number | null {
  const match = id.match(/-(\d+)$/)
  if (!match) return null
  return Number(match[1])
}

const MANUAL_SECOND_INTERVIEW_STATUSES: GeneralSecondInterviewScreeningStatus[] = [
  'pass',
  'fail',
  'reserve1',
  'reserve2',
  'reserve3',
  'reserve4',
]

function buildInterviewManagerScores(seed: number): {
  managerAScore: number | null
  managerBScore: number | null
} {
  if (seed % 4 === 0) {
    return { managerAScore: null, managerBScore: null }
  }

  const total = 1 + (seed % 10)
  if (total === 1) {
    return { managerAScore: 1, managerBScore: 0 }
  }

  const managerAScore = 1 + (seed % (total - 1))
  const managerBScore = total - managerAScore

  return { managerAScore, managerBScore }
}

function buildAssignedInterviewFields(
  seed: number,
  interviewAvailability: GeneralVolunteerInterviewAvailabilityDay[],
  index?: number
) {
  const demoFields = index != null ? INTERVIEW2_STATUS_DEMO_FIELDS[index] : undefined
  if (demoFields) {
    return {
      assignedInterviewDateLabel: demoFields.assignedInterviewDateLabel,
      assignedInterviewTime: demoFields.assignedInterviewTime,
      secondInterviewScreeningStatus: demoFields.secondInterviewScreeningStatus,
      managerAScore: demoFields.managerAScore ?? null,
      managerBScore: demoFields.managerBScore ?? null,
      ...(demoFields.interviewEvaluationRemark
        ? { interviewEvaluationRemark: demoFields.interviewEvaluationRemark }
        : {}),
    }
  }

  if (index === 2) {
    return {
      assignedInterviewDateLabel: '26. 09. 23(수)',
      assignedInterviewTime: '09:00 ~ 09:30',
      secondInterviewScreeningStatus: undefined,
      managerAScore: null,
      managerBScore: null,
      interviewEvaluationRemark: '지원동기도 좋고, 교육 경험이 풍부함',
    }
  }

  /** 회색 셀 demo — 9/10·9/11 배정 완료일 */
  if (index === 3) {
    return {
      assignedInterviewDateLabel: GENERAL_INTERVIEW_ASSIGNED_DATE_LABELS[0],
      assignedInterviewTime: '14:00 ~ 14:30',
      secondInterviewScreeningStatus: undefined,
      ...buildInterviewManagerScores(seed),
    }
  }

  if (index === 4) {
    return {
      assignedInterviewDateLabel: GENERAL_INTERVIEW_ASSIGNED_DATE_LABELS[1],
      assignedInterviewTime: '09:00 ~ 09:30',
      secondInterviewScreeningStatus: undefined,
      ...buildInterviewManagerScores(seed),
    }
  }

  /** 9/17 09:00 슬롯 — 배정 모달 `N명` 카운트 demo (2명) */
  if (index === 6 || index === 8) {
    return {
      assignedInterviewDateLabel: GENERAL_INTERVIEW_ASSIGNED_DATE_LABELS[2],
      assignedInterviewTime: '09:00 ~ 09:30',
      secondInterviewScreeningStatus: undefined,
      ...buildInterviewManagerScores(seed),
    }
  }

  const firstDay = interviewAvailability[0]
  const firstSlot = firstDay?.slots[0]
  const dateLabel =
    firstDay?.dateLabel ?? INTERVIEW_DATE_LABELS[seed % INTERVIEW_DATE_LABELS.length]
  const time =
    firstSlot ?? INTERVIEW_TIME_SLOTS[seed % INTERVIEW_TIME_SLOTS.length]
  const manualStatus =
    seed % 8 === 0
      ? MANUAL_SECOND_INTERVIEW_STATUSES[seed % MANUAL_SECOND_INTERVIEW_STATUSES.length]
      : undefined

  return {
    assignedInterviewDateLabel: dateLabel,
    assignedInterviewTime: time,
    secondInterviewScreeningStatus: manualStatus,
    ...buildInterviewManagerScores(seed),
  }
}

function buildRow(programId: string, index: number): GeneralVolunteerApplicantRow {
  const seed = hashSeed(programId, index)
  const no = index + 1
  const caseName =
    DOC_PASSED_ASSIGNMENT_CASE_NAMES[index] ??
    DOC1_STATUS_CASE_NAMES[index] ??
    INTERVIEW2_STATUS_CASE_NAMES[index]
  const name = caseName ?? NAMES[index % NAMES.length]
  const phoneSuffix = String(1000 + (seed % 9000)).padStart(4, '0')
  const contactRaw = `010-1234-${phoneSuffix}`
  const emailRaw = `${name}${no}@example.com`
  const applicationType: GeneralVolunteerApplicationType =
    index % 4 === 0 ? 'ujat-graduate' : 'new'
  const documentScreeningStatus = resolveDocumentStatus(index)
  const interviewAssignmentStatus = resolveInterviewAssignmentStatus(
    index,
    documentScreeningStatus
  )
  const interviewAvailability = DOC_PASSED_WAITING_INDICES.has(index)
    ? INTERVIEW_ASSIGN_CALENDAR_DEMO_AVAILABILITY
    : buildInterviewAvailability(seed, index)
  const evaluationOptions: GeneralManagerEvaluation[] = ['pass', 'neutral', 'fail', 'unreviewed']

  /** 담당자 평가 — 1차 서류 케이스 행에 대표값 고정 */
  const managerEvalCase = DOC1_PENDING_INDICES.has(index)
    ? ({ managerAEvaluation: 'unreviewed', managerBEvaluation: 'unreviewed' } as const)
    : DOC_FAILED_INDICES.has(index)
      ? ({ managerAEvaluation: 'fail', managerBEvaluation: 'fail' } as const)
      : DOC1_LIST_PASS_DEMO_INDICES.has(index)
        ? ({ managerAEvaluation: 'pass', managerBEvaluation: 'pass' } as const)
        : null

  return {
    id: `general-vol-${programId}-${index}`,
    no,
    name,
    contact: maskContact(contactRaw),
    email: maskEmail(emailRaw),
    contactRaw,
    emailRaw,
    id1365: buildId1365(name, no),
    scheduleChangeCancelCount: index === 3 ? 1 : seed % 7 === 0 ? 1 : 0,
    applicationType,
    hasJaVolunteerExperience: INTERVIEW2_FREE_WRITE_DEMO_INDICES.has(index)
      ? false
      : seed % 3 !== 0,
    essayIntro: applicationType === 'ujat-graduate' ? '' : `${ESSAY_INTRO} (${name})`,
    essayEducationExperience: applicationType === 'ujat-graduate' ? '' : ESSAY_EDUCATION,
    essayNecessity: applicationType === 'ujat-graduate' ? '' : ESSAY_NECESSITY,
    essayJaExperience: applicationType === 'ujat-graduate' ? '' : ESSAY_JA,
    managerAEvaluation:
      managerEvalCase?.managerAEvaluation ??
      (index <= 4 ? 'unreviewed' : evaluationOptions[seed % evaluationOptions.length]),
    managerBEvaluation:
      managerEvalCase?.managerBEvaluation ??
      (index <= 4 ? 'unreviewed' : evaluationOptions[(seed + 2) % evaluationOptions.length]),
    documentScreeningStatus,
    interviewSlotCount: countInterviewSlots(interviewAvailability),
    interviewAssignmentStatus,
    programId,
    englishName: `General Volunteer ${no}`,
    gender: index === 3 ? '남성' : seed % 2 === 0 ? '여성' : '남성',
    birthDate:
      index === 3
        ? '2000.09.15'
        : `200${seed % 5}.${String(1 + (seed % 12)).padStart(2, '0')}.${String(
            1 + (seed % 28)
          ).padStart(2, '0')}`,
    age: index === 3 ? 25 : 22 + (seed % 7),
    universityName: '**대학교',
    major: seed % 2 === 0 ? '경제학과 전공' : '경영학과 전공',
    applicationRoute: ['인스타그램', '학교 안내', '링커리어', '캠퍼스픽'][seed % 4],
    interviewAvailability,
    ...(interviewAssignmentStatus === 'assigned' || interviewAssignmentStatus === 'withdrawn'
      ? buildAssignedInterviewFields(seed, interviewAvailability, index)
      : {}),
  }
}

const cache = new Map<string, GeneralVolunteerApplicantRow[]>()

export function getGeneralVolunteerApplicants(programId: string): GeneralVolunteerApplicantRow[] {
  const existing = cache.get(programId)
  if (existing) return existing.map(row => ({ ...row }))
  const rows = Array.from({ length: VOLUNTEER_MOCK_ROW_COUNT }, (_, index) => {
    const row = buildRow(programId, index)
    if (!isGeneralInstitutionCaseProgramId(programId)) return row
    const member = GENERAL_INSTITUTION_MEMBER_ROSTER.individual
    return {
      ...row,
      memberId: member.memberId,
      name: member.name,
      contact: member.contact,
      contactRaw: member.contact.replaceAll('-', ''),
      email: member.email,
      emailRaw: member.email,
    }
  })
  cache.set(programId, rows)
  return rows.map(row => ({ ...row }))
}

export function sortGeneralVolunteerByInterviewSlotCount(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    if (a.interviewSlotCount !== b.interviewSlotCount) {
      return a.interviewSlotCount - b.interviewSlotCount
    }
    return a.no - b.no
  })
}

/** 1차 서류 심사 대상자 — 현황 케이스별 1건 */
export function getGeneralVolunteerDoc1Applicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return sortGeneralVolunteerByInterviewSlotCount(
    getGeneralVolunteerApplicants(programId).filter(row => {
      const index = volunteerIndexFromId(row.id)
      return index != null && DOC1_LIST_INDICES.has(index)
    })
  )
}

/** 참여자(개인) 1차 서류 합격자·2차 면접 대상자 — 활동 포기 하단, 나머지는 No. 내림차순 */
export function sortGeneralParticipantDocPassedVolunteerRows(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    const aWithdrawn = a.interviewAssignmentStatus === 'withdrawn' ? 1 : 0
    const bWithdrawn = b.interviewAssignmentStatus === 'withdrawn' ? 1 : 0
    if (aWithdrawn !== bWithdrawn) return aWithdrawn - bWithdrawn
    return b.no - a.no
  })
}

export function sortGeneralVolunteerDocPassedApplicants(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    const aWithdrawn = a.interviewAssignmentStatus === 'withdrawn' ? 1 : 0
    const bWithdrawn = b.interviewAssignmentStatus === 'withdrawn' ? 1 : 0
    if (aWithdrawn !== bWithdrawn) return aWithdrawn - bWithdrawn
    if (a.interviewSlotCount !== b.interviewSlotCount) {
      return a.interviewSlotCount - b.interviewSlotCount
    }
    return a.no - b.no
  })
}

/** 1차 서류 합격자 — 면접 배정 현황 케이스별 1건 */
export function getGeneralVolunteerDocPassedApplicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return sortGeneralVolunteerDocPassedApplicants(
    getGeneralVolunteerApplicants(programId).filter(row => {
      const index = volunteerIndexFromId(row.id)
      return index != null && DOC_PASSED_LIST_INDICES.has(index)
    })
  )
}

/** 2차 면접 대상자 — 심사 현황 케이스별 1건 */
export function getGeneralVolunteerInterview2Applicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return sortGeneralVolunteerInterview2Applicants(
    getGeneralVolunteerApplicants(programId).filter(row => {
      const index = volunteerIndexFromId(row.id)
      if (index == null || !INTERVIEW2_LIST_INDICES.has(index)) return false
      return (
        row.documentScreeningStatus === 'pass' &&
        (row.interviewAssignmentStatus === 'assigned' ||
          row.interviewAssignmentStatus === 'withdrawn') &&
        Boolean(row.assignedInterviewDateLabel) &&
        Boolean(row.assignedInterviewTime)
      )
    })
  )
}

export { sortGeneralVolunteerInterview2Applicants } from '@/features/program/general/lib/general-volunteer-interview2-display'

export function patchGeneralVolunteerDocumentScreeningStatus(
  rows: GeneralVolunteerApplicantRow[],
  ids: string[],
  status: 'pass' | 'fail',
  notifyTiming?: PermissionModalNotifyTiming
): GeneralVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row => {
    if (!idSet.has(row.id)) return row
    if (status === 'pass') {
      return {
        ...row,
        documentScreeningStatus: status,
        documentApprovalNotifyTiming: notifyTiming,
        documentRejectionNotifyTiming: undefined,
      }
    }
    return {
      ...row,
      documentScreeningStatus: status,
      documentRejectionNotifyTiming: notifyTiming,
      documentApprovalNotifyTiming: undefined,
    }
  })
}

export function patchGeneralVolunteerDocumentScreeningCancel(
  rows: GeneralVolunteerApplicantRow[],
  id: string
): GeneralVolunteerApplicantRow[] {
  return rows.map(row =>
    row.id === id
      ? {
          ...row,
          documentScreeningStatus: 'pending',
          documentApprovalNotifyTiming: undefined,
          documentRejectionNotifyTiming: undefined,
        }
      : row
  )
}

export function patchGeneralVolunteerSecondInterviewScreeningStatus(
  rows: GeneralVolunteerApplicantRow[],
  ids: string[],
  status: GeneralSecondInterviewScreeningStatus
): GeneralVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row =>
    idSet.has(row.id) ? { ...row, secondInterviewScreeningStatus: status } : row
  )
}

export type GeneralVolunteerInterviewEvaluationPayload = {
  managerAScore: number | null
  managerBScore: number | null
  interviewEvaluationRemark: string
}

export function patchGeneralVolunteerInterviewEvaluation(
  rows: GeneralVolunteerApplicantRow[],
  id: string,
  payload: GeneralVolunteerInterviewEvaluationPayload
): GeneralVolunteerApplicantRow[] {
  return rows.map(row => {
    if (row.id !== id) return row
    const totalScore = computeGeneralInterviewTotalScore({
      managerAScore: payload.managerAScore,
      managerBScore: payload.managerBScore,
    })
    return {
      ...row,
      managerAScore: payload.managerAScore,
      managerBScore: payload.managerBScore,
      interviewEvaluationRemark: payload.interviewEvaluationRemark,
      totalScore,
    }
  })
}

export function formatGeneralVolunteerApplicationType(type: GeneralVolunteerApplicationType): string {
  return GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}
