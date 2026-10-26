/**
 * Admin student-roster DTO ↔ 학교 상세 학생 명단 UI row
 */

import type { StudentRosterItemResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterItemResponse'
import type { StudentRosterResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterResponse'
import {
  buildStudentRosterCommitRequestBody,
  readCommittedRosterId,
} from '@/features/program/general/lib/student-roster-commit-safety'
import type {
  OrganizationStudentRosterManualCommitRequest,
  StudentRosterRowCommitPayload,
} from '@/features/program/general/api/student-roster-commit-types'
import type {
  SchoolDetailStudentRow,
  StudentGenderKey,
} from '@/features/program/general/model/school-detail-types'
import {
  formatGradeClassSelectDisplay,
  parseStudentGradeClassForRosterApi,
  shouldUseShortGradeClassLabelForGrades,
} from '@/features/program/general/lib/student-registered-grade-class-options'
import { formatStudentBirthDateFromDigits } from '@/features/program/general/model/school-detail-add-student-schema'
import {
  PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID,
  type StudentPortraitConsentSubmission,
} from '@/features/program/general/lib/student-portrait-consent'

function isLikelyMaskedPii(value?: string | null): boolean {
  if (!value) return false
  return /[*•]/.test(value)
}

export function mapApiGenderToStudentGenderKey(
  gender?: string | null
): StudentGenderKey | undefined {
  const normalized = (gender ?? '').trim().toLowerCase()
  if (!normalized) return undefined
  if (
    normalized === 'male' ||
    normalized === 'm' ||
    normalized === '남' ||
    normalized === '남자'
  ) {
    return 'male'
  }
  if (
    normalized === 'female' ||
    normalized === 'f' ||
    normalized === '여' ||
    normalized === '여자'
  ) {
    return 'female'
  }
  return undefined
}

export function mapStudentGenderKeyToApi(gender?: StudentGenderKey | null): string | undefined {
  if (gender === 'male') return 'male'
  if (gender === 'female') return 'female'
  return undefined
}

/** API date(YYYY-MM-DD) → 화면 `YYYY. MM. DD.` */
export function mapApiBirthDateToDisplay(birthDate?: string | null): string | undefined {
  if (!birthDate?.trim()) return undefined
  const digits = birthDate.replace(/\D/g, '')
  if (digits.length >= 8) return formatStudentBirthDateFromDigits(digits.slice(0, 8))
  return birthDate.trim()
}

/** 화면 생년월일 → API `YYYY-MM-DD` */
export function mapDisplayBirthDateToApi(birthDate?: string | null): string {
  const digits = (birthDate ?? '').replace(/\D/g, '')
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test((birthDate ?? '').trim())) {
    return (birthDate ?? '').trim().slice(0, 10)
  }
  throw new Error('생년월일 형식이 올바르지 않습니다.')
}

export function formatStudentGradeClass(grade?: string | null, className?: string | null): string {
  const g = grade?.trim() ?? ''
  const c = className?.trim() ?? ''
  if (g && c) {
    if (c.includes(g)) return c
    return `${g} ${c}`.trim()
  }
  return c || g
}

type StudentRosterItemEnriched = StudentRosterItemResponse & {
  portraitConsentFileObjectId?: number | null
  satisfactionSurveyCompleted?: boolean | null
}

export function mapRosterPortraitConsentSubmission(
  item: Pick<StudentRosterItemResponse, 'portraitConsentStatus' | 'portraitConsentUpdatedAt'>
): StudentPortraitConsentSubmission | null {
  const status = item.portraitConsentStatus?.trim().toUpperCase()
  if (status !== 'CONSENTED') return null
  const submittedAt = item.portraitConsentUpdatedAt?.trim()
  if (!submittedAt) return null
  return {
    templateId: PORTRAIT_CONSENT_AGREEMENT_TEMPLATE_ID,
    submittedAt,
  }
}

export function mapStudentRosterItemToRow(
  item: StudentRosterItemResponse,
  index: number,
  options?: { useShortClassLabel?: boolean }
): SchoolDetailStudentRow {
  const rosterId = item.rosterId
  const serverRosterId =
    typeof rosterId === 'number' && Number.isInteger(rosterId) && rosterId > 0 ? rosterId : undefined
  const extra = item as StudentRosterItemEnriched
  const fileObjectId = extra.portraitConsentFileObjectId
  const useShort = options?.useShortClassLabel === true
  const gradeClass =
    formatGradeClassSelectDisplay(item.grade ?? '', item.className ?? '', useShort) ||
    formatStudentGradeClass(item.grade, item.className) ||
    '-'
  return {
    id: serverRosterId != null ? String(serverRosterId) : `roster-row-${index + 1}`,
    serverRosterId,
    memberId: item.memberId ?? undefined,
    no: item.studentNo ?? index + 1,
    name: item.studentName?.trim() || '-',
    gender: mapApiGenderToStudentGenderKey(item.gender),
    birthDate: mapApiBirthDateToDisplay(item.birthDate),
    gradeClass,
    contact: item.maskedPhone?.trim() || undefined,
    email: item.maskedEmail?.trim() || undefined,
    participantId: item.participantId,
    portraitConsentSubmission: mapRosterPortraitConsentSubmission(item),
    portraitConsentFileObjectId:
      typeof fileObjectId === 'number' && Number.isFinite(fileObjectId) && fileObjectId > 0
        ? fileObjectId
        : undefined,
    satisfactionSurveyCompleted: extra.satisfactionSurveyCompleted === true,
    notes: item.notes?.trim() || undefined,
  }
}

export function mapStudentRosterResponseToRows(
  response: StudentRosterResponse | null | undefined
): SchoolDetailStudentRow[] {
  const rows = response?.rows ?? []
  const useShortClassLabel = shouldUseShortGradeClassLabelForGrades(
    rows.map(item => item.grade ?? '')
  )
  return rows.map((item, index) =>
    mapStudentRosterItemToRow(item, index, { useShortClassLabel })
  )
}

export type MapStudentRowToRosterRequestOptions = {
  /** 기관 교육 학년 — 반 표시에 학년이 없을 때 선택 필드 `grade`에 사용 */
  educationGrade?: string | null
}

/**
 * UI row → PUT row.
 * rosterId는 GET에서 받은 `serverRosterId`만 보낸다. 행 id를 파싱하지 않는다.
 * 마스킹된 연락처·이메일은 원문 덮어쓰기를 막기 위해 생략한다.
 */
export function mapStudentRowToRosterRequest(
  row: SchoolDetailStudentRow,
  options: MapStudentRowToRosterRequestOptions = {}
): StudentRosterRowCommitPayload {
  const { grade, className } = parseStudentGradeClassForRosterApi(
    row.gradeClass ?? '',
    options.educationGrade
  )
  const payload: StudentRosterRowCommitPayload = {
    studentName: row.name.trim(),
    gender: mapStudentGenderKeyToApi(row.gender) ?? '',
    birthDate: mapDisplayBirthDateToApi(row.birthDate),
    className,
    studentNo: Math.min(999, Math.max(1, row.no || 1)),
  }
  if (grade !== '-') payload.grade = grade
  const rosterId = readCommittedRosterId(row)
  if (rosterId != null) payload.rosterId = rosterId
  if (
    row.memberId != null &&
    Number.isFinite(row.memberId) &&
    row.memberId > 0
  ) {
    payload.memberId = row.memberId
  }
  const phone = row.contact?.trim()
  if (phone && !isLikelyMaskedPii(phone)) payload.phone = phone

  const email = row.email?.trim()
  if (email && !isLikelyMaskedPii(email)) payload.email = email

  const notes = row.notes?.trim()
  if (notes) payload.notes = notes

  return payload
}

export function mapStudentRowsToRosterCommitRequest(input: {
  rows: SchoolDetailStudentRow[]
  educationGrade?: string | null
  expectedRevisionNo: number
}): OrganizationStudentRosterManualCommitRequest {
  const rows = input.rows.map(row =>
    mapStudentRowToRosterRequest(row, { educationGrade: input.educationGrade })
  )
  return buildStudentRosterCommitRequestBody({
    rows,
    expectedRevisionNo: input.expectedRevisionNo,
  })
}
