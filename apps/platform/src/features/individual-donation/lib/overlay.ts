import type { WhyCardContent, WhyCardId } from './constants'
import { WHY_CARDS } from './constants'
import { readOptionalText, splitPublicTextLines } from '@/shared/lib/public-text'
import type { PublicPersonalSponsorshipResponse, PublicPersonalUsageResponse } from '../api/types'

const USAGE_CODE_TO_ID: Record<string, WhyCardId> = {
  FUTURE_CAPABILITY: 'future_capability',
  EDUCATION_ACCESSIBILITY: 'education_access',
}

const USAGE_ORDER: readonly WhyCardId[] = ['future_capability', 'education_access']

export type PersonalSponsorshipView = {
  titleLines: string[]
  descriptionLines: string[]
  heroImageUrl: string | null
  whyCards: WhyCardContent[]
  donationButtonLabel: string | null
  donationUrl: string | null
}

function whyIdFromUsage(item: PublicPersonalUsageResponse, index: number): WhyCardId | null {
  const fromCode = item.code ? USAGE_CODE_TO_ID[item.code] : undefined
  if (fromCode) return fromCode
  return USAGE_ORDER[index] ?? null
}

export function overlayPersonalWhyCards(
  remote: readonly PublicPersonalUsageResponse[] | undefined,
  fallback: readonly WhyCardContent[] = WHY_CARDS,
): WhyCardContent[] {
  const items = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  if (items.length === 0) return fallback.map(card => ({ ...card, titleLines: [...card.titleLines] }))

  const byId = new Map<WhyCardId, WhyCardContent>()
  items.forEach((item, index) => {
    const id = whyIdFromUsage(item, index)
    if (!id || byId.has(id)) return
    const seed = fallback.find(card => card.id === id) ?? fallback[index]
    if (!seed) return
    byId.set(id, {
      ...seed,
      badge: readOptionalText(item.name) ?? seed.badge,
      titleLines: splitPublicTextLines(item.mainText, seed.titleLines),
      description: readOptionalText(item.subText) ?? seed.description,
    })
  })

  return USAGE_ORDER.map(id => {
    const next = byId.get(id)
    const seed = fallback.find(card => card.id === id)!
    return next ?? { ...seed, titleLines: [...seed.titleLines] }
  })
}

export function buildPersonalSponsorshipView(
  remote: PublicPersonalSponsorshipResponse | undefined,
  options: {
    fallbackTitleLines: readonly string[]
    fallbackDescriptionLines: readonly string[]
    fallbackHeroImageUrl: string
    fallbackWhyCards?: readonly WhyCardContent[]
  },
): PersonalSponsorshipView {
  const banner = remote?.banner
  return {
    titleLines: splitPublicTextLines(banner?.mainText, options.fallbackTitleLines),
    descriptionLines: splitPublicTextLines(banner?.subText, options.fallbackDescriptionLines),
    heroImageUrl: readOptionalText(banner?.imageUrl) ?? options.fallbackHeroImageUrl,
    whyCards: overlayPersonalWhyCards(remote?.usageItems, options.fallbackWhyCards),
    donationButtonLabel: readOptionalText(remote?.donationButtonLabel) ?? null,
    donationUrl: readOptionalText(remote?.donationUrl) ?? null,
  }
}
