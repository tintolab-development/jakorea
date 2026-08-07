/**
 * 메인 콘텐츠 — localStorage mock (API 연동 전)
 */

import type {
  DonationSection,
  EducationSection,
  ImpactStoryOption,
  ImpactStorySection,
  MainContents,
  PerformanceMetric,
  PerformanceSection,
} from '@/entities/main-content/model/types'

const STORAGE_KEY = 'admin.jakorea.mainContents.v1'
const IMPACT_OPTIONS_KEY = 'admin.jakorea.impactStoryOptions.v1'

export const MAIN_CONTENTS_CHANGED_EVENT = 'jakorea:main-contents-changed' as const

type ContentsFile = {
  version: 1
  data: MainContents
}

type ImpactOptionsFile = {
  version: 1
  items: ImpactStoryOption[]
}

const METRIC_DEFS: readonly Omit<PerformanceMetric, 'value' | 'unit'>[] = [
  { id: 'network', label: '전국 교육 네트워크 분포 수' },
  { id: 'partners', label: '전문 협업 학교, 기관, 단체 수' },
  { id: 'volunteers', label: '전문 봉사자, 교사, 강사 수' },
  { id: 'beneficiaries', label: '교육 수혜자 청소년들의 수' },
]

function buildSeedMetrics(): PerformanceMetric[] {
  return [
    { ...METRIC_DEFS[0]!, value: '200', unit: '지역+' },
    { ...METRIC_DEFS[1]!, value: '1,000', unit: '개+' },
    { ...METRIC_DEFS[2]!, value: '3,000', unit: '명+' },
    { ...METRIC_DEFS[3]!, value: '90,000', unit: '여명' },
  ]
}

function buildSeedContents(): MainContents {
  const now = '2026-07-01T00:00:00.000Z'
  return {
    education: {
      title: '새로운 배움이 기다리고 있어요',
    },
    impactStory: {
      title: 'JA Korea와 함께\n청소년의 가능성을 넓혀주세요',
      youtubeUrl: 'https://youtu.be/sJYCV5yMa9M?si=4OMis_K0Cc_qVgQk',
      featuredContentId: 'impact-story-1',
    },
    performance: {
      title: '함께 만들어온 배움의 여정',
      metrics: buildSeedMetrics(),
      bottomText:
        '학생들이 스스로 미래를 설계하도록\n전국 200여개 지역의 JA 네트워크가 함께합니다',
    },
    donation: {
      title: '더 많은 학생들이 배움의 기회를\n만날 수 있게 함께해 주세요',
      cta1: {
        label: '개인후원 시작하기',
        linkUrl: 'https://online.mrm.or.kr/WJEP4tk',
      },
      cta2: {
        label: '기업후원 문의하기',
        linkUrl: 'https://online.mrm.or.kr/WJEP4tk',
      },
    },
    updatedAt: now,
  }
}

function buildSeedImpactOptions(): ImpactStoryOption[] {
  const base = new Date('2026-07-01T00:00:00.000Z')
  return [
    {
      id: 'impact-story-1',
      title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울',
      createdAt: new Date(base.getTime() + 3 * 60_000).toISOString(),
    },
    {
      id: 'impact-story-2',
      title: '청소년 금융교육으로 여는 미래',
      createdAt: new Date(base.getTime() + 2 * 60_000).toISOString(),
    },
    {
      id: 'impact-story-3',
      title: 'JA 네트워크와 함께한 지역 교육 사례',
      createdAt: new Date(base.getTime() + 1 * 60_000).toISOString(),
    },
  ]
}

function normalizeMetrics(metrics: PerformanceMetric[] | undefined): PerformanceMetric[] {
  const seed = buildSeedMetrics()
  const byId = new Map((metrics ?? []).map(m => [m.id, m]))
  return seed.map(def => {
    const prev = byId.get(def.id)
    return {
      ...def,
      value: typeof prev?.value === 'string' ? prev.value : def.value,
      unit: typeof prev?.unit === 'string' ? prev.unit : def.unit,
    }
  })
}

function normalizeContents(raw: Partial<MainContents> | null | undefined): MainContents {
  const seed = buildSeedContents()
  if (!raw || typeof raw !== 'object') return seed
  return {
    education: {
      title:
        typeof raw.education?.title === 'string' ? raw.education.title : seed.education.title,
    },
    impactStory: {
      title:
        typeof raw.impactStory?.title === 'string'
          ? raw.impactStory.title
          : seed.impactStory.title,
      youtubeUrl:
        typeof raw.impactStory?.youtubeUrl === 'string'
          ? raw.impactStory.youtubeUrl
          : seed.impactStory.youtubeUrl,
      featuredContentId:
        typeof raw.impactStory?.featuredContentId === 'string'
          ? raw.impactStory.featuredContentId
          : seed.impactStory.featuredContentId,
    },
    performance: {
      title:
        typeof raw.performance?.title === 'string'
          ? raw.performance.title
          : seed.performance.title,
      metrics: normalizeMetrics(raw.performance?.metrics),
      bottomText:
        typeof raw.performance?.bottomText === 'string'
          ? raw.performance.bottomText
          : seed.performance.bottomText,
    },
    donation: {
      title:
        typeof raw.donation?.title === 'string' ? raw.donation.title : seed.donation.title,
      cta1: {
        label:
          typeof raw.donation?.cta1?.label === 'string'
            ? raw.donation.cta1.label
            : seed.donation.cta1.label,
        linkUrl:
          typeof raw.donation?.cta1?.linkUrl === 'string'
            ? raw.donation.cta1.linkUrl
            : seed.donation.cta1.linkUrl,
      },
      cta2: {
        label:
          typeof raw.donation?.cta2?.label === 'string'
            ? raw.donation.cta2.label
            : seed.donation.cta2.label,
        linkUrl:
          typeof raw.donation?.cta2?.linkUrl === 'string'
            ? raw.donation.cta2.linkUrl
            : seed.donation.cta2.linkUrl,
      },
    },
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : seed.updatedAt,
  }
}

function readContentsFile(): ContentsFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedContents() }
    const parsed = JSON.parse(raw) as ContentsFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedContents() }
    }
    return { version: 1, data: normalizeContents(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedContents() }
  }
}

function writeContentsFile(file: ContentsFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(MAIN_CONTENTS_CHANGED_EVENT))
}

function readImpactOptionsFile(): ImpactOptionsFile {
  try {
    const raw = localStorage.getItem(IMPACT_OPTIONS_KEY)
    if (!raw) return { version: 1, items: buildSeedImpactOptions() }
    const parsed = JSON.parse(raw) as ImpactOptionsFile
    if (parsed?.version !== 1 || !Array.isArray(parsed.items) || parsed.items.length === 0) {
      return { version: 1, items: buildSeedImpactOptions() }
    }
    return parsed
  } catch {
    return { version: 1, items: buildSeedImpactOptions() }
  }
}

export function readMainContents(): MainContents {
  const file = readContentsFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeContentsFile(file)
  }
  return file.data
}

export function readImpactStoryOptions(): ImpactStoryOption[] {
  const file = readImpactOptionsFile()
  if (!localStorage.getItem(IMPACT_OPTIONS_KEY)) {
    localStorage.setItem(IMPACT_OPTIONS_KEY, JSON.stringify(file))
  }
  return [...file.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

function patchAndSave(patch: (prev: MainContents) => MainContents): MainContents {
  const prev = readContentsFile().data
  const next = { ...patch(prev), updatedAt: new Date().toISOString() }
  writeContentsFile({ version: 1, data: normalizeContents(next) })
  return normalizeContents(next)
}

export function saveEducationSection(section: EducationSection): MainContents {
  return patchAndSave(prev => ({
    ...prev,
    education: { title: section.title.trim() },
  }))
}

export function saveImpactStorySection(section: ImpactStorySection): MainContents {
  return patchAndSave(prev => ({
    ...prev,
    impactStory: {
      title: section.title.trimEnd(),
      youtubeUrl: section.youtubeUrl.trim(),
      featuredContentId: section.featuredContentId.trim(),
    },
  }))
}

export function savePerformanceSection(section: PerformanceSection): MainContents {
  return patchAndSave(prev => ({
    ...prev,
    performance: {
      title: section.title.trim(),
      bottomText: section.bottomText.trimEnd(),
      metrics: normalizeMetrics(
        section.metrics.map(m => ({
          ...m,
          value: m.value.trim(),
          unit: m.unit.trim(),
        }))
      ),
    },
  }))
}

export function saveDonationSection(section: DonationSection): MainContents {
  return patchAndSave(prev => ({
    ...prev,
    donation: {
      title: section.title.trimEnd(),
      cta1: {
        label: section.cta1.label.trim(),
        linkUrl: section.cta1.linkUrl.trim(),
      },
      cta2: {
        label: section.cta2.label.trim(),
        linkUrl: section.cta2.linkUrl.trim(),
      },
    },
  }))
}
