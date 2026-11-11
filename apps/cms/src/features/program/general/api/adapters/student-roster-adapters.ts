/**
 * Admin student-roster DTO ↔ 학교 상세 학생 명단 UI row
 */

import { toPolicyMaskedBirthDisplay } from '@/features/user/api/format-gender-birth-display'
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
  // BE 마스킹(yyyy-**-**)은 정책 표기(yyyy.**.**)로 보여준다.
  return toPolicyMaskedBirthDisplay(birthDate)
}

/** 화면 생년월일 → API `YYYY-MM-DD`. 없거나 형식이 아니면 undefined. */
export function mapOptionalDisplayBirthDateToApi(birthDate?: string | null): string | undefined {
  const digits = (birthDate ?? '').replace(/\D/g, '')
  if (digits.length >= 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
  }
  if (/^\d{4}-\d{2}-\d{2}/.test((birthDate ?? '').trim())) {
    return (birthDate ?? '').trim().slice(0, 10)
  }
  return undefined
}

/** 화면 생년월일 → API `YYYY-MM-DD` */
export function mapDisplayBirthDateToApi(birthDate?: string | null): string {
  const mapped = mapOptionalDisplayBirthDateToApi(birthDate)
  if (mapped) return mapped
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
  const rawPhone = item.phone?.trim() ?? ''
  const rawEmail = item.email?.trim() ?? ''
  const rawGender = item.gender?.trim() ?? ''
  const gender = mapApiGenderToStudentGenderKey(rawGender)
  const genderMask = !gender && rawGender && /[*•]/.test(rawGender) ? rawGender : undefined
  return {
    id: serverRosterId != null ? String(serverRosterId) : `roster-row-${index + 1}`,
    serverRosterId,
    memberId: item.memberId ?? undefined,
    no: item.studentNo ?? index + 1,
    name: item.studentName?.trim() || '-',
    gender,
    genderMask,
    birthDate: mapApiBirthDateToDisplay(item.birthDate),
    gradeClass,
    contact:
      (rawPhone && !isLikelyMaskedPii(rawPhone) ? rawPhone : item.maskedPhone?.trim()) || undefined,
    email:
      (rawEmail && !isLikelyMaskedPii(rawEmail) ? rawEmail : item.maskedEmail?.trim()) || undefined,
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
 * 기존 행은 마스킹으로 비거나 `*`인 성별·생년월일·연락처를 생략해 저장된 원문을 유지한다.
 * 신규 행은 생년월일이 없으면 저장 요청을 만들지 않는다.
 */
export function mapStudentRowToRosterRequest(
  row: SchoolDetailStudentRow,
  options: MapStudentRowToRosterRequestOptions = {}
): StudentRosterRowCommitPayload {
  const { grade, className } = parseStudentGradeClassForRosterApi(
    row.gradeClass ?? '',
    options.educationGrade
  )
  const rosterId = readCommittedRosterId(row)
  const isExistingRow = rosterId != null
  const payload: StudentRosterRowCommitPayload = {
    studentName: row.name.trim(),
    className,
    studentNo: Math.min(999, Math.max(1, row.no || 1)),
  }
  const gender = mapStudentGenderKeyToApi(row.gender)
  if (gender) payload.gender = gender
  else if (!isExistingRow) payload.gender = ''
  const birthDate = isExistingRow
    ? mapOptionalDisplayBirthDateToApi(row.birthDate)
    : mapDisplayBirthDateToApi(row.birthDate)
  if (birthDate) payload.birthDate = birthDate
  if (grade !== '-') payload.grade = grade
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
