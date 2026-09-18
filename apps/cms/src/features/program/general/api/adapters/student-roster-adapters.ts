/**
 * Admin student-roster DTO ↔ 학교 상세 학생 명단 UI row
 */

import type { StudentRosterItemResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterItemResponse'
import type { StudentRosterRowRequest } from '@/shared/api/generated/dashboard/schemas/studentRosterRowRequest'
import type { StudentRosterResponse } from '@/shared/api/generated/dashboard/schemas/studentRosterResponse'
import type {
  SchoolDetailStudentRow,
  StudentGenderKey,
} from '@/features/program/general/model/school-detail-types'
import { formatStudentBirthDateFromDigits } from '@/features/program/general/model/school-detail-add-student-schema'

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

export function mapStudentRosterItemToRow(
  item: StudentRosterItemResponse,
  index: number
): SchoolDetailStudentRow {
  const rosterId = item.rosterId
  return {
    id: rosterId != null ? String(rosterId) : `roster-row-${index + 1}`,
    no: item.studentNo ?? index + 1,
    name: item.studentName?.trim() || '-',
    gender: mapApiGenderToStudentGenderKey(item.gender),
    birthDate: mapApiBirthDateToDisplay(item.birthDate),
    gradeClass: formatStudentGradeClass(item.grade, item.className) || '-',
    contact: item.maskedPhone?.trim() || undefined,
    email: item.maskedEmail?.trim() || undefined,
    participantId: item.participantId,
  }
}

export function mapStudentRosterResponseToRows(
  response: StudentRosterResponse | null | undefined
): SchoolDetailStudentRow[] {
  const rows = response?.rows ?? []
  return rows.map((item, index) => mapStudentRosterItemToRow(item, index))
}

export type MapStudentRowToRosterRequestOptions = {
  /** 기관 교육 학년 — API `grade` 필수 필드 채움 */
  educationGrade?: string | null
}

/**
 * UI row → PUT row.
 * 마스킹된 연락처·이메일은 원문 덮어쓰기를 막기 위해 생략한다.
 */
export function mapStudentRowToRosterRequest(
  row: SchoolDetailStudentRow,
  options: MapStudentRowToRosterRequestOptions = {}
): StudentRosterRowRequest {
  const educationGrade = options.educationGrade?.trim() || ''
  const className = row.gradeClass?.trim() || ''
  const payload: StudentRosterRowRequest = {
    studentName: row.name.trim(),
    birthDate: mapDisplayBirthDateToApi(row.birthDate),
    grade: educationGrade,
    className: className || '-',
    studentNo: Math.min(999, Math.max(1, row.no || 1)),
  }
  const gender = mapStudentGenderKeyToApi(row.gender)
  if (gender) payload.gender = gender

  const phone = row.contact?.trim()
  if (phone && !isLikelyMaskedPii(phone)) payload.phone = phone

  const email = row.email?.trim()
  if (email && !isLikelyMaskedPii(email)) payload.email = email

  return payload
}

export function mapStudentRowsToRosterCommitRequest(input: {
  rows: SchoolDetailStudentRow[]
  educationGrade?: string | null
  /**
   * OpenAPI 필수. 수동 편집 시 직전 GET의 sourceFileObjectId를 재사용하고,
   * 없으면 0 — 서버 optional 허용 전까지 임시.
   */
  sourceFileObjectId?: number | null
}): {
  sourceFileObjectId: number
  rows: StudentRosterRowRequest[]
} {
  return {
    sourceFileObjectId: input.sourceFileObjectId ?? 0,
    rows: input.rows.map(row =>
      mapStudentRowToRosterRequest(row, { educationGrade: input.educationGrade })
    ),
  }
}
