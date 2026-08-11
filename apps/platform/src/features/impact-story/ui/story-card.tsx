import { Link } from 'react-router-dom'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import { impactStoryDetailPath } from '../lib/constants'
import type { ImpactStoryListItem } from '../model/types'
import styles from './story-card.module.css'

export type StoryCardProps = {
  story: ImpactStoryListItem
}

export function StoryCard({ story }: StoryCardProps) {
  return (
    <Link to={impactStoryDetailPath(story.id)} className={styles.cardLink}>
      <article className={styles.card}>
        <div
          className={styles.thumbnail}
          style={{ backgroundColor: story.placeholderColor }}
          aria-hidden="true"
        >
          <div className={styles.badge}>
            <PFCategoryBadge size="large" variant="primary">
              {story.categoryLabel}
            </PFCategoryBadge>
          </div>
        </div>

        <div className={styles.meta}>
          <PFText as="h3" typo="hl-lg" color="black" className={styles.title}>
            {story.title}
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-600" className={styles.date}>
            {story.publishedAtLabel}
          </PFText>
        </div>
      </article>
    </Link>
  )
}
