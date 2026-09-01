/**
 * 재능기부 신청 — localStorage mock
 */

import type {
  ApplicantGender,
  ApplicationStatus,
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
  TalentDonationApplicationPrivacyLog,
} from '@/entities/talent-donation-application/model/types'

const STORAGE_KEY = 'admin.sponsor.talentDonationApplications.v1'
const PRIVACY_LOG_KEY = 'admin.sponsor.talentDonationApplications.privacyLog.v1'

export const TALENT_DONATION_APPLICATIONS_CHANGED_EVENT =
  'jakorea:talent-donation-applications-changed' as const

export const DEFAULT_CONFIRM_ACTOR = '홍길동'

export const PRIVACY_VIEW_PURPOSE = '재능기부 신청 대응을 위함'

type StoreFile = {
  version: 1
  items: TalentDonationApplication[]
}

type PrivacyLogFile = {
  version: 1
  items: TalentDonationApplicationPrivacyLog[]
}

const SAMPLE_BIO =
  '홍익대학교 시각디자인과 졸업 후 10년간 IT·교육 분야에서 UX 디자인과 그래픽 작업을 해왔습니다. 청소년 대상 진로 멘토링에 관심이 많습니다.'

const SAMPLE_TALENT =
  '그래픽 디자인, UX 디자인, 디지털 미디어 제작을 중심으로 청소년 눈높이에 맞는 실습형 교육을 진행할 수 있습니다.'

const SAMPLE_MOTIVATION =
  '학창 시절 멘토의 도움으로 진로를 구체화할 수 있었습니다. 받은 기회를 다음 세대에게 돌려주고 싶어 재능기부에 신청합니다.'

const MOCK_ATTACHMENT =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80"><rect width="120" height="80" fill="#e8eef0"/><text x="60" y="44" text-anchor="middle" fill="#666" font-size="12">file</text></svg>`
  )

const SEED_NAMES = [
  '홍길동',
  '김영희',
  '이민수',
  '박지현',
  '최수아',
  '정민호',
  '한서연',
  '오준혁',
  '윤다은',
  '장우진',
  '임민제',
  '이대완',
  '강하늘',
  '서유진',
  '문지호',
  '배소희',
  '노태영',
  '신하린',
  '권도윤',
  '조은비',
  '황시우',
  '안예린',
  '백승민',
  '남지수',
  '유하준',
  '송채원',
  '허진우',
  '전민아',
  '고세진',
] as const

const AFFILIATIONS = [
  '진월초등학교',
  '서울디자인고등학교',
  '네이버',
  '카카오',
  '삼성전자',
  '프리랜서',
  '홍익대학교',
  'KT',
  'IBM',
  'Citi',
] as const

const ADDRESSES = [
  '서울특별시 강서구',
  '서울특별시 마포구',
  '경기도 성남시',
  '부산광역시 해운대구',
  '대전광역시 유성구',
  '인천광역시 연수구',
] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function buildSeedRows(): TalentDonationApplication[] {
  const rows: TalentDonationApplication[] = []
  const base = new Date('2026-09-15T09:15:00+09:00')

  for (let i = 0; i < SEED_NAMES.length; i++) {
    const applicantName = SEED_NAMES[i]!
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
    const birthYear = 1985 + (i % 15)
    const hasFile = i % 4 === 0

    rows.push({
      id: `talent-app-${pad2(i + 1)}`,
      status: isConfirmed ? 'confirmed' : 'pending',
      applicantName,
      gender: i % 2 === 0 ? 'male' : 'female',
      birthDate: `${birthYear}-09-15`,
      phone: `010-${1000 + (i % 9000)}-${phoneTail.slice(0, 4)}`,
      email: `wldnj${pad2(i)}wk@naver.com`,
      affiliation: AFFILIATIONS[i % AFFILIATIONS.length]!,
      homeAddress: ADDRESSES[i % ADDRESSES.length]!,
      availableFrom: '2026-09-15',
      availableTo: '2028-09-15',
      bio: SAMPLE_BIO,
      talentIntro: SAMPLE_TALENT,
      motivation: SAMPLE_MOTIVATION,
      jaProgramHistory: i % 2 === 0,
      attachmentFileName: hasFile ? 'text.jpg' : null,
      attachmentUrl: hasFile ? MOCK_ATTACHMENT : null,
      privacyConsent: true,
      appliedAt: applied.toISOString(),
      confirmedAt,
      confirmedByName,
      version: 0,
    })
  }

  const detailSampleIdx = rows.findIndex(r => r.applicantName === '홍길동')
  if (detailSampleIdx >= 0) {
    const sample = rows[detailSampleIdx]!
    rows[detailSampleIdx] = {
      ...sample,
      status: 'confirmed',
      gender: 'male',
      birthDate: '1990-09-15',
      phone: '010-1234-5678',
      email: 'wldnjswk@naver.com',
      affiliation: '진월초등학교',
      homeAddress: '서울특별시 강서구',
      jaProgramHistory: true,
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

function asStatus(v: unknown): ApplicationStatus {
  return v === 'confirmed' ? 'confirmed' : 'pending'
}

function asGender(v: unknown): ApplicantGender {
  return v === 'female' ? 'female' : 'male'
}

function normalizeItem(
  raw: Partial<TalentDonationApplication>,
  fallbackId: string
): TalentDonationApplication {
  const appliedAt = asString(raw.appliedAt, new Date().toISOString())
  const status = asStatus(raw.status)
  return {
    id: asString(raw.id, fallbackId),
    status,
    applicantName: asString(raw.applicantName),
    gender: asGender(raw.gender),
    birthDate: asString(raw.birthDate, '1990-01-01'),
    phone: asString(raw.phone),
    email: asString(raw.email),
    affiliation: asString(raw.affiliation),
    homeAddress: asString(raw.homeAddress),
    availableFrom: asString(raw.availableFrom, '2026-09-15'),
    availableTo: asString(raw.availableTo, '2028-09-15'),
    bio: asString(raw.bio),
    talentIntro: asString(raw.talentIntro),
    motivation: asString(raw.motivation),
    jaProgramHistory: raw.jaProgramHistory === true,
    attachmentFileName:
      typeof raw.attachmentFileName === 'string' && raw.attachmentFileName.trim()
        ? raw.attachmentFileName.trim()
        : null,
    attachmentUrl:
      typeof raw.attachmentUrl === 'string' && raw.attachmentUrl.trim()
        ? raw.attachmentUrl.trim()
        : null,
    privacyConsent: true,
    appliedAt,
    confirmedAt:
      typeof raw.confirmedAt === 'string' && raw.confirmedAt.trim() ? raw.confirmedAt : null,
    confirmedByName:
      typeof raw.confirmedByName === 'string' && raw.confirmedByName.trim()
        ? raw.confirmedByName.trim()
        : null,
    version: typeof raw.version === 'number' ? raw.version : 0,
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
      items: parsed.items.map((item, i) => normalizeItem(item, `talent-app-migrated-${i}`)),
    }
  } catch {
    return { version: 1, items: buildSeedRows() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(TALENT_DONATION_APPLICATIONS_CHANGED_EVENT))
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

function sortByAppliedDesc(items: TalentDonationApplication[]): TalentDonationApplication[] {
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
  item: TalentDonationApplication,
  filter: TalentDonationApplicationListFilter
): boolean {
  if (filter.status && item.status !== filter.status) return false

  if (filter.applicantName) {
    const q = filter.applicantName.trim().toLowerCase()
    if (q && !item.applicantName.toLowerCase().includes(q)) return false
  }
  if (filter.phone) {
    const q = filter.phone.trim().replace(/\D/g, '')
    const digits = item.phone.replace(/\D/g, '')
    if (q && !digits.includes(q) && !item.phone.includes(filter.phone.trim())) return false
  }
  if (filter.email) {
    const q = filter.email.trim().toLowerCase()
    if (q && !item.email.toLowerCase().includes(q)) return false
  }
  if (filter.jaProgramHistory === 'yes' && !item.jaProgramHistory) return false
  if (filter.jaProgramHistory === 'no' && item.jaProgramHistory) return false

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

export function readTalentDonationApplications(
  filter: TalentDonationApplicationListFilter = {}
): TalentDonationApplication[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return sortByAppliedDesc(file.items.filter(item => matchesFilter(item, filter)))
}

export function getTalentDonationApplication(id: string): TalentDonationApplication | null {
  const file = readFile()
  return file.items.find(item => item.id === id) ?? null
}

export function getTalentDonationApplicationWithPrivacyLog(
  id: string,
  actorName: string = DEFAULT_CONFIRM_ACTOR
): TalentDonationApplication | null {
  const item = getTalentDonationApplication(id)
  if (!item) return null

  const logs = readPrivacyLogs()
  const entry: TalentDonationApplicationPrivacyLog = {
    id: `privacy-log-${Date.now()}`,
    applicationId: id,
    purpose: PRIVACY_VIEW_PURPOSE,
    viewedAt: new Date().toISOString(),
    actorName: actorName.trim() || DEFAULT_CONFIRM_ACTOR,
  }
  writePrivacyLogs({ version: 1, items: [entry, ...logs.items] })
  return item
}

export function removeTalentDonationApplications(ids: string[]): void {
  const idSet = new Set(ids)
  const file = readFile()
  writeFile({ version: 1, items: file.items.filter(row => !idSet.has(row.id)) })
}

export function confirmTalentDonationApplications(
  ids: string[],
  actorName: string = DEFAULT_CONFIRM_ACTOR
): TalentDonationApplication[] {
  const idSet = new Set(ids)
  const file = readFile()
  const now = new Date().toISOString()
  const actor = actorName.trim() || DEFAULT_CONFIRM_ACTOR
  const updated: TalentDonationApplication[] = []

  const items = file.items.map(row => {
    if (!idSet.has(row.id) || row.status !== 'pending') return row
    const next: TalentDonationApplication = {
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
