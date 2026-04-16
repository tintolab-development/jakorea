import type { User } from '@/types/user'

/** 회원 상세 기본 정보 `DetailInfoForm` description에 붙는 문구 (별표 포함) */
export const ADMIN_REGISTERED_MEMBER_DETAIL_CAPTION = '*관리자에 의해 등록된 회원입니다'

/** 학교(기관) 상세 기본 정보 타이틀 우측 안내 */
export const ADMIN_REGISTERED_SCHOOL_TITLE_NOTICE = '관리자에 의해 등록된 학교입니다'
/** 회원 상세 기본 정보 타이틀 우측 안내 */
export const ADMIN_REGISTERED_MEMBER_TITLE_NOTICE = '관리자에 의해 등록된 회원입니다'

type UserLike = Pick<User, 'registeredByAdmin' | 'identitySelfSignupCompletedAfterAdminRegistration'>
type PermissionApprovalUserLike = Pick<User, 'permissionApprovalStatus'>
type CurrentUserLike = Pick<User, 'role' | 'adminLevel'>
type AdminMemberEditTargetLike = UserLike & Pick<User, 'role'>

type SchoolUserLike = UserLike &
  Pick<User, 'role' | 'schoolInfo'> & {
    schoolInfo?: { affiliatedTeachers?: { linkedUserId?: string }[] }
  }

/** CMS 상세 헤더 [정보 수정] 노출: 관리자 등록 계정이면서 본인 가입 완료 전일 때만 */
export function shouldShowCmsMemberInfoEditButton(user: UserLike): boolean {
  return Boolean(user.registeredByAdmin && !user.identitySelfSignupCompletedAfterAdminRegistration)
}

/**
 * 기본 정보 `DetailInfoForm` description에 붙는「관리자에 의해 등록」안내.
 * 관리자 등록 후 본인이 직접 가입(추가) 절차를 마친 경우에는 비노출 — [관리자 코멘트] 영역은 별도이며 계속 노출.
 */
export function shouldShowAdminRegisteredMemberDetailCaption(user: UserLike): boolean {
  return Boolean(user.registeredByAdmin && !user.identitySelfSignupCompletedAfterAdminRegistration)
}

/** 기본 정보 타이틀 우측「관리자에 의해 등록된 회원입니다」 */
export function shouldShowAdminRegisteredMemberTitleNotice(user: UserLike): boolean {
  return Boolean(user.registeredByAdmin && !user.identitySelfSignupCompletedAfterAdminRegistration)
}

/** 관리자 코멘트 노출: 권한 승인 현황이 승인 완료(APPROVED)인 회원만 */
export function shouldShowAdminCommentSection(user: PermissionApprovalUserLike): boolean {
  return user.permissionApprovalStatus === 'APPROVED'
}

/** 관리자 상세의 관리자 코멘트는 마스터 관리자만 열람/수정 가능 */
export function canAccessAdminCommentInAdminDetail(currentUser: CurrentUserLike | null | undefined): boolean {
  return currentUser?.role === 'ADMIN' && currentUser.adminLevel === 'MASTER'
}

/** 관리자 상세에서 관리자 회원 정보 수정 가능 조건 (마스터 + 관리자 등록 회원) */
export function canEditAdminMemberInfo(
  currentUser: CurrentUserLike | null | undefined,
  targetUser: AdminMemberEditTargetLike
): boolean {
  if (targetUser.role !== 'ADMIN') return false
  if (!canAccessAdminCommentInAdminDetail(currentUser)) return false
  return shouldShowCmsMemberInfoEditButton(targetUser)
}

/** 소속 교사 중 CMS 회원과 연동된 행이 하나라도 있으면 true (해당 학교명으로 가입·연동된 교사) */
export function schoolHasAffiliatedTeacherLinkedAccount(user: SchoolUserLike): boolean {
  if (user.role !== 'SCHOOL') return false
  return Boolean(
    user.schoolInfo?.affiliatedTeachers?.some(t => Boolean(t.linkedUserId && String(t.linkedUserId).trim()))
  )
}

/**
 * 학교 기본 정보 타이틀 우측「관리자에 의해 등록된 학교입니다」
 * — 관리자 등록 학교이면서 본인 가입 완료 전이고, 연동된 교사 회원이 없을 때만
 */
export function shouldShowAdminRegisteredSchoolTitleNotice(user: SchoolUserLike): boolean {
  if (user.role !== 'SCHOOL') return false
  if (!user.registeredByAdmin || user.identitySelfSignupCompletedAfterAdminRegistration) return false
  if (schoolHasAffiliatedTeacherLinkedAccount(user)) return false
  return true
}

/** 전략이 내려준 caption과 관리자 등록 안내 문구를 합친다. */
export function resolveUserDetailBasicTabCaption(
  user: UserLike,
  strategyCaption: string | undefined
): string | undefined {
  const parts: string[] = []
  const base = strategyCaption?.trim()
  if (base) parts.push(base)
  if (shouldShowAdminRegisteredMemberDetailCaption(user)) {
    parts.push(ADMIN_REGISTERED_MEMBER_DETAIL_CAPTION)
  }
  if (parts.length === 0) return undefined
  return parts.join(' ')
}
