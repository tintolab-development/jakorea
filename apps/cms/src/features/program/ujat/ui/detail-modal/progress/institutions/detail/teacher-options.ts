/**
 * UJAT 교육 진행 · 참여 기관 상세 [정보 수정] — 담당 교사 선택지
 *
 * 담당 교사는 PATCH `teacherMemberId`로만 바뀐다(BE `requireTeacher(organizationId, teacherMemberId)`).
 * 일반 프로그램 참여 기관 상세(`use-participating-institution-detail-edit`)와 같은 규칙으로
 * 기관 소속 교사 목록(재직 중 선택 가능 행)만 선택지로 쓰고, 현재 담당 교사가 목록에 없으면 legacy 항목을 앞에 둔다.
 */
import {
  getInstitutionAffiliatedTeacherOptions,
  mergeInstitutionAffiliatedTeacherOptions,
  type InstitutionAffiliatedTeacherOption,
} from '@/features/program/general/lib/institution-application-detail-edit-policy'

export type UjatAffiliatedTeacherSourceRow = {
  id: string
  teacherMemberId?: number | null
  name: string
  phone: string
  email: string
}

export function buildUjatInstitutionTeacherOptions(input: {
  /** 소속 교사 목록 응답(선택 가능 행만). 조회 전·조회 불가면 null */
  rows: readonly UjatAffiliatedTeacherSourceRow[] | null
  currentTeacherName: string
}): InstitutionAffiliatedTeacherOption[] {
  if (!input.rows) {
    return getInstitutionAffiliatedTeacherOptions(undefined, input.currentTeacherName)
  }
  const apiOptions = input.rows
    .map(row => ({
      value: row.teacherMemberId != null ? String(row.teacherMemberId) : row.id,
      label: row.name === '-' ? '' : row.name,
      mobile: row.phone === '-' ? '' : row.phone,
      email: row.email === '-' ? '' : row.email,
    }))
    .filter(option => option.label.trim())
  return mergeInstitutionAffiliatedTeacherOptions(apiOptions, input.currentTeacherName)
}

/**
 * 선택한 담당 교사 이름 → PATCH teacherMemberId. 현재 담당 교사와 같거나
 * 회원 ID를 알 수 없는 선택지(legacy)면 undefined(키 생략).
 */
export function resolveUjatInstitutionTeacherMemberIdChange(input: {
  teacherNameDraft: string
  teacherOptions: readonly InstitutionAffiliatedTeacherOption[]
  currentTeacherMemberId: number | null | undefined
}): number | undefined {
  const name = input.teacherNameDraft.trim()
  if (!name) return undefined
  const selected = input.teacherOptions.find(option => option.label === name)
  if (!selected) return undefined
  const memberId = Number(selected.value)
  if (!Number.isInteger(memberId) || memberId <= 0) return undefined
  if (memberId === input.currentTeacherMemberId) return undefined
  return memberId
}
