/**
 * 채용 안내 관리 — localStorage mock (API 연동 전)
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

const STORAGE_KEY = 'admin.jakorea.recruitGuide.v1'

export const RECRUIT_GUIDE_CHANGED_EVENT = 'jakorea:recruit-guide-changed' as const

type GuideFile = {
  version: 1
  data: RecruitGuideData
}

const FIXED_CULTURE: ReadonlyArray<{
  id: CultureItemId
  itemLabel: string
  defaultTitle: string
  defaultDescription: string
}> = [
  {
    id: 'ready_to_help',
    itemLabel: 'Ready to Help',
    defaultTitle: '협업은 서로를 존중하는 마음에서 시작됩니다',
    defaultDescription:
      '서로의 의견을 경청하고, 필요한 순간 먼저 손을 내밀어 함께 해결책을 찾아갑니다.',
  },
  {
    id: 'make_an_impact',
    itemLabel: 'Make an Impact',
    defaultTitle: '청소년의 성장이라는 공동의 목표를 향해 움직입니다',
    defaultDescription:
      '개인의 노력이 모여 사회적 가치를 만들고, 그 변화가 더 많은 청소년에게 닿도록 책임을 다합니다.',
  },
  {
    id: 'speak_openly',
    itemLabel: 'Speak Openly',
    defaultTitle: '좋은 아이디어는 열린 소통에서 시작됩니다',
    defaultDescription:
      '직급과 역할에 관계없이 의견을 나누고, 다른 생각을 존중하며 더 나은 방향을 함께 찾습니다.',
  },
  {
    id: 'keep_learning',
    itemLabel: 'Keep Learning',
    defaultTitle: '배움은 성장의 시작입니다',
    defaultDescription:
      '새로운 것에 도전하고, 더 나은 방법을 끊임없이 탐구하며 함께 성장합니다.',
  },
]

function buildSeedBanner(): RecruitGuideBanner {
  return {
    imageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=740&h=790&fit=crop',
    imageFileName: 'recruit-banner.jpg',
    mainText: '가능성을 믿는 사람들이 만드는 변화,\n우리는 청소년의 가능성을 믿습니다',
    subText01:
      '신뢰와 존중을 바탕으로 함께 배우고 성장하며,\n그 가능성을 현실로 만들어갑니다.',
    subText02:
      'People who believe in young people, creating impact together through trust, partnership, and continuous learning.',
    version: 0,
  }
}

function buildSeedCulture(): CultureItem[] {
  return FIXED_CULTURE.map(item => ({
    id: item.id,
    itemLabel: item.itemLabel,
    title: item.defaultTitle,
    description: item.defaultDescription,
    version: 0,
  }))
}

function buildSeedInterviews(): InterviewItem[] {
  return [
    {
      id: 'ri-1',
      storyId: 'is-112',
      title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
      publishedYear: 2026,
    },
    {
      id: 'ri-2',
      storyId: 'is-111',
      title: 'JA Korea - 시립은평청소년미래진로센터(궁리하다) 업무 협약',
      publishedYear: 2026,
    },
    {
      id: 'ri-3',
      storyId: 'is-110',
      title: '창업놀이 페스티벌 2022 최종 선정팀 결과발표',
      publishedYear: 2026,
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
    imageAssetId: typeof raw.imageAssetId === 'number' ? raw.imageAssetId : undefined,
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
    typeof row.publishedYear === 'number' && Number.isFinite(row.publishedYear)
      ? row.publishedYear
      : 2026
  return {
    id: asString(row.id, `ri-${i + 1}`),
    storyId,
    title,
    publishedYear: year,
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
    interviews: raw.interviews === undefined ? seed.interviews : normalizeInterviews(raw.interviews),
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

export function saveBanner(input: BannerSaveInput): RecruitGuideData {
  const imageUrl = input.imageUrl.trim()
  const mainText = input.mainText.trimEnd()
  const subText01 = input.subText01.trimEnd()
  const subText02 = input.subText02.trimEnd()
  if (!imageUrl) throw new Error('BANNER_IMAGE_REQUIRED')
  if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
  if (!subText01.trim()) throw new Error('BANNER_SUB_TEXT_01_REQUIRED')
  if (!subText02.trim()) throw new Error('BANNER_SUB_TEXT_02_REQUIRED')

  const current = readRecruitGuide()
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
  writeFile({ version: 1, data: next })
  return next
}

export function saveCulture(items: CultureSaveItem[]): RecruitGuideData {
  const current = readRecruitGuide()
  const byId = new Map(items.map(item => [item.id, item]))

  const nextItems = FIXED_CULTURE.map(fixed => {
    const patch = byId.get(fixed.id)
    const title = (patch?.title ?? '').trimEnd()
    const description = (patch?.description ?? '').trimEnd()
    if (!title.trim()) throw new Error('CULTURE_TITLE_REQUIRED')
    if (!description.trim()) throw new Error('CULTURE_DESCRIPTION_REQUIRED')
    return {
      id: fixed.id,
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
  writeFile({ version: 1, data: next })
  return next
}

function nextInterviewId(existing: InterviewItem[]): string {
  const nums = existing
    .map(row => Number(String(row.id).replace(/^ri-/, '')))
    .filter(n => Number.isFinite(n))
  const max = nums.length > 0 ? Math.max(...nums) : 0
  return `ri-${max + 1}`
}

export function addInterview(input: InterviewSaveItem): RecruitGuideData {
  const current = readRecruitGuide()
  if (current.interviews.some(row => row.storyId === input.storyId)) {
    throw new Error('INTERVIEW_DUPLICATE')
  }
  const nextRow: InterviewItem = {
    id: nextInterviewId(current.interviews),
    storyId: input.storyId,
    title: input.title.trim(),
    publishedYear: input.publishedYear,
  }
  const next: RecruitGuideData = {
    ...current,
    interviews: [...current.interviews, nextRow],
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function replaceInterview(id: string, input: InterviewSaveItem): RecruitGuideData {
  const current = readRecruitGuide()
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
    }
  })
  if (!found) throw new Error('INTERVIEW_NOT_FOUND')

  const next: RecruitGuideData = {
    ...current,
    interviews,
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function removeInterviews(ids: string[]): RecruitGuideData {
  if (ids.length === 0) throw new Error('INTERVIEW_NONE_SELECTED')
  const idSet = new Set(ids)
  const current = readRecruitGuide()
  const next: RecruitGuideData = {
    ...current,
    interviews: current.interviews.filter(row => !idSet.has(row.id)),
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}
