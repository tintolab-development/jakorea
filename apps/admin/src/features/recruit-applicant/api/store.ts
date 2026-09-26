/**
 * 인재채용 — localStorage mock
 * Platform에 접수 데이터가 없어 시드는 빈 목록이다.
 */

import type {
  RecruitApplicant,
  RecruitApplicantListFilter,
  RecruitApplicantStatus,
  RecruitCareerType,
  RecruitJobInterest,
} from '@/entities/recruit-applicant/model/types'

const STORAGE_KEY = 'admin.jakorea.recruitApplicants.v1'

export const RECRUIT_APPLICANTS_CHANGED_EVENT = 'jakorea:recruit-applicants-changed' as const

type FileShape = {
  version: 1
  items: RecruitApplicant[]
}

const STATUSES = new Set<RecruitApplicantStatus>(['pending', 'confirmed'])
const JOBS = new Set<RecruitJobInterest>([
  'managementPlanning',
  'prDesign',
  'accounting',
  'hrAdmin',
  'educationOps',
  'other',
])
const CAREERS = new Set<RecruitCareerType>(['newbie', 'experienced'])

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function emitChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(RECRUIT_APPLICANTS_CHANGED_EVENT))
  }
}

function normalizeApplicant(raw: Partial<RecruitApplicant>, i: number): RecruitApplicant | null {
  const applicantName = asString(raw.applicantName, '').trim()
  if (!applicantName) return null
  const status = STATUSES.has(raw.status as RecruitApplicantStatus)
    ? (raw.status as RecruitApplicantStatus)
    : 'pending'
  const jobInterest = JOBS.has(raw.jobInterest as RecruitJobInterest)
    ? (raw.jobInterest as RecruitJobInterest)
    : 'other'
  const careerType = CAREERS.has(raw.careerType as RecruitCareerType)
    ? (raw.careerType as RecruitCareerType)
    : 'newbie'
  return {
    id: asString(raw.id, `applicant-${i + 1}`),
    status,
    jobInterest,
    applicantName,
    phone: asString(raw.phone, ''),
    email: asString(raw.email, ''),
    careerType,
    appliedAt: asString(raw.appliedAt, ''),
    confirmedAt: typeof raw.confirmedAt === 'string' && raw.confirmedAt ? raw.confirmedAt : null,
    version: asNumber(raw.version, 0),
  }
}

function readFile(): FileShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, items: [] }
    const parsed = JSON.parse(raw) as FileShape
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: [] }
    }
    return {
      version: 1,
      items: parsed.items
        .map((row, i) => normalizeApplicant(row, i))
        .filter((row): row is RecruitApplicant => row != null),
    }
  } catch {
    return { version: 1, items: [] }
  }
}

function writeFile(file: FileShape): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  emitChange()
}

function ymd(value: string): string {
  return value.slice(0, 10)
}

function inRange(value: string, from: string, to: string): boolean {
  const day = ymd(value)
  if (!day) return false
  if (from && day < from) return false
  if (to && day > to) return false
  return true
}

function matchesFilter(row: RecruitApplicant, filter?: RecruitApplicantListFilter): boolean {
  if (!filter) return true
  if (filter.status && row.status !== filter.status) return false
  if (filter.jobInterest && row.jobInterest !== filter.jobInterest) return false
  if (filter.careerType && row.careerType !== filter.careerType) return false

  const nameQ = filter.applicantName?.trim().toLowerCase()
  if (nameQ && !row.applicantName.toLowerCase().includes(nameQ)) return false

  const phoneQ = (filter.phone ?? '').replace(/\D/g, '')
  if (phoneQ && !row.phone.replace(/\D/g, '').includes(phoneQ)) return false

  const emailQ = filter.email?.trim().toLowerCase()
  if (emailQ && !row.email.toLowerCase().includes(emailQ)) return false

  const appliedFrom = filter.appliedFrom?.trim() ?? ''
  const appliedTo = filter.appliedTo?.trim() ?? ''
  if ((appliedFrom || appliedTo) && !inRange(row.appliedAt, appliedFrom, appliedTo)) return false

  const confirmedFrom = filter.confirmedFrom?.trim() ?? ''
  const confirmedTo = filter.confirmedTo?.trim() ?? ''
  if ((confirmedFrom || confirmedTo) && !inRange(row.confirmedAt ?? '', confirmedFrom, confirmedTo)) {
    return false
  }

  return true
}

function sortApplicants(items: RecruitApplicant[]): RecruitApplicant[] {
  return [...items].sort((a, b) => {
    const pa = a.appliedAt || ''
    const pb = b.appliedAt || ''
    if (pa !== pb) return pb.localeCompare(pa)
    return a.id.localeCompare(b.id)
  })
}

export function filterRecruitApplicants(
  items: RecruitApplicant[],
  filter?: RecruitApplicantListFilter,
): RecruitApplicant[] {
  return sortApplicants(items).filter(row => matchesFilter(row, filter))
}

export function readRecruitApplicants(filter?: RecruitApplicantListFilter): RecruitApplicant[] {
  return filterRecruitApplicants(readFile().items, filter)
}

export function confirmRecruitApplicants(ids: string[]): RecruitApplicant[] {
  if (ids.length === 0) throw new Error('APPLICANT_NONE_SELECTED')
  const idSet = new Set(ids)
  const file = readFile()
  const now = new Date().toISOString()
  const updated: RecruitApplicant[] = []
  const items = file.items.map(row => {
    if (!idSet.has(row.id)) return row
    if (row.status === 'confirmed') {
      updated.push(row)
      return row
    }
    const next: RecruitApplicant = {
      ...row,
      status: 'confirmed',
      confirmedAt: now,
      version: row.version + 1,
    }
    updated.push(next)
    return next
  })
  writeFile({ version: 1, items })
  return updated
}

export function removeRecruitApplicants(ids: string[]): void {
  if (ids.length === 0) throw new Error('APPLICANT_NONE_SELECTED')
  const idSet = new Set(ids)
  const file = readFile()
  writeFile({ version: 1, items: file.items.filter(row => !idSet.has(row.id)) })
}
