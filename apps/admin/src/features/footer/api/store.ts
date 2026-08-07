/**
 * 푸터 관리 — localStorage mock
 */

import type {
  FooterOrgInfo,
  FooterRelatedLogo,
  FooterRelatedLogoSaveInput,
  FooterTopMenu,
  FooterTopMenuPatch,
} from '@/entities/footer/model/types'

const STORAGE_KEY = 'admin.site.footer.v1'

export const FOOTER_CHANGED_EVENT = 'jakorea:footer-changed' as const

export const INTERNAL_LINK_LABEL = '사이트 내부 연결'

const PLACEHOLDER_LOGO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
      <rect width="200" height="80" fill="#0B5CAD"/>
      <text x="100" y="46" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="14" font-weight="700">JA Korea</text>
    </svg>`
  )

const PARTNER_LOGO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="48" viewBox="0 0 120 48">
      <rect width="120" height="48" rx="4" fill="#F0F2F5"/>
      <text x="60" y="28" text-anchor="middle" fill="#666" font-family="sans-serif" font-size="11">Logo</text>
    </svg>`
  )

type StoreFile = {
  version: 1
  topMenus: FooterTopMenu[]
  orgInfo: FooterOrgInfo
  relatedLogos: FooterRelatedLogo[]
}

function buildSeedTopMenus(): FooterTopMenu[] {
  const items: Array<Omit<FooterTopMenu, 'sortOrder'>> = [
    {
      id: 'footer-menu-terms',
      isActive: true,
      name: '이용약관',
      isInternal: true,
      linkUrl: '',
    },
    {
      id: 'footer-menu-privacy',
      isActive: true,
      name: '개인정보처리방침',
      isInternal: true,
      linkUrl: '',
    },
    {
      id: 'footer-menu-directions',
      isActive: true,
      name: '오시는길',
      isInternal: true,
      linkUrl: '',
    },
    {
      id: 'footer-menu-nts-disclosure',
      isActive: true,
      name: '국세청 공시 및 공개 내역',
      isInternal: false,
      linkUrl: 'https://www.hometax.go.kr/websquare/websquare.html?w2xPath=/ui/pp/index.xml',
    },
    {
      id: 'footer-menu-nts-report',
      isActive: true,
      name: '국세청 탈세 제보',
      isInternal: false,
      linkUrl: 'https://www.hometax.go.kr/',
    },
    {
      id: 'footer-menu-donate',
      isActive: true,
      name: '후원하기',
      isInternal: false,
      linkUrl: 'https://www.mrm.co.kr/',
    },
    {
      id: 'footer-menu-receipt',
      isActive: true,
      name: '기부금영수증',
      isInternal: false,
      linkUrl: 'https://www.mrm.co.kr/',
    },
  ]
  return items.map((item, i) => ({ ...item, sortOrder: i + 1 }))
}

function buildSeedOrgInfo(): FooterOrgInfo {
  return {
    name: '사단법인 제이에이코리아',
    address: '서울특별시 강서구 마곡중앙로 171 (마곡나루역 프라이빗타워2차 714호)',
    zipCode: '07788',
    representative: '이은형',
    businessNumber: '107-82-10367',
    phone: '02-783-2367',
    fax: '070-4275-5115',
    email: 'jakorea@jakorea.org',
    logoUrl: PLACEHOLDER_LOGO,
    logoFileName: 'ja-korea-logo.svg',
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function buildSeedRelatedLogos(): FooterRelatedLogo[] {
  return [
    {
      id: 'footer-logo-1',
      sortOrder: 1,
      isActive: true,
      hasContent: true,
      name: '기획재정부',
      logoUrl: PARTNER_LOGO,
      logoFileName: 'moe.png',
    },
    {
      id: 'footer-logo-2',
      sortOrder: 2,
      isActive: true,
      hasContent: true,
      name: '국세청',
      logoUrl: PARTNER_LOGO,
      logoFileName: 'nts.png',
    },
    {
      id: 'footer-logo-3',
      sortOrder: 3,
      isActive: true,
      hasContent: true,
      name: '국민권익위원회',
      logoUrl: PARTNER_LOGO,
      logoFileName: 'acrc.png',
    },
    {
      id: 'footer-logo-4',
      sortOrder: 4,
      isActive: false,
      hasContent: false,
      name: '',
      logoUrl: '',
    },
  ]
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asBool(v: unknown, fallback = false): boolean {
  return typeof v === 'boolean' ? v : fallback
}

function normalizeTopMenu(raw: Partial<FooterTopMenu>, fallbackId: string, order: number): FooterTopMenu {
  return {
    id: asString(raw.id, fallbackId),
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : order,
    isActive: asBool(raw.isActive, true),
    name: asString(raw.name),
    isInternal: asBool(raw.isInternal, false),
    linkUrl: asString(raw.linkUrl),
  }
}

function normalizeOrgInfo(raw: Partial<FooterOrgInfo> | null | undefined): FooterOrgInfo {
  const seed = buildSeedOrgInfo()
  if (!raw || typeof raw !== 'object') return seed
  return {
    name: asString(raw.name, seed.name),
    address: asString(raw.address, seed.address),
    zipCode: asString(raw.zipCode, seed.zipCode),
    representative: asString(raw.representative, seed.representative),
    businessNumber: asString(raw.businessNumber, seed.businessNumber),
    phone: asString(raw.phone, seed.phone),
    fax: asString(raw.fax, seed.fax),
    email: asString(raw.email, seed.email),
    logoUrl: asString(raw.logoUrl, seed.logoUrl),
    logoFileName: typeof raw.logoFileName === 'string' ? raw.logoFileName : seed.logoFileName,
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function normalizeRelatedLogo(
  raw: Partial<FooterRelatedLogo>,
  fallbackId: string,
  order: number
): FooterRelatedLogo {
  const hasContent =
    typeof raw.hasContent === 'boolean'
      ? raw.hasContent
      : Boolean(asString(raw.name) || asString(raw.logoUrl))
  return {
    id: asString(raw.id, fallbackId),
    sortOrder: typeof raw.sortOrder === 'number' ? raw.sortOrder : order,
    isActive: asBool(raw.isActive, hasContent),
    hasContent,
    name: asString(raw.name),
    logoUrl: asString(raw.logoUrl),
    logoFileName: typeof raw.logoFileName === 'string' ? raw.logoFileName : undefined,
  }
}

function sortByOrder<T extends { sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder)
}

function reindexSortOrder(items: FooterTopMenu[]): FooterTopMenu[] {
  return items.map((item, i) => ({ ...item, sortOrder: i + 1 }))
}

function reindexRelatedSortOrder(items: FooterRelatedLogo[]): FooterRelatedLogo[] {
  return items.map((item, i) => ({ ...item, sortOrder: i + 1 }))
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        version: 1,
        topMenus: buildSeedTopMenus(),
        orgInfo: buildSeedOrgInfo(),
        relatedLogos: buildSeedRelatedLogos(),
      }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1) {
      return {
        version: 1,
        topMenus: buildSeedTopMenus(),
        orgInfo: buildSeedOrgInfo(),
        relatedLogos: buildSeedRelatedLogos(),
      }
    }
    const topMenus = Array.isArray(parsed.topMenus)
      ? reindexSortOrder(
          sortByOrder(
            parsed.topMenus.map((item, i) =>
              normalizeTopMenu(item, `footer-menu-migrated-${i}`, i + 1)
            )
          )
        )
      : buildSeedTopMenus()
    const relatedLogos = Array.isArray(parsed.relatedLogos)
      ? reindexRelatedSortOrder(
          sortByOrder(
            parsed.relatedLogos.map((item, i) =>
              normalizeRelatedLogo(item, `footer-logo-migrated-${i}`, i + 1)
            )
          )
        )
      : buildSeedRelatedLogos()
    return {
      version: 1,
      topMenus,
      orgInfo: normalizeOrgInfo(parsed.orgInfo),
      relatedLogos,
    }
  } catch {
    return {
      version: 1,
      topMenus: buildSeedTopMenus(),
      orgInfo: buildSeedOrgInfo(),
      relatedLogos: buildSeedRelatedLogos(),
    }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(FOOTER_CHANGED_EVENT))
}

function ensurePersisted(): StoreFile {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file
}

export function readFooterTopMenus(): FooterTopMenu[] {
  return sortByOrder(ensurePersisted().topMenus)
}

export function reorderFooterTopMenus(orderedIds: string[]): FooterTopMenu[] {
  const file = ensurePersisted()
  const map = new Map(file.topMenus.map(item => [item.id, item]))
  const next = orderedIds
    .map(id => map.get(id))
    .filter((item): item is FooterTopMenu => Boolean(item))
  if (next.length !== file.topMenus.length) {
    throw new Error('Footer top menu reorder: incomplete id list')
  }
  const reindexed = reindexSortOrder(next)
  writeFile({ ...file, topMenus: reindexed })
  return reindexed
}

export function setFooterTopMenuActive(id: string, isActive: boolean): FooterTopMenu {
  const file = ensurePersisted()
  const index = file.topMenus.findIndex(row => row.id === id)
  if (index < 0) throw new Error(`Footer top menu not found: ${id}`)
  const next = [...file.topMenus]
  next[index] = { ...next[index]!, isActive }
  writeFile({ ...file, topMenus: next })
  return next[index]!
}

export function saveFooterTopMenus(patches: FooterTopMenuPatch[]): FooterTopMenu[] {
  const file = ensurePersisted()
  const patchMap = new Map(patches.map(p => [p.id, p]))
  const next = file.topMenus.map(row => {
    const patch = patchMap.get(row.id)
    if (!patch) return row
    return {
      ...row,
      name: patch.name.trim() || row.name,
      linkUrl: patch.linkUrl.trim(),
    }
  })
  writeFile({ ...file, topMenus: next })
  return sortByOrder(next)
}

export function readFooterOrgInfo(): FooterOrgInfo {
  return ensurePersisted().orgInfo
}

export function saveFooterOrgInfo(data: FooterOrgInfo): FooterOrgInfo {
  const file = ensurePersisted()
  const next = normalizeOrgInfo({
    ...data,
    name: data.name.trim(),
    address: data.address.trim(),
    zipCode: data.zipCode.trim(),
    representative: data.representative.trim(),
    businessNumber: data.businessNumber.trim(),
    phone: data.phone.trim(),
    fax: data.fax.trim(),
    email: data.email.trim(),
    logoUrl: data.logoUrl.trim(),
    logoFileName: data.logoFileName,
    updatedAt: new Date().toISOString(),
  })
  writeFile({ ...file, orgInfo: next })
  return next
}

export function readFooterRelatedLogos(): FooterRelatedLogo[] {
  return sortByOrder(ensurePersisted().relatedLogos)
}

export function reorderFooterRelatedLogos(orderedIds: string[]): FooterRelatedLogo[] {
  const file = ensurePersisted()
  const map = new Map(file.relatedLogos.map(item => [item.id, item]))
  const next = orderedIds
    .map(id => map.get(id))
    .filter((item): item is FooterRelatedLogo => Boolean(item))
  if (next.length !== file.relatedLogos.length) {
    throw new Error('Footer related logo reorder: incomplete id list')
  }
  const reindexed = reindexRelatedSortOrder(next)
  writeFile({ ...file, relatedLogos: reindexed })
  return reindexed
}

export function setFooterRelatedLogoActive(id: string, isActive: boolean): FooterRelatedLogo {
  const file = ensurePersisted()
  const index = file.relatedLogos.findIndex(row => row.id === id)
  if (index < 0) throw new Error(`Footer related logo not found: ${id}`)
  const next = [...file.relatedLogos]
  next[index] = { ...next[index]!, isActive }
  writeFile({ ...file, relatedLogos: next })
  return next[index]!
}

export function saveFooterRelatedLogo(input: FooterRelatedLogoSaveInput): FooterRelatedLogo {
  const file = ensurePersisted()
  const index = file.relatedLogos.findIndex(row => row.id === input.id)
  if (index < 0) throw new Error(`Footer related logo not found: ${input.id}`)
  const name = input.name.trim()
  const logoUrl = input.logoUrl.trim()
  const hasContent = Boolean(name || logoUrl)
  const next: FooterRelatedLogo = {
    ...file.relatedLogos[index]!,
    isActive: input.isActive,
    hasContent,
    name,
    logoUrl,
    logoFileName: input.logoFileName,
  }
  const items = [...file.relatedLogos]
  items[index] = next
  writeFile({ ...file, relatedLogos: items })
  return next
}
