export type JaHistoryMedia = {
  /** Remote asset id. Keep across saves when the file is unchanged. */
  assetId?: number
  url: string
  fileName: string
  alt: string
}

export type JaHistoryHero = {
  image: JaHistoryMedia
  eyebrow: string
  mainText: string
}

export type JaHistoryOrigin = {
  yearMark: JaHistoryMedia
  title: string
  body: string
  learningEyebrow: string
  learningTitle: string
  learningBody: string
  learningImage: JaHistoryMedia
  learningOutro: string
  learningEmphasis: string
}

export type JaHistoryEra = {
  year: string
  image: JaHistoryMedia
  caption: string
}

export type JaHistoryTimelineEvent = {
  year: string
  text: string
}

export type JaHistoryTimelinePeriod = {
  id: string
  label: string
  title: string
  events: JaHistoryTimelineEvent[]
}

export type JaHistoryTimeline = {
  image: JaHistoryMedia
  title: string
  body: string
  periods: JaHistoryTimelinePeriod[]
}

export type JaHistoryPhilosophyCard = {
  id: string
  title: string
  description: string
  image: JaHistoryMedia
}

export type JaHistoryPhilosophy = {
  eyebrow: string
  title: string
  lead: string
  cards: JaHistoryPhilosophyCard[]
}

export type JaHistoryThriveCard = {
  id: string
  title: string
  description: string
  decoration: JaHistoryMedia
}

export type JaHistoryThrive = {
  title: string
  lead: string
  cards: JaHistoryThriveCard[]
  footnote: string
}

export type JaHistoryCta = {
  title: string
  body: string
  image: JaHistoryMedia
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
}

export type JaHistoryData = {
  hero: JaHistoryHero
  origin: JaHistoryOrigin
  eras: JaHistoryEra[]
  worldTimeline: JaHistoryTimeline
  philosophy: JaHistoryPhilosophy
  koreaTimeline: JaHistoryTimeline
  thrive: JaHistoryThrive
  cta: JaHistoryCta
  updatedAt: string
  /** Admin optimistic lock. Required on every remote PUT. */
  version: number
}

export type JaHistoryHeroSaveInput = {
  imageUrl: string
  imageFileName: string
  imageFile?: File | null
  imageAssetId?: number | null
  eyebrow: string
  mainText: string
}

export type JaHistoryOriginSaveInput = {
  title: string
  body: string
  learningEyebrow: string
  learningTitle: string
  learningBody: string
  learningOutro: string
  learningEmphasis: string
}

export type JaHistoryEraSaveInput = {
  year: string
  caption: string
}

export type JaHistoryTimelineSaveInput = {
  imageUrl: string
  imageFileName: string
  imageFile?: File | null
  imageAssetId?: number | null
  title: string
  body: string
  periods: Array<{
    id: string
    title: string
    events: Array<{ year: string; text: string }>
  }>
}

export type JaHistoryPhilosophySaveInput = {
  eyebrow: string
  title: string
  lead: string
  cards: Array<{
    id: string
    title: string
    description: string
    imageFile?: File | null
    imageAssetId?: number | null
  }>
}

export type JaHistoryThriveSaveInput = {
  title: string
  lead: string
  footnote: string
  cards: Array<{ id: string; title: string; description: string }>
}

export type JaHistoryCtaSaveInput = {
  title: string
  body: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryHref: string
  imageUrl?: string
  imageFileName?: string
  /** 새로 선택한 이미지. 없으면 imageAssetId를 생략해 기존 이미지를 유지한다. */
  imageFile?: File | null
}

export type JaHistorySaveErrorCode =
  | 'REQUIRED'
  | 'STORAGE_QUOTA'
  | 'REMOTE_UNAVAILABLE'
  | 'OPTIMISTIC_LOCK'

export class JaHistorySaveError extends Error {
  readonly code: JaHistorySaveErrorCode

  constructor(code: JaHistorySaveErrorCode, message: string) {
    super(message)
    this.name = 'JaHistorySaveError'
    this.code = code
  }
}
