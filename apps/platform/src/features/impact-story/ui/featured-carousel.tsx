import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PFCarouselButton, PFCategoryBadge, PFText } from '@/shared/ui'
import { impactStoryDetailPath } from '../lib/constants'
import type { ImpactStoryListItem } from '../model/types'
import styles from './featured-carousel.module.css'

export type FeaturedCarouselProps = {
  stories: readonly ImpactStoryListItem[]
}

export function FeaturedCarousel({ stories }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0)

  if (stories.length === 0) {
    return null
  }

  const safeIndex = index % stories.length
  const story = stories[safeIndex]!

  const goPrev = () => {
    setIndex(current => (current - 1 + stories.length) % stories.length)
  }

  const goNext = () => {
    setIndex(current => (current + 1) % stories.length)
  }

  return (
    <div className={styles.carousel}>
      <Link
        to={impactStoryDetailPath(story.id)}
        className={styles.mediaLink}
        aria-label={`${story.title} 상세 보기`}
      >
        <div className={styles.media} aria-hidden="true" />
      </Link>

      <div className={styles.content}>
        <div className={styles.header}>
          <PFCategoryBadge size="large" variant="primary">
            {story.categoryLabel}
          </PFCategoryBadge>

          <Link to={impactStoryDetailPath(story.id)} className={styles.titleLink}>
            <PFText as="h2" typo="hd-sm" color="black" className={styles.title}>
              {story.title}
            </PFText>
          </Link>

          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.date}>
            {story.publishedAtLabel}
          </PFText>
        </div>

        <p className={styles.summary}>{story.summary}</p>

        <div className={styles.controls}>
          <PFCarouselButton
            size="small"
            direction="left"
            aria-label="이전 스토리"
            onClick={goPrev}
          />
          <PFCarouselButton
            size="small"
            direction="right"
            aria-label="다음 스토리"
            onClick={goNext}
          />
        </div>
      </div>
    </div>
  )
}
