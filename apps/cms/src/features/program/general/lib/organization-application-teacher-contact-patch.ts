/**
 * 기관 신청 PATCH — 담당 교사 Tel/M/이메일을 서로 덮어쓰지 않는다.
 * 폼 teacherPhone = API teacherTel(일반전화), 폼 teacherMobile = API teacherPhone(휴대전화).
 */

export interface OrganizationApplicationFormTeacherContact {
  teacherPhone: string
  teacherMobile: string
  teacherEmail: string
}

export type OrganizationApplicationTeacherContactPatch = {
  teacherTel?: string | null
  teacherPhone?: string | null
  teacherEmail?: string | null
}

function normalizeEditableContactValue(raw: string | null | undefined): string | null | undefined {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed || trimmed === '-') return ''
  if (trimmed.includes('*')) return null
  return trimmed
}

/**
 * 값이 바뀐 키만 넣는다. 빈 값/공백/"-" 는 null(삭제). 마스킹 문자열은 보내지 않는다(omit).
 */
export function toNullableContactPatchField(
  nextRaw: string,
  prevRaw: string
): { omit: true } | { value: string | null } {
  const next = normalizeEditableContactValue(nextRaw)
  const prev = normalizeEditableContactValue(prevRaw)
  if (next == null) return { omit: true }
  if (prev == null) {
    return next === '' ? { omit: true } : { value: next }
  }
  if (next === prev) return { omit: true }
  if (next === '') return { value: null }
  return { value: next }
}

export function buildOrganizationApplicationTeacherContactPatch(
  draft: OrganizationApplicationFormTeacherContact,
  baseline: OrganizationApplicationFormTeacherContact
): OrganizationApplicationTeacherContactPatch {
  const patch: OrganizationApplicationTeacherContactPatch = {}
  const teacherTel = toNullableContactPatchField(draft.teacherPhone, baseline.teacherPhone)
  if ('value' in teacherTel) patch.teacherTel = teacherTel.value
  const teacherPhone = toNullableContactPatchField(draft.teacherMobile, baseline.teacherMobile)
  if ('value' in teacherPhone) patch.teacherPhone = teacherPhone.value
  const teacherEmail = toNullableContactPatchField(draft.teacherEmail, baseline.teacherEmail)
  if ('value' in teacherEmail) patch.teacherEmail = teacherEmail.value
  return patch
}

export function formTeacherContactFromOrganizationDetail(dto: {
  teacherTel?: string | null
  teacherPhone?: string | null
  teacherEmail?: string | null
}): OrganizationApplicationFormTeacherContact {
  const asFormValue = (raw: string | null | undefined) => {
    const normalized = normalizeEditableContactValue(raw ?? '')
    return normalized == null ? '' : normalized
  }
  return {
    teacherPhone: asFormValue(dto.teacherTel),
    teacherMobile: asFormValue(dto.teacherPhone),
    teacherEmail: asFormValue(dto.teacherEmail),
  }
}
