import { Link } from 'react-router-dom'
import { useRemoteThumbnailUrl } from '@/shared/hooks'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import defaultThumbnailUrl from '../image/illustration/card-default.png'
import { impactStoryDetailPath } from '../lib/constants'
import type { ImpactStoryListItem } from '../model/types'
import styles from './story-card.module.css'

export type StoryCardProps = {
  story: ImpactStoryListItem
}

export function StoryCard({ story }: StoryCardProps) {
  // 썸네일 없음(어드민 표식 포함) → Figma 13983:89479 기본 썸네일(회색 배경 + 로고 + 1px 테두리)
  const imageUrl = useRemoteThumbnailUrl(story.imageUrl)
  return (
    <Link to={impactStoryDetailPath(story.id)} className={styles.cardLink}>
      <article className={styles.card}>
        <div
          className={imageUrl ? styles.thumbnail : `${styles.thumbnail} ${styles.thumbnailDefault}`}
          aria-hidden="true"
        >
          <img className={styles.image} src={defaultThumbnailUrl} alt="" width={461} height={256} />
          {imageUrl ? (
            <img
              className={`${styles.image} ${styles.imageRemote}`}
              src={imageUrl}
              alt=""
              width={461}
              height={256}
            />
          ) : null}
          <div className={styles.badge}>
            <PFCategoryBadge
              className={styles.categoryBadge}
              size="large"
              variant="primary"
            >
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
