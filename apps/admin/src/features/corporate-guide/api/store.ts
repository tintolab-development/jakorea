/**
 * 기업후원 안내 관리 — localStorage mock (API 연동 전)
 */

import type {
  BannerSaveInput,
  CorporateGuideBanner,
  CorporateGuideData,
  MetricItem,
  MetricItemId,
  MetricSaveItem,
  PartnershipSaveItem,
  PartnershipStep,
  PartnershipStepNumber,
} from '@/entities/corporate-guide/model/types'

const STORAGE_KEY = 'admin.sponsor.corporateGuide.v1'

export const CORPORATE_GUIDE_CHANGED_EVENT = 'jakorea:corporate-guide-changed' as const

type GuideFile = {
  version: 1
  data: CorporateGuideData
}

const FIXED_METRICS: ReadonlyArray<{
  id: MetricItemId
  itemLabel: string
  defaultTitle: string
  defaultDescription: string
}> = [
  {
    id: 'global_scale',
    itemLabel: '글로벌 확장성',
    defaultTitle: '100여개 국가',
    defaultDescription: '글로벌 네트워크를 통한 사업 확장',
  },
  {
    id: 'transparency',
    itemLabel: '최고 수준의 투명성',
    defaultTitle: '투명한 조직운영',
    defaultDescription: 'JA Worldwide 기준에 따른 투명한 조직 운영 체계',
  },
  {
    id: 'proven_impact',
    itemLabel: '검증된 임팩트',
    defaultTitle: '10만명 이상',
    defaultDescription: '10년 이상 이어온 파트너십을 통한 누적 교육 인원',
  },
]

const FIXED_PARTNERSHIP_DEFAULTS: ReadonlyArray<{
  step: PartnershipStepNumber
  title: string
  description: string
}> = [
  {
    step: 1,
    title: '1. 제안',
    description: '· 파트너십 문의',
  },
  {
    step: 2,
    title: '2. 검토',
    description:
      '· 프로그램 적합성 및 교육 대상 검토\n· 기업 CSR 목표 파악',
  },
  {
    step: 3,
    title: '3. 기획',
    description:
      '· 프로그램 목적 및 포지셔닝 설계\n· 운영 방식 제안',
  },
  {
    step: 4,
    title: '4. 협약',
    description:
      '· 운영 기간 및 후원 규모 확정\n· 프로그램 비용 지원',
  },
  {
    step: 5,
    title: '5. 운영',
    description:
      '· 수혜자 및 강사 모집·선발\n· 프로그램 진행',
  },
  {
    step: 6,
    title: '6. 보고',
    description:
      '· 결과·정산 보고서 제공\n· 성과 평가 및 차년도 계획 수립',
  },
]

function buildSeedBanner(): CorporateGuideBanner {
  return {
    imageUrl:
      'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=400&h=400&fit=crop',
    imageFileName: 'corporate-banner-seed.jpg',
    mainText: '청소년의 성장을 이끌어내는\n파트너십의 힘',
    subText:
      'JA Korea는 기업의 사회적 책임이 청소년의 내일로 연결될 수 있도록\n맞춤형 교육 프로그램을 운영합니다.',
  }
}

function buildSeedMetrics(): MetricItem[] {
  return FIXED_METRICS.map(item => ({
    id: item.id,
    itemLabel: item.itemLabel,
    title: item.defaultTitle,
    description: item.defaultDescription,
  }))
}

function buildSeedPartnership(): PartnershipStep[] {
  return FIXED_PARTNERSHIP_DEFAULTS.map(item => ({
    step: item.step,
    title: item.title,
    description: item.description,
  }))
}

function buildSeedData(): CorporateGuideData {
  return {
    banner: buildSeedBanner(),
    metrics: buildSeedMetrics(),
    partnershipSteps: buildSeedPartnership(),
    updatedAt: '2026-08-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeBanner(
  raw: Partial<CorporateGuideBanner> | null | undefined
): CorporateGuideBanner {
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

function normalizeMetrics(raw: unknown): MetricItem[] {
  const seed = buildSeedMetrics()
  const byId = new Map<string, { title?: string; description?: string }>()
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
    }
  })
}

function normalizePartnership(raw: unknown): PartnershipStep[] {
  const seed = buildSeedPartnership()
  const byStep = new Map<number, { title?: string; description?: string }>()
  if (Array.isArray(raw)) {
    for (const row of raw) {
      if (!row || typeof row !== 'object') continue
      const step = (row as { step?: unknown }).step
      if (typeof step !== 'number') continue
      byStep.set(step, {
        title:
          typeof (row as { title?: unknown }).title === 'string'
            ? (row as { title: string }).title
            : undefined,
        description:
          typeof (row as { description?: unknown }).description === 'string'
            ? (row as { description: string }).description
            : undefined,
      })
    }
  }
  return seed.map(item => {
    const overlay = byStep.get(item.step)
    return {
      step: item.step,
      title: overlay?.title ?? item.title,
      description: overlay?.description ?? item.description,
    }
  })
}

function normalizeData(
  raw: Partial<CorporateGuideData> | null | undefined
): CorporateGuideData {
  const seed = buildSeedData()
  if (!raw || typeof raw !== 'object') return seed
  return {
    banner: normalizeBanner(raw.banner),
    metrics: normalizeMetrics(raw.metrics),
    partnershipSteps: normalizePartnership(raw.partnershipSteps),
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
  window.dispatchEvent(new CustomEvent(CORPORATE_GUIDE_CHANGED_EVENT))
}

export function readCorporateGuide(): CorporateGuideData {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function saveBanner(input: BannerSaveInput): CorporateGuideData {
  const imageUrl = input.imageUrl.trim()
  const mainText = input.mainText.trimEnd()
  const subText = input.subText.trimEnd()
  if (!imageUrl) throw new Error('BANNER_IMAGE_REQUIRED')
  if (!mainText.trim()) throw new Error('BANNER_MAIN_TEXT_REQUIRED')
  if (!subText.trim()) throw new Error('BANNER_SUB_TEXT_REQUIRED')

  const current = readCorporateGuide()
  const next: CorporateGuideData = {
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

export function saveMetrics(items: MetricSaveItem[]): CorporateGuideData {
  const current = readCorporateGuide()
  const byId = new Map(items.map(item => [item.id, item]))

  const nextMetrics = FIXED_METRICS.map(fixed => {
    const patch = byId.get(fixed.id)
    const title = (patch?.title ?? '').trimEnd()
    const description = (patch?.description ?? '').trimEnd()
    if (!title.trim()) throw new Error('METRIC_TITLE_REQUIRED')
    if (!description.trim()) throw new Error('METRIC_DESCRIPTION_REQUIRED')
    return {
      id: fixed.id,
      itemLabel: fixed.itemLabel,
      title,
      description,
    }
  })

  const next: CorporateGuideData = {
    ...current,
    metrics: nextMetrics,
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}

export function savePartnership(items: PartnershipSaveItem[]): CorporateGuideData {
  const current = readCorporateGuide()
  const byStep = new Map(items.map(item => [item.step, item]))

  const nextSteps = FIXED_PARTNERSHIP_DEFAULTS.map(fixed => {
    const patch = byStep.get(fixed.step)
    const title = (patch?.title ?? '').trimEnd()
    const description = (patch?.description ?? '').trimEnd()
    if (!title.trim()) throw new Error('PARTNERSHIP_TITLE_REQUIRED')
    if (!description.trim()) throw new Error('PARTNERSHIP_DESCRIPTION_REQUIRED')
    return {
      step: fixed.step,
      title,
      description,
    }
  })

  const next: CorporateGuideData = {
    ...current,
    partnershipSteps: nextSteps,
    updatedAt: new Date().toISOString(),
  }
  writeFile({ version: 1, data: next })
  return next
}
