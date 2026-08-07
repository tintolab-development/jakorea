/**
 * 기업 후원 상담 신청 — localStorage mock
 */

import type {
  CorporateConsultation,
  CorporateConsultationListFilter,
  CorporateConsultationPrivacyLog,
  ConsultationStatus,
} from '@/entities/corporate-consultation/model/types'

const STORAGE_KEY = 'admin.sponsor.corporateConsultations.v1'
const PRIVACY_LOG_KEY = 'admin.sponsor.corporateConsultations.privacyLog.v1'

export const CORPORATE_CONSULTATIONS_CHANGED_EVENT =
  'jakorea:corporate-consultations-changed' as const

export const DEFAULT_CONFIRM_ACTOR = '홍길동'

export const PRIVACY_VIEW_PURPOSE = '기업 상담 신청 대응을 위함'

type StoreFile = {
  version: 1
  items: CorporateConsultation[]
}

type PrivacyLogFile = {
  version: 1
  items: CorporateConsultationPrivacyLog[]
}

const SAMPLE_CONTENT =
  '안녕하세요. 기업 후원 관련해서 상담을 하고자 요청드립니다. 내년부터 후원에 참여하고 싶은데 일정상 가능한지, 절차와 혜택을 안내해 주시면 감사하겠습니다.'

const MOCK_ATTACHMENT =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#e8eef0"/><text x="60" y="44" text-anchor="middle" fill="#666" font-size="12">file</text></svg>`
  )

const SEED_COMPANIES = [
  '삼성',
  'Citi',
  'IBM',
  'Google',
  'KRAFTON',
  '네이버',
  '카카오',
  'SK하이닉스',
  '현대자동차',
  'LG전자',
  '아모레퍼시픽',
  '틴토랩',
  '포스코',
  'KT',
  '한화',
  'CJ',
  '롯데',
  '신한은행',
  '우리은행',
  'KB국민은행',
  '토스',
  '쿠팡',
  '배달의민족',
  '야놀자',
  '라인',
  'NHN',
  '넷마블',
  'NC소프트',
  '스마일게이트',
] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function buildSeedRows(): CorporateConsultation[] {
  const rows: CorporateConsultation[] = []
  const base = new Date('2025-12-10T09:15:00+09:00')

  for (let i = 0; i < SEED_COMPANIES.length; i++) {
    const companyName = SEED_COMPANIES[i]!
    const isConfirmed = i % 3 !== 0
    const applied = new Date(base)
    applied.setDate(base.getDate() - i)
    applied.setHours(9 + (i % 8), 15 + (i % 3) * 10, 0, 0)

    let confirmedAt: string | null = null
    let confirmedByName: string | null = null
    if (isConfirmed) {
      const confirmed = new Date(applied)
      confirmed.setHours(applied.getHours() + 2, applied.getMinutes() + 5, 0, 0)
      confirmedAt = confirmed.toISOString()
      confirmedByName = DEFAULT_CONFIRM_ACTOR
    }

    const phoneTail = pad2(10 + (i % 90)) + pad2(i % 100)
    const hasLink = i % 4 === 0
    const hasFile = i % 5 === 0

    rows.push({
      id: `corp-consult-${pad2(i + 1)}`,
      status: isConfirmed ? 'confirmed' : 'pending',
      companyName,
      contactName: i % 2 === 0 ? '홍길동' : '김영희',
      departmentTitle: i % 3 === 0 ? '대리' : i % 3 === 1 ? '과장' : 'CSR팀',
      phone: `010-${1000 + (i % 9000)}-${phoneTail.slice(0, 4)}`,
      privacyConsent: true,
      content:
        companyName === '틴토랩'
          ? '안녕하세요 틴토랩 담당자입니다. 기업 후원 관련해서 상담을 하고자 요청드립니다. 내년부터 후원에 참여하고 싶은데 일정상 가능한지...'
          : SAMPLE_CONTENT,
      linkUrl: hasLink ? 'https://www.samsung.com' : null,
      attachmentFileName: hasFile ? 'text.jpg' : null,
      attachmentUrl: hasFile ? MOCK_ATTACHMENT : null,
      appliedAt: applied.toISOString(),
      confirmedAt,
      confirmedByName,
    })
  }

  // 시안 상세 샘플 고정
  const detailSampleIdx = rows.findIndex(r => r.companyName === '틴토랩')
  if (detailSampleIdx >= 0) {
    const sample = rows[detailSampleIdx]!
    rows[detailSampleIdx] = {
      ...sample,
      status: 'confirmed',
      phone: '010-1234-5678',
      contactName: '홍길동',
      departmentTitle: '대리',
      linkUrl: 'https://www.samsung.com',
      attachmentFileName: 'text.jpg',
      attachmentUrl: MOCK_ATTACHMENT,
      appliedAt: '2025-12-08T09:15:00+09:00',
      confirmedAt: '2025-12-08T09:15:00+09:00',
      confirmedByName: DEFAULT_CONFIRM_ACTOR,
    }
  }

  return rows
}

function asString(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function asStatus(v: unknown): ConsultationStatus {
  return v === 'confirmed' ? 'confirmed' : 'pending'
}

function normalizeItem(raw: Partial<CorporateConsultation>, fallbackId: string): CorporateConsultation {
  const appliedAt = asString(raw.appliedAt, new Date().toISOString())
  const status = asStatus(raw.status)
  return {
    id: asString(raw.id, fallbackId),
    status,
    companyName: asString(raw.companyName),
    contactName: asString(raw.contactName),
    departmentTitle: asString(raw.departmentTitle),
    phone: asString(raw.phone),
    privacyConsent: true,
    content: asString(raw.content),
    linkUrl: typeof raw.linkUrl === 'string' && raw.linkUrl.trim() ? raw.linkUrl.trim() : null,
    attachmentFileName:
      typeof raw.attachmentFileName === 'string' && raw.attachmentFileName.trim()
        ? raw.attachmentFileName.trim()
        : null,
    attachmentUrl:
      typeof raw.attachmentUrl === 'string' && raw.attachmentUrl.trim()
        ? raw.attachmentUrl.trim()
        : null,
    appliedAt,
    confirmedAt:
      typeof raw.confirmedAt === 'string' && raw.confirmedAt.trim() ? raw.confirmedAt : null,
    confirmedByName:
      typeof raw.confirmedByName === 'string' && raw.confirmedByName.trim()
        ? raw.confirmedByName.trim()
        : null,
  }
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 1, items: buildSeedRows() }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedRows() }
    }
    return {
      version: 1,
      items: parsed.items.map((item, i) => normalizeItem(item, `corp-consult-migrated-${i}`)),
    }
  } catch {
    return { version: 1, items: buildSeedRows() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(CORPORATE_CONSULTATIONS_CHANGED_EVENT))
}

function readPrivacyLogs(): PrivacyLogFile {
  try {
    const raw = localStorage.getItem(PRIVACY_LOG_KEY)
    if (!raw) return { version: 1, items: [] }
    const parsed = JSON.parse(raw) as PrivacyLogFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: [] }
    }
    return parsed
  } catch {
    return { version: 1, items: [] }
  }
}

function writePrivacyLogs(file: PrivacyLogFile): void {
  localStorage.setItem(PRIVACY_LOG_KEY, JSON.stringify(file))
}

function sortByAppliedDesc(items: CorporateConsultation[]): CorporateConsultation[] {
  return [...items].sort((a, b) => {
    const ta = new Date(a.appliedAt).getTime()
    const tb = new Date(b.appliedAt).getTime()
    return tb - ta
  })
}

function dayEnd(isoDate: string): number {
  const to = new Date(isoDate)
  if (Number.isNaN(to.getTime())) return Number.NaN
  to.setHours(23, 59, 59, 999)
  return to.getTime()
}

function matchesFilter(
  item: CorporateConsultation,
  filter: CorporateConsultationListFilter
): boolean {
  if (filter.status && item.status !== filter.status) return false

  if (filter.companyName) {
    const q = filter.companyName.trim().toLowerCase()
    if (q && !item.companyName.toLowerCase().includes(q)) return false
  }
  if (filter.contactName) {
    const q = filter.contactName.trim().toLowerCase()
    if (q && !item.contactName.toLowerCase().includes(q)) return false
  }
  if (filter.departmentTitle) {
    const q = filter.departmentTitle.trim().toLowerCase()
    if (q && !item.departmentTitle.toLowerCase().includes(q)) return false
  }

  if (filter.appliedFrom) {
    const from = new Date(filter.appliedFrom).getTime()
    if (!Number.isNaN(from) && new Date(item.appliedAt).getTime() < from) return false
  }
  if (filter.appliedTo) {
    const end = dayEnd(filter.appliedTo)
    if (!Number.isNaN(end) && new Date(item.appliedAt).getTime() > end) return false
  }

  if (filter.confirmedFrom || filter.confirmedTo) {
    if (!item.confirmedAt) return false
    if (filter.confirmedFrom) {
      const from = new Date(filter.confirmedFrom).getTime()
      if (!Number.isNaN(from) && new Date(item.confirmedAt).getTime() < from) return false
    }
    if (filter.confirmedTo) {
      const end = dayEnd(filter.confirmedTo)
      if (!Number.isNaN(end) && new Date(item.confirmedAt).getTime() > end) return false
    }
  }

  return true
}

export function readCorporateConsultations(
  filter: CorporateConsultationListFilter = {}
): CorporateConsultation[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return sortByAppliedDesc(file.items.filter(item => matchesFilter(item, filter)))
}

export function getCorporateConsultation(id: string): CorporateConsultation | null {
  const file = readFile()
  return file.items.find(item => item.id === id) ?? null
}

/**
 * 상세 조회 + 개인정보 마스킹 해제에 따른 mock 감사 로그
 */
export function getCorporateConsultationWithPrivacyLog(
  id: string,
  actorName: string = DEFAULT_CONFIRM_ACTOR
): CorporateConsultation | null {
  const item = getCorporateConsultation(id)
  if (!item) return null

  const logs = readPrivacyLogs()
  const entry: CorporateConsultationPrivacyLog = {
    id: `privacy-log-${Date.now()}`,
    consultationId: id,
    purpose: PRIVACY_VIEW_PURPOSE,
    viewedAt: new Date().toISOString(),
    actorName: actorName.trim() || DEFAULT_CONFIRM_ACTOR,
  }
  writePrivacyLogs({ version: 1, items: [entry, ...logs.items] })
  return item
}

export function removeCorporateConsultations(ids: string[]): void {
  const idSet = new Set(ids)
  const file = readFile()
  writeFile({ version: 1, items: file.items.filter(row => !idSet.has(row.id)) })
}

/**
 * 확인 대기 건만 확인 완료로 변경. 이미 완료된 건은 no-op.
 */
export function confirmCorporateConsultations(
  ids: string[],
  actorName: string = DEFAULT_CONFIRM_ACTOR
): CorporateConsultation[] {
  const idSet = new Set(ids)
  const file = readFile()
  const now = new Date().toISOString()
  const actor = actorName.trim() || DEFAULT_CONFIRM_ACTOR
  const updated: CorporateConsultation[] = []

  const items = file.items.map(row => {
    if (!idSet.has(row.id) || row.status !== 'pending') return row
    const next: CorporateConsultation = {
      ...row,
      status: 'confirmed',
      confirmedAt: now,
      confirmedByName: actor,
    }
    updated.push(next)
    return next
  })

  writeFile({ version: 1, items })
  return updated
}

export function readPrivacyLogEntries(): CorporateConsultationPrivacyLog[] {
  return readPrivacyLogs().items
}
