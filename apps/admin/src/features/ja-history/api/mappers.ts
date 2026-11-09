import type {
  JaHistoryData,
  JaHistoryCtaSaveInput,
  JaHistoryEraSaveInput,
  JaHistoryHeroSaveInput,
  JaHistoryMedia,
  JaHistoryOriginSaveInput,
  JaHistoryPhilosophySaveInput,
  JaHistoryThriveSaveInput,
  JaHistoryTimeline,
  JaHistoryTimelineSaveInput,
} from '@/entities/ja-history/model/types'
import type { JaHistoryPageCtaUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageCtaUpdateRequest'
import type { JaHistoryPageErasUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageErasUpdateRequest'
import type { JaHistoryPageHeroUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageHeroUpdateRequest'
import type { JaHistoryPageMediaResponse } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageMediaResponse'
import type { JaHistoryPageOriginUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageOriginUpdateRequest'
import type { JaHistoryPagePhilosophyUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPagePhilosophyUpdateRequest'
import type { JaHistoryPageResponse } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageResponse'
import type { JaHistoryPageThriveUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageThriveUpdateRequest'
import type { JaHistoryPageTimelineResponse } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageTimelineResponse'
import type { JaHistoryPageTimelineUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/jaHistoryPageTimelineUpdateRequest'

function emptyMedia(): JaHistoryMedia {
  return { url: '', fileName: '', alt: '' }
}

export function mapJaHistoryMedia(media?: JaHistoryPageMediaResponse | null): JaHistoryMedia {
  if (!media) return emptyMedia()
  return {
    assetId: media.assetId,
    url: media.url ?? '',
    fileName: media.fileName ?? '',
    alt: media.alt ?? '',
  }
}

function mapTimelineEventYear(year: unknown): string {
  if (typeof year === 'string') return year
  if (typeof year === 'number' && Number.isFinite(year)) return String(year)
  return ''
}

function mapTimeline(row?: JaHistoryPageTimelineResponse | null): JaHistoryTimeline {
  return {
    image: mapJaHistoryMedia(row?.image),
    title: row?.title ?? '',
    body: row?.body ?? '',
    periods: (row?.periods ?? []).map(period => ({
      id: period.id ?? '',
      label: period.label ?? '',
      title: period.title ?? '',
      events: (period.events ?? []).map(event => ({
        year: mapTimelineEventYear(event.year),
        text: event.text ?? '',
      })),
    })),
  }
}

export function mapJaHistoryPageResponseToDomain(row: JaHistoryPageResponse): JaHistoryData {
  const eraItems = row.eras?.items ?? []
  return {
    hero: {
      image: mapJaHistoryMedia(row.hero?.image),
      eyebrow: row.hero?.eyebrow ?? '',
      mainText: row.hero?.mainText ?? '',
    },
    origin: {
      yearMark: mapJaHistoryMedia(row.origin?.yearMark),
      title: row.origin?.title ?? '',
      body: row.origin?.body ?? '',
      learningEyebrow: row.origin?.learningEyebrow ?? '',
      learningTitle: row.origin?.learningTitle ?? '',
      learningBody: row.origin?.learningBody ?? '',
      learningImage: mapJaHistoryMedia(row.origin?.learningImage),
      learningOutro: row.origin?.learningOutro ?? '',
      learningEmphasis: row.origin?.learningEmphasis ?? '',
    },
    eras: eraItems.map(item => ({
      year: item.year == null ? '' : String(item.year),
      caption: item.caption ?? '',
      image: mapJaHistoryMedia(item.image),
    })),
    worldTimeline: mapTimeline(row.worldTimeline),
    philosophy: {
      eyebrow: row.philosophy?.eyebrow ?? '',
      title: row.philosophy?.title ?? '',
      lead: row.philosophy?.lead ?? '',
      cards: (row.philosophy?.cards ?? []).map(card => ({
        id: card.id ?? '',
        title: card.title ?? '',
        description: card.description ?? '',
        image: mapJaHistoryMedia(card.image),
      })),
    },
    koreaTimeline: mapTimeline(row.koreaTimeline),
    thrive: {
      title: row.thrive?.title ?? '',
      lead: row.thrive?.lead ?? '',
      footnote: row.thrive?.footnote ?? '',
      cards: (row.thrive?.cards ?? []).map(card => ({
        id: card.id ?? '',
        title: card.title ?? '',
        description: card.description ?? '',
        decoration: mapJaHistoryMedia(card.decoration),
      })),
    },
    cta: {
      title: row.cta?.title ?? '',
      body: row.cta?.body ?? '',
      image: mapJaHistoryMedia(row.cta?.image),
      primaryLabel: row.cta?.primaryLabel ?? '',
      primaryHref: row.cta?.primaryHref ?? '',
      secondaryLabel: row.cta?.secondaryLabel ?? '',
      secondaryHref: row.cta?.secondaryHref ?? '',
    },
    updatedAt: row.updatedAt ?? '',
    version: row.version ?? 0,
  }
}

function requireYearNumber(year: string, label: string): number {
  const n = Number(year)
  if (!Number.isFinite(n)) {
    throw new Error(`${label} 연도가 올바르지 않습니다.`)
  }
  return n
}

export function toJaHistoryHeroUpdateRequest(
  input: JaHistoryHeroSaveInput,
  imageAssetId: number,
  version: number,
): JaHistoryPageHeroUpdateRequest {
  return {
    imageAssetId,
    eyebrow: input.eyebrow.trimEnd(),
    mainText: input.mainText.trimEnd(),
    version,
  }
}

export function toJaHistoryOriginUpdateRequest(
  input: JaHistoryOriginSaveInput,
  version: number,
): JaHistoryPageOriginUpdateRequest {
  return {
    title: input.title.trimEnd(),
    body: input.body.trimEnd(),
    learningEyebrow: input.learningEyebrow.trimEnd(),
    learningTitle: input.learningTitle.trimEnd(),
    learningBody: input.learningBody.trimEnd(),
    learningOutro: input.learningOutro.trimEnd(),
    learningEmphasis: input.learningEmphasis.trimEnd(),
    version,
  }
}

export function toJaHistoryErasUpdateRequest(
  input: JaHistoryEraSaveInput[],
  version: number,
): JaHistoryPageErasUpdateRequest {
  return {
    items: input.map(item => ({
      year: requireYearNumber(item.year, '시대'),
      caption: item.caption.trimEnd(),
    })),
    version,
  }
}

export function toJaHistoryTimelineUpdateRequest(
  input: JaHistoryTimelineSaveInput,
  imageAssetId: number,
  version: number,
): JaHistoryPageTimelineUpdateRequest {
  return {
    imageAssetId,
    title: input.title.trimEnd(),
    body: input.body.trimEnd(),
    periods: input.periods.map(period => ({
      id: period.id,
      title: period.title.trimEnd(),
      events: period.events.map(event => ({
        year: event.year.trim(),
        text: event.text.trimEnd(),
      })),
    })),
    version,
  }
}

export function toJaHistoryPhilosophyUpdateRequest(
  input: JaHistoryPhilosophySaveInput,
  version: number,
): JaHistoryPagePhilosophyUpdateRequest {
  return {
    eyebrow: input.eyebrow.trimEnd(),
    title: input.title.trimEnd(),
    lead: input.lead.trimEnd(),
    cards: input.cards.map(card => {
      if (card.imageAssetId == null) {
        throw new Error('교육 카드 이미지를 등록해 주세요.')
      }
      return {
        id: card.id,
        title: card.title.trimEnd(),
        description: card.description.trimEnd(),
        imageAssetId: card.imageAssetId,
      }
    }),
    version,
  }
}

export function toJaHistoryThriveUpdateRequest(
  input: JaHistoryThriveSaveInput,
  version: number,
): JaHistoryPageThriveUpdateRequest {
  return {
    title: input.title.trimEnd(),
    lead: input.lead.trimEnd(),
    footnote: input.footnote.trimEnd(),
    cards: input.cards.map(card => ({
      id: card.id,
      title: card.title.trimEnd(),
      description: card.description.trimEnd(),
    })),
    version,
  }
}

export function toJaHistoryCtaUpdateRequest(
  input: JaHistoryCtaSaveInput,
  version: number,
  imageAssetId?: number,
): JaHistoryPageCtaUpdateRequest {
  return {
    title: input.title.trimEnd(),
    body: input.body.trimEnd(),
    primaryLabel: input.primaryLabel.trimEnd(),
    primaryHref: input.primaryHref.trim(),
    secondaryLabel: input.secondaryLabel.trimEnd(),
    secondaryHref: input.secondaryHref.trim(),
    ...(imageAssetId != null ? { imageAssetId } : {}),
    version,
  }
}
