/**
 * 채용 안내 관리 — local fallback
 */

import type {
  BannerSaveInput,
  CultureItem,
  CultureItemId,
  CultureSaveItem,
  InterviewItem,
  InterviewSaveItem,
  RecruitGuideBanner,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import heroImageUrl from '@/assets/images/recruit/hero.png'
import storyImageUrl from '@/assets/images/recruit/story-metlife.png'

const STORAGE_KEY = 'admin.jakorea.recruitGuide.v2'
export const MAX_RECRUIT_INTERVIEWS = 9

export const RECRUIT_GUIDE_CHANGED_EVENT = 'jakorea:recruit-guide-changed' as const

type GuideFile = {
  version: 1
  data: RecruitGuideData
}

/** Platform `THRIVE_VALUES` summaryLines / detailLines — `\n` 이 화면 줄바꿈 */
const FIXED_CULTURE: ReadonlyArray<{
  id: CultureItemId
  itemLabel: string
  defaultTitle: string
  defaultDescription: string
}> = [
  {
    id: 'make_an_impact',
    itemLabel: 'Make an Impact',
    defaultTitle: '청소년의 성장이라는\n공동의 목적을 향해 함께 나아갑니다',
    defaultDescription:
      '각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고\n긍정적인 변화를 만들어갑니다.',
  },
  {
    id: 'keep_learning',
    itemLabel: 'Keep Learning',
    defaultTitle: '배움은 성장의 시작입니다',
    defaultDescription:
      '호기심을 가지고 새로운 것에 도전하며 끊임없이\n배우고 더 나은 방법을 함께 찾아갑니다.',
  },
  {
    id: 'speak_openly',
    itemLabel: 'Speak Openly',
    defaultTitle: '좋은 아이디어는\n열린 소통에서 시작됩니다',
    defaultDescription:
      '신뢰와 정직을 바탕으로 자유롭게 의견을 나누며,\n직급이나 역할에 관계없이 서로의 목소리에\n귀 기울이고 더 나은 방향을 함께 만들어갑니다.',
  },
  {
    id: 'ready_to_help',
    itemLabel: 'Ready to Help',
    defaultTitle: '협력은 서로를 존중하는\n마음에서 시작됩니다',
    defaultDescription:
      '다양한 의견에 귀 기울이고, 도움이 필요한 순간에는\n기꺼이 손을 내밀며 함께 해결책을 찾아갑니다.',
  },
]

function buildSeedBanner(): RecruitGuideBanner {
  return {
    imageUrl: heroImageUrl,
    imageFileName: 'hero.png',
    mainText: '가능성을 믿는 사람들이\n만드는 변화, 우리는 청소년의\n가능성을 믿습니다',
    subText01: '신뢰와 존중을 바탕으로 함께 배우고 성장하며,\n그 가능성을 현실로 만들어갑니다.',
    subText02:
      'People who believe in young people, creating impact together through trust, partnership, and continuous learning.',
    version: 0,
  }
}

function buildSeedCulture(): CultureItem[] {
  return FIXED_CULTURE.map((item, index) => ({
    id: item.id,
    apiId: index + 1,
    itemLabel: item.itemLabel,
    title: item.defaultTitle,
    description: item.defaultDescription,
    version: 0,
  }))
}

/** Platform `FEATURED_STORIES` */
function buildSeedInterviews(): InterviewItem[] {
  return [
    {
      id: 'ri-1',
      storyId: 'story-metlife-2026',
      title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울',
      publishedYear: 2026,
      version: 0,
      imageUrl: storyImageUrl,
    },
    {
      id: 'ri-2',
      storyId: 'story-summer-camp',
      title: '청소년과 함께한 JA Korea 여름 캠프 이야기',
      publishedYear: 2025,
      version: 0,
      imageUrl: storyImageUrl,
    },
    {
      id: 'ri-3',
      storyId: 'story-volunteer-day',
      title: '임직원 봉사로 이어진 따뜻한 하루',
      publishedYear: 2025,
      version: 0,
      imageUrl: storyImageUrl,
    },
  ]
}

function buildSeedData(): RecruitGuideData {
  return {
    banner: buildSeedBanner(),
    cultureItems: buildSeedCulture(),
    interviews: buildSeedInterviews(),
    updatedAt: '2026-08-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeVersion(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeBanner(raw: Partial<RecruitGuideBanner> | null | undefined): RecruitGuideBanner {
  const seed = buildSeedBanner()
  if (!raw || typeof raw !== 'object') return seed
  return {
    imageUrl: asString(raw.imageUrl, seed.imageUrl).trim() || seed.imageUrl,
    imageFileName:
      typeof raw.imageFileName === 'string' && raw.imageFileName.trim()
        ? raw.imageFileName.trim()
        : undefined,
    imageAssetId:
      raw.imageAssetId === null
        ? null
        : typeof raw.imageAssetId === 'number'
          ? raw.imageAssetId
          : undefined,
    mainText: asString(raw.mainText, seed.mainText),
    subText01: asString(raw.subText01, seed.subText01),
    subText02: asString(raw.subText02, seed.subText02),
    version: normalizeVersion(raw.version, seed.version),
  }
}

function normalizeCulture(raw: unknown): CultureItem[] {
  const seed = buildSeedCulture()
  const byId = new Map<string, { title?: string; description?: string; version?: number }>()
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const id = (row as { id?: unknown }).id
      if (typeof id !== 'string') continue
      byId.set(id, {
        title:
          typeof (row as { title?: unknown }).title === 'string'
            ? (row as { title: string }).title
            : undefined,
        description:
          typeof (row as { description?: unknown }).description === 'string'
            ? (row as { description: string }).description
            : undefined,
        version:
          typeof (row as { version?: unknown }).version === 'number'
            ? (row as { version: number }).version
            : undefined,
      })
    }
  }
  return seed.map(item => {
    const overlay = byId.get(item.id)
    return {
      id: item.id,
      apiId: item.apiId,
      itemLabel: item.itemLabel,
      title: overlay?.title ?? item.title,
      description: overlay?.description ?? item.description,
      version: overlay?.version ?? item.version,
    }
  })
}

function normalizeInterview(raw: unknown, i: number): InterviewItem | null {
  if (!raw || typeof raw !== 'object') return null
  const row = raw as Partial<InterviewItem>
  const storyId = asString(row.storyId, '').trim()
  const title = asString(row.title, '').trim()
  if (!storyId || !title) return null
  const year =
    row.publishedYear == null
      ? null
      : typeof row.publishedYear === 'number' && Number.isFinite(row.publishedYear)
        ? row.publishedYear
        : null
  const imageUrl = asString(row.imageUrl, '').trim()
  return {
    id: asString(row.id, `ri-${i + 1}`),
    storyId,
    title,
    publishedYear: year,
    version: normalizeVersion(row.version, 0),
    ...(imageUrl ? { imageUrl } : {}),
  }
}

function normalizeInterviews(raw: unknown): InterviewItem[] {
  if (!Array.isArray(raw)) return buildSeedInterviews()
  return raw
    .map((row, i) => normalizeInterview(row, i))
    .filter((row): row is InterviewItem => row != null)
}

function normalizeData(raw: Partial<RecruitGuideData> | null | undefined): RecruitGuideData {
  const seed = buildSeedData()
  if (!raw || typeof raw !== 'object') return seed
  return {
    banner: normalizeBanner(raw.banner),
    cultureItems: normalizeCulture(raw.cultureItems),
    interviews:
      raw.interviews === undefined ? seed.interviews : normalizeInterviews(raw.interviews),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): GuideFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedData() }
    const parsed = JSON.parse(raw) as GuideFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedData() }
    }
    return { version: 1, data: normalizeData(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedData() }
  }
}

function writeFile(file: GuideFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(RECRUIT_GUIDE_CHANGED_EVENT))
}

export function readRecruitGuide(): RecruitGuideData {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

type MutateOptions = {
  /** local fallback의 기준값 */
  base?: RecruitGuideData
  /** false면 localStorage에 쓰지 않는다 */
  persist?: boolean
}

export function saveBanner(input: BannerSaveInput, options?: MutateOptions): RecruitGuideData {
  const imageUrl = input.imageUrl.trim()
  const mainText = input.mainText.trimEnd()
  const subText01 = input.subText01.trimEnd()
  const subText02 = input.subText02.trimEnd()
  if (!imageUrl) throw new Error('BANNER_IMAGE_REQUIRED')
  if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
  if (!subText01.trim()) throw new Error('BANNER_SUB_TEXT_01_REQUIRED')
  if (!subText02.trim()) throw new Error('BANNER_SUB_TEXT_02_REQUIRED')

  const current = options?.base ?? readRecruitGuide()
  const next: RecruitGuideData = {
    ...current,
    banner: {
      imageUrl,
      imageFileName: input.imageFileName?.trim() || undefined,
      imageAssetId: input.imageAssetId,
      mainText,
      subText01,
      subText02,
      version: input.version,
    },
    updatedAt: new Date().toISOString(),
  }
  if (options?.persist !== false) {
    writeFile({ version: 1, data: next })
  }
  return next
}

export function saveCulture(items: CultureSaveItem[], options?: MutateOptions): RecruitGuideData {
  const current = options?.base ?? readRecruitGuide()
  const byId = new Map(items.map(item => [item.id, item]))

  const nextItems = FIXED_CULTURE.map(fixed => {
    const patch = byId.get(fixed.id)
    const title = (patch?.title ?? '').trimEnd()
    const description = (patch?.description ?? '').trimEnd()
    if (!title.trim()) throw new Error('CULTURE_TITLE_REQUIRED')
    if (!description.trim()) throw new Error('CULTURE_DESCRIPTION_REQUIRED')
    return {
      id: fixed.id,
      apiId: FIXED_CULTURE.indexOf(fixed) + 1,
      itemLabel: fixed.itemLabel,
      title,
      description,
      version: patch?.version ?? 0,
    }
  })

  const next: RecruitGuideData = {
    ...current,
    cultureItems: nextItems,
    updatedAt: new Date().toISOString(),
  }
  if (options?.persist !== false) {
    writeFile({ version: 1, data: next })
  }
  return next
}

function nextInterviewId(existing: InterviewItem[]): string {
  const nums = existing
    .map(row => Number(String(row.id).replace(/^ri-/, '')))
    .filter(n => Number.isFinite(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `ri-${max + 1}`
}

export function addInterview(input: InterviewSaveItem, options?: MutateOptions): RecruitGuideData {
  const current = options?.base ?? readRecruitGuide()
  if (current.interviews.length >= MAX_RECRUIT_INTERVIEWS) {
    throw new Error('INTERVIEW_LIMIT_EXCEEDED')
  }
  if (current.interviews.some(row => row.storyId === input.storyId)) {
    throw new Error('INTERVIEW_DUPLICATE')
  }
  const nextRow: InterviewItem = {
    id: nextInterviewId(current.interviews),
    storyId: input.storyId,
    title: input.title.trim(),
    publishedYear: input.publishedYear,
    version: 0,
  }
  const next: RecruitGuideData = {
    ...current,
    interviews: [...current.interviews, nextRow],
    updatedAt: new Date().toISOString(),
  }
  if (options?.persist !== false) {
    writeFile({ version: 1, data: next })
  }
  return next
}

export function replaceInterview(
  id: string,
  input: InterviewSaveItem,
  options?: MutateOptions,
): RecruitGuideData {
  const current = options?.base ?? readRecruitGuide()
  const duplicate = current.interviews.find(
    row => row.storyId === input.storyId && row.id !== id
  )
  if (duplicate) throw new Error('INTERVIEW_DUPLICATE')

  let found = false
  const interviews = current.interviews.map(row => {
    if (row.id !== id) return row
    found = true
    return {
      ...row,
      storyId: input.storyId,
      title: input.title.trim(),
      publishedYear: input.publishedYear,
      version: row.version + 1,
    }
  })
  if (!found) throw new Error('INTERVIEW_NOT_FOUND')

  const next: RecruitGuideData = {
    ...current,
    interviews,
    updatedAt: new Date().toISOString(),
  }
  if (options?.persist !== false) {
    writeFile({ version: 1, data: next })
  }
  return next
}

export function removeInterviews(ids: string[], options?: MutateOptions): RecruitGuideData {
  if (ids.length === 0) throw new Error('INTERVIEW_NONE_SELECTED')
  const idSet = new Set(ids)
  const current = options?.base ?? readRecruitGuide()
  const next: RecruitGuideData = {
    ...current,
    interviews: current.interviews.filter(row => !idSet.has(row.id)),
    updatedAt: new Date().toISOString(),
  }
  if (options?.persist !== false) {
    writeFile({ version: 1, data: next })
  }
  return next
}
