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

/** 2뎁스 불릿 — CMS와 동일 (`•` + sidebar.css에서 3px 원형으로 렌더). 3뎁스 리프는 CSS에서 숨김 */
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
 * 홈페이지 어드민 LNB — 시안 기준 **최대 3뎁스**
 * 1뎁스: 시안 대메뉴 / 2·3뎁스: 시안 드롭다운·하위 항목
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
          { key: '/ja-korea/intro', label: 'JA Korea 소개 관리' },
          { key: '/ja-korea/global-value', label: 'JA Global Value 관리' },
          { key: '/ja-korea/worldwide', label: 'JA Worldwide 관리' },
          { key: '/ja-korea/history-awards-certs', label: '연혁/수상/인증 관리' },
          { key: '/ja-korea/bi', label: 'BI 소개 관리' },
        ],
      },
      {
        key: 'ja-korea-transparency-group',
        label: '투명경영',
        children: [
          { key: '/ja-korea/principles', label: '소개 및 운영원칙 관리' },
          { key: '/ja-korea/income-expense', label: '수입&지출 관리' },
          { key: '/ja-korea/reports-disclosure', label: '보고서 및 공시 관리' },
        ],
      },
      {
        key: 'ja-korea-history-group',
        label: 'JA History',
        children: [{ key: '/ja-korea/ja-history/resumes', label: '강사 이력서' }],
      },
      {
        key: 'ja-korea-recruit-group',
        label: '채용',
        children: [
          { key: '/ja-korea/recruit/ideal-talent', label: '인재상 관리' },
          { key: '/ja-korea/recruit/postings', label: '공고 관리' },
          { key: '/ja-korea/recruit/applicants', label: '지원자 관리' },
        ],
      },
      {
        key: 'ja-korea-notice-group',
        label: '공지 관리',
        children: [
          { key: '/ja-korea/notice-fields', label: '사업분야 관리' },
          { key: '/ja-korea/notices', label: '공지 관리' },
        ],
      },
      { key: '/ja-korea/directions', label: '오시는 길' },
      { key: '/ja-korea/organization', label: '조직도' },
      { key: '/ja-korea/board', label: '이사회' },
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
      {
        key: 'sponsor-individual-group',
        label: '개인후원',
        children: [
          { key: '/sponsor/individual/banner', label: '메인 배너 관리' },
          { key: '/sponsor/individual/usage-guide', label: '후원금 사용 안내 관리' },
          { key: '/sponsor/individual/links', label: '후원 연결 관리' },
        ],
      },
      {
        key: 'sponsor-corporate-group',
        label: '기업후원',
        children: [
          { key: '/sponsor/corporate/guide', label: '기업후원 안내 관리' },
          { key: '/sponsor/corporate/partners', label: '후원사 목록 관리' },
          { key: '/sponsor/corporate/consultations', label: '기업 후원 상담 신청 관리' },
        ],
      },
      {
        key: 'sponsor-talent-group',
        label: '재능기부',
        children: [
          { key: '/sponsor/talent/intro', label: '소개글 관리' },
          { key: '/sponsor/talent/interviews', label: '인터뷰 관리' },
          { key: '/sponsor/talent/applications', label: '재능기부 신청 목록' },
        ],
      },
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
    const children = item.children?.length
      ? toAntItems(item.children, depth + 1)
      : undefined
    // 1뎁스: 카테고리 아이콘 / 2뎁스: BulletIcon(•) / 3뎁스: CSS에서 아이콘 숨김
    const showIcon = depth === 0 && item.icon != null
    return {
      key: item.key,
      label: item.label,
      icon: showIcon ? item.icon : depth >= 1 ? <BulletIcon /> : undefined,
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
  '/ja-korea/history-awards-certs': '연혁/수상/인증 관리',
  '/ja-korea/bi': 'BI 소개 관리',
  '/ja-korea/principles': '소개 및 운영원칙 관리',
  '/ja-korea/income-expense': '수입&지출 관리',
  '/ja-korea/reports-disclosure': '보고서 및 공시 관리',
  '/ja-korea/ja-history/resumes': '강사 이력서',
  '/ja-korea/recruit/ideal-talent': '인재상 관리',
  '/ja-korea/recruit/postings': '공고 관리',
  '/ja-korea/recruit/applicants': '지원자 관리',
  '/ja-korea/notice-fields': '사업분야 관리',
  '/ja-korea/notices': '공지 관리',
  '/ja-korea/directions': '오시는 길 관리',
  '/ja-korea/organization': '조직도 관리',
  '/ja-korea/board': '이사회 관리',
  '/impact/stories': '임팩트 스토리 관리',
  '/sponsor/individual/banner': '메인 배너 관리',
  '/sponsor/individual/usage-guide': '후원금 사용 안내 관리',
  '/sponsor/individual/links': '후원 연결 관리',
  '/sponsor/corporate/guide': '기업후원 안내 관리',
  '/sponsor/corporate/partners': '후원사 목록 관리',
  '/sponsor/corporate/consultations': '기업 후원 상담 신청 관리',
  '/sponsor/talent/intro': '소개글 관리',
  '/sponsor/talent/interviews': '인터뷰 관리',
  '/sponsor/talent/applications': '재능기부 신청 목록',
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
