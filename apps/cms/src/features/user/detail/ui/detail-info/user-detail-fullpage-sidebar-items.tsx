import { BulbOutlined, WalletOutlined } from '@ant-design/icons'
import type {
  DetailModalSidebarNavChild,
  DetailModalSidebarNavItem,
} from '@/shared/ui/detail-modal-sidebar'
import type { ReactNode } from 'react'
import type { User, UserRole } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { instructorDetailShowsPaymentStatusLnb } from '../../lib/user-detail-fullpage-helpers'
import { UserProgramsHistoryLnbIcon } from '../user-programs-history-lnb-icon'

const LNB_ICONS = {
  detail: <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
  programs: <UserProgramsHistoryLnbIcon />,
  payment: <WalletOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
} as const

type SidebarUser =
  | Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
  | undefined

type ChildItem = DetailModalSidebarNavChild

const PROGRAM_SIDEBAR_CHILD_LABELS = {
  enrollmentIndividual: '프로그램 수강 이력',
  enrollmentGroup: '프로그램 수강 이력',
  lecture: '프로그램 강의 이력',
  volunteer: '봉사 프로그램 참여 이력',
} as const

function createProgramChildren(
  type: 'INDIVIDUAL' | 'INSTRUCTOR' | 'DUAL' | 'SCHOOL_TEACHER'
): ChildItem[] {
  const L = PROGRAM_SIDEBAR_CHILD_LABELS

  if (type === 'INDIVIDUAL') {
    return [
      { key: 'enrollment', label: L.enrollmentIndividual },
      { key: 'volunteer', label: L.volunteer },
    ]
  }

  if (type === 'SCHOOL_TEACHER') {
    return [
      { key: 'enrollment', label: L.enrollmentIndividual },
      { key: 'volunteer', label: L.volunteer },
    ]
  }

  if (type === 'INSTRUCTOR') {
    return [
      { key: 'enrollment', label: L.enrollmentIndividual },
      { key: 'lecture', label: L.lecture },
      { key: 'volunteer', label: L.volunteer },
    ]
  }

  return [
    { key: 'enrollment', label: L.enrollmentGroup },
    { key: 'lecture', label: L.lecture },
    { key: 'volunteer', label: L.volunteer },
  ]
}

type BuildSidebarProgramsItemStrategy = (
  user: SidebarUser,
  programsLabel: string,
  programsIcon: ReactNode
) => DetailModalSidebarNavItem

function buildIndividualProgramsItem(
  _user: SidebarUser,
  programsLabel: string,
  programsIcon: ReactNode
): DetailModalSidebarNavItem {
  return {
    key: 'history',
    label: programsLabel,
    icon: programsIcon,
    children: createProgramChildren('INDIVIDUAL'),
  }
}

function buildInstructorProgramsItem(
  user: SidebarUser,
  programsLabel: string,
  programsIcon: ReactNode
): DetailModalSidebarNavItem {
  const instructorProfile = user ? resolveInstructorMemberProfile(user) : null

  if (instructorProfile === 'instructor_only') {
    return {
      key: 'history',
      label: programsLabel,
      icon: programsIcon,
      children: createProgramChildren('INSTRUCTOR'),
    }
  }

  if (instructorProfile === 'school_teacher') {
    return {
      key: 'history',
      label: programsLabel,
      icon: programsIcon,
      children: createProgramChildren('SCHOOL_TEACHER'),
    }
  }

  if (instructorProfile === 'instructor_dual') {
    return {
      key: 'history',
      label: programsLabel,
      icon: programsIcon,
      children: createProgramChildren('DUAL'),
    }
  }

  return {
    key: 'history',
    label: programsLabel,
    icon: programsIcon,
  }
}

function buildDefaultProgramsItem(
  _user: SidebarUser,
  programsLabel: string,
  programsIcon: ReactNode
): DetailModalSidebarNavItem {
  return {
    key: 'history',
    label: programsLabel,
    icon: programsIcon,
  }
}

/** 학교 상세: LNB 1뎁스 «프로젝트 수강 이력» */
function buildSchoolProgramsItem(
  _user: SidebarUser,
  _programsLabel: string,
  programsIcon: ReactNode
): DetailModalSidebarNavItem {
  return {
    key: 'history',
    label: '프로젝트 수강 이력',
    icon: programsIcon,
  }
}

const sidebarStrategyMap: Record<UserRole, BuildSidebarProgramsItemStrategy> = {
  INDIVIDUAL: buildIndividualProgramsItem,
  INSTRUCTOR: buildInstructorProgramsItem,
  SCHOOL: buildSchoolProgramsItem,
  ADMIN: buildDefaultProgramsItem,
}

function getSidebarUserRole(user: SidebarUser): UserRole | undefined {
  return user?.role
}

function buildProgramsItem(
  user: SidebarUser,
  role: UserRole | undefined
): DetailModalSidebarNavItem {
  let programsLabel = '프로그램 참여 이력'
  if (role === 'INDIVIDUAL' || role === 'INSTRUCTOR') {
    programsLabel = '프로젝트 참여 이력'
  } else if (role === 'ADMIN') {
    programsLabel = '프로그램 담당 이력'
  }
  const programsIcon = LNB_ICONS.programs

  if (!role) {
    return buildDefaultProgramsItem(user, programsLabel, programsIcon)
  }

  const strategy = sidebarStrategyMap[role]
  return strategy(user, programsLabel, programsIcon)
}

function getDetailInfoLabel(user: SidebarUser): string {
  const role = user?.role
  const instructorProfile =
    user && role === 'INSTRUCTOR' ? resolveInstructorMemberProfile(user) : null

  if (role === 'ADMIN') {
    return '관리자 상세 정보'
  }

  if (role === 'INSTRUCTOR' && instructorProfile === 'instructor_only') {
    return '강사 상세 정보'
  }

  if (
    role === 'INSTRUCTOR' &&
    (instructorProfile === 'school_teacher' || instructorProfile === 'instructor_dual')
  ) {
    return '교사 상세 정보'
  }

  if (role === 'SCHOOL') {
    return '학교 상세 정보'
  }

  return '회원 상세 정보'
}

function buildDetailInfoNavItem(label: string): DetailModalSidebarNavItem {
  return {
    key: 'detail-info',
    label,
    icon: LNB_ICONS.detail,
  }
}

function buildPermissionModeSidebarItems(): DetailModalSidebarNavItem[] {
  return [buildDetailInfoNavItem('신청 정보')]
}

const PAYMENT_STATUS_SIDEBAR_ITEM: DetailModalSidebarNavItem = {
  key: 'payment-status',
  label: '정산 현황',
  icon: LNB_ICONS.payment,
}

export function buildUserDetailSidebarItems(
  user: SidebarUser,
  mode: 'default' | 'permission'
): DetailModalSidebarNavItem[] {
  if (mode === 'permission') {
    return buildPermissionModeSidebarItems()
  }

  const role = getSidebarUserRole(user)
  const programsItem = buildProgramsItem(user, role)
  const detailInfoLabel = getDetailInfoLabel(user)

  const items: DetailModalSidebarNavItem[] = [buildDetailInfoNavItem(detailInfoLabel), programsItem]

  if (user && instructorDetailShowsPaymentStatusLnb(user)) {
    items.push(PAYMENT_STATUS_SIDEBAR_ITEM)
  }

  return items
}
