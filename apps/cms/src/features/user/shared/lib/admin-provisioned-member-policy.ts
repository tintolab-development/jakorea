import type { User } from '@/types/user'

/** 회원 상세 기본 정보 `DetailInfoForm` description에 붙는 문구 (별표 포함) */
export const ADMIN_REGISTERED_MEMBER_DETAIL_CAPTION = '*관리자에 의해 등록된 회원입니다'

/** 학교(기관) 상세 기본 정보 `DetailInfoForm` description에 붙는 문구 (별표 포함) */
export const ADMIN_REGISTERED_SCHOOL_DETAIL_CAPTION = '*관리자에 의해 등록된 학교입니다'

type UserLike = Pick<User, 'registeredByAdmin' | 'identitySelfSignupCompletedAfterAdminRegistration'>
type PermissionApprovalUserLike = Pick<User, 'permissionApprovalStatus' | 'role'>
type CurrentUserLike = Pick<User, 'role' | 'adminLevel'>
type AdminMemberEditTargetLike = UserLike & Pick<User, 'role'>

type SchoolUserLike = UserLike &
  Pick<User, 'role' | 'schoolInfo'> & {
    schoolInfo?: { affiliatedTeachers?: { linkedUserId?: string }[] }
  }

/**
 * 회원 등록 유형 — CMS에서 「관리자 등록」으로 보아 기본정보(읽기전용 제외)를 수정할 수 있는지.
 * - 관리자가 생성 후 사용자가 직접 가입(본인 인증 등)을 완료하면 **직접 등록**과 동일하게 취급 (`false`).
 */
export function shouldShowCmsMemberInfoEditButton(user: UserLike): boolean {
  return Boolean(user.registeredByAdmin && !user.identitySelfSignupCompletedAfterAdminRegistration)
}

/** 직접 등록으로 취급되는지: 처음부터 직접 가입이거나, 관리자 등록 후 본인 직접 가입을 마친 경우 */
export function isSelfRegisteredMemberForCmsBasicInfo(user: UserLike): boolean {
  return !shouldShowCmsMemberInfoEditButton(user)
}

/**
 * 기본 정보 `DetailInfoForm` description에 붙는「관리자에 의해 등록」안내.
 * 관리자 등록 후 본인이 직접 가입(추가) 절차를 마친 경우에는 비노출.
 */
export function shouldShowAdminRegisteredMemberDetailCaption(user: UserLike): boolean {
  return Boolean(user.registeredByAdmin && !user.identitySelfSignupCompletedAfterAdminRegistration)
}

/** CMS에 로그인한 운영 관리자(관리자 계정) 여부 — `AdminLevel` 무관 */
export function isCmsAdminUser(currentUser: CurrentUserLike | null | undefined): boolean {
  return currentUser?.role === 'ADMIN'
}

/**
 * 대상 회원만 볼 때 — 권한 승인이 **승인 완료(APPROVED)** 인지.
 * (`shouldShowAdminCommentSectionForViewer`에서 비관리자 로그인 주체용 방어 분기에 사용)
 */
export function shouldShowAdminCommentSection(user: PermissionApprovalUserLike): boolean {
  return user.permissionApprovalStatus === 'APPROVED'
}

/**
 * 회원 상세 기본 탭 — [관리자 코멘트] 블록 노출.
 * CMS에 **관리자(`role === 'ADMIN'`)** 로 로그인한 경우 대상의 권한 승인 현황과 관계없이 항상 노출한다(열람 전용·편집 가능 여부는 별도).
 * 그 외 로그인 주체에는 `shouldShowAdminCommentSection`과 동일하게 APPROVED일 때만 노출한다.
 */
export function shouldShowAdminCommentSectionForViewer(
  currentUser: CurrentUserLike | null | undefined,
  targetUser: PermissionApprovalUserLike
): boolean {
  return isCmsAdminUser(currentUser) || shouldShowAdminCommentSection(targetUser)
}

/** 마스터 관리자 여부 */
export function isMasterAdminUser(currentUser: CurrentUserLike | null | undefined): boolean {
  return currentUser?.role === 'ADMIN' && currentUser.adminLevel === 'MASTER'
}

/**
 * 관리자 회원(`role === 'ADMIN'`) 상세에서 [관리자 코멘트]·권한 유형 등
 * **모든 CMS 관리자**가 접근·수정할 수 있는 범위의 게이트.
 * (성명·연락처 등 그 외 기본정보는 `canEditAdminMemberInfo`.)
 */
export function canAccessAdminCommentInAdminDetail(currentUser: CurrentUserLike | null | undefined): boolean {
  return isCmsAdminUser(currentUser)
}

/**
 * 관리자 회원 상세 — 성명·연락처·이메일 등 **기본정보 일괄 수정**.
 * **마스터 관리자**이면서 대상이 **관리자 등록** 회원일 때만 true.
 */
export function canEditAdminMemberInfo(
  currentUser: CurrentUserLike | null | undefined,
  targetUser: AdminMemberEditTargetLike
): boolean {
  if (targetUser.role !== 'ADMIN') return false
  if (!isMasterAdminUser(currentUser)) return false
  return shouldShowCmsMemberInfoEditButton(targetUser)
}

/**
 * 관리자 회원(`role === 'ADMIN'`) 상세 — [정보 수정] 진입.
 * 관리자 등록 회원이면 CMS 관리자 전원 노출(마스터는 전체 기본정보, 그 외는 코멘트·권한 유형만).
 */
export function canStartAdminMemberProfileEdit(
  currentUser: CurrentUserLike | null | undefined,
  targetUser: AdminMemberEditTargetLike
): boolean {
  if (targetUser.role !== 'ADMIN') return false
  if (!shouldShowCmsMemberInfoEditButton(targetUser)) return false
  return canAccessAdminCommentInAdminDetail(currentUser)
}

/** 소속 교사 중 CMS 회원과 연동된 행이 하나라도 있으면 true (해당 학교명으로 가입·연동된 교사) */
export function schoolHasAffiliatedTeacherLinkedAccount(user: SchoolUserLike): boolean {
  if (user.role !== 'SCHOOL') return false
  return Boolean(
    user.schoolInfo?.affiliatedTeachers?.some(t => Boolean(t.linkedUserId && String(t.linkedUserId).trim()))
  )
}

/**
 * 기본 정보 `DetailInfoForm` description「관리자에 의해 등록된 학교입니다」
 * — 관리자 등록 학교이면서 본인 가입 완료 전이고, 연동된 교사 회원이 없을 때만
 */
export function shouldShowAdminRegisteredSchoolDetailCaption(user: SchoolUserLike): boolean {
  if (user.role !== 'SCHOOL') return false
  if (!user.registeredByAdmin || user.identitySelfSignupCompletedAfterAdminRegistration) return false
  if (schoolHasAffiliatedTeacherLinkedAccount(user)) return false
  return true
}

type UserDetailBasicTabCaptionUser = UserLike & Pick<User, 'role' | 'schoolInfo'>

/** 전략이 내려준 caption과 관리자 등록 안내 문구를 합친다. */
export function resolveUserDetailBasicTabCaption(
  user: UserDetailBasicTabCaptionUser,
  strategyCaption: string | undefined
): string | undefined {
  const parts: string[] = []
  const base = strategyCaption?.trim()
  if (base) parts.push(base)
  if (shouldShowAdminRegisteredSchoolDetailCaption(user)) {
    parts.push(ADMIN_REGISTERED_SCHOOL_DETAIL_CAPTION)
  } else if (shouldShowAdminRegisteredMemberDetailCaption(user)) {
    parts.push(ADMIN_REGISTERED_MEMBER_DETAIL_CAPTION)
  }
  if (parts.length === 0) return undefined
  return parts.join(' ')
}
