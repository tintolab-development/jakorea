import { useState } from 'react'
import chevronLeftUrl from '../image/icon/chevron-left.svg'
import chevronRightUrl from '../image/icon/chevron-right.svg'
import type { CareersFeaturedStory } from '../model/types'
import { PFText } from '@/shared/ui'
import styles from './featured-story-carousel.module.css'

export type FeaturedStoryCarouselProps = {
  stories: readonly CareersFeaturedStory[]
}

function StoryNavButton({
  direction,
  label,
  onClick,
}: {
  direction: 'left' | 'right'
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className={styles.navButton} aria-label={label} onClick={onClick}>
      <img
        className={styles.navIcon}
        src={direction === 'left' ? chevronLeftUrl : chevronRightUrl}
        alt=""
        aria-hidden="true"
        width={22}
        height={22}
      />
    </button>
  )
}

export function FeaturedStoryCarousel({ stories }: FeaturedStoryCarouselProps) {
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
    <section className={styles.section} aria-roledescription="carousel" aria-label="스토리">
      <div className={styles.carousel}>
        <div className={styles.media}>
          {story.imageUrl ? (
            <img
              className={styles.image}
              src={story.imageUrl}
              alt=""
              width={720}
              height={480}
            />
          ) : (
            <div className={styles.mediaEmpty} aria-hidden="true" />
          )}
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <PFText as="span" typo="hl-lg" color="primary-500" className={styles.category}>
                {story.categoryLabel}
              </PFText>

              <PFText as="h2" typo="page-title-sm" color="black" className={styles.title}>
                {story.titleLines ? (
                  story.titleLines.map(line => (
                    <span key={line} className={styles.titleLine}>
                      {line}
                    </span>
                  ))
                ) : (
                  story.title
                )}
              </PFText>
            </div>

            <PFText as="p" typo="hl-lg" color="black" className={styles.date}>
              {story.publishedAtLabel}
            </PFText>
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <StoryNavButton direction="left" label="이전 스토리" onClick={goPrev} />
        <StoryNavButton direction="right" label="다음 스토리" onClick={goNext} />
      </div>
    </section>
  )
}
