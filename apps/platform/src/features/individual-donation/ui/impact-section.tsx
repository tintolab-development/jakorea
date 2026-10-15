import { useMemo, useState, type CSSProperties } from 'react'
import {
  impactStoryDetailPath,
  useImpactStoriesPreview,
  type ImpactStoryCategoryKey,
} from '@/features/impact-story'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { useMediaQuery } from '@/shared/hooks'
import { PFCarouselButton, PFText } from '@/shared/ui'
import {
  IMPACT_SECTION_TITLE,
  IMPACT_SLIDER_VISIBLE_COUNT,
} from '../lib/constants'
import type { DonationImpactCategory, DonationImpactItem } from '../lib/donation-impact-types'
import { DonationImpactCard } from './donation-impact-card'
import styles from './impact-section.module.css'

const IMPACT_CARD_LIMIT = 6

function donationCategory(category: ImpactStoryCategoryKey): DonationImpactCategory {
  if (category === 'press' || category === 'report' || category === 'story') return category
  return 'story'
}

export function ImpactSection() {
  const preview = useImpactStoriesPreview()
  const items = useMemo(() => {
    return preview.items.slice(0, IMPACT_CARD_LIMIT).flatMap((item): DonationImpactItem[] => {
      if (!item.id) return []
      return [
        {
          id: item.id,
          category: donationCategory(item.category),
          categoryLabel: item.categoryLabel,
          title: item.title,
          dateLabel: item.publishedAtLabel,
          imageUrl: item.imageUrl ?? '',
          href: impactStoryDetailPath(item.id),
          placeholderColor: item.placeholderColor,
        },
      ]
    })
  }, [preview.items])
  const isPcUp = useMediaQuery(platformMediaQueries.pcUp)
  const [slideIndex, setSlideIndex] = useState(0)

  if (items.length === 0) {
    return null
  }

  const maxIndex = Math.max(0, items.length - IMPACT_SLIDER_VISIBLE_COUNT)
  const clampedIndex = Math.min(slideIndex, maxIndex)
  const canGoPrev = clampedIndex > 0
  const canGoNext = clampedIndex < maxIndex

  const trackStyle = isPcUp
    ? ({ '--slide-index': clampedIndex } as CSSProperties)
    : undefined

  return (
    <section className={styles.section} aria-labelledby="individual-donation-impact-title">
      <div className={styles.content}>
        <PFText
          as="h2"
          id="individual-donation-impact-title"
          typo="page-title-sm"
          color="black"
          className={styles.title}
        >
          {IMPACT_SECTION_TITLE}
        </PFText>

        {isPcUp ? (
          <>
            <div className={styles.viewport}>
              <ul className={styles.track} style={trackStyle}>
                {items.map(item => (
                  <li className={styles.slide} key={item.id}>
                    <DonationImpactCard item={item} />
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.navigation}>
              <PFCarouselButton
                size="large"
                direction="left"
                aria-label="이전 콘텐츠"
                disabled={!canGoPrev}
                onClick={() => setSlideIndex(current => Math.max(0, current - 1))}
              />
              <PFCarouselButton
                size="large"
                direction="right"
                aria-label="다음 콘텐츠"
                disabled={!canGoNext}
                onClick={() => setSlideIndex(current => Math.min(maxIndex, current + 1))}
              />
            </div>
          </>
        ) : (
          <ul className={styles.list}>
            {items.map(item => (
              <li className={styles.listItem} key={item.id}>
                <DonationImpactCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
