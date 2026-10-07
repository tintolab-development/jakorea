import type { WritingTemplateCategory } from '@/features/template/model/template-create.types'
import type { TemplateRow, TemplateSection } from '@/features/template/model/template.schema'

const STORAGE_KEY = 'jakorea.cms.user-created-writing-templates'

export type UserCreatedWritingTemplateEntry = {
  templateCode: string
  templateName: string
  sectionKey: WritingTemplateCategory
  createdAt: string
}

let entries: UserCreatedWritingTemplateEntry[] = readStoredEntries()
let version = 0
const listeners = new Set<() => void>()

function readStoredEntries(): UserCreatedWritingTemplateEntry[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw == null || raw.trim() === '') return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isUserCreatedWritingTemplateEntry)
  } catch {
    return []
  }
}

function isUserCreatedWritingTemplateEntry(
  value: unknown
): value is UserCreatedWritingTemplateEntry {
  if (value == null || typeof value !== 'object') return false
  const row = value as Partial<UserCreatedWritingTemplateEntry>
  return (
    typeof row.templateCode === 'string' &&
    row.templateCode.trim() !== '' &&
    typeof row.templateName === 'string' &&
    typeof row.sectionKey === 'string' &&
    typeof row.createdAt === 'string'
  )
}

function persistAndNotify() {
  version += 1
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }
  listeners.forEach(listener => listener())
}

export function subscribeUserCreatedWritingTemplates(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getUserCreatedWritingTemplatesVersion(): number {
  return version
}

export function rememberUserCreatedWritingTemplate(entry: UserCreatedWritingTemplateEntry): void {
  const templateCode = entry.templateCode.trim()
  if (templateCode === '') return
  const next: UserCreatedWritingTemplateEntry = {
    ...entry,
    templateCode,
    templateName: entry.templateName.trim() || templateCode,
  }
  const index = entries.findIndex(item => item.templateCode === templateCode)
  if (index >= 0) {
    entries = entries.map((item, i) => (i === index ? next : item))
  } else {
    entries = [...entries, next]
  }
  persistAndNotify()
}

export function getUserCreatedWritingTemplateName(templateCode: string): string | null {
  const code = templateCode.trim()
  return entries.find(item => item.templateCode === code)?.templateName ?? null
}

/** 신규 복제 양식 표시명 변경 — 카탈로그에 있을 때만 갱신하고 true 반환 */
export function renameUserCreatedWritingTemplate(templateCode: string, templateName: string): boolean {
  const code = templateCode.trim()
  const name = templateName.trim()
  if (code === '' || name === '') return false
  const index = entries.findIndex(item => item.templateCode === code)
  if (index < 0) return false
  if (entries[index].templateName === name) return true
  entries = entries.map((item, i) => (i === index ? { ...item, templateName: name } : item))
  persistAndNotify()
  return true
}

export function forgetUserCreatedWritingTemplate(templateCode: string): void {
  const code = templateCode.trim()
  if (code === '') return
  const next = entries.filter(item => item.templateCode !== code)
  if (next.length === entries.length) return
  entries = next
  persistAndNotify()
}

function formatListDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}.${m}.${d}`
}

function toRow(entry: UserCreatedWritingTemplateEntry, index: number, sectionKey: string): TemplateRow {
  const createdAt = formatListDate(entry.createdAt)
  return {
    id: entry.templateCode,
    templateName: entry.templateName,
    variant: 'default',
    key: `${sectionKey}-user-${index + 1}`,
    no: index + 1,
    creator: '사용자 생성',
    createdAt,
    updatedAt: createdAt,
    systemTemplate: false,
    deletable: true,
  }
}

/** 신규 복제 양식을 템플릿 관리 목록에 붙인다. 이미 API/카탈로그에 있으면 건너뛴다. */
export function mergeUserCreatedWritingTemplates(sections: TemplateSection[]): TemplateSection[] {
  if (entries.length === 0) return sections
  return sections.map(section => {
    const extras = entries.filter(
      entry =>
        entry.sectionKey === section.key &&
        !section.rows.some(row => row.id === entry.templateCode)
    )
    if (extras.length === 0) return section
    const rows = [
      ...section.rows,
      ...extras.map((entry, index) => toRow(entry, section.rows.length + index, section.key)),
    ].map((row, index) => ({ ...row, no: index + 1 }))
    return { ...section, rows }
  })
}
