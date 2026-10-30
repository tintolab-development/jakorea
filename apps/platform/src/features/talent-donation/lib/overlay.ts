import { readOptionalText, splitPublicTextLines } from '@/shared/lib/public-text'
import { talentInterviewStoryHref } from './interview-href.ts'
import type {
  MethodCardContent,
  MethodCardId,
  StoryContent,
  StoryId,
} from './constants'
import { METHOD_CARDS, TALENT_STORIES } from './constants'
import type {
  PublicTalentHowItem,
  PublicTalentInterview,
  PublicTalentIntroResponse,
} from '../api/types'

const HOW_ID_TO_CARD: Record<number, MethodCardId> = {
  1: 'mentoring',
  2: 'advisory',
  3: 'program_support',
}

const INTERVIEW_TO_STORY: Record<string, StoryId> = {
  interview_01: 'im_minjae',
  interview_02: 'lee_daehan',
}

export type TalentSponsorshipView = {
  titleLines: string[]
  descriptionLines: string[]
  methodCards: MethodCardContent[]
  stories: Array<StoryContent & { href: string | null }>
}

function descriptionLinesFromText(
  value: string | undefined,
  fallback: readonly string[],
): string[] {
  const lines = splitPublicTextLines(value, fallback)
  return lines.length > 0 ? lines : [...fallback]
}

export function overlayTalentMethodCards(
  remote: readonly PublicTalentHowItem[] | undefined,
  fallback: readonly MethodCardContent[] = METHOD_CARDS,
): MethodCardContent[] {
  const byId = new Map<MethodCardId, MethodCardContent>()
  ;(remote ?? []).forEach(item => {
    const cardId = item.id != null ? HOW_ID_TO_CARD[item.id] : undefined
    if (!cardId) return
    const seed = fallback.find(card => card.id === cardId)
    if (!seed) return
    byId.set(cardId, {
      ...seed,
      title: readOptionalText(item.title) ?? seed.title,
      descriptionLines: descriptionLinesFromText(item.description, seed.descriptionLines),
    })
  })

  return fallback.map(seed => {
    const next = byId.get(seed.id)
    return next ?? { ...seed, descriptionLines: [...seed.descriptionLines] }
  })
}

export function overlayTalentStories(
  remote: readonly PublicTalentInterview[] | undefined,
  fallback: readonly StoryContent[] = TALENT_STORIES,
): Array<StoryContent & { href: string | null }> {
  const byId = new Map<StoryId, StoryContent & { href: string | null }>()
  ;(remote ?? []).forEach((item, index) => {
    const storyId =
      (item.id && INTERVIEW_TO_STORY[item.id]) || fallback[index]?.id
    if (!storyId) return
    const seed = fallback.find(story => story.id === storyId)
    if (!seed) return
    byId.set(storyId, {
      ...seed,
      titleLines: splitPublicTextLines(item.mainText, seed.titleLines),
      descriptionLines: descriptionLinesFromText(item.subText, seed.descriptionLines),
      buttonLabel: readOptionalText(item.buttonLabel) ?? seed.buttonLabel,
      href: talentInterviewStoryHref(item.linkedStoryId),
    })
  })

  return fallback.map(seed => {
    const next = byId.get(seed.id)
    return (
      next ?? {
        ...seed,
        titleLines: [...seed.titleLines],
        descriptionLines: [...seed.descriptionLines],
        href: null,
      }
    )
  })
}

export function buildTalentSponsorshipView(
  remote: PublicTalentIntroResponse | undefined,
  options: {
    fallbackTitleLines: readonly string[]
    fallbackDescriptionLines: readonly string[]
  },
): TalentSponsorshipView {
  const banner = remote?.banner
  return {
    titleLines: splitPublicTextLines(banner?.mainText, options.fallbackTitleLines),
    descriptionLines: splitPublicTextLines(banner?.subText, options.fallbackDescriptionLines),
    methodCards: overlayTalentMethodCards(remote?.howItems),
    stories: overlayTalentStories(remote?.interviews),
  }
}
