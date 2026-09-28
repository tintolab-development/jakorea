export type HistoryEraAlign = 'left' | 'right'

export type HistoryEraPhoto = {
  year: string
  caption: string
  captionLines?: readonly string[]
  imageUrl: string
  alt: string
  align: HistoryEraAlign
}

export type HistoryTimelineEvent = {
  year: string
  lines: readonly string[]
}

export type HistoryTimelinePeriod = {
  id: string
  label: string
  title: string
  events: readonly HistoryTimelineEvent[]
}

export type HistoryPhilosophyCard = {
  id: string
  title: string
  description: string
  descriptionPcLines?: readonly string[]
  descriptionMobileLines?: readonly string[]
  imageUrl: string
  alt: string
}

export type HistoryThriveCardId = 'empower' | 'digital' | 'partner' | 'enablers'

export type HistoryThriveCard = {
  id: HistoryThriveCardId
  titleLines: readonly string[]
  description: string
  descriptionPcLines?: readonly string[]
  descriptionMobileLines?: readonly string[]
  decorationUrl: string
}
