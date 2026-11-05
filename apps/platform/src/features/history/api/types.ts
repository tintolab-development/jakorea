/** 공개 GET /api/public/ja-korea/ja-history. version은 공개 응답에 없다. */

export type PublicJaHistoryMedia = {
  assetId?: number | null
  fileName?: string | null
  alt?: string | null
  url?: string | null
}

export type PublicJaHistoryTimelineEvent = {
  year?: string | number | null
  text?: string | null
}

export type PublicJaHistoryTimelinePeriod = {
  id?: string | null
  label?: string | null
  title?: string | null
  events?: PublicJaHistoryTimelineEvent[] | null
}

export type PublicJaHistoryTimeline = {
  image?: PublicJaHistoryMedia | null
  title?: string | null
  body?: string | null
  periods?: PublicJaHistoryTimelinePeriod[] | null
}

export type PublicJaHistoryPageResponse = {
  hero?: {
    image?: PublicJaHistoryMedia | null
    eyebrow?: string | null
    mainText?: string | null
  } | null
  origin?: {
    yearMark?: PublicJaHistoryMedia | null
    title?: string | null
    body?: string | null
    learningEyebrow?: string | null
    learningTitle?: string | null
    learningBody?: string | null
    learningImage?: PublicJaHistoryMedia | null
    learningOutro?: string | null
    learningEmphasis?: string | null
  } | null
  eras?: {
    items?: Array<{
      year?: number | string | null
      caption?: string | null
      image?: PublicJaHistoryMedia | null
    }> | null
  } | null
  worldTimeline?: PublicJaHistoryTimeline | null
  koreaTimeline?: PublicJaHistoryTimeline | null
  philosophy?: {
    eyebrow?: string | null
    title?: string | null
    lead?: string | null
    cards?: Array<{
      id?: string | null
      title?: string | null
      description?: string | null
      image?: PublicJaHistoryMedia | null
    }> | null
  } | null
  thrive?: {
    title?: string | null
    lead?: string | null
    footnote?: string | null
    cards?: Array<{
      id?: string | null
      title?: string | null
      description?: string | null
      decoration?: PublicJaHistoryMedia | null
    }> | null
  } | null
  cta?: {
    title?: string | null
    body?: string | null
    image?: PublicJaHistoryMedia | null
    primaryLabel?: string | null
    primaryHref?: string | null
    secondaryLabel?: string | null
    secondaryHref?: string | null
  } | null
  updatedAt?: string | null
}
