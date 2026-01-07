/**
 * 권한별 메뉴 구성 설정
 * Phase 4.2.1: 권한별 메뉴 구성
 */

import type { UserRole } from '@/types/user'
import type { MenuProps } from 'antd'
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  ShopOutlined,
  DollarOutlined,
  HistoryOutlined,
  UserSwitchOutlined,
  BarChartOutlined,
} from '@ant-design/icons'

/**
 * 메뉴 아이템 타입 정의
 */
export interface MenuItemConfig {
  key: string
  label: string
  icon?: React.ReactNode
  children?: MenuItemConfig[]
  // 권한별 접근 제어
  allowedRoles?: UserRole[] // 허용된 권한 목록 (없으면 모든 권한 허용)
  hidden?: boolean // 숨김 여부
}

/**
 * 전체 메뉴 아이템 정의
 */
const allMenuItems: MenuItemConfig[] = [
  {
    key: '/',
    label: '대시보드',
    icon: <DashboardOutlined />,
    // 모든 권한 접근 가능
  },
  {
    key: 'programs-group',
    label: '프로그램',
    icon: <BookOutlined />,
    // 모든 권한 접근 가능
    children: [
      {
        key: '/programs',
        label: '프로그램 목록',
        // 모든 권한 접근 가능
      },
      {
        key: '/programs/my',
        label: '본인 프로그램',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'], // 강사, 봉사자만 접근 가능
      },
      {
        key: '/programs/favorites',
        label: '관심 프로그램',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'], // 강사, 봉사자만 접근 가능
      },
    ],
  },
  {
    key: '/education-records',
    label: '교육실적 관리',
    icon: <BarChartOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/education-records-v2',
    label: '교육실적 관리 (v2)',
    icon: <BarChartOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/applications',
    label: '신청 관리',
    icon: <FileTextOutlined />,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'VOLUNTEER', 'STUDENT'], // 관리자 + 교육 주체 공통 접근
  },
  {
    key: '/application-paths',
    label: '신청 경로 관리',
    icon: <FileTextOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: 'schedules-group',
    label: '일정 관리',
    icon: <CalendarOutlined />,
    // 모든 권한 접근 가능
    children: [
      {
        key: '/schedules',
        label: '일정 캘린더',
        // 모든 권한 접근 가능
      },
      {
        key: '/schedules/my',
        label: '본인 일정 목록',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT'], // 강사, 봉사자, 수강자 접근 가능
      },
      {
        key: '/schedules/my/calendar',
        label: '본인 일정 캘린더',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT'], // 강사, 봉사자, 수강자 접근 가능
      },
    ],
  },
  {
    key: '/matchings',
    label: '매칭 관리',
    icon: <TeamOutlined />,
    allowedRoles: ['ADMIN', 'INSTRUCTOR'], // 관리자, 강사만 접근 가능
  },
  {
    key: '/instructors',
    label: '강사 관리',
    icon: <UserOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/users',
    label: '사용자 관리',
    icon: <TeamOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/schools',
    label: '학교 관리',
    icon: <BankOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/sponsors',
    label: '스폰서 관리',
    icon: <ShopOutlined />,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
      {
        key: 'settlements-group',
        label: '정산 관리',
        icon: <DollarOutlined />,
        allowedRoles: ['ADMIN', 'INSTRUCTOR'], // 관리자, 강사만 접근 가능
        children: [
          {
            key: '/settlements',
            label: '정산 목록',
            allowedRoles: ['ADMIN'], // 관리자만 접근 가능 (전체 정산 목록)
          },
          {
            key: '/settlements/my',
            label: '본인 정산',
            allowedRoles: ['INSTRUCTOR'], // 강사만 접근 가능
          },
          {
            key: '/settlements/my/monthly',
            label: '월별 정산 관리',
            allowedRoles: ['INSTRUCTOR'], // 강사만 접근 가능
          },
          {
            key: '/settlements/monthly',
            label: '월별 정산 관리',
            allowedRoles: ['ADMIN'], // 관리자만 접근 가능
          },
          {
            key: '/settlements/calculation-settings',
            label: '산출 로직 설정',
            allowedRoles: ['ADMIN'], // 관리자만 접근 가능
          },
        ],
      },
  {
    key: 'interviews-group',
    label: '면접 관리',
    icon: <TeamOutlined />,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'VOLUNTEER'], // 관리자, 강사, 봉사자 접근 가능
    children: [
      {
        key: '/interviews',
        label: '면접 관리',
        allowedRoles: ['ADMIN'], // 관리자만 접근 가능
      },
      {
        key: '/interviews/apply',
        label: '강사/봉사자 신청',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'], // 강사, 봉사자만 접근 가능
      },
      {
        key: '/interviews/my',
        label: '내 면접 일정',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'], // 강사, 봉사자만 접근 가능
      },
    ],
  },
  {
    key: '/reports',
    label: '보고서',
    icon: <FileTextOutlined />,
    allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'], // 강사, 봉사자만 접근 가능
    children: [
      {
        key: '/reports/new',
        label: '보고서 작성',
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'],
      },
    ],
  },
  {
    key: '/mypage',
    label: '마이페이지',
    icon: <UserSwitchOutlined />,
    // 모든 권한 접근 가능
  },
  {
    key: '/histories',
    label: '이력 목록',
    icon: <HistoryOutlined />,
    // 모든 권한 접근 가능
  },
]

/**
 * 권한별 메뉴 필터링
 * @param userRole 사용자 권한
 * @param items 메뉴 아이템 목록
 * @returns 필터링된 메뉴 아이템 목록
 */
export function filterMenuByRole(
  userRole: UserRole | null,
  items: MenuItemConfig[] = allMenuItems
): MenuProps['items'] {
  if (!userRole) {
    // 로그인하지 않은 경우 빈 메뉴 반환
    return []
  }

  return items
    .filter(item => {
      // allowedRoles가 없으면 모든 권한 허용
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true
      }
      // allowedRoles에 사용자 권한이 포함되어 있는지 확인
      return item.allowedRoles.includes(userRole)
    })
    .map(item => {
      const menuItem: any = {
        key: item.key,
        label: item.label,
        icon: item.icon,
      }

      // 자식 메뉴가 있는 경우 재귀적으로 필터링
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByRole(userRole, item.children)
        if (filteredChildren && filteredChildren.length > 0) {
          menuItem.children = filteredChildren
        } else {
          // 자식 메뉴가 모두 필터링된 경우 부모 메뉴도 제거
          return null
        }
      }

      return menuItem
    })
    .filter(item => item !== null)
}

/**
 * 사용자 권한에 따라 필터링된 메뉴 아이템 반환
 * @param userRole 사용자 권한
 * @returns 필터링된 메뉴 아이템 목록
 */
export function getMenuItemsByRole(userRole: UserRole | null): MenuProps['items'] {
  return filterMenuByRole(userRole, allMenuItems)
}

/**
 * 특정 경로에 대한 접근 권한 확인
 * @param path 경로
 * @param userRole 사용자 권한
 * @returns 접근 가능 여부
 */
export function canAccessPath(path: string, userRole: UserRole | null): boolean {
  if (!userRole) {
    return false
  }

  // 메뉴 아이템에서 경로 찾기
  const findMenuItem = (items: MenuItemConfig[], targetPath: string): MenuItemConfig | null => {
    for (const item of items) {
      if (item.key === targetPath) {
        return item
      }
      if (item.children) {
        const found = findMenuItem(item.children, targetPath)
        if (found) return found
      }
    }
    return null
  }

  const menuItem = findMenuItem(allMenuItems, path)
  if (!menuItem) {
    // 메뉴에 없는 경로는 기본적으로 접근 가능 (기타 페이지)
    return true
  }

  // allowedRoles가 없으면 모든 권한 허용
  if (!menuItem.allowedRoles || menuItem.allowedRoles.length === 0) {
    return true
  }

  // allowedRoles에 사용자 권한이 포함되어 있는지 확인
  return menuItem.allowedRoles.includes(userRole)
}

