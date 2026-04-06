import { BulbOutlined, WalletOutlined } from '@ant-design/icons'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { instructorDetailShowsPaymentStatusLnb } from './user-detail-fullpage-helpers'
import { UserProgramsHistoryLnbIcon } from './user-programs-history-lnb-icon'

type SidebarUser =
  | Pick<User, 'role' | 'instructorMemberProfile' | 'affiliatedSchoolUserId'>
  | undefined

export function buildUserDetailSidebarItems(
  user: SidebarUser,
  mode: 'default' | 'permission'
): DetailModalSidebarNavItem[] {
  if (mode === 'permission') {
    return [
      {
        key: 'detail-info',
        label: '신청 정보',
        icon: <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
      },
    ]
  }

  const role = user?.role
  const programsLabel = role === 'ADMIN' ? '담당 프로그램 이력' : '프로그램 참여 이력'
  const programsIcon = <UserProgramsHistoryLnbIcon />

  const instructorProfile =
    user && role === 'INSTRUCTOR' ? resolveInstructorMemberProfile(user) : null

  const programsItem: DetailModalSidebarNavItem =
    role === 'INDIVIDUAL'
      ? {
          key: 'history',
          label: programsLabel,
          icon: programsIcon,
          children: [
            { key: 'enrollment', label: '프로그램 수강 이력' },
            { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
          ],
        }
      : role === 'INSTRUCTOR' && instructorProfile === 'school_teacher'
        ? {
            key: 'history',
            label: programsLabel,
            icon: programsIcon,
            children: [
              { key: 'enrollment', label: '프로그램 수강 이력' },
              { key: 'lecture', label: '프로그램 강의 이력' },
              { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
            ],
          }
        : {
            key: 'history',
            label: programsLabel,
            icon: programsIcon,
          }

  const detailInfoLabel =
    role === 'ADMIN'
      ? '관리자 상세 정보'
      : role === 'INSTRUCTOR' && instructorProfile === 'instructor_only'
        ? '강사 상세 정보'
        : role === 'INSTRUCTOR' &&
            (instructorProfile === 'school_teacher' || instructorProfile === 'instructor_dual')
          ? '교사 상세 정보'
          : role === 'SCHOOL'
            ? '프로그램 정보'
            : '회원 상세 정보'

  const items: DetailModalSidebarNavItem[] = [
    {
      key: 'detail-info',
      label: detailInfoLabel,
      icon: <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
    },
    programsItem,
  ]

  if (user && instructorDetailShowsPaymentStatusLnb(user)) {
    items.push({
      key: 'payment-status',
      label: '정산 현황',
      icon: <WalletOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
    })
  }

  return items
}
