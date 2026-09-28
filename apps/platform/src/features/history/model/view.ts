import type { HistoryEraAlign } from './types'

export type HistoryMediaView = {
  url: string
  alt: string
}

export type HistoryTimelineEventView = {
  year: string
  text: string
}

export type HistoryTimelinePeriodView = {
  id: string
  label: string
  title: string
  events: HistoryTimelineEventView[]
}

export type HistoryTimelineView = {
  image: HistoryMediaView
  title: string
  body: string
  periods: HistoryTimelinePeriodView[]
}

export type HistoryPageView = {
  hero: {
    image: HistoryMediaView
    eyebrow: string
    mainText: string
  }
  origin: {
    yearMark: HistoryMediaView
    englishTitle: string
    koreanTitle: string
    body: string
  }
  learning: {
    eyebrow: string
    title: string
    body: string
    image: HistoryMediaView
    outro: string
    emphasis: string
  }
  eras: Array<{
    year: string
    caption: string
    image: HistoryMediaView
    align: HistoryEraAlign
  }>
  world: HistoryTimelineView
  korea: HistoryTimelineView
  philosophy: {
    eyebrow: string
    title: string
    lead: string
    cards: Array<{
      id: string
      title: string
      description: string
      image: HistoryMediaView
    }>
  }
  thrive: {
    title: string
    lead: string
    footnote: string
    cards: Array<{
      id: string
      title: string
      description: string
      decoration: HistoryMediaView
    }>
  }
  cta: {
    title: string
    body: string
    image: HistoryMediaView
    primaryLabel: string
    primaryHref: string
    secondaryLabel: string
    secondaryHref: string
  }
}
