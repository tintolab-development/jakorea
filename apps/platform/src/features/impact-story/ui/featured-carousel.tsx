import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRemoteThumbnailUrl } from '@/shared/hooks'
import { PFCarouselButton, PFCategoryBadge, PFText } from '@/shared/ui'
import defaultThumbnailUrl from '../image/illustration/card-default.png'
import { impactStoryDetailPath } from '../lib/constants'
import type { ImpactStoryListItem } from '../model/types'
import styles from './featured-carousel.module.css'

export type FeaturedCarouselProps = {
  stories: readonly ImpactStoryListItem[]
}

export function FeaturedCarousel({ stories }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0)
  const current = stories.length > 0 ? stories[index % stories.length] : undefined
  // 어드민 「썸네일 없음」 표식(1×1 투명 PNG)은 이미지 없음으로 보고 기본 썸네일을 쓴다
  const remoteImageUrl = useRemoteThumbnailUrl(current?.featuredImageUrl || current?.imageUrl)

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
        <div
          className={remoteImageUrl ? styles.media : `${styles.media} ${styles.mediaDefault}`}
          aria-hidden="true"
        >
          <img
            className={styles.image}
            src={remoteImageUrl || defaultThumbnailUrl}
            alt=""
            width={630}
            height={355}
          />
        </div>
      </Link>

      <div className={styles.content}>
        <div className={styles.header}>
          <PFCategoryBadge
            className={styles.categoryBadge}
            size="large"
            variant="primary"
          >
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
