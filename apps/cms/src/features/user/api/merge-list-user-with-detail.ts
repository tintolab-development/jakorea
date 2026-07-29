import type { User } from '@/types/user'
import {
  isInstructorMaskedPlaceholder,
  looksLikeInstructorActivityEnumCode,
} from '@/features/user/api/map-instructor-activity-display'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'

function resolveMergedDisplayName(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>,
  role: User['role']
): string {
  if (role === 'SCHOOL') {
    const schoolName = (fetched.schoolInfo ?? listUser.schoolInfo)?.schoolName?.trim()
    if (schoolName) return schoolName
  }

  const listName = listUser.name?.trim()
  const fetchedName = fetched.name?.trim()
  if (!listName) return fetchedName || '-'
  if (!fetchedName) return listName

  if (role === 'INSTRUCTOR') {
    const schoolLabel =
      listUser.affiliatedSchoolName?.trim() ||
      fetched.affiliatedSchoolName?.trim() ||
      listUser.schoolInfo?.schoolName?.trim() ||
      fetched.schoolInfo?.schoolName?.trim()
    if (schoolLabel && fetchedName === schoolLabel) {
      return listName
    }
  }

  return fetchedName || listName
}

function resolveMergedAffiliation(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedAffiliation = fetched.affiliation?.trim()
  const listAffiliation = listUser.affiliation?.trim()
  if (fetchedAffiliation && !looksLikeInstructorActivityEnumCode(fetchedAffiliation)) {
    return fetchedAffiliation
  }
  if (listAffiliation) return listAffiliation
  return fetchedAffiliation || undefined
}

function resolveMergedBio(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedBio = fetched.bio?.trim()
  const listBio = listUser.bio?.trim()
  if (fetchedBio && !isInstructorMaskedPlaceholder(fetchedBio)) return fetchedBio
  if (listBio && !isInstructorMaskedPlaceholder(listBio)) return listBio
  return fetchedBio || listBio || undefined
}

/** 자택 주소 — `"마스킹"` 제외, unmask 등 더 긴(원문에 가까운) 쪽 우선 */
function resolveMergedDetailAddress(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): string | undefined {
  const fetchedAddr = fetched.detailAddress?.trim()
  const listAddr = listUser.detailAddress?.trim()
  const fetchedOk =
    fetchedAddr && !isInstructorMaskedPlaceholder(fetchedAddr) ? fetchedAddr : undefined
  const listOk = listAddr && !isInstructorMaskedPlaceholder(listAddr) ? listAddr : undefined
  if (fetchedOk && listOk) {
    return fetchedOk.length >= listOk.length ? fetchedOk : listOk
  }
  return fetchedOk || listOk || undefined
}

/**
 * 목록 행을 remote 상세로 덮어쓸 때 SCHOOL·schoolInfo 등 목록 전용 필드를 보존한다.
 * 상세 API가 roles 누락 시 INDIVIDUAL로 떨어지면 「학교 상세」가 「회원 상세」로 보이는 문제를 막는다.
 */
function resolveMergedInstructorInfo(
  listInfo: User['instructorInfo'] | undefined,
  fetchedInfo: User['instructorInfo'] | undefined
): User['instructorInfo'] | undefined {
  if (!listInfo && !fetchedInfo) return undefined
  if (!fetchedInfo) return listInfo
  if (!listInfo) return fetchedInfo

  const fetchedHasBank =
    Boolean(fetchedInfo.bankName?.trim()) ||
    Boolean(fetchedInfo.accountNumber?.trim()) ||
    Boolean(fetchedInfo.accountHolder?.trim())

  return {
    ...listInfo,
    ...fetchedInfo,
    bankName: fetchedHasBank
      ? fetchedInfo.bankName || listInfo.bankName
      : listInfo.bankName || fetchedInfo.bankName,
    accountNumber: fetchedHasBank
      ? fetchedInfo.accountNumber || listInfo.accountNumber
      : listInfo.accountNumber || fetchedInfo.accountNumber,
    accountHolder: fetchedHasBank
      ? fetchedInfo.accountHolder || listInfo.accountHolder
      : listInfo.accountHolder || fetchedInfo.accountHolder,
    isBusinessIncome: fetchedInfo.isBusinessIncome ?? listInfo.isBusinessIncome,
  }
}

export function mergeListUserWithFetchedDetail(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): Omit<User, 'password'> {
  const fetchedRevoked = isInstructorPermissionRevoked(fetched)
  const listRevoked = isInstructorPermissionRevoked(listUser)
  const role =
    fetchedRevoked || listRevoked
      ? fetched.role
      : fetched.role === 'INDIVIDUAL' && listUser.role !== 'INDIVIDUAL'
        ? listUser.role
        : fetched.role

  const schoolInfo =
    role === 'SCHOOL' ? (fetched.schoolInfo ?? listUser.schoolInfo) : undefined

  const listMetrics = {
    ...listUser.listMetrics,
    ...omitUndefinedMetrics(fetched.listMetrics),
  }

  return {
    ...listUser,
    ...fetched,
    id: listUser.id,
    memberId: fetched.memberId ?? listUser.memberId,
    role,
    schoolInfo,
    instructorInfo: resolveMergedInstructorInfo(listUser.instructorInfo, fetched.instructorInfo),
    instructorMemberProfile:
      fetched.instructorMemberProfile ??
      (fetchedRevoked || listRevoked ? undefined : listUser.instructorMemberProfile),
    affiliatedSchoolUserId:
      fetched.affiliatedSchoolUserId ?? listUser.affiliatedSchoolUserId,
    affiliatedSchoolName: fetched.affiliatedSchoolName ?? listUser.affiliatedSchoolName,
    affiliation: resolveMergedAffiliation(listUser, fetched),
    detailAddress: resolveMergedDetailAddress(listUser, fetched),
    bio: resolveMergedBio(listUser, fetched),
    instructorApprovalStatus:
      fetched.instructorApprovalStatus ?? listUser.instructorApprovalStatus,
    listMetrics: Object.keys(listMetrics).length > 0 ? listMetrics : undefined,
    name: resolveMergedDisplayName(listUser, fetched, role),
  }
}

function omitUndefinedMetrics(
  metrics: User['listMetrics'] | undefined
): User['listMetrics'] | undefined {
  if (!metrics) return undefined
  const next: NonNullable<User['listMetrics']> = {}
  for (const [key, value] of Object.entries(metrics) as Array<
    [keyof NonNullable<User['listMetrics']>, unknown]
  >) {
    if (value === undefined || value === null) continue
    if (typeof value === 'string' && !value.trim()) continue
    ;(next as Record<string, unknown>)[key as string] = value
  }
  return Object.keys(next).length > 0 ? next : undefined
}
