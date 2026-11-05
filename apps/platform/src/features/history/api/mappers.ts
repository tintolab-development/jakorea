import type {
  HistoryMediaView,
  HistoryPageView,
  HistoryTimelinePeriodView,
  HistoryTimelineView,
} from '../model/view.ts'
import { historyEraAlign } from '../lib/era-align.ts'
import type {
  PublicJaHistoryMedia,
  PublicJaHistoryPageResponse,
  PublicJaHistoryTimeline,
  PublicJaHistoryTimelinePeriod,
} from './types.ts'

export type HistoryMediaResolver = (
  media: PublicJaHistoryMedia | null | undefined,
  fallback: { fileName: string; url: string; alt: string },
) => HistoryMediaView

const ERA_FILE: Record<string, string> = {
  '1920': 'era-1920.png',
  '1950': 'era-1950.png',
  '1960': 'era-1960.png',
  '1980': 'era-1980.png',
}

const THRIVE_FILE: Record<string, string> = {
  empower: 'thrive-empower.svg',
  digital: 'thrive-digital.svg',
  partner: 'thrive-partner.svg',
  enablers: 'thrive-enablers.svg',
}

function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function asYear(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function mapRemoteMedia(
  media: PublicJaHistoryMedia | null | undefined,
  fallbackAlt = '',
): HistoryMediaView {
  const url = typeof media?.url === 'string' ? media.url.trim() : ''
  const alt = typeof media?.alt === 'string' ? media.alt : fallbackAlt
  return { url, alt }
}

function splitOriginTitle(title: string): { englishTitle: string; koreanTitle: string } {
  const newline = title.indexOf('\n')
  if (newline < 0) return { englishTitle: '', koreanTitle: title }
  return {
    englishTitle: title.slice(0, newline),
    koreanTitle: title.slice(newline + 1),
  }
}

function mapPeriods(
  periods: PublicJaHistoryTimelinePeriod[] | null | undefined,
): HistoryTimelinePeriodView[] {
  if (!Array.isArray(periods)) return []
  return periods.map(period => {
    const events = Array.isArray(period.events) ? period.events : []
    return {
      id: asText(period.id, ''),
      label: asText(period.label, ''),
      title: asText(period.title, ''),
      events: events.map(event => ({
        year: asYear(event?.year, ''),
        text: asText(event?.text, ''),
      })),
    }
  })
}

function mapTimeline(
  remote: PublicJaHistoryTimeline | null | undefined,
  fallback: HistoryTimelineView,
  resolveMedia: HistoryMediaResolver,
  fileName: string,
): HistoryTimelineView {
  if (!remote) {
    return {
      image: fallback.image,
      title: fallback.title,
      body: fallback.body,
      periods: [],
    }
  }
  return {
    image: resolveMedia(remote.image, {
      fileName,
      url: fallback.image.url,
      alt: fallback.image.alt,
    }),
    title: asText(remote.title, fallback.title),
    body: asText(remote.body, fallback.body),
    periods: mapPeriods(remote.periods),
  }
}

/**
 * 공개 페이지를 화면 모델로 바꾼다.
 * 빈 기간·빈 제목은 빼지 않는다. 개행은 유지한다. version은 읽지 않는다.
 */
export function mapPublicJaHistoryPage(
  raw: PublicJaHistoryPageResponse,
  resolveMedia: HistoryMediaResolver,
  fallback: HistoryPageView,
): HistoryPageView {
  const hero = raw.hero
  const origin = raw.origin
  const originTitle = splitOriginTitle(asText(origin?.title, ''))
  const philosophy = raw.philosophy
  const thrive = raw.thrive
  const cta = raw.cta
  const eraItems = raw.eras?.items

  return {
    hero: {
      image: resolveMedia(hero?.image, {
        fileName: 'hero-visual.png',
        url: fallback.hero.image.url,
        alt: fallback.hero.image.alt,
      }),
      eyebrow: asText(hero?.eyebrow, fallback.hero.eyebrow),
      mainText: asText(hero?.mainText, fallback.hero.mainText),
    },
    origin: origin
      ? {
          yearMark: resolveMedia(origin.yearMark, {
            fileName: 'year-1919.svg',
            url: fallback.origin.yearMark.url,
            alt: fallback.origin.yearMark.alt,
          }),
          englishTitle: origin.title == null ? fallback.origin.englishTitle : originTitle.englishTitle,
          koreanTitle: origin.title == null ? fallback.origin.koreanTitle : originTitle.koreanTitle,
          body: asText(origin.body, fallback.origin.body),
        }
      : fallback.origin,
    learning: origin
      ? {
          eyebrow: asText(origin.learningEyebrow, fallback.learning.eyebrow),
          title: asText(origin.learningTitle, fallback.learning.title),
          body: asText(origin.learningBody, fallback.learning.body),
          image: resolveMedia(origin.learningImage, {
            fileName: 'learning-photo.png',
            url: fallback.learning.image.url,
            alt: fallback.learning.image.alt,
          }),
          outro: asText(origin.learningOutro, fallback.learning.outro),
          emphasis: asText(origin.learningEmphasis, fallback.learning.emphasis),
        }
      : fallback.learning,
    eras: Array.isArray(eraItems)
      ? eraItems.map((item, index) => {
          const fallbackEra = fallback.eras[index]
          const year = asYear(item?.year, fallbackEra?.year ?? '')
          return {
            year,
            caption: asText(item?.caption, ''),
            image: resolveMedia(item?.image, {
              fileName: ERA_FILE[year] ?? `era-${year}.png`,
              url: fallbackEra?.image.url ?? '',
              alt: fallbackEra?.image.alt ?? '',
            }),
            align: historyEraAlign(year, index),
          }
        })
      : fallback.eras,
    world: mapTimeline(raw.worldTimeline, fallback.world, resolveMedia, 'expansion-photo.png'),
    korea: mapTimeline(raw.koreaTimeline, fallback.korea, resolveMedia, 'korea-photo.png'),
    philosophy: philosophy
      ? {
          eyebrow: asText(philosophy.eyebrow, fallback.philosophy.eyebrow),
          title: asText(philosophy.title, fallback.philosophy.title),
          lead: asText(philosophy.lead, fallback.philosophy.lead),
          cards: Array.isArray(philosophy.cards)
            ? philosophy.cards.map((card, index) => {
                const fallbackCard = fallback.philosophy.cards[index]
                const id = asText(card?.id, fallbackCard?.id ?? '')
                return {
                  id,
                  title: asText(card?.title, ''),
                  description: asText(card?.description, ''),
                  image: mapRemoteMedia(card?.image, fallbackCard?.image.alt ?? ''),
                }
              })
            : fallback.philosophy.cards,
        }
      : fallback.philosophy,
    thrive: thrive
      ? {
          title: asText(thrive.title, fallback.thrive.title),
          lead: asText(thrive.lead, fallback.thrive.lead),
          footnote: asText(thrive.footnote, fallback.thrive.footnote),
          cards: Array.isArray(thrive.cards)
            ? thrive.cards.map((card, index) => {
                const fallbackCard = fallback.thrive.cards[index]
                const id = asText(card?.id, fallbackCard?.id ?? '')
                return {
                  id,
                  title: asText(card?.title, ''),
                  description: asText(card?.description, ''),
                  decoration: resolveMedia(card?.decoration, {
                    fileName: THRIVE_FILE[id] ?? '',
                    url: fallbackCard?.decoration.url ?? '',
                    alt: fallbackCard?.decoration.alt ?? '',
                  }),
                }
              })
            : fallback.thrive.cards,
        }
      : fallback.thrive,
    cta: cta
      ? {
          title: asText(cta.title, fallback.cta.title),
          body: asText(cta.body, fallback.cta.body),
          image: resolveMedia(cta.image, {
            fileName: 'cta-photo.png',
            url: fallback.cta.image.url,
            alt: fallback.cta.image.alt,
          }),
          primaryLabel: asText(cta.primaryLabel, fallback.cta.primaryLabel),
          primaryHref: asText(cta.primaryHref, fallback.cta.primaryHref),
          secondaryLabel: asText(cta.secondaryLabel, fallback.cta.secondaryLabel),
          secondaryHref: asText(cta.secondaryHref, fallback.cta.secondaryHref),
        }
      : fallback.cta,
  }
}
