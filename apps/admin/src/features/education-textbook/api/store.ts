/**
 * 교재 관리 — localStorage mock (API 연동 전)
 */

import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'

const STORAGE_KEY = 'admin.jakorea.educationTextbooks.v2'

export const EDUCATION_TEXTBOOKS_CHANGED_EVENT =
  'jakorea:education-textbooks-changed' as const

export const DEFAULT_TEXTBOOK_AUTHOR = '홍길동'

/** 시안용 기본 썸네일 (세로 226×320 비율 SVG) */
export const DEFAULT_TEXTBOOK_THUMBNAIL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="226" height="320" viewBox="0 0 226 320">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0CBDCC"/>
          <stop offset="100%" stop-color="#46B17B"/>
        </linearGradient>
      </defs>
      <rect width="226" height="320" fill="url(#g)"/>
      <text x="113" y="168" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="16">Textbook</text>
    </svg>`
  )

type StoreFile = {
  version: 2
  items: EducationTextbook[]
}

const FIELD_IDS = {
  career: 'edu-field-career',
  economy: 'edu-field-economy',
  entrepreneurship: 'edu-field-entrepreneurship',
  digital: 'edu-field-digital_literacy',
} as const

const TARGET_IDS = {
  preschool: 'edu-target-preschool',
  elementary: 'edu-target-elementary',
  middle: 'edu-target-middle',
  high: 'edu-target-high',
  adult: 'edu-target-adult',
} as const

type SeedOmit = Omit<EducationTextbook, 'id' | 'createdAt' | 'updatedAt'>

const SEED_ROWS: readonly SeedOmit[] = [
  {
    isActive: true,
    businessFieldId: FIELD_IDS.economy,
    educationTargetIds: [TARGET_IDS.preschool],
    educationEffect: '읽기, 쓰기',
    title: '우리들의 경제생활',
    description:
      '유아, 유치원생을 대상으로 경제교육을 하는 교재입니다. 동화를 통해 경제 개념을 쉽게 이해할 수 있도록 구성되어 있습니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: 'text.jpg',
    unitCount: 4,
    unitSessionText: '30분 수업기준 4차시 교육',
    unitIntroMarkdown:
      '**1단원 로비의 농장 여행**\n\n농장 이야기 속에서 생산과 소비를 경험합니다.\n\n**2단원 로비의 시장 여행**\n\n가게 놀이를 통해 교환과 가격을 이해합니다.',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.career,
    educationTargetIds: [TARGET_IDS.middle],
    educationEffect: '진로 탐색, 협업',
    title: '우주여행',
    description:
      '중학생을 대상으로 진로·미래 직업을 탐구하는 교재입니다. 우주 탐사를 소재로 진로 탐색과 협업 역량을 기릅니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 3,
    unitSessionText: '45분 수업기준 6차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.economy,
    educationTargetIds: [TARGET_IDS.elementary],
    educationEffect: '합리적 소비, 저축',
    title: '경제 탐험대',
    description:
      '초등학생을 위한 경제·금융 입문 교재입니다. 생활 속 경제 이야기를 통해 합리적 소비와 저축을 배웁니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 5,
    unitSessionText: '40분 수업기준 5차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.career,
    educationTargetIds: [TARGET_IDS.high],
    educationEffect: '자기이해, 직업 탐색',
    title: '직업의 세계',
    description: '고등학생이 다양한 직업 세계를 탐색하고 자기 이해를 넓히는 진로 교재입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 4,
    unitSessionText: '50분 수업기준 8차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.entrepreneurship,
    educationTargetIds: [TARGET_IDS.high],
    educationEffect: '창의성, 문제해결',
    title: '창업 씨앗 키우기',
    description: '청소년·청년의 기업가정신을 키우는 실습형 교재입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 6,
    unitSessionText: '50분 수업기준 12차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.digital,
    educationTargetIds: [TARGET_IDS.elementary],
    educationEffect: '미디어 리터러시, 정보 판별',
    title: '디지털 시민 되기',
    description:
      '초·중학생을 위한 디지털 리터러시 기초 교재입니다. 온라인 예절과 정보 비판 능력을 다룹니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 4,
    unitSessionText: '40분 수업기준 4차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.economy,
    educationTargetIds: [TARGET_IDS.adult],
    educationEffect: '재무 관리, 의사결정',
    title: '성인을 위한 금융 리터러시',
    description: '성인 학습자를 위한 실용 금융 교육 콘텐츠입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 5,
    unitSessionText: '60분 수업기준 5차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.economy,
    educationTargetIds: [TARGET_IDS.adult],
    educationEffect: '안내',
    title: '교육 콘텐츠 이용 안내',
    description: '교재 신청·활용 전 확인이 필요한 공통 안내사항입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 0,
    unitSessionText: '차시 없음',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
]

function buildSeedTextbooks(): EducationTextbook[] {
  const base = new Date('2026-09-15T00:15:00.000Z')
  return SEED_ROWS.map((row, index) => {
    const ts = new Date(base.getTime() - index * 86_400_000).toISOString()
    return {
      ...row,
      id: `edu-textbook-${index + 1}`,
      createdAt: ts,
      updatedAt: ts,
    }
  })
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBool(value: unknown, fallback = true): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeItem(raw: Partial<EducationTextbook>, fallbackId: string): EducationTextbook {
  const createdAt = asString(raw.createdAt, new Date().toISOString())
  return {
    id: asString(raw.id, fallbackId),
    isActive: asBool(raw.isActive, true),
    businessFieldId: asString(raw.businessFieldId),
    educationTargetIds: Array.isArray(raw.educationTargetIds)
      ? raw.educationTargetIds.filter((id): id is string => typeof id === 'string')
      : [],
    educationEffect: asString(raw.educationEffect),
    title: asString(raw.title),
    description: asString(raw.description),
    thumbnailUrl: asString(raw.thumbnailUrl, DEFAULT_TEXTBOOK_THUMBNAIL) || DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: typeof raw.thumbnailFileName === 'string' ? raw.thumbnailFileName : undefined,
    unitCount: asNumber(raw.unitCount, 0),
    unitSessionText: asString(raw.unitSessionText),
    unitIntroMarkdown: asString(raw.unitIntroMarkdown),
    authorName: asString(raw.authorName, DEFAULT_TEXTBOOK_AUTHOR),
    createdAt,
    updatedAt: asString(raw.updatedAt, createdAt),
  }
}

function readFile(): StoreFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { version: 2, items: buildSeedTextbooks() }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 2 || !Array.isArray(parsed.items)) {
      return { version: 2, items: buildSeedTextbooks() }
    }
    return {
      version: 2,
      items: parsed.items.map((item, i) => normalizeItem(item, `edu-textbook-migrated-${i}`)),
    }
  } catch {
    return { version: 2, items: buildSeedTextbooks() }
  }
}

function writeFile(file: StoreFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(EDUCATION_TEXTBOOKS_CHANGED_EVENT))
}

function sortByCreatedDesc(items: EducationTextbook[]): EducationTextbook[] {
  return [...items].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return tb - ta
  })
}

function matchesFilter(
  item: EducationTextbook,
  filter: EducationTextbookListFilter
): boolean {
  if (filter.usage === 'active' && !item.isActive) return false
  if (filter.usage === 'inactive' && item.isActive) return false
  if (filter.title) {
    const q = filter.title.trim().toLowerCase()
    if (q && !item.title.toLowerCase().includes(q)) return false
  }
  if (filter.businessFieldId && item.businessFieldId !== filter.businessFieldId) return false
  if (
    filter.educationTargetId &&
    !item.educationTargetIds.includes(filter.educationTargetId)
  ) {
    return false
  }
  if (filter.createdFrom) {
    const from = new Date(filter.createdFrom).getTime()
    if (!Number.isNaN(from) && new Date(item.createdAt).getTime() < from) return false
  }
  if (filter.createdTo) {
    const to = new Date(filter.createdTo)
    if (!Number.isNaN(to.getTime())) {
      // 종료일 포함 (당일 23:59:59)
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      if (new Date(item.createdAt).getTime() > end.getTime()) return false
    }
  }
  return true
}

export function readEducationTextbooks(
  filter: EducationTextbookListFilter = {}
): EducationTextbook[] {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return sortByCreatedDesc(file.items.filter(item => matchesFilter(item, filter)))
}

export function getEducationTextbook(id: string): EducationTextbook | null {
  const file = readFile()
  return file.items.find(item => item.id === id) ?? null
}

export function createEducationTextbook(
  input: EducationTextbookCreateInput
): EducationTextbook {
  const file = readFile()
  const now = new Date().toISOString()
  const item: EducationTextbook = {
    id: `edu-textbook-${Date.now()}`,
    isActive: input.isActive,
    businessFieldId: input.businessFieldId,
    educationTargetIds: [...input.educationTargetIds],
    educationEffect: input.educationEffect.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    thumbnailUrl: input.thumbnailUrl.trim() || DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: input.thumbnailFileName,
    unitCount: input.unitCount,
    unitSessionText: input.unitSessionText.trim(),
    unitIntroMarkdown: input.unitIntroMarkdown,
    authorName: (input.authorName ?? DEFAULT_TEXTBOOK_AUTHOR).trim() || DEFAULT_TEXTBOOK_AUTHOR,
    createdAt: now,
    updatedAt: now,
  }
  writeFile({ version: 2, items: [item, ...file.items] })
  return item
}

export function updateEducationTextbook(
  input: EducationTextbookUpdateInput
): EducationTextbook {
  const file = readFile()
  const index = file.items.findIndex(row => row.id === input.id)
  if (index < 0) {
    throw new Error(`Education textbook not found: ${input.id}`)
  }
  const prev = file.items[index]!
  const next: EducationTextbook = {
    ...prev,
    isActive: input.isActive,
    businessFieldId: input.businessFieldId,
    educationTargetIds: [...input.educationTargetIds],
    educationEffect: input.educationEffect.trim(),
    title: input.title.trim(),
    description: input.description.trim(),
    thumbnailUrl: input.thumbnailUrl.trim() || DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: input.thumbnailFileName,
    unitCount: input.unitCount,
    unitSessionText: input.unitSessionText.trim(),
    unitIntroMarkdown: input.unitIntroMarkdown,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[index] = next
  writeFile({ version: 2, items })
  return next
}

export function removeEducationTextbooks(ids: string[]): void {
  const idSet = new Set(ids)
  const file = readFile()
  writeFile({ version: 2, items: file.items.filter(row => !idSet.has(row.id)) })
}

export function setEducationTextbookActive(
  id: string,
  isActive: boolean
): EducationTextbook {
  const file = readFile()
  const index = file.items.findIndex(row => row.id === id)
  if (index < 0) {
    throw new Error(`Education textbook not found: ${id}`)
  }
  const next: EducationTextbook = {
    ...file.items[index]!,
    isActive,
    updatedAt: new Date().toISOString(),
  }
  const items = [...file.items]
  items[index] = next
  writeFile({ version: 2, items })
  return next
}
