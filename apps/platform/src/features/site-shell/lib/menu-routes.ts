/**
 * GNB href SSOT. 공개 API는 경로를 주지 않는다.
 * 라벨·순서·사용 여부는 원격을 기본으로 쓰되, 디자인 고정 표기·위치는 예외로 정규화한다.
 * href/external 은 이 표만 쓴다.
 */

export type GnbNavItem = {
  menuCode: string
  label: string
  href?: string
  external?: boolean
}

export type GnbNavGroup = {
  groupCode: string
  label: string
  href?: string
  children: readonly GnbNavItem[]
}

export const GNB_MENU_ROUTES = {
  JA_ORGANIZATION: { href: '/about/introduction' },
  JA_TRANSPARENCY: { href: '/about/transparency' },
  JA_PEOPLE: { href: '/about/people' },
  JA_DIRECTIONS: { href: '/about/directions' },
  JA_NOTICE: { href: '/notices' },
  JA_HISTORY: { href: '/about/history' },
  JA_RECRUIT: { href: '/about/careers' },
  IMPACT_STORY: { href: '/impact' },
  EDU_CAREER: { href: '/education/career' },
  EDU_ECONOMY: { href: '/education/finance' },
  EDU_ENTREPRENEURSHIP: { href: '/education/entrepreneurship' },
  EDU_DIGITAL_LITERACY: { href: '/education/digital-literacy' },
  EDU_MATERIAL: { href: '/education/textbooks' },
  PARTICIPATION_APPLY: { href: '/programs' },
  PARTICIPATION_RESULT: { href: '/results' },
  PARTICIPATION_ONLINE: { external: true as const },
  PARTICIPATION_ALUMNI: { external: true as const },
  SPONSOR_PERSONAL: { href: '/support/individual' },
  SPONSOR_CORPORATE: { href: '/support/corporate' },
  SPONSOR_TALENT: { href: '/support/talent' },
} as const

export type GnbMenuCode = keyof typeof GNB_MENU_ROUTES

/** 공개 GNB에서 디자인 시안과 일치시켜야 하는 고정 메뉴 표기. */
export const GNB_DESIGN_LABEL_OVERRIDES: Partial<Record<GnbMenuCode, string>> = {
  JA_DIRECTIONS: '오시는 길',
  EDU_CAREER: '진로·취업',
  EDU_ECONOMY: '경제·금융',
  EDU_ENTREPRENEURSHIP: '기업가정신',
  EDU_DIGITAL_LITERACY: '디지털 리터러시',
  EDU_MATERIAL: '교재',
  IMPACT_STORY: '임팩트 스토리',
}

const KNOWN_GROUP_CODES = [
  'JA_KOREA',
  'IMPACT_STORY',
  'EDUCATION',
  'PARTICIPATION',
  'SPONSORSHIP',
] as const

export type GnbGroupCode = (typeof KNOWN_GROUP_CODES)[number]

/** 공개 GNB에서 디자인 시안과 일치시켜야 하는 고정 상위 메뉴 표기. */
export const GNB_DESIGN_GROUP_LABEL_OVERRIDES: Partial<Record<GnbGroupCode, string>> = {
  IMPACT_STORY: '임팩트',
}

/** 메가메뉴에서 시안 미포함 항목 — 공지·채용·결과 확인은 단독 라우트로만 연다. */
export const GNB_MEGA_HIDDEN_MENU_CODES = new Set<string>([
  'JA_NOTICE',
  'JA_RECRUIT',
  'PARTICIPATION_RESULT',
])

/** 메가메뉴 하위 항목 시안 순서. 없는 코드는 숨긴다. */
export const GNB_DESIGN_CHILD_ORDER: Partial<Record<GnbGroupCode, readonly string[]>> = {
  JA_KOREA: [
    'JA_ORGANIZATION',
    'JA_TRANSPARENCY',
    'JA_HISTORY',
    'JA_PEOPLE',
    'JA_DIRECTIONS',
  ],
  IMPACT_STORY: ['IMPACT_STORY'],
  EDUCATION: [
    'EDU_CAREER',
    'EDU_ECONOMY',
    'EDU_ENTREPRENEURSHIP',
    'EDU_DIGITAL_LITERACY',
    'EDU_MATERIAL',
  ],
  PARTICIPATION: ['PARTICIPATION_APPLY', 'PARTICIPATION_ONLINE', 'PARTICIPATION_ALUMNI'],
}

export function isKnownGnbGroupCode(code: string): code is GnbGroupCode {
  return (KNOWN_GROUP_CODES as readonly string[]).includes(code)
}

export function isKnownGnbMenuCode(code: string): code is GnbMenuCode {
  return Object.prototype.hasOwnProperty.call(GNB_MENU_ROUTES, code)
}

/** header-config `navigationGroups` 와 같은 fallback 트리. SVG를 가져오지 않는다. */
export const gnbFallbackGroups = [
  {
    groupCode: 'JA_KOREA',
    label: 'JA Korea',
    children: [
      { menuCode: 'JA_ORGANIZATION', label: '기관소개', href: '/about/introduction' },
      { menuCode: 'JA_TRANSPARENCY', label: '투명경영', href: '/about/transparency' },
      { menuCode: 'JA_HISTORY', label: 'JA History', href: '/about/history' },
      { menuCode: 'JA_PEOPLE', label: '함께하는 사람들', href: '/about/people' },
      { menuCode: 'JA_DIRECTIONS', label: '오시는 길', href: '/about/directions' },
    ],
  },
  {
    groupCode: 'IMPACT_STORY',
    label: '임팩트',
    href: '/impact',
    children: [{ menuCode: 'IMPACT_STORY', label: '임팩트 스토리', href: '/impact' }],
  },
  {
    groupCode: 'EDUCATION',
    label: '교육 소개',
    children: [
      { menuCode: 'EDU_CAREER', label: '진로·취업', href: '/education/career' },
      { menuCode: 'EDU_ECONOMY', label: '경제·금융', href: '/education/finance' },
      {
        menuCode: 'EDU_ENTREPRENEURSHIP',
        label: '기업가정신',
        href: '/education/entrepreneurship',
      },
      {
        menuCode: 'EDU_DIGITAL_LITERACY',
        label: '디지털 리터러시',
        href: '/education/digital-literacy',
      },
      { menuCode: 'EDU_MATERIAL', label: '교재', href: '/education/textbooks' },
    ],
  },
  {
    groupCode: 'PARTICIPATION',
    label: '참여하기',
    children: [
      { menuCode: 'PARTICIPATION_APPLY', label: '프로그램 신청', href: '/programs' },
      { menuCode: 'PARTICIPATION_ONLINE', label: '온라인 학습', external: true },
      { menuCode: 'PARTICIPATION_ALUMNI', label: 'Alumni', external: true },
    ],
  },
  {
    groupCode: 'SPONSORSHIP',
    label: '후원하기',
    children: [
      { menuCode: 'SPONSOR_PERSONAL', label: '개인후원', href: '/support/individual' },
      { menuCode: 'SPONSOR_CORPORATE', label: '기업후원', href: '/support/corporate' },
      { menuCode: 'SPONSOR_TALENT', label: '재능기부', href: '/support/talent' },
    ],
  },
] as const satisfies readonly GnbNavGroup[]
