import type { ReactNode } from 'react'
import type { MenuProps } from 'antd'
import {
  MainScreenMenuIcon,
  JaKoreaMenuIcon,
  ImpactStoryMenuIcon,
  EducationMenuIcon,
  SponsorMenuIcon,
  ParticipateMenuIcon,
  SiteMenuIcon,
  StatsMenuIcon,
  LogsMenuIcon,
} from '@/shared/ui/icons'

export interface MenuItemConfig {
  key: string
  label?: string
  icon?: ReactNode
  children?: MenuItemConfig[]
  type?: 'divider'
}

/** 2뎁스 불릿 — CMS와 동일 (`•` + sidebar.css에서 3px 원형으로 렌더) */
function BulletIcon() {
  return (
    <span
      style={{
        display: 'inline-block',
        color: 'currentColor',
        fontSize: 10,
        lineHeight: 1,
        marginRight: 0,
      }}
      aria-hidden
    >
      •
    </span>
  )
}

/**
 * 홈페이지 어드민 LNB — 시안 GNB 대메뉴 기준
 * (하위 상세는 Notion「홈페이지 어드민 기능정의서」)
 */
export const menuItems: MenuItemConfig[] = [
  {
    key: 'main-group',
    label: '메인 화면 관리',
    icon: <MainScreenMenuIcon />,
    children: [
      { key: '/main/popups', label: '팝업 관리' },
      { key: '/main/strip-banners', label: '메인 상단 띠배너 관리' },
      { key: '/main/hero-banners', label: '히어로 배너 관리' },
      { key: '/main/social-links', label: '소셜 링크 관리' },
      { key: '/main/contents', label: '콘텐츠 관리' },
    ],
  },
  {
    key: 'ja-korea-group',
    label: 'JA Korea 관리',
    icon: <JaKoreaMenuIcon />,
    children: [
      {
        key: 'ja-korea-intro-group',
        label: '기관 소개',
        children: [
          { key: '/ja-korea/intro', label: 'JA Korea 소개' },
          { key: '/ja-korea/global-value', label: 'JA Global Value' },
          { key: '/ja-korea/worldwide', label: 'JA Worldwide' },
          { key: '/ja-korea/history', label: '연혁' },
          { key: '/ja-korea/awards', label: '수상' },
          { key: '/ja-korea/certifications', label: '인증' },
          { key: '/ja-korea/bi', label: 'BI 소개' },
        ],
      },
      {
        key: 'ja-korea-transparency-group',
        label: '투명경영',
        children: [
          { key: '/ja-korea/principles', label: '운영원칙' },
          { key: '/ja-korea/income', label: '수입' },
          { key: '/ja-korea/expense', label: '지출' },
          { key: '/ja-korea/annual-report', label: '연차보고서' },
          { key: '/ja-korea/audit-report', label: '회계감사 보고서' },
          { key: '/ja-korea/nts-disclosure', label: '국세청 공시' },
        ],
      },
      { key: '/ja-korea/notices', label: '공지사항' },
      { key: '/ja-korea/directions', label: '오시는 길' },
      {
        key: 'ja-korea-people-group',
        label: '함께하는 사람들',
        children: [
          { key: '/ja-korea/organization', label: '조직도' },
          { key: '/ja-korea/board', label: '이사회' },
        ],
      },
    ],
  },
  {
    key: '/impact/stories',
    label: '임팩트 스토리 관리',
    icon: <ImpactStoryMenuIcon />,
  },
  {
    key: 'education-group',
    label: '교육 소개 관리',
    icon: <EducationMenuIcon />,
    children: [
      { key: '/education/fields', label: '사업분야' },
      { key: '/education/textbooks', label: '교재 소개' },
      { key: '/education/targets', label: '교육 대상' },
    ],
  },
  {
    key: 'sponsor-group',
    label: '후원하기 관리',
    icon: <SponsorMenuIcon />,
    children: [
      { key: '/sponsor/individual', label: '개인후원' },
      { key: '/sponsor/corporate-guide', label: '기업후원 안내' },
      { key: '/sponsor/partners', label: '후원사' },
      { key: '/sponsor/corporate-applications', label: '기업 후원 신청 현황' },
    ],
  },
  {
    key: '/participate',
    label: '참여하기 관리',
    icon: <ParticipateMenuIcon />,
  },
  {
    key: 'site-group',
    label: '사이트 관리',
    icon: <SiteMenuIcon />,
    children: [
      { key: '/site/info', label: '사이트 정보' },
      { key: '/site/gnb', label: 'GNB 메뉴' },
      { key: '/site/footer', label: '푸터' },
    ],
  },
  {
    key: 'stats-group',
    label: '통계 관리',
    icon: <StatsMenuIcon />,
    children: [
      { key: '/stats/visitors', label: '방문자 통계' },
      { key: '/stats/menu-views', label: '메뉴별 조회 통계' },
    ],
  },
  {
    key: 'logs-group',
    label: '로그 관리',
    icon: <LogsMenuIcon />,
    children: [
      { key: '/logs/member-login', label: '회원 로그인 이력' },
      { key: '/logs/admin-account', label: '관리자 계정 처리 이력' },
      { key: '/logs/file-download', label: '파일 다운로드 이력' },
      { key: '/logs/pii-access', label: '개인정보 조회 이력' },
      { key: '/logs/bugs', label: '버그/이슈 이력' },
    ],
  },
]

function toAntItems(items: MenuItemConfig[], depth = 0): MenuProps['items'] {
  return items.map(item => {
    if (item.type === 'divider') {
      return { type: 'divider' as const, key: item.key }
    }
    const children = item.children ? toAntItems(item.children, depth + 1) : undefined
    // 1뎁스: 카테고리 아이콘 / 2뎁스: BulletIcon(•) / 3뎁스+: 아이콘 없음 — CMS filterMenuByRole과 동일
    const showIcon = depth === 0 && item.icon != null
    return {
      key: item.key,
      label: item.label,
      icon: showIcon ? item.icon : depth === 1 ? <BulletIcon /> : undefined,
      children,
    }
  })
}

export function getSidebarMenuItems(): MenuProps['items'] {
  return toAntItems(menuItems)
}

/** 리프 경로 목록 (라우터 등록용) */
export function getLeafMenuPaths(items: MenuItemConfig[] = menuItems): string[] {
  const paths: string[] = []
  for (const item of items) {
    if (item.children?.length) {
      paths.push(...getLeafMenuPaths(item.children))
    } else if (item.key.startsWith('/')) {
      paths.push(item.key)
    }
  }
  return paths
}

/**
 * 경로에 해당하는 조상 그룹 openKeys + 리프 label
 */
export function findMenuTrail(
  path: string,
  items: MenuItemConfig[] = menuItems,
  ancestors: string[] = []
): { openKeys: string[]; label: string } | null {
  const normalized = path === '/' ? path : path.replace(/\/$/, '')

  for (const item of items) {
    const isExact = item.key === normalized
    const isPrefix =
      item.key.startsWith('/') &&
      !item.children?.length &&
      normalized.startsWith(`${item.key}/`)

    if (isExact || isPrefix) {
      return { openKeys: ancestors, label: item.label ?? item.key }
    }

    if (item.children?.length) {
      const nextAncestors = item.key.startsWith('/') ? ancestors : [...ancestors, item.key]
      const found = findMenuTrail(normalized, item.children, nextAncestors)
      if (found) return found
    }
  }

  return null
}

/** 시안 상단 헤더 타이틀 — LNB 라벨과 다를 때만 지정 */
const PAGE_TITLE_BY_PATH: Record<string, string> = {
  '/main/hero-banners': '메인 히어로 배너 관리',
  '/main/strip-banners': '메인 상단 띠배너 관리',
  '/main/popups': '팝업 관리',
  '/main/social-links': '소셜 링크 관리',
  '/main/contents': '콘텐츠 관리',
  '/ja-korea/intro': 'JA Korea 소개 관리',
  '/ja-korea/global-value': 'JA Global Value 관리',
  '/ja-korea/worldwide': 'JA Worldwide 관리',
  '/ja-korea/history': '연혁 관리',
  '/ja-korea/awards': '수상 관리',
  '/impact/stories': '임팩트 스토리 관리',
  '/participate': '참여하기 관리',
}

export function getCategoryNameByPath(path: string): string {
  if (path === '/') return '홈'
  const normalized = path === '/' ? path : path.replace(/\/$/, '')
  if (PAGE_TITLE_BY_PATH[normalized]) return PAGE_TITLE_BY_PATH[normalized]
  const trail = findMenuTrail(path)
  return trail?.label ?? '홈페이지 어드민'
}

export function getOpenKeysForPath(path: string): string[] {
  return findMenuTrail(path)?.openKeys ?? []
}
