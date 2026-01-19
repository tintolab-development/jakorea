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
  UserSwitchOutlined,
  BarChartOutlined,
  HeartOutlined,
  FileOutlined,
  EditOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  FileSearchOutlined,
} from '@ant-design/icons'

/**
 * 메뉴 아이템 타입 정의
 */
export interface MenuItemConfig {
  key: string
  label?: string // divider인 경우 label 생략
  icon?: React.ReactNode
  children?: MenuItemConfig[]
  type?: 'divider'
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
  // 사용자 영역
  { key: '/', label: '메인 홈', icon: <DashboardOutlined />, enabled: true },
  {
    key: 'programs-group',
    label: '진행 프로그램(수강)',
    icon: <BookOutlined />,
    enabled: true,
    children: [
      {
        key: '/programs',
        label: '프로그램 리스트',
        enabled: true,
      },
    ],
  },
  {
    key: 'volunteers-group',
    label: '봉사단',
    icon: <HeartOutlined />,
    enabled: true,
    allowedRoles: ['STUDENT'],
    children: [
      {
        key: '/interviews/apply',
        label: '봉사자 신청',
        enabled: true,
        allowedRoles: ['STUDENT'],
      },
      {
        key: 'volunteer-info-group',
        label: '봉사 정보',
        enabled: true,
        allowedRoles: ['STUDENT'],
        children: [
          {
            key: '/volunteers/my/schedules',
            label: '진행 상세정보',
            enabled: true,
            allowedRoles: ['STUDENT'],
          },
          {
            key: '/volunteers/education-plan',
            label: '교육 계획서 작성',
            enabled: true,
            allowedRoles: ['STUDENT'],
          },
        ],
      },
    ],
  },

  // 강사(INSTRUCTOR) 및 수강자(STUDENT) 마이페이지
  {
    key: 'mypage-group',
    label: '마이페이지',
    icon: <UserSwitchOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'STUDENT'],
    children: [
      {
        key: 'personal-info-group',
        label: '개인정보 관리',
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'STUDENT'],
        children: [
          {
            key: '/mypage/profile',
            label: '개인정보 관리',
            enabled: true,
            allowedRoles: ['INSTRUCTOR', 'STUDENT'],
          },
          {
            key: '/histories',
            label: '강사 이력 관리',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
        ],
      },
      {
        key: 'program-management-group',
        label: '프로그램 관리',
        enabled: true,
        allowedRoles: ['INSTRUCTOR', 'STUDENT'],
        children: [
          {
            key: '/volunteers/my/programs',
            label: '수강 프로그램',
            enabled: true,
            allowedRoles: ['STUDENT'],
          },
          {
            key: '/programs/my',
            label: '내가 신청한 프로그램',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
          {
            key: '/programs/my/active',
            label: '강의 프로그램',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
          {
            key: '/programs/favorites',
            label: '관심 프로그램 관리',
            enabled: true,
            allowedRoles: ['INSTRUCTOR', 'STUDENT'],
          },
          {
            key: '/programs/satisfaction',
            label: '만족도 조사',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
        ],
      },
      {
        key: 'volunteer-activity-mgmt',
        label: '봉사단 활동 관리',
        enabled: true,
        allowedRoles: ['STUDENT'],
        children: [
          {
            key: '/volunteers/my/schedules',
            label: '내 봉사 일정',
            enabled: true,
            allowedRoles: ['STUDENT'],
          },
          {
            key: '/volunteers/my/histories',
            label: '봉사단 참여 이력',
            enabled: true,
            allowedRoles: ['STUDENT'],
          },
        ],
      },
      {
        key: 'settlement-history-group',
        label: '정산 이력/현황 관리',
        enabled: true,
        allowedRoles: ['INSTRUCTOR'],
        children: [
          {
            key: '/settlements/my',
            label: '정산 이력/현황',
            enabled: true,
            allowedRoles: ['INSTRUCTOR'],
          },
        ],
      },
    ],
  },

  { key: 'divider-user', type: 'divider', enabled: true },

  {
    key: '/notices',
    label: '공지사항',
    icon: <InfoCircleOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'STUDENT'],
  },
  {
    key: '/notices/faq',
    label: 'FAQ',
    icon: <QuestionCircleOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'STUDENT'],
  },
  {
    key: '/notices/inquiries',
    label: '문의하기',
    icon: <FileSearchOutlined />,
    enabled: true,
    allowedRoles: ['INSTRUCTOR', 'STUDENT'],
  },

  // legacy support paths (호환/리다이렉트 용도 - 메뉴에는 노출하지 않음)
  { key: '/posts', enabled: false, allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { key: '/posts/faq', enabled: false, allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { key: '/posts/inquiries', enabled: false, allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { key: '/posts/categories', enabled: false, allowedRoles: ['ADMIN'] },
  { key: '/posts/notices', enabled: false, allowedRoles: ['ADMIN'] },
  { key: 'divider-admin', type: 'divider', enabled: true, allowedRoles: ['ADMIN'] },

  // 관리자 영역
  {
    key: 'members-group',
    label: '회원 관리',
    icon: <TeamOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/users', label: '전체 회원', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/schools', label: '학교(교사)', enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  {
    key: 'instructors-group',
    label: '강사단 관리',
    icon: <UserOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/instructors', label: '강사진', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/settlements', label: '정산', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/settlements/payment-statements', label: '지급조서/이체리스트', enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  {
    key: 'volunteers-group',
    label: '봉사단 관리',
    icon: <HeartOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/volunteers', label: '봉사자', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/volunteers/programs', label: '봉사 프로그램', enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  {
    key: 'templates-group',
    label: '템플릿 관리',
    icon: <FileOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/templates/files', label: '파일 양식', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/templates/sms', label: '문자 양식', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/templates/email', label: '메일 양식', enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  {
    key: 'posts-group',
    label: '게시글 관리',
    icon: <EditOutlined />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/admin/posts/categories', label: '카테고리', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/admin/posts/notices', label: '공지사항', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/admin/posts/faq', label: 'FAQ', enabled: true, allowedRoles: ['ADMIN'] },
      { key: '/admin/posts/inquiries', label: '문의하기', enabled: true, allowedRoles: ['ADMIN'] },
    ],
  },
  { key: '/sponsors', label: '후원사 관리', icon: <ShopOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  { key: '/surveys', label: '설문 관리', icon: <FileTextOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  { key: '/education-records', label: '실적 통계', icon: <BarChartOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  { key: '/education-records-v2', label: '실적 통계 (v2)', icon: <BarChartOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  { key: '/performance', label: '실적 통계', icon: <BarChartOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  { key: '/logs', label: '로그 관리', icon: <DatabaseOutlined />, enabled: true, allowedRoles: ['ADMIN'] },
  { key: 'divider-bottom', type: 'divider', enabled: true, allowedRoles: ['ADMIN'] },

  // 기타 (비활성)
  { key: '/applications', label: '신청 관리', icon: <FileTextOutlined />, enabled: false, allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
  { key: '/application-paths', label: '신청 경로 관리', icon: <FileTextOutlined />, enabled: false, allowedRoles: ['ADMIN'] },
  {
    key: 'schedules-group',
    label: '일정 관리',
    icon: <CalendarOutlined />,
    enabled: false,
    children: [
      { key: '/schedules', label: '일정 캘린더', enabled: false },
      { key: '/schedules/my', label: '본인 일정 목록', enabled: false, allowedRoles: ['INSTRUCTOR', 'STUDENT'] },
      { key: '/schedules/my/calendar', label: '본인 일정 캘린더', enabled: false, allowedRoles: ['INSTRUCTOR', 'STUDENT'] },
      { key: '/schedule-negotiations', label: '일정 협의 관리', enabled: false, allowedRoles: ['ADMIN'] },
    ],
  },
  { key: '/matchings', label: '매칭 관리', icon: <TeamOutlined />, enabled: false, allowedRoles: ['ADMIN', 'INSTRUCTOR'] },
  {
    key: 'interviews-group',
    label: '면접 관리',
    icon: <TeamOutlined />,
    enabled: false,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
    children: [
      { key: '/interviews', label: '면접 관리', enabled: false, allowedRoles: ['ADMIN'] },
      { key: '/interviews/apply', label: '강사 신청', enabled: false, allowedRoles: ['INSTRUCTOR'] },
      { key: '/interviews/my', label: '내 면접 일정', enabled: false, allowedRoles: ['INSTRUCTOR', 'STUDENT'] },
    ],
  },
  {
    key: 'reports-group',
    label: '보고서',
    icon: <FileTextOutlined />,
    enabled: false,
    allowedRoles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'],
    children: [
      { key: '/reports', label: '보고서 관리', enabled: false, allowedRoles: ['ADMIN'] },
      { key: '/reports/new', label: '보고서 작성', enabled: false, allowedRoles: ['INSTRUCTOR', 'STUDENT'] },
    ],
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
      if (item.type === 'divider') {
        return true
      }
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
      if (item.type === 'divider') {
        return { type: 'divider' as const }
      }

      const menuItem: any = {
        key: item.key,
        label: item.label,
        icon: item.icon,
      }

      if (userRole === 'ADMIN' && item.key === 'programs-group') {
        menuItem.label = '프로그램 관리'
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
 * 메뉴 아이템에서 경로 찾기 (내부 유틸리티)
 * 특정 경로에 해당하는 모든 메뉴 설정 반환
 */
function findAllMenuItemsByPath(
  items: MenuItemConfig[],
  targetPath: string
): MenuItemConfig[] {
  const matches: MenuItemConfig[] = []

  for (const item of items) {
    if (item.key === targetPath) {
      matches.push(item)
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.key === targetPath) {
          matches.push(child)
        }
        if (child.children) {
          for (const grandchild of child.children) {
            if (grandchild.key === targetPath) {
              matches.push(grandchild)
            }
          }
        }
      }
    }
  }
  return matches
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

  // 경로 정규화 (끝에 있는 / 제거)
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '')

  // 관리자는 모든 경로 접근 가능
  if (userRole === 'ADMIN') {
    return true
  }

  // 수강자는 정산 관련 경로 접근 불가 (Phase 6.1.3)
  if (userRole === 'STUDENT' && normalizedPath.startsWith('/settlements')) {
    return false
  }

  const matches = findAllMenuItemsByPath(allMenuItems, normalizedPath)
  if (matches.length === 0) {
    // 메뉴에 없는 경로는 기본적으로 접근 가능 (기타 페이지)
    return true
  }

  // 매칭된 메뉴 중 하나라도 권한이 허용되면 접근 가능
  return matches.some(menuItem => {
    // allowedRoles가 없으면 모든 권한 허용
    if (!menuItem.allowedRoles || menuItem.allowedRoles.length === 0) {
      return true
    }
    // allowedRoles에 사용자 권한이 포함되어 있는지 확인
    return menuItem.allowedRoles.includes(userRole)
  })
}

/**
 * 현재 경로에 해당하는 카테고리명 가져오기
 * @param path 경로
 * @param depth 가져올 뎁스 (1: 1뎁스, 2: 2뎁스, 3: 3뎁스, 기본값: 자동 감지)
 * @returns 카테고리명 (없으면 null)
 */
export function getCategoryNameByPath(path: string, depth?: number): string | null {
  // 경로 정규화
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '')

  // 모든 매칭 항목 찾기 (부모 정보 포함을 위해 로직 직접 구현)
  const matches: Array<{ item: MenuItemConfig; parent?: MenuItemConfig; depth: number }> = []

  for (const item of allMenuItems) {
    if (item.key === normalizedPath) {
      matches.push({ item, depth: 1 })
    }
    if (item.children) {
      for (const child of item.children) {
        if (child.key === normalizedPath) {
          matches.push({ item: child, parent: item, depth: 2 })
        }
        if (child.children) {
          for (const grandchild of child.children) {
            if (grandchild.key === normalizedPath) {
              matches.push({ item: grandchild, parent: child, depth: 3 })
            }
          }
        }
      }
    }
  }

  if (matches.length === 0) {
    return null
  }

  // 첫 번째 매칭 항목 사용 (향후 현재 사용자 권한에 따른 필터링 추가 가능)
  const result = matches[0]

  // depth가 지정되지 않았으면 해당 뎁스의 카테고리명 반환
  if (depth === undefined) {
    return result.item.label || null
  }

  // depth에 따라 카테고리명 반환
  if (depth === 1) {
    // 1뎁스: 최상위 카테고리
    if (result.depth === 1) {
      return result.item.label || null
    } else if (result.depth === 2 && result.parent) {
      // 2뎁스 아이템의 경우, 1뎁스는 부모
      return result.parent.label || null
    } else if (result.depth === 3 && result.parent) {
      // 3뎁스 아이템의 경우, 1뎁스는 부모의 부모를 찾아야 함
      for (const topLevel of allMenuItems) {
        if (
          topLevel.children?.some(child =>
            child.children?.some(grandchild => grandchild.key === result.item.key)
          )
        ) {
          return topLevel.label || null
        }
      }
    }
  } else if (depth === 2) {
    // 2뎁스: 중간 카테고리
    if (result.depth === 2) {
      // 2뎁스 아이템은 자기 자신이 2뎁스
      return result.item.label || null
    } else if (result.depth === 3 && result.parent) {
      // 3뎁스 아이템의 경우, 2뎁스는 부모
      return result.parent.label || null
    } else if (result.depth === 1) {
      // 1뎁스 아이템은 2뎁스가 없으므로 자기 자신 반환
      return result.item.label || null
    }
  } else if (depth === 3) {
    // 3뎁스: 최하위 카테고리
    if (result.depth === 3) {
      return result.item.label || null
    } else if (result.depth === 2) {
      // 2뎁스 아이템은 3뎁스가 없으므로 자기 자신 반환
      return result.item.label || null
    } else if (result.depth === 1) {
      // 1뎁스 아이템은 3뎁스가 없으므로 자기 자신 반환
      return result.item.label || null
    }
  }

  return result.item.label || null
}
