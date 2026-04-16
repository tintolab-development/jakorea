import type { User } from '@/types/user'
import type { PatchUserBasicInfoInput } from '@/entities/user/api/user-service'

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
  /** SCHOOL(기관) 상세 — 기관명 */
  schoolName?: string
  /** 도로명·지번 등 주소 검색으로 채운 기본 주소 */
  institutionAddressSearch?: string
  /** 상세 주소(동·호 등) */
  institutionAddressDetail?: string
  /** 학교(기관) — 프로그램 신청 횟수(숫자 문자열) */
  institutionProgramApplicationCount?: string
  /** 학교(기관) — 프로그램 수강 횟수(숫자 문자열) */
  institutionProgramAttendanceCount?: string
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

const EMPTY_ADMIN_PROVISIONED_DRAFT: AdminProvisionedMemberBasicInfoDraft = {
  name: '',
  nameEn: '',
  phone: '',
  email: '',
  detailAddress: '',
  affiliationInstitution: '',
  affiliationGrade: '',
  gender: '',
  birthDate: '',
  socialAccount: '',
  adminComment: '',
}

function optionalCountString(n: number | undefined): string {
  return n != null && !Number.isNaN(n) ? String(n) : ''
}

/** 0 이상 정수만 patch에 반영. 빈 문자열은 해당 필드를 patch에서 생략 */
function parseInstitutionListMetricCount(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const t = raw.trim()
  if (!t) return undefined
  const n = Number.parseInt(t, 10)
  if (Number.isNaN(n) || n < 0) return undefined
  return n
}

/** 학교(기관) 계정 — 기본 정보 수정용 초안 */
export function userToSchoolInstitutionEditDraft(
  user: Omit<User, 'password'>
): AdminProvisionedMemberBasicInfoDraft {
  const addr = user.schoolInfo?.address ?? ''
  return {
    ...EMPTY_ADMIN_PROVISIONED_DRAFT,
    schoolName: user.schoolInfo?.schoolName ?? user.name ?? '',
    institutionAddressSearch: addr,
    institutionAddressDetail: '',
    adminComment: user.adminComment ?? '',
    institutionProgramApplicationCount: optionalCountString(
      user.listMetrics?.institutionProgramApplicationCount
    ),
    institutionProgramAttendanceCount: optionalCountString(
      user.listMetrics?.institutionProgramAttendanceCount
    ),
  }
}

export function composeInstitutionAddressFromDraft(
  draft: Pick<AdminProvisionedMemberBasicInfoDraft, 'institutionAddressSearch' | 'institutionAddressDetail'>
): string {
  const a = (draft.institutionAddressSearch ?? '').trim()
  const b = (draft.institutionAddressDetail ?? '').trim()
  if (a && b) return `${a} ${b}`
  return a || b
}

/** 일반 교사(INSTRUCTOR · school_teacher) — 관리자 코멘트만 인라인 수정 */
export function userToAdminCommentOnlyDraft(user: Omit<User, 'password'>): AdminProvisionedMemberBasicInfoDraft {
  return {
    ...EMPTY_ADMIN_PROVISIONED_DRAFT,
    adminComment: user.adminComment ?? '',
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

/** 학교 계정 — `adminComment`만 patch (CMS 학교 상세 인라인 편집에서는 미사용) */
export function draftToSchoolAdminCommentOnlyPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const adminTrimmed = draft.adminComment.trim()
  return { adminComment: adminTrimmed ? adminTrimmed : undefined }
}

/** 학교(기관) 관리자 등록 계정 — 기관명·주소·지표·관리자 코멘트 저장 */
export function draftToSchoolInstitutionBasicInfoPatch(
  draft: AdminProvisionedMemberBasicInfoDraft
): PatchUserBasicInfoInput {
  const schoolName = (draft.schoolName ?? '').trim()
  const address = composeInstitutionAddressFromDraft(draft).trim()
  const adminTrimmed = draft.adminComment.trim()
  const patch: PatchUserBasicInfoInput = {
    adminComment: adminTrimmed ? adminTrimmed : undefined,
  }
  if (schoolName || address) {
    patch.name = schoolName || undefined
    // `patchUserBasicInfo`는 schoolInfo를 base와 병합하나, Patch 타입은 전체 객체 형태를 요구한다.
    patch.schoolInfo = {
      ...(schoolName ? { schoolName } : {}),
      ...(address ? { address } : {}),
    } as NonNullable<User['schoolInfo']>
  }
  const app = parseInstitutionListMetricCount(draft.institutionProgramApplicationCount)
  const att = parseInstitutionListMetricCount(draft.institutionProgramAttendanceCount)
  if (app !== undefined || att !== undefined) {
    patch.listMetrics = {
      ...(app !== undefined ? { institutionProgramApplicationCount: app } : {}),
      ...(att !== undefined ? { institutionProgramAttendanceCount: att } : {}),
    }
  }
  return patch
}
