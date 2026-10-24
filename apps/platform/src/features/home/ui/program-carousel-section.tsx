import { useHomeMain } from '../api/use-home-main'
import { FALLBACK_EDUCATION_TITLE, HOME_PROGRAM_CARD_LIMIT, type HomeProgramCard } from '../lib/view'
import { useState, type CSSProperties, type WheelEvent } from 'react'
import { Link } from 'react-router-dom'
import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import {
  focusFromListItem,
  PROGRAMS_PATH,
  programDetailPath,
  programListEntryKey,
  useHomePortalPrograms,
} from '@/features/program'
import { RECRUITMENT_STATUS_TONE_MAP } from '@/features/program/lib/badge-config'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { resolvePortalPublicFileImageUrl } from '@/shared/lib/resolve-portal-public-file-image-url'
import { useMediaQuery } from '@/shared/hooks'
import { PFArrowButton, PFStateBadge, PFText } from '@/shared/ui'
import chevronRightUrl from '../image/icon/chevron-right-black-12.svg'
import viewAllChevronUrl from '../image/icon/chevron-right-black-18.svg'
import { SkeletonBlock } from './skeleton-block'
import styles from './program-carousel-section.module.css'

/** 트랙은 가로라 장 수가 섹션 높이를 바꾸지 않는다. PC는 3장, 모바일은 1장이 보인다. */
const PROGRAM_SKELETON_KEYS = [0, 1, 2] as const

/** 홈 카드 상태배지 — 시안 compact 라벨 */
function homeRecruitmentStatusLabel(status: RecruitmentStatus) {
  if (status === 'closed') return '모집완료'
  if (status === 'scheduled') return '모집예정'
  return '모집중'
}

/** 분류 라벨 구분자를 ` · ` 로 통일 */
function formatClassificationLabel(label: string) {
  return label
    .split(/\s*[·•|,/]\s*/)
    .map(part => part.trim())
    .filter(Boolean)
    .join(' · ')
}

function ProgramCardSkeleton() {
  return (
    <div className={styles.card} aria-hidden="true">
      <div className={styles.cardMedia}>
        <SkeletonBlock className={styles.skeletonMedia} />
      </div>
      <div className={styles.cardBody}>
        <SkeletonBlock className={styles.skeletonBadge} />
        <SkeletonBlock className={styles.skeletonTitle} />
        <SkeletonBlock className={styles.skeletonTarget} />
      </div>
    </div>
  )
}

function ProgramCard({ program }: { program: HomeProgramCard }) {
  const thumbnailSrc = resolvePortalPublicFileImageUrl(program.thumbnailUrl)

  return (
    <Link
      className={styles.card}
      to={program.detailPath}
      aria-label={`${program.title} 상세 보기`}
    >
      <div className={styles.cardMedia}>
        {thumbnailSrc ? (
          <img className={styles.cardImage} src={thumbnailSrc} alt="" loading="lazy" />
        ) : (
          <div className={styles.cardImagePlaceholder} aria-hidden="true" />
        )}
      </div>

      <div className={styles.cardBody}>
        <PFStateBadge
          size="large"
          tone={RECRUITMENT_STATUS_TONE_MAP[program.recruitmentStatus]}
          className={styles.cardBadge}
        >
          {homeRecruitmentStatusLabel(program.recruitmentStatus)}
        </PFStateBadge>

        <PFText as="h3" typo="hd-sm" color="black" className={styles.cardTitle}>
          {program.title}
        </PFText>

        {program.educationTargetLabel ? (
          <PFText as="p" typo="bd-lg-sb" color="neutral-cool-700" className={styles.cardTarget}>
            {formatClassificationLabel(program.educationTargetLabel)}
          </PFText>
        ) : null}

        <PFArrowButton
          className={styles.cardArrow}
          size="medium"
          variant="secondary"
          decorative
        />
      </div>
    </Link>
  )
}

function EducationTitle({ title }: { title: string }) {
  if (title === FALLBACK_EDUCATION_TITLE) {
    return (
      <h2 className={styles.title}>
        새로운 배움이
        <br className={styles.titleBreak} />
        {' '}기다리고 있어요
      </h2>
    )
  }

  const lines = title.split(/\r?\n/).filter(Boolean)
  return (
    <h2 className={styles.title}>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </h2>
  )
}

export function ProgramCarouselSection() {
  const { educationTitle } = useHomeMain()
  const { items, isPending, isError } = useHomePortalPrograms()
  const isPcUp = useMediaQuery(platformMediaQueries.pcUp)
  /** PC: 아이템 617px × 3 + gap → 약 3장 노출 · 모바일은 네이티브 가로 스크롤 */
  const visibleCount = isPcUp ? 3 : 1
  const [index, setIndex] = useState(0)
  const [isPointerInteraction, setIsPointerInteraction] = useState(false)

  const cards: HomeProgramCard[] = items.slice(0, HOME_PROGRAM_CARD_LIMIT).map(program => ({
    id: program.id,
    entryKey: programListEntryKey(program),
    detailPath: programDetailPath(program.id, undefined, focusFromListItem(program, 'all')),
    title: program.title,
    recruitmentStatus: program.recruitmentStatus,
    educationTargetLabel: program.educationTargetLabel,
    thumbnailUrl: program.thumbnailUrl,
  }))
  const maxIndex = Math.max(0, cards.length - visibleCount)
  /* 브레이크포인트 전환으로 index가 범위를 벗어나면 렌더 시점에 클램프 */
  const clampedIndex = Math.min(index, maxIndex)

  if (!isPending && (isError || cards.length === 0)) {
    return null
  }

  const trackStyle = isPcUp
    ? ({ '--slide-index': clampedIndex } as CSSProperties)
    : undefined

  return (
    <section
      className={styles.section}
      aria-busy={isPending || undefined}
      data-pointer-interaction={isPointerInteraction ? 'true' : undefined}
      onKeyDown={() => setIsPointerInteraction(false)}
      onPointerDown={() => setIsPointerInteraction(true)}
      onWheel={(event: WheelEvent<HTMLElement>) => {
        if (event.shiftKey || event.deltaX !== 0) setIsPointerInteraction(true)
      }}
    >
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.header}>
            <EducationTitle title={educationTitle} />
            <Link className={styles.viewAllLink} to={PROGRAMS_PATH}>
              전체보기
              <img
                className={styles.viewAllIcon}
                src={viewAllChevronUrl}
                alt=""
                width={18.4}
                height={18.4}
                aria-hidden="true"
              />
            </Link>
          </div>

          {isPending ? (
            <div className={styles.viewport}>
              <ul className={styles.track}>
                {PROGRAM_SKELETON_KEYS.map(key => (
                  <li className={styles.slide} key={key}>
                    <ProgramCardSkeleton />
                  </li>
                ))}
              </ul>
            </div>
          ) : cards.length > 0 ? (
            <div className={styles.viewport}>
              <ul className={styles.track} style={trackStyle}>
                {cards.map(program => (
                  <li className={styles.slide} key={program.entryKey}>
                    <ProgramCard program={program} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {isPcUp && cards.length > visibleCount ? (
          <div className={styles.controls}>
            <button
              className={styles.pageButton}
              type="button"
              aria-label="이전 프로그램"
              onClick={() =>
                setIndex(clampedIndex <= 0 ? maxIndex : clampedIndex - 1)
              }
            >
              <img
                className={[styles.pageButtonIcon, styles.pageButtonIconPrev].join(' ')}
                src={chevronRightUrl}
                alt=""
                aria-hidden="true"
              />
            </button>
            <button
              className={styles.pageButton}
              type="button"
              aria-label="다음 프로그램"
              onClick={() =>
                setIndex(clampedIndex >= maxIndex ? 0 : clampedIndex + 1)
              }
            >
              <img
                className={styles.pageButtonIcon}
                src={chevronRightUrl}
                alt=""
                aria-hidden="true"
              />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
