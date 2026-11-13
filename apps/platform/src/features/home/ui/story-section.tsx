import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  IMPACT_STORIES_PATH,
  impactStoryDetailPath,
  type ImpactStoryListItem,
  useHomeImpactSubStories,
} from '@/features/impact-story'
import defaultThumbnailUrl from '@/features/impact-story/image/illustration/card-default.png'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import { useHomeMain } from '../api/use-home-main'
import { FALLBACK_IMPACT_TITLE } from '../lib/view'
import { SkeletonBlock } from './skeleton-block'
import styles from './story-section.module.css'

const SUB_STORY_SKELETON_KEYS = [0, 1, 2] as const

function TitleLines({ title }: { title: string }) {
  const lines = title.split(/\r?\n/).filter(Boolean)
  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  )
}

function FeaturedStory({ story }: { story: ImpactStoryListItem }) {
  // 썸네일 없음(서버 null) → 기본 썸네일
  const remoteSrc = story.featuredImageUrl || story.imageUrl || defaultThumbnailUrl
  const [src, setSrc] = useState(remoteSrc)

  useEffect(() => {
    setSrc(remoteSrc)
  }, [remoteSrc, story.id])

  return (
    <Link
      className={styles.featured}
      to={impactStoryDetailPath(story.id)}
      aria-label={`${story.title} 상세 보기`}
    >
      <div
        className={
          src === defaultThumbnailUrl
            ? `${styles.featuredMedia} ${styles.mediaDefault}`
            : styles.featuredMedia
        }
        aria-hidden="true"
      >
        <img
          className={styles.featuredImage}
          src={src}
          alt=""
          onError={() => {
            if (src !== defaultThumbnailUrl) setSrc(defaultThumbnailUrl)
          }}
        />
      </div>
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

function SubStoryCardSkeleton() {
  return (
    <div className={styles.subCard} aria-hidden="true">
      <div className={styles.subCardMedia}>
        <SkeletonBlock className={styles.skeletonMedia} />
      </div>
      <SkeletonBlock className={styles.skeletonTitle} />
    </div>
  )
}

function SubStoryCard({ story, className }: { story: ImpactStoryListItem; className?: string }) {
  const imageUrl = story.imageUrl || undefined
  return (
    <Link
      className={className ? `${styles.subCard} ${className}` : styles.subCard}
      to={impactStoryDetailPath(story.id)}
      aria-label={`${story.title} 상세 보기`}
    >
      <div
        className={imageUrl ? styles.subCardMedia : `${styles.subCardMedia} ${styles.mediaDefault}`}
      >
        <img className={styles.subCardImage} src={imageUrl || defaultThumbnailUrl} alt="" />
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

type StorySectionProps = {
  /** 모바일 시안: 섹션 제목 아래 소개 영상 (PC는 페이지 상단 별도 영역) */
  mobileVideo?: ReactNode
}

export function StorySection({ mobileVideo }: StorySectionProps) {
  const { featuredStory, impactTitle } = useHomeMain()
  const featured = featuredStory
  const { items: subStories, isPending: subStoriesPending } = useHomeImpactSubStories(
    featured?.id ?? null
  )
  const mobileTitle = impactTitle.trim() || FALLBACK_IMPACT_TITLE

  if (!featured) {
    return null
  }

  return (
    <section className={styles.section} aria-busy={subStoriesPending || undefined}>
      <div className={styles.inner}>
        <h2 className={styles.mobileTitle}>
          <TitleLines title={mobileTitle} />
        </h2>

        {mobileVideo}

        <FeaturedStory story={featured} />

        <div className={styles.subGrid}>
          {/* 모바일 시안: 피처드도 카드 목록 첫 항목으로 노출 (PC는 상단 피처드) */}
          <SubStoryCard story={featured} className={styles.subCardMobileOnly} />
          {subStoriesPending
            ? SUB_STORY_SKELETON_KEYS.map(key => <SubStoryCardSkeleton key={key} />)
            : subStories.map(story => <SubStoryCard story={story} key={story.id} />)}
        </div>

        <div className={styles.viewAllRow}>
          <Link className={styles.viewAllLink} to={IMPACT_STORIES_PATH}>
            전체보기
          </Link>
        </div>
      </div>
    </section>
  )
}
