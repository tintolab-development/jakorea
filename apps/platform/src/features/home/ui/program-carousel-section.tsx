import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  PROGRAMS_PATH,
  getMockPrograms,
  programDetailPath,
  type ProgramListItem,
} from '@/features/program'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { useMediaQuery } from '@/shared/hooks'
import { PFArrowButton, PFPageButton, PFStateBadge, PFText } from '@/shared/ui'
import styles from './program-carousel-section.module.css'

const MAX_ITEMS = 8

function ProgramCard({ program }: { program: ProgramListItem }) {
  return (
    <Link
      className={styles.card}
      to={programDetailPath(program.id)}
      aria-label={`${program.title} 상세 보기`}
    >
      <div className={styles.cardMedia}>
        {program.thumbnailUrl ? (
          <img className={styles.cardImage} src={program.thumbnailUrl} alt="" loading="lazy" />
        ) : (
          <div className={styles.cardImagePlaceholder} aria-hidden="true" />
        )}
      </div>

      <div className={styles.cardBody}>
        {program.recruitmentStatus === 'recruiting' ? (
          <PFStateBadge size="small" tone="progress" className={styles.cardBadge}>
            모집중
          </PFStateBadge>
        ) : null}

        <PFText as="h3" typo="hl-sm" color="black" className={styles.cardTitle}>
          {program.title}
        </PFText>

        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.cardTarget}>
          {program.educationTargetLabel}
        </PFText>

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

export function ProgramCarouselSection() {
  const isPcUp = useMediaQuery(platformMediaQueries.pcUp)
  const visibleCount = isPcUp ? 3 : 1
  const [index, setIndex] = useState(0)

  const programs = useMemo(() => getMockPrograms().slice(0, MAX_ITEMS), [])
  const maxIndex = Math.max(0, programs.length - visibleCount)
  /* 브레이크포인트 전환으로 index가 범위를 벗어나면 렌더 시점에 클램프 */
  const clampedIndex = Math.min(index, maxIndex)

  if (programs.length === 0) {
    return null
  }

  const trackStyle = { '--slide-index': clampedIndex } as CSSProperties

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <PFText as="h2" typo="hd-lg" color="black" className={styles.title}>
            새로운 배움이 기다리고 있어요
          </PFText>
          <Link className={styles.viewAllLink} to={PROGRAMS_PATH}>
            전체보기
          </Link>
        </div>

        <div className={styles.viewport}>
          <ul className={styles.track} style={trackStyle}>
            {programs.map(program => (
              <li className={styles.slide} key={program.id}>
                <ProgramCard program={program} />
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.controls}>
          <PFPageButton
            size="large"
            direction="left"
            aria-label="이전 프로그램"
            disabled={clampedIndex <= 0}
            onClick={() => setIndex(Math.max(0, clampedIndex - 1))}
          />
          <PFPageButton
            size="large"
            direction="right"
            aria-label="다음 프로그램"
            disabled={clampedIndex >= maxIndex}
            onClick={() => setIndex(Math.min(maxIndex, clampedIndex + 1))}
          />
        </div>
      </div>
    </section>
  )
}
