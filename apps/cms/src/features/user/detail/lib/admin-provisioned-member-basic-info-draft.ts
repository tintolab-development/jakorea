import type { User } from '@/types/user'

/** `user.affiliation` 저장 시 기관·학년 구분에 사용 (목·API와 동일) */
export const USER_AFFILIATION_PIPE_SEP = ' | ' as const

export type AdminProvisionedMemberBasicInfoDraft = {
  name: string
  nameEn: string
  phone: string
  email: string
  detailAddress: string
  /** 기관(학교명 등) */
  affiliationInstitution: string
  /** 담당·소속 학년 */
  affiliationGrade: string
  gender: string
  birthDate: string
  socialAccount: string
  adminComment: string
}

export function splitUserAffiliationForDraft(affiliation: string | undefined): {
  affiliationInstitution: string
  affiliationGrade: string
} {
  const s = (affiliation ?? '').trim()
  if (!s) return { affiliationInstitution: '', affiliationGrade: '' }
  const idx = s.indexOf(USER_AFFILIATION_PIPE_SEP)
  if (idx === -1) return { affiliationInstitution: s, affiliationGrade: '' }
  return {
    affiliationInstitution: s.slice(0, idx).trim(),
    affiliationGrade: s.slice(idx + USER_AFFILIATION_PIPE_SEP.length).trim(),
  }
}

export function composeUserAffiliation(institution: string, grade: string): string | undefined {
  const i = institution.trim()
  const g = grade.trim()
  if (i && g) return `${i}${USER_AFFILIATION_PIPE_SEP}${g}`
  if (i) return i
  if (g) return g
  return undefined
}

function birthDateToInputValue(birthDate: User['birthDate']): string {
  if (!birthDate) return ''
  if (typeof birthDate === 'string') return birthDate.slice(0, 10)
  try {
    return new Date(birthDate).toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export function userToAdminProvisionedBasicDraft(
  user: Omit<User, 'password'>
): AdminProvisionedMemberBasicInfoDraft {
  const { affiliationInstitution, affiliationGrade } = splitUserAffiliationForDraft(user.affiliation)
  return {
    name: user.name ?? '',
    nameEn: user.nameEn ?? '',
    phone: user.phone ?? '',
    email: user.email ?? '',
    detailAddress: user.detailAddress ?? '',
    affiliationInstitution,
    affiliationGrade,
    gender: user.gender ?? '',
    birthDate: birthDateToInputValue(user.birthDate),
    socialAccount: user.socialAccounts?.[0] ?? '',
    adminComment: user.adminComment ?? '',
  }
}

export function draftToBasicInfoPatch(draft: AdminProvisionedMemberBasicInfoDraft): Partial<
  Pick<
    User,
    | 'name'
    | 'nameEn'
    | 'phone'
    | 'email'
    | 'detailAddress'
    | 'affiliation'
    | 'gender'
    | 'birthDate'
    | 'socialAccounts'
    | 'adminComment'
  >
> {
  const social = draft.socialAccount.trim()
  const adminTrimmed = draft.adminComment.trim()
  const affiliation = composeUserAffiliation(draft.affiliationInstitution, draft.affiliationGrade)
  return {
    name: draft.name.trim(),
    nameEn: draft.nameEn.trim() || undefined,
    phone: draft.phone.trim() || undefined,
    email: draft.email.trim(),
    detailAddress: draft.detailAddress.trim() || undefined,
    affiliation,
    gender: draft.gender.trim() || undefined,
    birthDate: draft.birthDate.trim() || undefined,
    socialAccounts: social ? [social] : [],
    adminComment: adminTrimmed ? adminTrimmed : undefined,
  }
}
