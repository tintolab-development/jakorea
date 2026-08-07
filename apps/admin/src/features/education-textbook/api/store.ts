/**
 * 교재 관리 — localStorage mock (API 연동 전)
 */

import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'

const STORAGE_KEY = 'admin.jakorea.educationTextbooks.v1'

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
  version: 1
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
      '일상 속 경제 활동을 통해 화폐와 교환·소비의 개념을 익히고, 합리적인 선택의 기초를 쌓습니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: 'text.jpg',
    unitCount: 4,
    unitSessionText: '30분 수업기준 4차시 교육',
    unitIntroMarkdown:
      '**1단원 로비의 농장 여행**\n\n농장 이야기 속에서 생산과 소비를 경험합니다.\n\n**2단원 동네 가게 탐험**\n\n가게 놀이를 통해 교환과 가격을 이해합니다.\n\n**3단원 알뜰한 소비**\n\n필요와 욕구를 구분하며 현명한 선택을 연습합니다.',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.entrepreneurship,
    educationTargetIds: [TARGET_IDS.elementary],
    educationEffect: '읽기, 쓰기, 수학능력',
    title: '우리들의 경제생활',
    description: '초등 대상 경제생활 기초 교재입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    thumbnailFileName: 'text.jpg',
    unitCount: 5,
    unitSessionText: '40분 수업기준 5차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.career,
    educationTargetIds: [TARGET_IDS.middle, TARGET_IDS.high],
    educationEffect: '진로 탐색, 의사소통',
    title: '나의 진로 찾기',
    description: '중·고등 대상 진로 탐색 프로그램 교재입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 6,
    unitSessionText: '45분 수업기준 6차시 교육',
    unitIntroMarkdown: '**1단원 나를 이해하기**\n\n흥미·강점·가치관을 탐색합니다.',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.entrepreneurship,
    educationTargetIds: [TARGET_IDS.high],
    educationEffect: '창의성, 협업, 문제해결',
    title: '스타트업 챌린지',
    description: '아이디어 발굴부터 피치까지 기업가 정신 실습 교재입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 8,
    unitSessionText: '50분 수업기준 8차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: false,
    businessFieldId: FIELD_IDS.digital,
    educationTargetIds: [TARGET_IDS.elementary, TARGET_IDS.middle],
    educationEffect: '미디어 리터러시, 정보 판별',
    title: '스마트 디지털 시민',
    description: '미사용 상태 mock — 어드민에서만 조회됩니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 3,
    unitSessionText: '40분 수업기준 3차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.economy,
    educationTargetIds: [TARGET_IDS.high, TARGET_IDS.adult],
    educationEffect: '재무 관리, 의사결정',
    title: '생활 금융 마스터',
    description: '생활 속에서 쓰이는 금융 개념과 실천 습관을 다룹니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 7,
    unitSessionText: '50분 수업기준 7차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.career,
    educationTargetIds: [TARGET_IDS.elementary],
    educationEffect: '자기이해, 직업 탐색',
    title: '꿈 키우기 워크북',
    description: '초등 저·중학년용 꿈 탐색 활동 교재입니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 4,
    unitSessionText: '40분 수업기준 4차시 교육',
    unitIntroMarkdown: '',
    authorName: DEFAULT_TEXTBOOK_AUTHOR,
  },
  {
    isActive: true,
    businessFieldId: FIELD_IDS.entrepreneurship,
    educationTargetIds: [TARGET_IDS.middle],
    educationEffect: '리더십, 팀워크',
    title: '미니 기업가 교실',
    description: '소규모 프로젝트로 기업가 정신을 체험합니다.',
    thumbnailUrl: DEFAULT_TEXTBOOK_THUMBNAIL,
    unitCount: 5,
    unitSessionText: '45분 수업기준 5차시 교육',
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
      return { version: 1, items: buildSeedTextbooks() }
    }
    const parsed = JSON.parse(raw) as StoreFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items)) {
      return { version: 1, items: buildSeedTextbooks() }
    }
    return {
      version: 1,
      items: parsed.items.map((item, i) => normalizeItem(item, `edu-textbook-migrated-${i}`)),
    }
  } catch {
    return { version: 1, items: buildSeedTextbooks() }
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
  writeFile({ version: 1, items: [item, ...file.items] })
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
  writeFile({ version: 1, items })
  return next
}

export function removeEducationTextbooks(ids: string[]): void {
  const idSet = new Set(ids)
  const file = readFile()
  writeFile({ version: 1, items: file.items.filter(row => !idSet.has(row.id)) })
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
  writeFile({ version: 1, items })
  return next
}
