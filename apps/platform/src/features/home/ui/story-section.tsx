import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  IMPACT_STORIES_PATH,
  getFeaturedImpactStories,
  getMockImpactStories,
  impactStoryDetailPath,
  type ImpactStoryListItem,
} from '@/features/impact-story'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './story-section.module.css'

const SUB_STORY_COUNT = 3

function FeaturedStory({ story }: { story: ImpactStoryListItem }) {
  return (
    <Link
      className={styles.featured}
      to={impactStoryDetailPath(story.id)}
      aria-label={`${story.title} 상세 보기`}
    >
      <div
        className={styles.featuredMedia}
        style={{ backgroundColor: story.placeholderColor }}
        aria-hidden="true"
      />
      <div className={styles.featuredBody}>
        <PFText as="p" typo="hl-lg" color="primary-500" className={styles.featuredCategory}>
          {story.categoryLabel}
        </PFText>
        <PFText as="h3" typo="hd-lg" color="black" className={styles.featuredTitle}>
          {story.title}
        </PFText>
        <PFText as="p" typo="hl-lg" color="black" className={styles.featuredDate}>
          {story.publishedAtLabel}
        </PFText>
      </div>
    </Link>
  )
}

function SubStoryCard({ story }: { story: ImpactStoryListItem }) {
  return (
    <Link
      className={styles.subCard}
      to={impactStoryDetailPath(story.id)}
      aria-label={`${story.title} 상세 보기`}
    >
      <div
        className={styles.subCardMedia}
        style={{ backgroundColor: story.placeholderColor }}
      >
        <PFCategoryBadge size="small" variant="primary" className={styles.subCardBadge}>
          {story.categoryLabel}
        </PFCategoryBadge>
      </div>
      <PFText as="h4" typo="hl-lg" color="black" className={styles.subCardTitle}>
        {story.title}
      </PFText>
    </Link>
  )
}

export function StorySection() {
  const { featured, subStories } = useMemo(() => {
    const featuredStories = getFeaturedImpactStories()
    const mainStory = featuredStories[0] ?? getMockImpactStories()[0] ?? null
    const rest = getMockImpactStories()
      .filter(story => story.id !== mainStory?.id)
      .slice(0, SUB_STORY_COUNT)
    return { featured: mainStory, subStories: rest }
  }, [])

  if (!featured) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.mobileTitle}>
          JA Korea와 함께
          <br />
          청소년의 가능성을 넓혀주세요
        </h2>

        <FeaturedStory story={featured} />

        <div className={styles.subGrid}>
          {subStories.map(story => (
            <SubStoryCard story={story} key={story.id} />
          ))}
        </div>

        <div className={styles.viewAllRow}>
          <Link className={[styles.viewAllLink, 'typo-bd-lg-sb'].join(' ')} to={IMPACT_STORIES_PATH}>
            전체보기
          </Link>
        </div>
      </div>
    </section>
  )
}
