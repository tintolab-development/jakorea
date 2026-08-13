/**
 * 보고서 및 공시 관리 — localStorage mock
 */

import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'

const STORAGE_ANNUAL = 'admin.jakorea.reports.annual.v1'
const STORAGE_AUDIT = 'admin.jakorea.reports.audit.v1'
const STORAGE_NTS = 'admin.jakorea.ntsDisclosure.v1'

export const REPORTS_CHANGED_EVENT = 'jakorea:reports-disclosure-changed' as const
export const NTS_DISCLOSURE_CHANGED_EVENT = 'jakorea:nts-disclosure-changed' as const

type ReportFile = {
  version: 1
  items: TransparencyReport[]
}

type NtsFile = {
  version: 1
  data: NtsDisclosure
}

function storageKey(kind: ReportKind): string {
  return kind === 'annual' ? STORAGE_ANNUAL : STORAGE_AUDIT
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/** 단색 커버 placeholder (data URL) */
function seedThumbnail(label: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="226" viewBox="0 0 160 226">
    <rect width="160" height="226" fill="${bg}"/>
    <text x="80" y="118" text-anchor="middle" fill="#fff" font-family="Pretendard,sans-serif" font-size="11" font-weight="600">${label}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function buildSeedReports(kind: ReportKind): TransparencyReport[] {
  const base = new Date('2026-09-15T09:15:00.000Z')
  const prefix =
    kind === 'annual'
      ? { title: 'Annual Report JA Korea', file: 'Annual Report JA Korea' }
      : { title: '외부 회계감사 보고서', file: '외부 회계감사 보고서' }
  const colors =
    kind === 'annual'
      ? ['#01A1AF', '#0E7490', '#155E75', '#0F766E', '#0369A1', '#1D4ED8']
      : ['#01A1AF', '#16A34A', '#2563EB', '#7C3AED', '#DB2777', '#EA580C']

  return Array.from({ length: 18 }, (_, i) => {
    const year = 2025 - (i % 6)
    const idx = 18 - i
    const created = new Date(base.getTime() - i * 86_400_000 * 3)
    const title =
      kind === 'annual'
        ? `${year} ${prefix.title}`
        : `${year} ${prefix.title}`
    const fileBase =
      kind === 'annual' ? `${year} ${prefix.file}` : `${year} ${prefix.file}`
    return {
      id: `${kind}-report-${idx}`,
      kind,
      title,
      thumbnailUrl: seedThumbnail(
        kind === 'annual' ? `${year}` : `${year}년`,
        colors[i % colors.length]!
      ),
      thumbnailFileName: `${fileBase}-thumb.png`,
      attachmentFileName: `${fileBase}.pdf`,
      attachmentUrl: `data:application/pdf;base64,`,
      version: 0,
      downloadCount: 915,
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    }
  })
}

function buildSeedNts(): NtsDisclosure {
  return {
    linkUrl:
      'https://teht.hometax.go.kr/websquare/websquare.wq?w2xPath=/ui/sf/a/c/UTESFACJ01.xml&tmIdx=0&tm2lIdx=&tm3lIdx=',
    updatedAt: '2026-07-01T00:00:00.000Z',
    version: 0,
  }
}

function normalizeReport(
  raw: Partial<TransparencyReport>,
  kind: ReportKind,
  seed: TransparencyReport
): TransparencyReport {
  return {
    id: asString(raw.id, seed.id),
    kind,
    title: asString(raw.title, seed.title),
    thumbnailUrl: asString(raw.thumbnailUrl, seed.thumbnailUrl),
    thumbnailFileName: asString(raw.thumbnailFileName, seed.thumbnailFileName),
    attachmentFileName: asString(raw.attachmentFileName, seed.attachmentFileName),
    attachmentUrl: asString(raw.attachmentUrl, seed.attachmentUrl),
    version: asNumber(raw.version, seed.version),
    downloadCount: asNumber(raw.downloadCount, seed.downloadCount),
    createdAt: asString(raw.createdAt, seed.createdAt),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readReportFile(kind: ReportKind): ReportFile {
  const seed = buildSeedReports(kind)
  try {
    const raw = localStorage.getItem(storageKey(kind))
    if (!raw) return { version: 1, items: seed }
    const parsed = JSON.parse(raw) as ReportFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: seed }
    }
    return {
      version: 1,
      items: parsed.items.map((item, i) =>
        normalizeReport(item, kind, seed[i] ?? seed[0]!)
      ),
    }
  } catch {
    return { version: 1, items: seed }
  }
}

function writeReportFile(kind: ReportKind, file: ReportFile): void {
  localStorage.setItem(storageKey(kind), JSON.stringify(file))
  window.dispatchEvent(
    new CustomEvent(REPORTS_CHANGED_EVENT, { detail: { kind } })
  )
}

function sortByCreatedDesc(items: TransparencyReport[]): TransparencyReport[] {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

function ymd(iso: string): string {
  return iso.slice(0, 10)
}

export function listReports(
  kind: ReportKind,
  filter: ReportListFilter = {}
): TransparencyReport[] {
  const file = readReportFile(kind)
  if (!localStorage.getItem(storageKey(kind))) {
    writeReportFile(kind, file)
  }
  let items = sortByCreatedDesc(file.items)

  const titleQ = filter.title?.trim().toLowerCase()
  if (titleQ) {
    items = items.filter(r => r.title.toLowerCase().includes(titleQ))
  }
  const attQ = filter.attachmentName?.trim().toLowerCase()
  if (attQ) {
    items = items.filter(r => r.attachmentFileName.toLowerCase().includes(attQ))
  }
  if (filter.createdFrom) {
    items = items.filter(r => ymd(r.createdAt) >= filter.createdFrom!)
  }
  if (filter.createdTo) {
    items = items.filter(r => ymd(r.createdAt) <= filter.createdTo!)
  }
  return items
}

export function getReport(kind: ReportKind, id: string): TransparencyReport | null {
  return listReports(kind).find(r => r.id === id) ?? null
}

export function createReport(
  kind: ReportKind,
  input: ReportCreateInput
): TransparencyReport {
  const file = readReportFile(kind)
  const now = new Date().toISOString()
  const next: TransparencyReport = {
    id: `${kind}-${Date.now()}`,
    kind,
    title: input.title.trim(),
    thumbnailUrl: input.thumbnailUrl,
    thumbnailFileName: input.thumbnailFileName,
    attachmentFileName: input.attachmentFileName,
    attachmentUrl: input.attachmentUrl,
    version: 0,
    downloadCount: 0,
    createdAt: now,
    updatedAt: now,
  }
  writeReportFile(kind, {
    version: 1,
    items: sortByCreatedDesc([next, ...file.items]),
  })
  return next
}

export function updateReport(
  kind: ReportKind,
  input: ReportUpdateInput
): TransparencyReport {
  const file = readReportFile(kind)
  const index = file.items.findIndex(r => r.id === input.id)
  if (index < 0) throw new Error(`Report not found: ${input.id}`)
  const prev = file.items[index]!
  const next: TransparencyReport = {
    ...prev,
    title: input.title.trim(),
    thumbnailUrl: input.thumbnailUrl,
    thumbnailFileName: input.thumbnailFileName,
    attachmentFileName: input.attachmentFileName,
    attachmentUrl: input.attachmentUrl,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[index] = next
  writeReportFile(kind, { version: 1, items: sortByCreatedDesc(items) })
  return next
}

export function removeReports(kind: ReportKind, ids: string[]): void {
  const file = readReportFile(kind)
  const idSet = new Set(ids)
  writeReportFile(kind, {
    version: 1,
    items: file.items.filter(r => !idSet.has(r.id)),
  })
}

// —— NTS ——

function readNtsFile(): NtsFile {
  try {
    const raw = localStorage.getItem(STORAGE_NTS)
    if (!raw) return { version: 1, data: buildSeedNts() }
    const parsed = JSON.parse(raw) as NtsFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedNts() }
    }
    return {
      version: 1,
      data: {
        linkUrl: asString(parsed.data.linkUrl, buildSeedNts().linkUrl),
        updatedAt: asString(parsed.data.updatedAt, buildSeedNts().updatedAt),
        version: asNumber(parsed.data.version, 0),
      },
    }
  } catch {
    return { version: 1, data: buildSeedNts() }
  }
}

function writeNtsFile(file: NtsFile): void {
  localStorage.setItem(STORAGE_NTS, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(NTS_DISCLOSURE_CHANGED_EVENT))
}

export function readNtsDisclosure(): NtsDisclosure {
  const file = readNtsFile()
  if (!localStorage.getItem(STORAGE_NTS)) {
    writeNtsFile(file)
  }
  return file.data
}

export function saveNtsDisclosure(linkUrl: string): NtsDisclosure {
  const prev = readNtsDisclosure()
  const next: NtsDisclosure = {
    linkUrl: linkUrl.trim(),
    updatedAt: new Date().toISOString(),
    version: prev.version,
  }
  writeNtsFile({ version: 1, data: next })
  return next
}
