import type { HomePartnerLogo } from '@/features/home'
import {
  readOptionalText,
  splitPublicTextLines,
  splitStepDescriptions,
  stripStepNumberPrefix,
} from '@/shared/lib/public-text'
import type {
  ProcessStep,
  WhyCardContent,
  WhyCardId,
} from './constants'
import { PROCESS_STEPS, WHY_CARDS } from './constants'
import type {
  PublicCorporateMetricResponse,
  PublicCorporateSponsorResponse,
  PublicCorporateSponsorshipResponse,
  PublicCorporateStepResponse,
} from '../api/types'

const METRIC_CODE_TO_ID: Record<string, WhyCardId> = {
  GLOBAL_SCALE: 'global_expansion',
  TRANSPARENCY: 'transparent_ops',
  PROVEN_IMPACT: 'verified_impact',
}

const METRIC_ORDER: readonly WhyCardId[] = [
  'global_expansion',
  'transparent_ops',
  'verified_impact',
]

export type CorporateSponsorshipView = {
  titleLines: string[]
  descriptionLines: string[]
  heroImageUrl: string
  whyCards: WhyCardContent[]
  processSteps: ProcessStep[]
}

function whyIdFromMetric(item: PublicCorporateMetricResponse, index: number): WhyCardId | null {
  const fromCode = item.code ? METRIC_CODE_TO_ID[item.code] : undefined
  if (fromCode) return fromCode
  return METRIC_ORDER[index] ?? null
}

export function overlayCorporateWhyCards(
  remote: readonly PublicCorporateMetricResponse[] | undefined,
  fallback: readonly WhyCardContent[] = WHY_CARDS,
): WhyCardContent[] {
  const items = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  if (items.length === 0) return fallback.map(card => ({ ...card, titleLines: [...card.titleLines] }))

  const byId = new Map<WhyCardId, WhyCardContent>()
  items.forEach((item, index) => {
    const id = whyIdFromMetric(item, index)
    if (!id || byId.has(id)) return
    const seed = fallback.find(card => card.id === id) ?? fallback[index]
    if (!seed) return
    byId.set(id, {
      ...seed,
      badge: readOptionalText(item.name) ?? seed.badge,
      titleLines: splitPublicTextLines(item.title, seed.titleLines),
      description: readOptionalText(item.description) ?? seed.description,
    })
  })

  return METRIC_ORDER.map(id => {
    const next = byId.get(id)
    const seed = fallback.find(card => card.id === id)!
    return next ?? { ...seed, titleLines: [...seed.titleLines] }
  })
}

export function overlayCorporateProcessSteps(
  remote: readonly PublicCorporateStepResponse[] | undefined,
  fallback: readonly ProcessStep[] = PROCESS_STEPS,
): ProcessStep[] {
  const items = [...(remote ?? [])].sort(
    (a, b) => (a.stepNumber ?? 0) - (b.stepNumber ?? 0),
  )
  if (items.length === 0) {
    return fallback.map(step => ({ ...step, descriptions: [...step.descriptions] }))
  }

  const byNumber = new Map<number, ProcessStep>()
  items.forEach(item => {
    const number = item.stepNumber
    if (number == null || number < 1 || number > 6) return
    const seed = fallback.find(step => step.number === number)
    if (!seed) return
    const titleRaw = readOptionalText(item.title)
    byNumber.set(number, {
      number,
      title: titleRaw ? stripStepNumberPrefix(titleRaw) || seed.title : seed.title,
      descriptions: splitStepDescriptions(item.description, seed.descriptions),
    })
  })

  return ([1, 2, 3, 4, 5, 6] as const).map(number => {
    const next = byNumber.get(number)
    const seed = fallback.find(step => step.number === number)!
    return next ?? { ...seed, descriptions: [...seed.descriptions] }
  })
}

export function buildCorporateSponsorshipView(
  remote: PublicCorporateSponsorshipResponse | undefined,
  options: {
    fallbackTitleLines: readonly string[]
    fallbackDescriptionLines: readonly string[]
    fallbackHeroImageUrl: string
  },
): CorporateSponsorshipView {
  const banner = remote?.banner
  return {
    titleLines: splitPublicTextLines(banner?.mainText, options.fallbackTitleLines),
    descriptionLines: splitPublicTextLines(banner?.subText, options.fallbackDescriptionLines),
    heroImageUrl: readOptionalText(banner?.imageUrl) ?? options.fallbackHeroImageUrl,
    whyCards: overlayCorporateWhyCards(remote?.metrics),
    processSteps: overlayCorporateProcessSteps(remote?.steps),
  }
}

export function mapCorporateSponsorRows(
  remote: readonly PublicCorporateSponsorResponse[] | undefined,
  fallback: readonly (readonly HomePartnerLogo[])[],
): readonly (readonly HomePartnerLogo[])[] {
  const logos = [...(remote ?? [])]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .flatMap(row => {
      const name = readOptionalText(row.companyName)
      if (!name) return []
      return [{ name, logoUrl: readOptionalText(row.logoUrl) }]
    })
  if (logos.length === 0) return fallback

  const mid = Math.ceil(logos.length / 2)
  return [logos.slice(0, mid), logos.slice(mid)]
}
