export type SiteFooterMenu =
  | { key: string; label: string; kind: 'terms' | 'privacy' | 'noop' }
  | { key: string; label: string; kind: 'directions' | 'external'; href: string }

export type SiteFooterPartner = {
  partnerId: number
  name: string
  logoUrl: string | null
}

export type SiteFooterView = {
  source: 'fallback' | 'remote'
  menus: readonly SiteFooterMenu[]
  addressLine: string
  postalCode: string
  representativeName: string
  businessRegistrationNumber: string
  phone: string
  fax: string
  email: string
  organizationLogoUrl: string | null
  partners: readonly SiteFooterPartner[]
}

const LOCAL_ONLINE_LEARNING: SiteFooterMenu = {
  key: 'LOCAL_ONLINE_LEARNING',
  label: '온라인 학습관리',
  kind: 'noop',
}

const EXTERNAL_MENU_CODES = new Set([
  'NTS_DISCLOSURE',
  'NTS_EVASION_REPORT',
  'DONATION',
  'DONATION_RECEIPT',
])

/** 요청 실패·미호출일 때의 현재 푸터. 외부 URL은 만들지 않는다. */
export const SITE_FOOTER_FALLBACK: SiteFooterView = {
  source: 'fallback',
  menus: [
    { key: 'TERMS', label: '이용약관', kind: 'terms' },
    { key: 'PRIVACY', label: '개인정보처리방침', kind: 'privacy' },
    { key: 'DIRECTIONS', label: '오시는 길', kind: 'directions', href: '/about/directions' },
    { key: 'NTS_DISCLOSURE', label: '국세청 공시 및 공개 내역', kind: 'noop' },
    { key: 'NTS_EVASION_REPORT', label: '국세청 탈세 제보', kind: 'noop' },
    { key: 'DONATION', label: '후원하기', kind: 'noop' },
    { key: 'DONATION_RECEIPT', label: '기부금영수증', kind: 'noop' },
    LOCAL_ONLINE_LEARNING,
  ],
  addressLine:
    '사단법인 제이에이코리아 서울특별시 강서구 마곡중앙로 171 마곡나루역 프라이빗타워2차 714호',
  postalCode: '07788',
  representativeName: '이은형',
  businessRegistrationNumber: '107-82-10367',
  phone: '02-783-2367',
  fax: '070-4275-5115',
  email: 'jakorea@jakorea.org',
  organizationLogoUrl: null,
  partners: [
    { partnerId: 1, name: '기획재정부', logoUrl: null },
    { partnerId: 2, name: '국세청', logoUrl: null },
    { partnerId: 3, name: '국민권익위원회', logoUrl: null },
  ],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readHttpUrl(value: unknown): string | null {
  const url = readText(value)
  if (!url || !/^https?:\/\//i.test(url)) return null
  return url
}

function readOrder(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

function sortByDisplayOrder<T extends { displayOrder?: unknown }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const order = readOrder(a.item.displayOrder) - readOrder(b.item.displayOrder)
      if (order !== 0) return order
      return a.index - b.index
    })
    .map(entry => entry.item)
}

const FOOTER_DIRECTIONS_LABEL = '오시는 길'

function displayFooterMenuLabel(label: string): string {
  return label === '오시는길' ? FOOTER_DIRECTIONS_LABEL : label
}

function mapMenu(raw: unknown): SiteFooterMenu | null {
  if (!isRecord(raw)) return null
  const key = readText(raw.menuCode)
  const label = displayFooterMenuLabel(readText(raw.label))
  if (!key || !label) return null

  if (key === 'TERMS') return { key, label, kind: 'terms' }
  if (key === 'PRIVACY') return { key, label, kind: 'privacy' }
  if (key === 'DIRECTIONS') {
    return { key, label: FOOTER_DIRECTIONS_LABEL, kind: 'directions', href: '/about/directions' }
  }
  if (!EXTERNAL_MENU_CODES.has(key)) return null

  const href = raw.linkType === 'EXTERNAL' ? readHttpUrl(raw.externalUrl) : null
  if (href) return { key, label, kind: 'external', href }
  return { key, label, kind: 'noop' }
}

function mapPartners(raw: unknown): SiteFooterPartner[] {
  if (!Array.isArray(raw)) return []
  const partners: SiteFooterPartner[] = []
  const seen = new Set<number>()

  for (const item of sortByDisplayOrder(raw)) {
    if (!isRecord(item)) continue
    const name = readText(item.organizationName)
    if (!name) continue
    if (typeof item.partnerId !== 'number' || !Number.isFinite(item.partnerId)) continue
    if (seen.has(item.partnerId)) continue
    seen.add(item.partnerId)
    partners.push({
      partnerId: item.partnerId,
      name,
      logoUrl: readHttpUrl(item.logoUrl),
    })
  }

  return partners
}

/**
 * 객체가 아니거나 menus가 배열이 아니면 null.
 * `{ success, data }` 래퍼는 벗긴다.
 * 성공 객체는 원격이 SSOT이고, 메뉴 뒤에 로컬 `온라인 학습관리`를 붙인다.
 * 파트너 빈 배열은 빈 목록이다.
 */
export function mapPublicFooter(remote: unknown): SiteFooterView | null {
  const body = unwrapPayload(remote)
  if (!isRecord(body) || !Array.isArray(body.menus)) return null

  const seen = new Set<string>()
  const menus: SiteFooterMenu[] = []
  for (const raw of sortByDisplayOrder(body.menus)) {
    const menu = mapMenu(raw)
    if (!menu || seen.has(menu.key)) continue
    seen.add(menu.key)
    menus.push(menu)
  }
  menus.push(LOCAL_ONLINE_LEARNING)

  const org = isRecord(body.organization) ? body.organization : {}
  const organizationName = readText(org.organizationName)
  const address = readText(org.address)

  return {
    source: 'remote',
    menus,
    addressLine: [organizationName, address].filter(Boolean).join(' '),
    postalCode: readText(org.postalCode),
    representativeName: readText(org.representativeName),
    businessRegistrationNumber: readText(org.businessRegistrationNumber),
    phone: readText(org.phone),
    fax: readText(org.fax),
    email: readText(org.email),
    organizationLogoUrl: readHttpUrl(org.logoUrl),
    partners: mapPartners(body.partners),
  }
}

function unwrapPayload(payload: unknown): unknown {
  let current = payload
  for (let depth = 0; depth < 3; depth += 1) {
    if (!isRecord(current) || current.success !== true || !('data' in current)) return current
    current = current.data
  }
  return current
}
