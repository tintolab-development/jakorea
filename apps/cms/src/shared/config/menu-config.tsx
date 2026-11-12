/**
 * 권한별 메뉴 구성 설정
 * Phase 4.2.1: 권한별 메뉴 구성
 * Phase 0.1.5: 역할별 메뉴 완전 분리 및 권한 기반 라우트 가드 완성
 */

import type { AdminLevel, UserRole } from '@/types/user'
import {
  canAccessAccountPayments,
  isAccountPaymentsPath,
} from '@/shared/lib/account-payments-access'
import type { MenuProps } from 'antd'
import {
  LnbAdjustmentIcon,
  LnbChartIcon,
  LnbDashboardIcon,
  LnbDataIcon,
  LnbMailIcon,
  LnbMemberIcon,
  LnbPostIcon,
  LnbProgramIcon,
  LnbSecurityIcon,
  LnbTemplateIcon,
} from '@/shared/ui/icons'
import React from 'react'
import { memberListHref, normalizeMemberListKind } from '@/shared/config/member-list-kinds'

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
  /** ADMIN 전용: 해당 관리자 레벨은 메뉴·동일 키 경로 접근 불가 (adminLevel 미지정 계정은 차단하지 않음) */
  blockedAdminLevels?: AdminLevel[]
  hidden?: boolean // 숨김 여부
  enabled?: boolean // 활성화/비활성화 여부 (기본값: true)
}

/** 프로그램 관리 LNB 2뎁스 중 전용 목록 미연결 분류 */
export const PROGRAM_MANAGEMENT_LNB_PATHS = [] as const

export function isProgramManagementLnbPath(key: string): boolean {
  return (PROGRAM_MANAGEMENT_LNB_PATHS as readonly string[]).includes(key)
}

/**
 * 전체 메뉴 아이템 정의
 * IA 순서에 맞게 정리됨
 */
const allMenuItems: MenuItemConfig[] = [
  // 관리자 전용 홈
  {
    key: '/',
    label: '대시보드 홈',
    icon: <LnbDashboardIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
  },

  /* 1뎁스 프로그램 관리 (ADMIN): 일반 `/programs/general`, 1사1교 `/programs/company-school`, 교육받은 교사 `/programs/trained-teachers`, UJAT `/programs/ujat`, Gemini 3뎁스(실적·찾아가는 연수) */
  {
    key: 'programs-group',
    label: '프로그램 관리',
    icon: <LnbProgramIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: '/programs/general',
        label: '일반 프로그램',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/programs/company-school',
        label: '1사1교 프로그램',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: 'ujat-program-group',
        label: 'UJAT 프로그램',
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          {
            key: '/programs/ujat',
            label: 'UJAT 프로그램',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/programs/ujat/regions',
            label: '교육 지역 관리',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
        ],
      },
      {
        key: 'gemini-program-group',
        label: 'Gemini 프로그램',
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          {
            key: '/programs/gemini/performance',
            label: '실적 관리',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/programs/gemini/visiting-training',
            label: '찾아가는 연수',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
        ],
      },
      {
        key: '/programs/trained-teachers',
        label: '교육받은 교사 프로그램',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },

  // CMS는 관리자 전용 — 관리자 외 역할용 LNB는 두지 않는다. (과거 스펙은 Git 히스토리 참고)

  // legacy support paths (호환/리다이렉트 용도 - 메뉴에는 노출하지 않음)
  { key: '/posts', enabled: false, allowedRoles: ['ADMIN'] },
  {
    key: '/posts/faq',
    enabled: false,
    allowedRoles: ['ADMIN'],
  },
  {
    key: '/posts/inquiries',
    enabled: false,
    allowedRoles: ['ADMIN'],
  },
  { key: '/posts/notices', enabled: false, allowedRoles: ['ADMIN'] },
  { key: 'divider-admin', type: 'divider', enabled: true, allowedRoles: ['ADMIN'] },

  // 관리자 영역
  {
    key: 'members-group',
    label: '회원 관리',
    icon: <LnbMemberIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: 'member-list-group',
        label: '회원 목록',
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          {
            key: memberListHref('all'),
            label: '전체 회원',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: memberListHref('institutions'),
            label: '학교(교사) 회원',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: memberListHref('instructors'),
            label: '강사 회원',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: memberListHref('admins'),
            label: '관리자 회원',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
        ],
      },
      {
        key: 'member-permissions-group',
        label: '회원 권한 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
        children: [
          {
            key: '/admin/permission-requests',
            label: '권한 승인',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/admin/settings/permissions',
            label: '관리자 권한 설정',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
          {
            key: '/admin/settings/program-manager-permissions',
            label: '프로그램 담당자 권한 설정',
            enabled: true,
            allowedRoles: ['ADMIN'],
          },
        ],
      },
    ],
  },
  {
    key: 'settlement-management-group',
    label: '정산 관리',
    icon: <LnbAdjustmentIcon />,
    enabled: true,
    children: [
      {
        key: '/settlement-management/payment-orders',
        label: '지급조서 확인',
        enabled: true,
      },
      {
        key: '/settlement-management/account-payments',
        label: '계좌 지급 확인',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/settlement-management/item-settings',
        label: '정산 항목 설정',
        enabled: true,
      },
    ],
  },
  {
    key: '/templates/form-management',
    label: '템플릿 관리',
    icon: <LnbTemplateIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
  },
  {
    key: 'posts-group',
    label: '게시글 관리',
    icon: <LnbPostIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: '/admin/posts/notices',
        label: '공지사항',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/admin/posts/faq',
        label: 'FAQ',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/admin/posts/inquiries',
        label: '문의내역',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: '/data-management',
    label: '데이터 관리',
    icon: <LnbDataIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: '/sponsor',
        label: '후원사 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/textbook',
        label: '교재 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/detailed-program',
        label: '세부 프로그램 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: 'notification-messages-group',
    label: '알림 메시지 관리',
    icon: <LnbMailIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: '/admin/notifications/kakao-alimtalk',
        label: '알림톡 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/admin/notifications/mail',
        label: '메일 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/admin/notifications/sms',
        label: '문자 관리',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: '/education-records',
    label: '실적 관리',
    icon: <LnbChartIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
  },
  {
    key: 'logs-group',
    label: '로그 관리',
    icon: <LnbSecurityIcon />,
    enabled: true,
    allowedRoles: ['ADMIN'],
    children: [
      {
        key: '/logs/member-login-history',
        label: 'CMS 관리자 로그인 이력',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/logs/file-download-history',
        label: '파일 다운로드 이력',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/logs/personal-info-access-history',
        label: '개인정보 조회 이력',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
      {
        key: '/logs/bug-issue-history',
        label: '버그/이슈 이력',
        enabled: true,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  { key: 'divider-bottom', type: 'divider', enabled: true, allowedRoles: ['ADMIN'] },

  // LNB 비활성 플레이스홀더: `canAccessPath` / `findAllMenuItemsByPath`가 경로 키를 참조하므로 유지한다(삭제 시 접근 판정이 달라질 수 있음).
  {
    key: '/application-paths',
    label: '신청 경로 관리',
    enabled: false,
    allowedRoles: ['ADMIN'],
  },
  {
    key: 'schedules-group',
    label: '일정 관리',
    enabled: false,
    allowedRoles: ['ADMIN'],
    children: [
      { key: '/schedules', label: '일정 캘린더', enabled: false, allowedRoles: ['ADMIN'] },
      {
        key: '/schedule-negotiations',
        label: '일정 협의 관리',
        enabled: false,
        allowedRoles: ['ADMIN'],
      },
    ],
  },
  {
    key: 'interviews-group',
    label: '면접 관리',
    enabled: false,
    allowedRoles: ['ADMIN'],
    children: [{ key: '/interviews', label: '면접 관리', enabled: false, allowedRoles: ['ADMIN'] }],
  },
  {
    key: 'reports-group',
    label: '보고서',
    enabled: false,
    allowedRoles: ['ADMIN'],
    children: [{ key: '/reports', label: '보고서 관리', enabled: false, allowedRoles: ['ADMIN'] }],
  },
]

/**
 * 권한별 메뉴 필터링
 *
 * - `allowedRoles`로 LNB에 노출할 항목을 제한한다.
 * @param userRole 사용자 권한
 * @param items 메뉴 아이템 목록
 * @param user 사용자 정보 (선택, 하위 호환용)
 * @returns 필터링된 메뉴 아이템 목록
 */
export function filterMenuByRole(
  userRole: UserRole | null,
  items: MenuItemConfig[] = allMenuItems,
  user?: Omit<import('@/types/user').User, 'password'> | null,
  depth: number = 0
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
      // Phase 0.1.5: hidden 처리된 메뉴는 완전히 제외
      if (item.hidden === true) {
        return false
      }
      // 비활성화된 메뉴는 제외
      if (item.enabled === false) {
        return false
      }
      if (isMenuPathBlockedForAdminLevel(item, userRole, user?.adminLevel)) {
        return false
      }
      // 권한 설정 V1.2 역할별 공통: 접근할 수 없는 메뉴도 숨기지 않는다.
      // 계좌 지급 확인(Master·Accounting Manager 전용)·템플릿 관리·정산 항목 설정(Program Viewer 제한) 등은
      // 메뉴를 노출하고 사이드바 클릭 시 접근 불가 안내를 띄우며, URL 직접 진입은 레이아웃 가드가 안내 후 되돌린다.
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

      // 1뎁스: 카테고리 아이콘 표시 / 2뎁스 이상: 시안대로 아이콘·불릿 없음
      const menuItem: any = {
        key: item.key,
        label: item.label,
        icon: depth === 0 ? item.icon : undefined,
      }

      // Phase 0.1.5: 자식 메뉴가 있는 경우 재귀적으로 필터링 (강화)
      // 재귀 호출 시 동적 라벨 변경도 함께 적용됨 (2뎁스 이상 아이콘 제거를 위해 depth 전달)
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterMenuByRole(userRole, item.children, user, depth + 1)
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
 * @param user 사용자 정보 (인증 상태 확인용, 선택적)
 * @returns 필터링된 메뉴 아이템 목록
 */
export function getMenuItemsByRole(
  userRole: UserRole | null,
  user?: Omit<import('@/types/user').User, 'password'> | null
): MenuProps['items'] {
  return filterMenuByRole(userRole, allMenuItems, user)
}

/**
 * 메뉴 아이템에서 경로 찾기 (내부 유틸리티)
 * 특정 경로에 해당하는 모든 메뉴 설정 반환
 */
function findAllMenuItemsByPath(items: MenuItemConfig[], targetPath: string): MenuItemConfig[] {
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

/** ADMIN + 명시적 adminLevel이 메뉴 항목의 blockedAdminLevels에 있으면 접근·노출 불가 */
function isMenuPathBlockedForAdminLevel(
  menuItem: MenuItemConfig,
  userRole: UserRole,
  adminLevel: AdminLevel | undefined
): boolean {
  if (userRole !== 'ADMIN') return false
  const blocked = menuItem.blockedAdminLevels
  if (!blocked?.length) return false
  if (adminLevel === undefined) return false
  return blocked.includes(adminLevel)
}

export type CanAccessPathUser = {
  role: UserRole
  adminLevel?: AdminLevel
  roleCode?: string | null
} | null

/**
 * 특정 경로에 대한 접근 권한 확인
 * @param path 경로
 * @param user 역할·관리자 레벨 (레이아웃 가드와 동일)
 * @returns 접근 가능 여부
 */
export function canAccessPath(path: string, user: CanAccessPathUser): boolean {
  if (!user) {
    return false
  }
  const { role: userRole, adminLevel } = user

  // 경로 정규화 (끝에 있는 / 제거)
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '')

  // LNB 접근 차단: 특정 관리 카테고리는 하위 경로 포함 접근 불가
  if (userRole !== 'ADMIN') {
    const blockedPathPrefixes = ['/admin/posts/', '/logs/']
    if (blockedPathPrefixes.some(prefix => normalizedPath.startsWith(prefix))) {
      return false
    }
    const blockedExactPaths = [
      '/data-management',
      '/sponsor',
      '/textbook',
      '/detailed-program',
      '/sponsors',
      '/education-records',
    ]
    if (blockedExactPaths.includes(normalizedPath)) {
      return false
    }
  }

  // 프로그램 관리 > 2뎁스 4분류(일반/1사1교/UJAT/Gemini) 및 레거시 `/programs/education`·`/programs/economy-education` 하위
  const programCategoryByPrefix: { prefix: string; menuKey: string }[] = [
    { prefix: '/programs/general', menuKey: '/programs/general' },
    { prefix: '/programs/company-school', menuKey: '/programs/company-school' },
    { prefix: '/programs/trained-teachers', menuKey: '/programs/trained-teachers' },
    { prefix: '/programs/ujat/regions', menuKey: '/programs/ujat/regions' },
    { prefix: '/programs/ujat', menuKey: '/programs/ujat' },
    { prefix: '/programs/gemini/performance', menuKey: '/programs/gemini/performance' },
    { prefix: '/programs/gemini/visiting-training', menuKey: '/programs/gemini/visiting-training' },
    { prefix: '/programs/gemini', menuKey: '/programs/gemini/performance' },
    { prefix: '/programs/education', menuKey: '/programs/general' },
    { prefix: '/programs/economy-education', menuKey: '/programs/company-school' },
  ]
  for (const { prefix, menuKey } of programCategoryByPrefix) {
    if (normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)) {
      const programMenus = findAllMenuItemsByPath(allMenuItems, menuKey)
      return programMenus.some(menuItem => {
        if (menuItem.hidden === true) return false
        if (menuItem.enabled === false) return false
        if (isMenuPathBlockedForAdminLevel(menuItem, userRole, adminLevel)) return false
        if (!menuItem.allowedRoles || menuItem.allowedRoles.length === 0) return true
        return menuItem.allowedRoles.includes(userRole)
      })
    }
  }

  // Phase 0.1.5: 관리자 — 프로그램 영역은 아래 예외 규칙으로 먼저 허용
  // 그 외(회원 목록 `/users/list`, 템플릿, 게시글 등)는 하단 `findAllMenuItemsByPath`와 동일 규칙으로 판단
  if (userRole === 'ADMIN') {
    if (normalizedPath === '/') return true
    const programsReserved = [
      'general',
      'company-school',
      'trained-teachers',
      'ujat',
      'regions',
      'gemini',
      'education',
      'economy-education',
      'my',
      'favorites',
      'volunteer',
      'new',
      'satisfaction',
    ]
    if (normalizedPath.startsWith('/programs/')) {
      const rest = normalizedPath.slice('/programs/'.length)
      const segments = rest.split('/').filter(Boolean)
      const firstSegment = segments[0]
      if (firstSegment && !programsReserved.includes(firstSegment)) return true // 프로그램 상세/수정/신청 등
    }
  }

  if (isAccountPaymentsPath(normalizedPath)) {
    return canAccessAccountPayments(user)
  }

  const matches = findAllMenuItemsByPath(allMenuItems, normalizedPath)
  if (matches.length === 0) {
    // 메뉴에 없는 경로는 기본적으로 접근 가능 (기타 페이지)
    return true
  }

  // Phase 0.1.5: 매칭된 메뉴 중 하나라도 권한이 허용되면 접근 가능 (강화)
  return matches.some(menuItem => {
    // hidden 처리된 메뉴는 접근 불가
    if (menuItem.hidden === true) {
      return false
    }
    // 비활성화된 메뉴는 접근 불가
    if (menuItem.enabled === false) {
      return false
    }
    if (isMenuPathBlockedForAdminLevel(menuItem, userRole, adminLevel)) {
      return false
    }
    // allowedRoles가 없으면 모든 권한 허용
    if (!menuItem.allowedRoles || menuItem.allowedRoles.length === 0) {
      return true
    }
    // allowedRoles에 사용자 권한이 포함되어 있는지 확인
    return menuItem.allowedRoles.includes(userRole)
  })
}

/**
 * 메뉴 key는 `/admin/posts/notices`·`/admin/posts/faq` exact만 등록돼 있어
 * 상세 URL(`/admin/posts/notices/:id` 등)은 매칭이 비어 null이 된다.
 * 사이드바 `selectedKeys`와 동일한 prefix 규칙으로 1뎁스(게시글 관리) / 2·3뎁스(리프)를 맞춘다.
 */
function getPostsPathCategoryNameWhenUnmatched(
  normalizedPath: string,
  depth: number | undefined
): string | null {
  const postsLeaves: Array<{ prefix: string; label: string }> = [
    { prefix: '/admin/posts/notices/', label: '공지사항' },
    { prefix: '/admin/posts/faq/', label: 'FAQ' },
  ]

  for (const leaf of postsLeaves) {
    if (normalizedPath.startsWith(leaf.prefix)) {
      if (depth === 1) return '게시글 관리'
      return leaf.label
    }
  }

  return null
}

/**
 * 메뉴 key는 `/templates/…` exact만 등록돼 있어, 하위 URL 등은 매칭이 비어 null이 된다.
 * 사이드바 `selectedKeys`와 동일한 prefix 규칙으로 1뎁스(템플릿 관리) / 2·3뎁스(리프)를 맞춘다.
 */
function getTemplatesPathCategoryNameWhenUnmatched(
  normalizedPath: string,
  depth: number | undefined
): string | null {
  if (normalizedPath !== '/templates' && !normalizedPath.startsWith('/templates/')) {
    return null
  }

  const isFormSubtree =
    normalizedPath === '/templates' ||
    normalizedPath.startsWith('/templates/form-management') ||
    normalizedPath.startsWith('/templates/program-forms')

  if (isFormSubtree) {
    if (depth === 1) return '템플릿 관리'
    return '폼 양식 관리'
  }
  return '템플릿 관리'
}

/**
 * 현재 경로에 해당하는 카테고리명 가져오기
 * @param path 경로
 * @param depth 가져올 뎁스 (1: 1뎁스, 2: 2뎁스, 3: 3뎁스, 기본값: 자동 감지 - 가장 구체적인 뎁스)
 * @param userRole 사용자 권한 (선택적, 권한별 필터링용)
 * @param user 사용자 정보 (선택적, 동적 라벨 변경용)
 * @returns 카테고리명 (없으면 null)
 */
export function getCategoryNameByPath(
  path: string,
  depth?: number,
  userRole?: UserRole | null,
  user?: Omit<import('@/types/user').User, 'password'> | null
): string | null {
  // 경로 정규화
  const normalizedPath = path === '/' ? path : path.replace(/\/$/, '')

  // 사용자 권한이 제공된 경우, 권한별로 필터링된 메뉴에서 찾기
  const itemsToSearch = userRole
    ? filterMenuByRole(userRole, allMenuItems, user) || []
    : allMenuItems

  // 필터링된 메뉴 아이템을 MenuItemConfig 형태로 변환
  const filteredItems: MenuItemConfig[] = itemsToSearch
    .filter((item): item is MenuItemConfig => item !== null && 'key' in item)
    .map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      children: item.children as MenuItemConfig[] | undefined,
      type: item.type as 'divider' | undefined,
      allowedRoles: undefined, // 이미 필터링됨
      hidden: false, // 이미 필터링됨
      enabled: true, // 이미 필터링됨
    }))

  // 모든 매칭 항목 찾기 (부모 정보 포함을 위해 로직 직접 구현)
  const matches: Array<{
    item: MenuItemConfig
    parent?: MenuItemConfig
    grandparent?: MenuItemConfig
    depth: number
  }> = []

  // 필터링된 메뉴에서 검색
  for (const item of filteredItems) {
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
              matches.push({ item: grandchild, parent: child, grandparent: item, depth: 3 })
            }
          }
        }
      }
    }
  }

  // 필터링된 메뉴에서 찾지 못한 경우, 원본 메뉴에서도 검색 (하위 호환성)
  if (matches.length === 0) {
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
                matches.push({ item: grandchild, parent: child, grandparent: item, depth: 3 })
              }
            }
          }
        }
      }
    }
  }

  if (matches.length === 0) {
    const postsTitle = getPostsPathCategoryNameWhenUnmatched(normalizedPath, depth)
    if (postsTitle !== null) {
      return postsTitle
    }
    const templateTitle = getTemplatesPathCategoryNameWhenUnmatched(normalizedPath, depth)
    if (templateTitle !== null) {
      return templateTitle
    }
    return null
  }

  // 가장 구체적인 뎁스의 매칭 항목 사용 (3뎁스 > 2뎁스 > 1뎁스 순)
  const result = matches.sort((a, b) => b.depth - a.depth)[0]

  // depth가 지정되지 않았으면 해당 뎁스의 카테고리명 반환 (가장 구체적인 뎁스)
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
      const searchItems = filteredItems.length > 0 ? filteredItems : allMenuItems
      for (const topLevel of searchItems) {
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

/**
 * 브레드크럼 아이템 타입
 * path가 있으면 링크(클릭 시 이동), 없으면 현재 페이지 또는 그룹
 */
export interface BreadcrumbItem {
  label: string
  path?: string
}

type MatchResult = {
  item: MenuItemConfig
  parent?: MenuItemConfig
  grandparent?: MenuItemConfig
  depth: 1 | 2 | 3
}

/**
 * 권한별 필터링된 메뉴에서 경로 매칭 찾기
 * @param path 경로
 * @param items 검색할 메뉴 아이템 목록 (권한별 필터링된 메뉴)
 * @returns 매칭 결과 또는 null
 */
function findMenuMatchInItems(path: string, items: MenuItemConfig[]): MatchResult | null {
  const n = path === '/' ? path : path.replace(/\/$/, '')
  for (const item of items) {
    if (item.type === 'divider' || !item.label) continue
    if (item.key === n) return { item, depth: 1 }
    if (!item.children) continue
    for (const child of item.children) {
      if (child.type === 'divider' || !child.label) continue
      if (child.key === n) return { item: child, parent: item, depth: 2 }
      if (!child.children) continue
      for (const grandchild of child.children) {
        if (grandchild.type === 'divider' || !grandchild.label) continue
        if (grandchild.key === n)
          return { item: grandchild, parent: child, grandparent: item, depth: 3 }
      }
    }
  }
  return null
}

/**
 * 전체 메뉴에서 경로 매칭 찾기 (하위 호환성)
 * @param path 경로
 * @returns 매칭 결과 또는 null
 */
function findMenuMatch(path: string): MatchResult | null {
  return findMenuMatchInItems(path, allMenuItems)
}

function toBreadcrumbItem(menuItem: MenuItemConfig): BreadcrumbItem {
  const label = menuItem.label || ''
  const path =
    typeof menuItem.key === 'string' && menuItem.key.startsWith('/') ? menuItem.key : undefined
  return { label, path }
}

/**
 * 경로·역할에 따른 브레드크럼 체인 반환
 * 사이드바 메뉴 뎁스(1·2·3)를 브레드크럼으로 표현할 때 사용
 * 권한별 필터링된 메뉴에서 검색하여 올바른 breadcrumb 생성
 *
 * @param pathname 경로
 * @param userRole 사용자 권한
 * @param user 사용자 정보 (동적 라벨 변경용, 선택적)
 * @param search location.search (`/users/list?kind=…` 메뉴 키 매칭용)
 * @returns 브레드크럼 아이템 배열
 */
export function getBreadcrumbByPath(
  pathname: string,
  userRole: UserRole | null,
  user?: Omit<import('@/types/user').User, 'password'> | null,
  search: string = ''
): BreadcrumbItem[] {
  const n = pathname === '/' ? pathname : pathname.replace(/\/$/, '')

  if (n === '/') {
    const label = userRole === 'ADMIN' ? '대시보드 홈' : '메인 홈'
    return [{ label }]
  }

  // 권한별로 필터링된 메뉴에서 검색 (권한에 맞는 메뉴 구조 반영)
  const filteredMenuItems = userRole
    ? filterMenuByRole(userRole, allMenuItems, user) || []
    : allMenuItems

  // 필터링된 메뉴 아이템을 MenuItemConfig 형태로 변환
  const filteredItems: MenuItemConfig[] = filteredMenuItems
    .filter((item): item is MenuItemConfig => item !== null && 'key' in item)
    .map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      children: item.children as MenuItemConfig[] | undefined,
      type: item.type as 'divider' | undefined,
      allowedRoles: undefined, // 이미 필터링됨
      hidden: false, // 이미 필터링됨
      enabled: true, // 이미 필터링됨
    }))

  const pathForMenuMatch =
    userRole === 'ADMIN' && n === '/users/list'
      ? memberListHref(
          (() => {
            const raw = new URLSearchParams(search).get('kind')
            return normalizeMemberListKind(raw)
          })()
        )
      : n

  // 권한별 필터링된 메뉴에서 매칭 찾기
  let match = findMenuMatchInItems(pathForMenuMatch, filteredItems)

  // 필터링된 메뉴에서 찾지 못한 경우, 원본 메뉴에서도 검색 (하위 호환성)
  if (!match) {
    match = findMenuMatch(pathForMenuMatch)
  }

  // 관리자: 일반 프로그램(레거시 education, 신규 general) 하위 경로 브레드크럼
  if (
    !match &&
    userRole === 'ADMIN' &&
    (n === '/programs/education' ||
      n.startsWith('/programs/education/') ||
      n === '/programs/general' ||
      n.startsWith('/programs/general/'))
  ) {
    const listMatch =
      findMenuMatchInItems('/programs/general', filteredItems) || findMenuMatch('/programs/general')
    if (listMatch && listMatch.parent) {
      const third = (p: string) =>
        p === '/programs/education' ||
        p === '/programs/education/' ||
        p === '/programs/general' ||
        p === '/programs/general/'
      let thirdLabel: string
      if (third(n)) {
        thirdLabel = '전체 프로그램'
      } else if (
        n === '/programs/education/student-recruitment' ||
        n === '/programs/general/student-recruitment'
      ) {
        thirdLabel = '수강자 모집'
      } else if (n === '/programs/education/enrollment' || n === '/programs/general/enrollment') {
        thirdLabel = '수강 신청 현황'
      } else if (n === '/programs/education/schedule' || n === '/programs/general/schedule') {
        thirdLabel = '프로그램 일정'
      } else {
        thirdLabel =
          typeof listMatch.item.label === 'string' ? listMatch.item.label : '일반 프로그램'
      }
      return [
        toBreadcrumbItem(listMatch.parent),
        toBreadcrumbItem(listMatch.item),
        { label: thirdLabel },
      ]
    }
  }

  // 관리자: 1사1교(레거시 economy-education, 신규 company-school) 하위
  if (
    !match &&
    userRole === 'ADMIN' &&
    (n === '/programs/economy-education' ||
      n.startsWith('/programs/economy-education/') ||
      n === '/programs/company-school' ||
      n.startsWith('/programs/company-school/'))
  ) {
    const listMatch =
      findMenuMatchInItems('/programs/company-school', filteredItems) ||
      findMenuMatch('/programs/company-school')
    if (listMatch && listMatch.parent) {
      let thirdLabel: string
      if (
        n === '/programs/economy-education' ||
        n === '/programs/economy-education/' ||
        n === '/programs/company-school' ||
        n === '/programs/company-school/'
      ) {
        thirdLabel = '전체 프로그램'
      } else if (
        n === '/programs/economy-education/student-recruitment' ||
        n === '/programs/company-school/student-recruitment'
      ) {
        thirdLabel = '수강자 모집'
      } else if (
        n === '/programs/economy-education/enrollment' ||
        n === '/programs/company-school/enrollment'
      ) {
        thirdLabel = '수강 신청 현황'
      } else if (
        n === '/programs/economy-education/schedule' ||
        n === '/programs/company-school/schedule'
      ) {
        thirdLabel = '프로그램 일정'
      } else {
        thirdLabel =
          typeof listMatch.item.label === 'string' ? listMatch.item.label : '1사1교 프로그램'
      }
      return [
        toBreadcrumbItem(listMatch.parent),
        toBreadcrumbItem(listMatch.item),
        { label: thirdLabel },
      ]
    }
  }

  // 관리자: 프로그램 상세(/programs/:id) 또는 수정(/programs/:id/edit) 접근 시 브레드크럼 연동
  const programsReserved = [
    'my',
    'favorites',
    'volunteer',
    'general',
    'company-school',
    'trained-teachers',
    'ujat',
    'regions',
    'gemini',
    'education',
    'economy-education',
    'new',
    'satisfaction',
  ]
  if (!match && userRole === 'ADMIN' && n.startsWith('/programs/')) {
    const rest = n.slice('/programs/'.length)
    const segments = rest.split('/').filter(Boolean)
    const firstSegment = segments[0]
    if (firstSegment && !programsReserved.includes(firstSegment)) {
      const listMatch =
        findMenuMatchInItems('/programs/general', filteredItems) ||
        findMenuMatch('/programs/general')
      const isEdit = segments[1] === 'edit'
      if (listMatch && listMatch.depth === 2 && listMatch.parent) {
        return [
          toBreadcrumbItem(listMatch.parent),
          toBreadcrumbItem(listMatch.item),
          { label: isEdit ? '프로그램 수정' : '프로그램 상세' },
        ]
      }
      if (listMatch && listMatch.depth === 3 && listMatch.parent && listMatch.grandparent) {
        return [
          toBreadcrumbItem(listMatch.grandparent),
          toBreadcrumbItem(listMatch.parent),
          toBreadcrumbItem(listMatch.item),
          { label: isEdit ? '프로그램 수정' : '프로그램 상세' },
        ]
      }
    }
  }

  if (!match) return []

  const chain: BreadcrumbItem[] = []
  if (match.depth === 1) {
    chain.push(toBreadcrumbItem(match.item))
  } else if (match.depth === 2 && match.parent) {
    chain.push(toBreadcrumbItem(match.parent))
    chain.push(toBreadcrumbItem(match.item))
  } else if (match.depth === 3 && match.parent && match.grandparent) {
    chain.push(toBreadcrumbItem(match.grandparent))
    chain.push(toBreadcrumbItem(match.parent))
    chain.push(toBreadcrumbItem(match.item))
  }
  // 현재 페이지(마지막 항목)는 링크 제거
  if (chain.length > 0) {
    const last = chain[chain.length - 1]
    chain[chain.length - 1] = { label: last.label }
  }
  return chain
}
