import type { User } from '@/types/user'

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

/**
 * 목록 행을 remote 상세로 덮어쓸 때 SCHOOL·schoolInfo 등 목록 전용 필드를 보존한다.
 * 상세 API가 roles 누락 시 INDIVIDUAL로 떨어지면 「학교 상세」가 「회원 상세」로 보이는 문제를 막는다.
 */
export function mergeListUserWithFetchedDetail(
  listUser: Omit<User, 'password'>,
  fetched: Omit<User, 'password'>
): Omit<User, 'password'> {
  const role =
    fetched.role === 'INDIVIDUAL' && listUser.role !== 'INDIVIDUAL'
      ? listUser.role
      : fetched.role

  const schoolInfo =
    role === 'SCHOOL' ? (fetched.schoolInfo ?? listUser.schoolInfo) : undefined

  return {
    ...listUser,
    ...fetched,
    id: listUser.id,
    memberId: fetched.memberId ?? listUser.memberId,
    role,
    schoolInfo,
    instructorMemberProfile:
      fetched.instructorMemberProfile ?? listUser.instructorMemberProfile,
    affiliatedSchoolUserId:
      fetched.affiliatedSchoolUserId ?? listUser.affiliatedSchoolUserId,
    affiliatedSchoolName: fetched.affiliatedSchoolName ?? listUser.affiliatedSchoolName,
    listMetrics: {
      ...listUser.listMetrics,
      ...fetched.listMetrics,
    },
    name: resolveMergedDisplayName(listUser, fetched, role),
  }
}
