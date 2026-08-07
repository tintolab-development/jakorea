/**
 * 개인후원 관리 — localStorage mock (API 연동 전)
 */

import type {
  BannerSaveInput,
  DonateCtaSaveInput,
  IndividualDonationBanner,
  IndividualDonationData,
  UsageGuideItem,
  UsageGuideItemId,
  UsageGuideSaveItem,
} from '@/entities/individual-donation/model/types'

const STORAGE_KEY = 'admin.sponsor.individualDonation.v1'

export const INDIVIDUAL_DONATION_CHANGED_EVENT = 'jakorea:individual-donation-changed' as const

type DonationFile = {
  version: 1
  data: IndividualDonationData
}

const FIXED_USAGE_GUIDE: ReadonlyArray<{
  id: UsageGuideItemId
  itemLabel: string
  defaultMain: string
  defaultSub: string
}> = [
  {
    id: 'future_capability',
    itemLabel: '미래 역량',
    defaultMain: '청소년을 위한 교육 프로그램 운영',
    defaultSub: 'JA 글로벌 네트워크를 통한 교육 프로그램 확장',
  },
  {
    id: 'education_access',
    itemLabel: '교육 접근성',
    defaultMain:
      '봉사자의 손길이 닿지 않는 지방 및 도서·산간 지역 청소년을 위한 교육 지원',
    defaultSub: 'JA Worldwide 기준에 따른 투명한 조직 운영 체계',
  },
]

function buildSeedBanner(): IndividualDonationBanner {
  return {
    imageUrl:
      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400&h=400&fit=crop',
    imageFileName: 'banner-seed.jpg',
    mainText: '청소년을 위한\n지속가능한 교육의 첫걸음',
    subText:
      'JA 코리아는 청소년들이 미래 사회에 필요한 역량을 키우고,\n세상을 긍정적으로 변화시키는 주체가 되도록 돕습니다.\n여러분의 후원이 청소년의 더 밝은 내일을 만듭니다.',
  }
}

function buildSeedUsageGuide(): UsageGuideItem[] {
  return FIXED_USAGE_GUIDE.map(item => ({
    id: item.id,
    itemLabel: item.itemLabel,
    mainText: item.defaultMain,
    subText: item.defaultSub,
  }))
}

function buildSeedData(): IndividualDonationData {
  return {
    banner: buildSeedBanner(),
    usageGuideItems: buildSeedUsageGuide(),
    donateCta: {
      buttonLabel: '후원하기',
      linkUrl: 'https://online.mrm.or.kr/WJEP4tk',
    },
    updatedAt: '2026-08-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeBanner(
  raw: Partial<IndividualDonationBanner> | null | undefined
): IndividualDonationBanner {
  const seed = buildSeedBanner()
  if (!raw || typeof raw !== 'object') return seed
  return {
    imageUrl: asString(raw.imageUrl, seed.imageUrl).trim() || seed.imageUrl,
    imageFileName:
      typeof raw.imageFileName === 'string' && raw.imageFileName.trim()
        ? raw.imageFileName.trim()
        : undefined,
    mainText: asString(raw.mainText, seed.mainText),
    subText: asString(raw.subText, seed.subText),
  }
}

function normalizeUsageGuide(
  raw: unknown
): UsageGuideItem[] {
  const seed = buildSeedUsageGuide()
  const byId = new Map<string, { mainText?: string; subText?: string }>()
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const id = (row as { id?: unknown }).id
      if (typeof id !== 'string') continue
      byId.set(id, {
        mainText:
          typeof (row as { mainText?: unknown }).mainText === 'string'
            ? (row as { mainText: string }).mainText
            : undefined,
        subText:
          typeof (row as { subText?: unknown }).subText === 'string'
            ? (row as { subText: string }).subText
            : undefined,
      })
    }
  }
  return seed.map(item => {
    const overlay = byId.get(item.id)
    return {
      id: item.id,
      itemLabel: item.itemLabel,
      mainText: overlay?.mainText ?? item.mainText,
      subText: overlay?.subText ?? item.subText,
    }
  })
}

function normalizeData(
  raw: Partial<IndividualDonationData> | null | undefined
): IndividualDonationData {
  const seed = buildSeedData()
  if (!raw || typeof raw !== 'object') return seed
  return {
    banner: normalizeBanner(raw.banner),
    usageGuideItems: normalizeUsageGuide(raw.usageGuideItems),
    donateCta: {
      buttonLabel: '후원하기',
      linkUrl: asString(raw.donateCta?.linkUrl, seed.donateCta.linkUrl).trim() || seed.donateCta.linkUrl,
    },
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): DonationFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedData() }
    const parsed = JSON.parse(raw) as DonationFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedData() }
    }
    return { version: 1, data: normalizeData(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedData() }
  }
}

function writeFile(file: DonationFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(INDIVIDUAL_DONATION_CHANGED_EVENT))
}

export function readIndividualDonation(): IndividualDonationData {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function saveBanner(input: BannerSaveInput): IndividualDonationData {
  const imageUrl = input.imageUrl.trim()
  const mainText = input.mainText.trimEnd()
  const subText = input.subText.trimEnd()
  if (!imageUrl) throw new Error('BANNER_IMAGE_REQUIRED')
  if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
  if (!subText.trim()) throw new Error('BANNER_SUB_TEXT_REQUIRED')

  const current = readIndividualDonation()
  const next: IndividualDonationData = {
    ...current,
    banner: {
      imageUrl,
      imageFileName: input.imageFileName?.trim() || undefined,
      mainText,
      subText,
    },
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function saveUsageGuide(items: UsageGuideSaveItem[]): IndividualDonationData {
  const current = readIndividualDonation()
  const byId = new Map(items.map(item => [item.id, item]))

  const nextItems = FIXED_USAGE_GUIDE.map(fixed => {
    const patch = byId.get(fixed.id)
    const mainText = (patch?.mainText ?? '').trimEnd()
    const subText = (patch?.subText ?? '').trimEnd()
    if (!mainText.trim()) throw new Error('USAGE_MAIN_TEXT_REQUIRED')
    if (!subText.trim()) throw new Error('USAGE_SUB_TEXT_REQUIRED')
    return {
      id: fixed.id,
      itemLabel: fixed.itemLabel,
      mainText,
      subText,
    }
  })

  const next: IndividualDonationData = {
    ...current,
    usageGuideItems: nextItems,
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function saveDonateCta(input: DonateCtaSaveInput): IndividualDonationData {
  const linkUrl = input.linkUrl.trim()
  if (!linkUrl) throw new Error('DONATE_LINK_REQUIRED')

  const current = readIndividualDonation()
  const next: IndividualDonationData = {
    ...current,
    donateCta: {
      buttonLabel: '후원하기',
      linkUrl,
    },
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}
