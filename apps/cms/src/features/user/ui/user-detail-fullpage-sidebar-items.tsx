import { AccountBookOutlined, BulbOutlined, FolderOpenOutlined } from '@ant-design/icons'
import type { DetailModalSidebarNavItem } from '@/shared/ui/detail-modal-sidebar'
import type { User } from '@/types/user'

export function buildUserDetailSidebarItems(
  role: User['role'] | undefined,
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

  const programsLabel = role === 'ADMIN' ? '담당 프로그램 이력' : '프로그램 참여 이력'
  const programsIcon = (
    <FolderOpenOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />
  )

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
      : role === 'INSTRUCTOR'
        ? {
            key: 'history',
            label: programsLabel,
            icon: programsIcon,
            children: [
              // TODO: 강사 상세 > 프로그램 수강 이력은 개발 완료 후 주석 해제 예정
              // { key: 'enrollment', label: '프로그램 수강 이력' },
              { key: 'lecture', label: '프로그램 강의 이력' },
              { key: 'volunteer', label: '봉사 프로그램 참여 이력' },
            ],
          }
        : {
            key: 'history',
            label: programsLabel,
            icon: programsIcon,
          }

  const items: DetailModalSidebarNavItem[] = [
    {
      key: 'detail-info',
      label:
        role === 'ADMIN'
          ? '관리자 상세 정보'
          : role === 'INSTRUCTOR'
            ? '강사 상세 정보'
            : role === 'SCHOOL'
              ? '학교 상세 정보'
              : '회원 상세 정보',
      icon: <BulbOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />,
    },
    programsItem,
  ]

  if (role === 'INSTRUCTOR') {
    items.push({
      key: 'payment-status',
      label: '정산 현황',
      icon: (
        <AccountBookOutlined className="detail-fullpage-modal__lnb-icon" style={{ fontSize: 20 }} />
      ),
    })
  }

  return items
}
