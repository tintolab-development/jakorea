/**
 * 연혁·수상·인증 — localStorage mock
 */

import type {
  AwardCreateInput,
  AwardItem,
  AwardListFilter,
  CertCreateInput,
  CertItem,
  CertListFilter,
  HistoryCreateInput,
  HistoryItem,
  HistoryListFilter,
} from '@/entities/history-awards-certs/model/types'

const HISTORY_KEY = 'admin.jakorea.history.v1'
const AWARD_KEY = 'admin.jakorea.award.v1'
const CERT_KEY = 'admin.jakorea.cert.v1'

export const HISTORY_CHANGED_EVENT = 'jakorea:history-changed' as const
export const AWARD_CHANGED_EVENT = 'jakorea:award-changed' as const
export const CERT_CHANGED_EVENT = 'jakorea:cert-changed' as const

type FileV1<T> = { version: 1; items: T[] }

function emit(event: string): void {
  window.dispatchEvent(new CustomEvent(event))
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isoDaysAgo(days: number, hour = 9, minute = 15): string {
  const d = new Date('2026-09-15T00:00:00.000Z')
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(hour, minute, 0, 0)
  return d.toISOString()
}

/* ── Seed ───────────────────────────────────────── */

function buildSeedHistory(): HistoryItem[] {
  const contents = [
    '2026 BETTER GROUND High School 6개국 확대 운영',
    '제 21회 JA Future Economy Forum 개최',
    '2025 미래인재 양성 프로젝트 100개 학교 참여',
    'JA Korea 교육 네트워크 전국 200개 지역 달성',
    '청소년 금융교육 프로그램 신규 런칭',
    "기업가정신 캠프 'Startup Heroes' 개최",
    '글로벌 파트너십 업무협약 체결',
    '디지털 리터러시 교육 과정 개설',
    '연간 교육 수혜 청소년 9만 명 돌파',
    '사회공헌 우수기관 선정 기념 세미나 개최',
  ]
  return contents.map((content, i) => ({
    id: `history-${i + 1}`,
    isPublic: true,
    year: 2026 - Math.floor(i / 3),
    month: ((5 - i + 12) % 12) + 1,
    content,
    createdAt: isoDaysAgo(i * 12),
    version: 0,
  }))
}

function buildSeedAwards(): AwardItem[] {
  return [
    {
      id: 'award-1',
      isPublic: true,
      title: '서울특별시 자원봉사 대상 대상 수상',
      organization: '행정안전부, 한국자원봉사센터협회',
      awardedOn: '2026-05-15',
      createdAt: isoDaysAgo(10),
      version: 0,
    },
    {
      id: 'award-2',
      isPublic: true,
      title: '청소년 교육 기여 유공 표창',
      organization: '교육부',
      awardedOn: '2025-11-20',
      createdAt: isoDaysAgo(40),
      version: 0,
    },
    {
      id: 'award-3',
      isPublic: true,
      title: '사회공헌 우수기관 선정',
      organization: '한국사회복지협의회',
      awardedOn: '2025-06-01',
      createdAt: isoDaysAgo(80),
      version: 0,
    },
    {
      id: 'award-4',
      isPublic: false,
      title: '기업가정신 교육 우수 기관상',
      organization: '중소벤처기업부',
      awardedOn: '2024-12-10',
      createdAt: isoDaysAgo(120),
      version: 0,
    },
    {
      id: 'award-5',
      isPublic: true,
      title: '디지털 교육 혁신상',
      organization: '과학기술정보통신부',
      awardedOn: '2024-08-22',
      createdAt: isoDaysAgo(160),
      version: 0,
    },
  ]
}

function buildSeedCerts(): CertItem[] {
  return [
    {
      id: 'cert-1',
      isPublic: true,
      content: '교육기부기관 지정 (인증번호 제2011-062호)',
      organization: '교육부',
      certifiedOn: '2025-09-15',
      createdAt: isoDaysAgo(5),
      version: 0,
    },
    {
      id: 'cert-2',
      isPublic: true,
      content: '청소년 활동 진흥 인증 기관',
      organization: '여성가족부',
      certifiedOn: '2024-11-01',
      createdAt: isoDaysAgo(50),
      version: 0,
    },
    {
      id: 'cert-3',
      isPublic: true,
      content: '비영리민간단체 등록',
      organization: '행정안전부',
      certifiedOn: '2023-03-20',
      createdAt: isoDaysAgo(100),
      version: 0,
    },
    {
      id: 'cert-4',
      isPublic: false,
      content: 'ISO 교육서비스 품질 인증',
      organization: '한국표준협회',
      certifiedOn: '2022-07-08',
      createdAt: isoDaysAgo(150),
      version: 0,
    },
  ]
}

/* ── Generic file helpers ───────────────────────── */

function readFile<T extends { version?: number }>(key: string, seed: () => T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      const items = seed()
      localStorage.setItem(key, JSON.stringify({ version: 1, items } satisfies FileV1<T>))
      return items
    }
    const parsed = JSON.parse(raw) as FileV1<T>
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      const items = seed()
      localStorage.setItem(key, JSON.stringify({ version: 1, items } satisfies FileV1<T>))
      return items
    }
    return parsed.items.map(item => ({
      ...item,
      version: typeof item.version === 'number' ? item.version : 0,
    }))
  } catch {
    return seed()
  }
}

function writeFile<T>(key: string, items: T[], event: string): void {
  localStorage.setItem(key, JSON.stringify({ version: 1, items } satisfies FileV1<T>))
  emit(event)
}

function inCreatedRange(iso: string, from?: string, to?: string): boolean {
  if (!from && !to) return true
  const day = iso.slice(0, 10)
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

function inYmdRange(ymd: string, from?: string, to?: string): boolean {
  if (!from && !to) return true
  if (from && ymd < from) return false
  if (to && ymd > to) return false
  return true
}

/* ── History ─────────────────────────────────────── */

export function listHistoryItems(filter: HistoryListFilter = {}): HistoryItem[] {
  let items = [...readFile(HISTORY_KEY, buildSeedHistory)]
  if (filter.isPublic === true) items = items.filter(i => i.isPublic)
  if (filter.isPublic === false) items = items.filter(i => !i.isPublic)
  if (filter.year != null) items = items.filter(i => i.year === filter.year)
  if (filter.month != null) items = items.filter(i => i.month === filter.month)
  const q = filter.content?.trim().toLowerCase()
  if (q) items = items.filter(i => i.content.toLowerCase().includes(q))
  items = items.filter(i => inCreatedRange(i.createdAt, filter.createdFrom, filter.createdTo))

  const sort = filter.sort ?? 'event'
  items.sort((a, b) => {
    if (sort === 'created') return b.createdAt.localeCompare(a.createdAt)
    if (a.year !== b.year) return b.year - a.year
    if (a.month !== b.month) return b.month - a.month
    return b.createdAt.localeCompare(a.createdAt)
  })
  return items
}

export function createHistoryItem(input: HistoryCreateInput): HistoryItem {
  const items = readFile(HISTORY_KEY, buildSeedHistory)
  const row: HistoryItem = {
    id: newId('history'),
    isPublic: input.isPublic,
    year: input.year,
    month: input.month,
    content: input.content.trim(),
    createdAt: new Date().toISOString(),
    version: 0,
  }
  writeFile(HISTORY_KEY, [row, ...items], HISTORY_CHANGED_EVENT)
  return row
}

export function updateHistoryItem(id: string, patch: HistoryCreateInput): HistoryItem {
  const items = readFile(HISTORY_KEY, buildSeedHistory)
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('History item not found')
  const next: HistoryItem = {
    ...items[idx]!,
    isPublic: patch.isPublic,
    year: patch.year,
    month: patch.month,
    content: patch.content.trim(),
  }
  items[idx] = next
  writeFile(HISTORY_KEY, items, HISTORY_CHANGED_EVENT)
  return next
}

export function setHistoryPublic(id: string, isPublic: boolean): HistoryItem {
  const items = readFile(HISTORY_KEY, buildSeedHistory)
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('History item not found')
  const next = { ...items[idx]!, isPublic }
  items[idx] = next
  writeFile(HISTORY_KEY, items, HISTORY_CHANGED_EVENT)
  return next
}

export function removeHistoryItems(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const items = readFile(HISTORY_KEY, buildSeedHistory).filter(i => !idSet.has(i.id))
  writeFile(HISTORY_KEY, items, HISTORY_CHANGED_EVENT)
}

/* ── Award ───────────────────────────────────────── */

export function listAwardItems(filter: AwardListFilter = {}): AwardItem[] {
  let items = [...readFile(AWARD_KEY, buildSeedAwards)]
  if (filter.isPublic === true) items = items.filter(i => i.isPublic)
  if (filter.isPublic === false) items = items.filter(i => !i.isPublic)
  const titleQ = filter.title?.trim().toLowerCase()
  if (titleQ) items = items.filter(i => i.title.toLowerCase().includes(titleQ))
  const orgQ = filter.organization?.trim().toLowerCase()
  if (orgQ) items = items.filter(i => i.organization.toLowerCase().includes(orgQ))
  items = items.filter(i => inYmdRange(i.awardedOn, filter.awardedFrom, filter.awardedTo))
  items = items.filter(i => inCreatedRange(i.createdAt, filter.createdFrom, filter.createdTo))

  const sort = filter.sort ?? 'date'
  items.sort((a, b) => {
    if (sort === 'created') return b.createdAt.localeCompare(a.createdAt)
    return b.awardedOn.localeCompare(a.awardedOn) || b.createdAt.localeCompare(a.createdAt)
  })
  return items
}

export function createAwardItem(input: AwardCreateInput): AwardItem {
  const items = readFile(AWARD_KEY, buildSeedAwards)
  const row: AwardItem = {
    id: newId('award'),
    isPublic: input.isPublic,
    title: input.title.trim(),
    organization: input.organization.trim(),
    awardedOn: input.awardedOn,
    createdAt: new Date().toISOString(),
    version: 0,
  }
  writeFile(AWARD_KEY, [row, ...items], AWARD_CHANGED_EVENT)
  return row
}

export function updateAwardItem(id: string, patch: AwardCreateInput): AwardItem {
  const items = readFile(AWARD_KEY, buildSeedAwards)
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('Award item not found')
  const next: AwardItem = {
    ...items[idx]!,
    isPublic: patch.isPublic,
    title: patch.title.trim(),
    organization: patch.organization.trim(),
    awardedOn: patch.awardedOn,
  }
  items[idx] = next
  writeFile(AWARD_KEY, items, AWARD_CHANGED_EVENT)
  return next
}

export function setAwardPublic(id: string, isPublic: boolean): AwardItem {
  const items = readFile(AWARD_KEY, buildSeedAwards)
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('Award item not found')
  const next = { ...items[idx]!, isPublic }
  items[idx] = next
  writeFile(AWARD_KEY, items, AWARD_CHANGED_EVENT)
  return next
}

export function removeAwardItems(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const items = readFile(AWARD_KEY, buildSeedAwards).filter(i => !idSet.has(i.id))
  writeFile(AWARD_KEY, items, AWARD_CHANGED_EVENT)
}

/* ── Cert ────────────────────────────────────────── */

export function listCertItems(filter: CertListFilter = {}): CertItem[] {
  let items = [...readFile(CERT_KEY, buildSeedCerts)]
  if (filter.isPublic === true) items = items.filter(i => i.isPublic)
  if (filter.isPublic === false) items = items.filter(i => !i.isPublic)
  const contentQ = filter.content?.trim().toLowerCase()
  if (contentQ) items = items.filter(i => i.content.toLowerCase().includes(contentQ))
  const orgQ = filter.organization?.trim().toLowerCase()
  if (orgQ) items = items.filter(i => i.organization.toLowerCase().includes(orgQ))
  items = items.filter(i => inYmdRange(i.certifiedOn, filter.certifiedFrom, filter.certifiedTo))
  items = items.filter(i => inCreatedRange(i.createdAt, filter.createdFrom, filter.createdTo))

  const sort = filter.sort ?? 'date'
  items.sort((a, b) => {
    if (sort === 'created') return b.createdAt.localeCompare(a.createdAt)
    return (
      b.certifiedOn.localeCompare(a.certifiedOn) || b.createdAt.localeCompare(a.createdAt)
    )
  })
  return items
}

export function createCertItem(input: CertCreateInput): CertItem {
  const items = readFile(CERT_KEY, buildSeedCerts)
  const row: CertItem = {
    id: newId('cert'),
    isPublic: input.isPublic,
    content: input.content.trim(),
    organization: input.organization.trim(),
    certifiedOn: input.certifiedOn,
    createdAt: new Date().toISOString(),
    version: 0,
  }
  writeFile(CERT_KEY, [row, ...items], CERT_CHANGED_EVENT)
  return row
}

export function updateCertItem(id: string, patch: CertCreateInput): CertItem {
  const items = readFile(CERT_KEY, buildSeedCerts)
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('Cert item not found')
  const next: CertItem = {
    ...items[idx]!,
    isPublic: patch.isPublic,
    content: patch.content.trim(),
    organization: patch.organization.trim(),
    certifiedOn: patch.certifiedOn,
  }
  items[idx] = next
  writeFile(CERT_KEY, items, CERT_CHANGED_EVENT)
  return next
}

export function setCertPublic(id: string, isPublic: boolean): CertItem {
  const items = readFile(CERT_KEY, buildSeedCerts)
  const idx = items.findIndex(i => i.id === id)
  if (idx < 0) throw new Error('Cert item not found')
  const next = { ...items[idx]!, isPublic }
  items[idx] = next
  writeFile(CERT_KEY, items, CERT_CHANGED_EVENT)
  return next
}

export function removeCertItems(ids: string[]): void {
  if (ids.length === 0) return
  const idSet = new Set(ids)
  const items = readFile(CERT_KEY, buildSeedCerts).filter(i => !idSet.has(i.id))
  writeFile(CERT_KEY, items, CERT_CHANGED_EVENT)
}
