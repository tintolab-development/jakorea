import {
  GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_ORDER,
  GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS,
  type GeneralDocumentScreeningStatus,
  type GeneralInterviewAssignmentStatus,
  type GeneralManagerEvaluation,
  type GeneralSecondInterviewScreeningStatus,
  type GeneralVolunteerApplicationType,
} from '@/features/program/general/lib/volunteer-screening-constants'

export type GeneralVolunteerInterviewAvailabilityDay = {
  dateLabel: string
  slots: string[]
}

export interface GeneralVolunteerApplicantRow {
  id: string
  no: number
  name: string
  contact: string
  email: string
  contactRaw: string
  emailRaw: string
  id1365: string
  scheduleChangeCancelCount: number
  applicationType: GeneralVolunteerApplicationType
  essayIntro: string
  essayEducationExperience: string
  essayNecessity: string
  essayJaExperience: string
  managerAEvaluation: GeneralManagerEvaluation
  managerBEvaluation: GeneralManagerEvaluation
  documentScreeningStatus: GeneralDocumentScreeningStatus
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
  '26. 03. 09(월)',
  '26. 03. 10(화)',
  '26. 03. 11(수)',
  '26. 03. 12(목)',
  '26. 03. 16(월)',
  '26. 03. 17(화)',
  '26. 03. 23(월)',
] as const

const INTERVIEW_SLOTS = [
  ['09:00 ~ 09:30', '14:00 ~ 14:30'],
  ['15:00 ~ 15:30'],
  ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'],
  [],
] as const

const ESSAY_INTRO =
  '경제·금융에 관심을 키우며 JA Korea 봉사에 지원했습니다. 학생들과 소통하며 경제 개념을 쉽게 전달하고 싶습니다.'
const ESSAY_EDUCATION =
  '초등학생 대상 과외와 학습 멘토링을 진행한 경험이 있으며, 수준에 맞춘 설명을 중요하게 생각합니다.'
const ESSAY_NECESSITY =
  '초등학생 시기의 경제 교육은 소비와 저축 습관을 형성하는 데 중요하다고 생각합니다.'
const ESSAY_JA =
  '중·고등학교 시절 JA Korea 경제금융교육 안내를 들었고, 대학 진학 후 프로그램에 관심을 갖게 되었습니다.'

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
  const slots = INTERVIEW_SLOTS[seed % INTERVIEW_SLOTS.length]
  if (slots.length === 0) return []

  const firstDate = INTERVIEW_DATE_LABELS[seed % INTERVIEW_DATE_LABELS.length]
  const days: GeneralVolunteerInterviewAvailabilityDay[] = [
    { dateLabel: firstDate, slots: [...slots] },
  ]

  if (index <= 4) {
    days.push({
      dateLabel: '26. 03. 23(월)',
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
  if (index === 2) return 'pass'
  if (index <= 4) return 'pending'
  if (index <= 9) return 'pass'
  return 'fail'
}

function resolveInterviewAssignmentStatus(
  index: number,
  documentScreeningStatus: GeneralDocumentScreeningStatus
): GeneralInterviewAssignmentStatus {
  if (documentScreeningStatus !== 'pass') return 'waiting'
  if (index % 5 === 0) return 'withdrawn'
  if (index % 2 === 0) return 'assigned'
  return 'waiting'
}

function buildAssignedInterviewFields(
  seed: number,
  interviewAvailability: GeneralVolunteerInterviewAvailabilityDay[],
  index?: number
) {
  if (index === 2) {
    return {
      assignedInterviewDateLabel: '26. 03. 23(월)',
      assignedInterviewTime: '09:00 ~ 09:30',
      secondInterviewScreeningStatus: 'waiting' as GeneralSecondInterviewScreeningStatus,
      totalScore: null,
    }
  }

  const firstDay = interviewAvailability[0]
  const firstSlot = firstDay?.slots[0]
  if (!firstDay || !firstSlot) return {}
  const status =
    GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_ORDER[
      seed % GENERAL_SECOND_INTERVIEW_SCREENING_STATUS_ORDER.length
    ]
  const totalScore = seed % 4 === 0 ? null : 70 + (seed % 25)
  return {
    assignedInterviewDateLabel: firstDay.dateLabel,
    assignedInterviewTime: firstSlot,
    secondInterviewScreeningStatus: status,
    totalScore,
  }
}

function buildRow(programId: string, index: number): GeneralVolunteerApplicantRow {
  const seed = hashSeed(programId, index)
  const no = index + 1
  const name = NAMES[index % NAMES.length]
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
  const interviewAvailability =
    index === 2
      ? ([
          {
            dateLabel: '26.03.09(월)',
            slots: ['15:00 - 15:30', '09:00 - 09:30'],
          },
          {
            dateLabel: '26. 03. 23(월)',
            slots: ['09:00 ~ 09:30', '14:00 ~ 14:30', '15:00 ~ 15:30'],
          },
        ] satisfies GeneralVolunteerInterviewAvailabilityDay[])
      : buildInterviewAvailability(seed, index)
  const evaluationOptions: GeneralManagerEvaluation[] = ['pass', 'neutral', 'fail', 'unreviewed']

  return {
    id: `general-vol-${programId}-${index}`,
    no,
    name,
    contact: maskContact(contactRaw),
    email: maskEmail(emailRaw),
    contactRaw,
    emailRaw,
    id1365: buildId1365(name, no),
    scheduleChangeCancelCount: index === 2 ? 1 : seed % 7 === 0 ? 1 : 0,
    applicationType,
    essayIntro: applicationType === 'ujat-graduate' ? '' : `${ESSAY_INTRO} (${name})`,
    essayEducationExperience: applicationType === 'ujat-graduate' ? '' : ESSAY_EDUCATION,
    essayNecessity: applicationType === 'ujat-graduate' ? '' : ESSAY_NECESSITY,
    essayJaExperience: applicationType === 'ujat-graduate' ? '' : ESSAY_JA,
    managerAEvaluation: index <= 4 ? 'unreviewed' : evaluationOptions[seed % evaluationOptions.length],
    managerBEvaluation:
      index <= 4 ? 'unreviewed' : evaluationOptions[(seed + 2) % evaluationOptions.length],
    documentScreeningStatus,
    interviewSlotCount: countInterviewSlots(interviewAvailability),
    interviewAssignmentStatus,
    programId,
    englishName: `General Volunteer ${no}`,
    gender: index === 2 ? '남성' : seed % 2 === 0 ? '여성' : '남성',
    birthDate:
      index === 2
        ? '2000.09.15'
        : `200${seed % 5}.${String(1 + (seed % 12)).padStart(2, '0')}.${String(
            1 + (seed % 28)
          ).padStart(2, '0')}`,
    age: index === 2 ? 25 : 22 + (seed % 7),
    universityName: '**대학교',
    major: seed % 2 === 0 ? '경제학과 전공' : '경영학과 전공',
    applicationRoute: ['인스타그램', '학교 안내', '링커리어', '캠퍼스픽'][seed % 4],
    interviewAvailability,
    ...(interviewAssignmentStatus === 'assigned'
      ? buildAssignedInterviewFields(seed, interviewAvailability, index)
      : {}),
  }
}

const cache = new Map<string, GeneralVolunteerApplicantRow[]>()

export function getGeneralVolunteerApplicants(programId: string): GeneralVolunteerApplicantRow[] {
  const existing = cache.get(programId)
  if (existing) return existing.map(row => ({ ...row }))
  const rows = Array.from({ length: 12 }, (_, index) => buildRow(programId, index))
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

export function getGeneralVolunteerDoc1Applicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return sortGeneralVolunteerByInterviewSlotCount(
    getGeneralVolunteerApplicants(programId).filter(row => row.documentScreeningStatus === 'pending')
  )
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

export function getGeneralVolunteerDocPassedApplicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return sortGeneralVolunteerDocPassedApplicants(
    getGeneralVolunteerApplicants(programId).filter(row => row.documentScreeningStatus === 'pass')
  )
}

export function getGeneralVolunteerInterview2Applicants(
  programId: string
): GeneralVolunteerApplicantRow[] {
  return sortGeneralVolunteerInterview2Applicants(
    getGeneralVolunteerApplicants(programId).filter(
      row =>
        row.documentScreeningStatus === 'pass' &&
        row.interviewAssignmentStatus === 'assigned' &&
        row.assignedInterviewDateLabel &&
        row.assignedInterviewTime
    )
  )
}

export function sortGeneralVolunteerInterview2Applicants(
  rows: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  return [...rows].sort((a, b) => {
    const dateA = a.assignedInterviewDateLabel ?? ''
    const dateB = b.assignedInterviewDateLabel ?? ''
    if (dateA !== dateB) return dateA.localeCompare(dateB)
    const timeA = a.assignedInterviewTime ?? ''
    const timeB = b.assignedInterviewTime ?? ''
    if (timeA !== timeB) return timeA.localeCompare(timeB)
    return a.no - b.no
  })
}

export function patchGeneralVolunteerDocumentScreeningStatus(
  rows: GeneralVolunteerApplicantRow[],
  ids: string[],
  status: 'pass' | 'fail'
): GeneralVolunteerApplicantRow[] {
  const idSet = new Set(ids)
  return rows.map(row =>
    idSet.has(row.id) ? { ...row, documentScreeningStatus: status } : row
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
    const totalScore =
      payload.managerAScore == null || payload.managerBScore == null
        ? null
        : Math.round((payload.managerAScore + payload.managerBScore) / 2)
    return {
      ...row,
      managerAScore: payload.managerAScore,
      managerBScore: payload.managerBScore,
      interviewEvaluationRemark: payload.interviewEvaluationRemark,
      totalScore,
      secondInterviewScreeningStatus: 'completed',
    }
  })
}

export function formatGeneralVolunteerApplicationType(type: GeneralVolunteerApplicationType): string {
  return GENERAL_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}
