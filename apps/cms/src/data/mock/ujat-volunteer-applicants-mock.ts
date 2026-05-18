/**
 * UJAT 프로그램 — 봉사자 1차 서류 심사 대상자 mock
 */

import {
  UJAT_DOCUMENT_SCREENING_STATUS_LABELS,
  UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS,
  UJAT_VOLUNTEER_GRADE_OPTIONS,
  UJAT_VOLUNTEER_PREFERRED_REGIONS,
  UJAT_VOLUNTEER_REGION_SORT_ORDER,
  type UjatDocumentScreeningStatus,
  type UjatManagerEvaluation,
  type UjatVolunteerApplicationType,
  type UjatVolunteerGrade,
  type UjatVolunteerPreferredRegion,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/model/ujat-volunteer-screening-constants'

export type { UjatDocumentScreeningStatus, UjatVolunteerApplicationType, UjatVolunteerRecruitHalf }

export interface UjatVolunteerApplicantRow {
  id: string
  no: number
  name: string
  grade: UjatVolunteerGrade
  preferredRegion: UjatVolunteerPreferredRegion
  contact: string
  email: string
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
  programId: string
  half: UjatVolunteerRecruitHalf
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

const ESSAY_INTRO =
  'JA Korea 경제교육 봉사에 지원하게 된 계기와 본인의 강점을 중심으로 자기소개를 작성합니다.'
const ESSAY_EDU =
  '초등·중등 대상 과외 및 학원 보조 강사 경험이 있으며, 학생과의 소통에 자신이 있습니다.'
const ESSAY_NECESSITY =
  '초등학생에게 경제 개념을 일상 언어로 전달하는 것이 사회적 역량 형성에 중요하다고 생각합니다.'
const ESSAY_JA =
  '중학교 시절 JA Korea 프로그램을 수료한 경험이 있으며, 당시 배운 내용을 봉사로 전달하고 싶습니다.'

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
  const statusKeys = Object.keys(
    UJAT_DOCUMENT_SCREENING_STATUS_LABELS
  ) as UjatDocumentScreeningStatus[]
  const documentScreeningStatus = statusKeys[seed % statusKeys.length]
  const evaluationOptions: UjatManagerEvaluation[] = ['pass', 'neutral', 'fail', 'unreviewed']
  const managerAEvaluation = evaluationOptions[seed % evaluationOptions.length]
  const managerBEvaluation = evaluationOptions[(seed * 3) % evaluationOptions.length]
  const interviewSlotCount = (seed % 6) + 1
  const phoneSuffix = String(1000 + (seed % 9000)).padStart(4, '0')
  const rawContact = `010-1234-${phoneSuffix}`
  const rawEmail = `${name.replace(/\s/g, '').toLowerCase()}${index}@example.com`

  return {
    id: `ujat-vol-${half}-${programId}-${index}`,
    no: index + 1,
    name,
    grade,
    preferredRegion,
    contact: maskContact(rawContact),
    email: maskEmail(rawEmail),
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
  }
}

const cache = new Map<string, UjatVolunteerApplicantRow[]>()

export function getUjatVolunteerApplicants(
  programId: string,
  half: UjatVolunteerRecruitHalf
): UjatVolunteerApplicantRow[] {
  const key = `${programId}:${half}`
  const existing = cache.get(key)
  if (existing) return existing.map(row => ({ ...row }))

  const count = 24 + (hashSeed(programId, half, 0) % 7)
  const rows = Array.from({ length: count }, (_, i) => buildRow(programId, half, i))
  cache.set(key, rows)
  return rows.map(row => ({ ...row }))
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

export function formatUjatVolunteerApplicationType(type: UjatVolunteerApplicationType): string {
  return UJAT_VOLUNTEER_APPLICATION_TYPE_LABELS[type]
}
