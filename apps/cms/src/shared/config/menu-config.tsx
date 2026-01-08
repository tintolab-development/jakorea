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
  ShopOutlined,
  HistoryOutlined,
  UserSwitchOutlined,
  BarChartOutlined,
  HeartOutlined,
  FileOutlined,
  EditOutlined,
  DatabaseOutlined,
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
  enabled?: boolean // 활성화/비활성화 여부 (기본값: true)
}

/**
 * 전체 메뉴 아이템 정의
 * IA 순서에 맞게 정리됨
 */
const allMenuItems: MenuItemConfig[] = [
  // 1. 홈 (Home)
  {
    key: '/',
    label: '홈',
    icon: <DashboardOutlined />,
    enabled: true,
    // 모든 권한 접근 가능
  },
  // 2. 프로그램 관리 (Program Management)
  {
    key: '/programs',
    label: '프로그램 관리',
    icon: <BookOutlined />,
    enabled: true,
    // 모든 권한 접근 가능
  },
  // 3. 회원 관리 (Member Management)
  {
    key: 'members-group',
    label: '회원 관리',
    icon: <TeamOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
    children: [
      {
        key: '/users',
        label: '전체 회원',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/schools',
        label: '학교(교사)',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  // 4. 강사단 관리 (Instructor Management)
  {
    key: 'instructors-group',
    label: '강사단 관리',
    icon: <UserOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
    children: [
      {
        key: '/instructors',
        label: '강사진',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: 'settlements-group',
        label: '정산',
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          {
            key: '/settlements',
            label: '정산 목록',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/settlements/monthly',
            label: '월별 정산 관리',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/settlements/calculation-settings',
            label: '산출 로직 설정',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
        ],
      },
    ],
  },
  // 5. 봉사단 관리 (Volunteer Management)
  {
    key: 'volunteers-group',
    label: '봉사단 관리',
    icon: <HeartOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
    children: [
      {
        key: '/volunteers',
        label: '봉사자',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/volunteers/programs',
        label: '봉사 프로그램',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  // 6. 템플릿 관리 (Template Management)
  {
    key: 'templates-group',
    label: '템플릿 관리',
    icon: <FileOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
    children: [
      {
        key: '/templates/files',
        label: '파일 양식',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/templates/sms',
        label: '문자 양식',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/templates/email',
        label: '메일 양식',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  // 7. 게시글 관리 (Post Management)
  {
    key: 'posts-group',
    label: '게시글 관리',
    icon: <EditOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
    children: [
      {
        key: '/posts/categories',
        label: '카테고리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/posts/notices',
        label: '공지사항',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/posts/faq',
        label: 'FAQ',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/posts/inquiries',
        label: '문의하기',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  // 8. 후원사 관리 (Sponsor Management)
  {
    key: '/sponsors',
    label: '후원사 관리',
    icon: <ShopOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  // 9. 실적 통계 (Performance Statistics)
  {
    key: '/education-records',
    label: '실적 통계',
    icon: <BarChartOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/education-records-v2',
    label: '실적 통계 (v2)',
    icon: <BarChartOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  {
    key: '/performance',
    label: '실적 통계',
    icon: <BarChartOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  // 10. 로그 관리 (Log Management)
  {
    key: '/logs',
    label: '로그 관리',
    icon: <DatabaseOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'], // 관리자만 접근 가능
  },
  // 기타 메뉴 (IA에 없는 메뉴들 - 비활성화)
  {
    key: '/applications',
    label: '신청 관리',
    icon: <FileTextOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'VOLUNTEER', 'STUDENT'],
  },
  {
    key: '/application-paths',
    label: '신청 경로 관리',
    icon: <FileTextOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['ADMIN'],
  },
  {
    key: 'schedules-group',
    label: '일정 관리',
    icon: <CalendarOutlined />,
    enabled: false, // 비활성화
    children: [
      {
        key: '/schedules',
        label: '일정 캘린더',
        enabled: false,
      },
      {
        key: '/schedules/my',
        label: '본인 일정 목록',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT'],
      },
      {
        key: '/schedules/my/calendar',
        label: '본인 일정 캘린더',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT'],
      },
      {
        key: '/schedule-negotiations',
        label: '일정 협의 관리',
        enabled: false,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: '/matchings',
    label: '매칭 관리',
    icon: <TeamOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['ADMIN', 'INSTRUCTOR'],
  },
  {
    key: 'interviews-group',
    label: '면접 관리',
    icon: <TeamOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'VOLUNTEER'],
    children: [
      {
        key: '/interviews',
        label: '면접 관리',
        enabled: false,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/interviews/apply',
        label: '강사/봉사자 신청',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'],
      },
      {
        key: '/interviews/my',
        label: '내 면접 일정',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'],
      },
    ],
  },
  {
    key: '/reports',
    label: '보고서',
    icon: <FileTextOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'VOLUNTEER'],
    children: [
      {
        key: '/reports',
        label: '보고서 관리',
        enabled: false,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/reports/new',
        label: '보고서 작성',
        enabled: false,
        allowedRoles: ['INSTRUCTOR', 'VOLUNTEER'],
      },
    ],
  },
  {
    key: '/mypage',
    label: '마이페이지',
    icon: <UserSwitchOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT'],
  },
  {
    key: '/histories',
    label: '이력 목록',
    icon: <HistoryOutlined />,
    enabled: false, // 비활성화
    allowedRoles: ['INSTRUCTOR', 'VOLUNTEER', 'STUDENT'],
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
      // 비활성화된 메뉴는 제외
      if (item.enabled === false) {
        return false
      }
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

  // 수강자는 정산 관련 경로 접근 불가 (Phase 6.1.3)
  if (userRole === 'STUDENT' && path.startsWith('/settlements')) {
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

