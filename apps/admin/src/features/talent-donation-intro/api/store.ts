/**
 * 재능기부 소개 관리 — localStorage mock (API 연동 전)
 */

import type {
  BannerSaveInput,
  HowItem,
  HowItemId,
  HowSaveItem,
  InterviewSaveInput,
  InterviewSlot,
  InterviewSlotId,
  TalentDonationBanner,
  TalentDonationIntroData,
} from '@/entities/talent-donation-intro/model/types'

const STORAGE_KEY = 'admin.sponsor.talentDonationIntro.v1'

export const TALENT_DONATION_INTRO_CHANGED_EVENT =
  'jakorea:talent-donation-intro-changed' as const

type IntroFile = {
  version: 1
  data: TalentDonationIntroData
}

const FIXED_HOW: ReadonlyArray<{
  id: HowItemId
  defaultTitle: string
  defaultDescription: string
}> = [
  {
    id: 1,
    defaultTitle: '교육·멘토링',
    defaultDescription: '전문 지식과 현장 경험을 청소년 눈높이에 맞게 전달합니다.',
  },
  {
    id: 2,
    defaultTitle: '심사·자문',
    defaultDescription: '청소년의 아이디어와 발표에 전문적인 피드백을 더합니다.',
  },
  {
    id: 3,
    defaultTitle: '프로그램 협력',
    defaultDescription: '운영 지원, 교육 공간, 네트워킹 등 자원을 제공합니다.',
  },
]

const FIXED_INTERVIEWS: ReadonlyArray<{
  id: InterviewSlotId
  defaultMain: string
  defaultSub: string
  defaultButton: string
  defaultStoryTitle: string
}> = [
  {
    id: 'interview_01',
    defaultMain: '받은 기회를 다음 세대에게 돌려주는 일',
    defaultSub:
      '“학창 시절 JA 프로그램을 통해 진로를 구체화할 수 있었습니다. 이제 그 경험을 다음 세대에게 나누고 싶습니다.”',
    defaultButton: '임민제님의 이야기 살펴보기',
    defaultStoryTitle:
      "'멘티에서 서포터로' 미래 게임 기획자의 성장기 - 이제윤님의 이야기",
  },
  {
    id: 'interview_02',
    defaultMain: 'JA 네트워크 안에서 함께 성장하는 경험',
    defaultSub:
      '“대학생 봉사자로 시작해 프로그램과 함께 성장했고, 이제는 사회인 후원자로 다음 세대를 응원합니다.”',
    defaultButton: '이대완님의 이야기 살펴보기',
    defaultStoryTitle: '봉사에서 시작된 변화의 여정: 대학생 봉사자에서 사회인 후원자로',
  },
]

function buildSeedBanner(): TalentDonationBanner {
  return {
    imageUrl:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=560&fit=crop',
    imageFileName: 'talent-banner-seed.jpg',
    mainText: '당신의 경험이 청소년의 가능성으로',
    subText:
      '전문 지식과 경험을 JA Korea와 나누면,\n청소년은 진로를 그리고 사회는 더 단단해집니다.',
    version: 0,
  }
}

function buildSeedHowItems(): HowItem[] {
  return FIXED_HOW.map(item => ({
    id: item.id,
    title: item.defaultTitle,
    description: item.defaultDescription,
    version: 0,
  }))
}

function buildSeedInterviews(): InterviewSlot[] {
  return FIXED_INTERVIEWS.map(item => ({
    id: item.id,
    mainText: item.defaultMain,
    subText: item.defaultSub,
    buttonLabel: item.defaultButton,
    linkedStoryId: item.id === 'interview_01' ? 'is-111' : 'is-103',
    linkedStoryTitle: item.defaultStoryTitle,
    thumbnailUrl:
      item.id === 'interview_01'
        ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=280&fit=crop'
        : 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=400&h=280&fit=crop',
    version: 0,
  }))
}

function buildSeedData(): TalentDonationIntroData {
  return {
    banner: buildSeedBanner(),
    howItems: buildSeedHowItems(),
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

function normalizeBanner(
  raw: Partial<TalentDonationBanner> | null | undefined
): TalentDonationBanner {
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
    subText: asString(raw.subText, seed.subText),
    version: normalizeVersion(raw.version, seed.version),
  }
}

function normalizeHowItems(raw: unknown): HowItem[] {
  const seed = buildSeedHowItems()
  const byId = new Map<number, { title?: string; description?: string; version?: number }>()
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const id = (row as { id?: unknown }).id
      if (typeof id !== 'number') continue
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
      title: overlay?.title ?? item.title,
      description: overlay?.description ?? item.description,
      version: overlay?.version ?? item.version,
    }
  })
}

function normalizeInterviews(raw: unknown): InterviewSlot[] {
  const seed = buildSeedInterviews()
  const byId = new Map<string, Partial<InterviewSlot>>()
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const id = (row as { id?: unknown }).id
      if (typeof id !== 'string') continue
      byId.set(id, row as Partial<InterviewSlot>)
    }
  }
  return seed.map(item => {
    const overlay = byId.get(item.id)
    const linkedStoryId =
      typeof overlay?.linkedStoryId === 'string' && overlay.linkedStoryId.trim()
        ? overlay.linkedStoryId.trim()
        : overlay?.linkedStoryId === null
          ? null
          : item.linkedStoryId
    return {
      id: item.id,
      mainText: asString(overlay?.mainText, item.mainText),
      subText: asString(overlay?.subText, item.subText),
      buttonLabel: asString(overlay?.buttonLabel, item.buttonLabel),
      linkedStoryId,
      linkedStoryTitle: asString(overlay?.linkedStoryTitle, item.linkedStoryTitle),
      thumbnailUrl: asString(overlay?.thumbnailUrl, item.thumbnailUrl),
      version: normalizeVersion(overlay?.version, item.version),
    }
  })
}

function normalizeData(
  raw: Partial<TalentDonationIntroData> | null | undefined
): TalentDonationIntroData {
  const seed = buildSeedData()
  if (!raw || typeof raw !== 'object') return seed
  return {
    banner: normalizeBanner(raw.banner),
    howItems: normalizeHowItems(raw.howItems),
    interviews: normalizeInterviews(raw.interviews),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): IntroFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedData() }
    const parsed = JSON.parse(raw) as IntroFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedData() }
    }
    return { version: 1, data: normalizeData(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedData() }
  }
}

function writeFile(file: IntroFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(TALENT_DONATION_INTRO_CHANGED_EVENT))
}

export function readTalentDonationIntro(): TalentDonationIntroData {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function saveBanner(input: BannerSaveInput): TalentDonationIntroData {
  const imageUrl = input.imageUrl.trim()
  const mainText = input.mainText.trimEnd()
  const subText = input.subText.trimEnd()
  if (!imageUrl) throw new Error('BANNER_IMAGE_REQUIRED')
  if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
  if (!subText.trim()) throw new Error('BANNER_SUB_TEXT_REQUIRED')

  const current = readTalentDonationIntro()
  const next: TalentDonationIntroData = {
    ...current,
    banner: {
      imageUrl,
      imageFileName: input.imageFileName?.trim() || undefined,
      imageAssetId: input.imageAssetId,
      mainText,
      subText,
      version: input.version,
    },
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function saveHowItems(items: HowSaveItem[]): TalentDonationIntroData {
  const current = readTalentDonationIntro()
  const byId = new Map(items.map(item => [item.id, item]))

  const nextItems = FIXED_HOW.map(fixed => {
    const patch = byId.get(fixed.id)
    const title = (patch?.title ?? '').trimEnd()
    const description = (patch?.description ?? '').trimEnd()
    if (!title.trim()) throw new Error('HOW_TITLE_REQUIRED')
    if (!description.trim()) throw new Error('HOW_DESCRIPTION_REQUIRED')
    return {
      id: fixed.id,
      title,
      description,
      version: patch?.version ?? 0,
    }
  })

  const next: TalentDonationIntroData = {
    ...current,
    howItems: nextItems,
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function saveInterview(input: InterviewSaveInput): TalentDonationIntroData {
  const mainText = input.mainText.trimEnd()
  const subText = input.subText.trimEnd()
  const buttonLabel = input.buttonLabel.trim()
  const linkedStoryTitle = input.linkedStoryTitle.trim()
  if (!mainText.trim()) throw new Error('INTERVIEW_MAIN_TEXT_REQUIRED')
  if (!subText.trim()) throw new Error('INTERVIEW_SUB_TEXT_REQUIRED')
  if (!buttonLabel) throw new Error('INTERVIEW_BUTTON_REQUIRED')
  if (!linkedStoryTitle && !input.linkedStoryId) throw new Error('INTERVIEW_POST_REQUIRED')

  const current = readTalentDonationIntro()
  const nextInterviews = current.interviews.map(slot => {
    if (slot.id !== input.id) return slot
    return {
      id: slot.id,
      mainText,
      subText,
      buttonLabel,
      linkedStoryId: input.linkedStoryId,
      linkedStoryTitle: linkedStoryTitle || slot.linkedStoryTitle,
      thumbnailUrl: input.thumbnailUrl,
      version: input.version,
    }
  })

  const next: TalentDonationIntroData = {
    ...current,
    interviews: nextInterviews,
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}
