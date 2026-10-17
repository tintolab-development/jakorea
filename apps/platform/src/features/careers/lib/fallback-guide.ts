import {
  CAREERS_HERO,
  FEATURED_STORIES,
  THRIVE_VALUES,
} from '../lib/careers-fallback-content'
import type { CareersGuideView } from '../model/guide-view'

export function createFallbackCareersGuideView(): CareersGuideView {
  return {
    hero: {
      label: CAREERS_HERO.label,
      titleLines: CAREERS_HERO.titleLines,
      descriptionKo: CAREERS_HERO.descriptionKo,
      descriptionEn: CAREERS_HERO.descriptionEn,
      imageUrl: CAREERS_HERO.imageUrl,
      imageFallbackUrl: CAREERS_HERO.imageUrl,
      imageAlt: CAREERS_HERO.imageAlt,
    },
    thriveValues: THRIVE_VALUES,
    featuredStories: FEATURED_STORIES,
  }
}
