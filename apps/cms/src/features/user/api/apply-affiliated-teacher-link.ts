import type { AffiliatedTeacherLinkTarget, User } from '@/types/user'

type UserWithoutPassword = Omit<User, 'password'>

function schoolLabelFromUser(user: UserWithoutPassword): string | undefined {
  return (
    user.affiliatedSchoolName?.trim() ||
    user.schoolInfo?.schoolName?.trim() ||
    undefined
  )
}

/** 소속 교사 목록 행 클릭 → 교사 상세 drill-down 시 API name 오류(기관명) 보정 */
export function applyAffiliatedTeacherLinkToUser(
  user: UserWithoutPassword,
  link: Pick<AffiliatedTeacherLinkTarget, 'name' | 'assignedGrade'>,
  schoolNameHint?: string
): UserWithoutPassword {
  const rowName = link.name?.trim()
  const schoolLabel = schoolNameHint?.trim() || schoolLabelFromUser(user)
  const apiName = user.name?.trim()

  let name = apiName || rowName || '-'
  if (rowName && (!apiName || (schoolLabel && apiName === schoolLabel))) {
    name = rowName
  }

  const assignedGrade = link.assignedGrade?.trim()

  return {
    ...user,
    name,
    ...(user.role === 'INSTRUCTOR' ? { schoolInfo: undefined } : {}),
    ...(assignedGrade
      ? {
          listMetrics: {
            ...user.listMetrics,
            instructorAssignedGrade: assignedGrade,
          },
        }
      : {}),
  }
}
