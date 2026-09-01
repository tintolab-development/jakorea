import { useState, type CSSProperties } from 'react'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { useMediaQuery, useShouldUsePlatformMockData } from '@/shared/hooks'
import { PFCarouselButton, PFText } from '@/shared/ui'
import {
  IMPACT_SECTION_TITLE,
  IMPACT_SLIDER_VISIBLE_COUNT,
} from '../lib/constants'
import { getDonationImpactItems } from '../lib/impact-mock'
import { DonationImpactCard } from './donation-impact-card'
import styles from './impact-section.module.css'

export function ImpactSection() {
  useShouldUsePlatformMockData()
  const items = getDonationImpactItems()
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
