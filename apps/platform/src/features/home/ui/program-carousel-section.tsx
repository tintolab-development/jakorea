import { useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import {
  PROGRAMS_PATH,
  getMockPrograms,
  programDetailPath,
  type ProgramListItem,
} from '@/features/program'
import { RECRUITMENT_STATUS_TONE_MAP } from '@/features/program/lib/badge-config'
import { platformMediaQueries } from '@/shared/lib/breakpoints'
import { useMediaQuery } from '@/shared/hooks'
import { PFArrowButton, PFStateBadge, PFText } from '@/shared/ui'
import chevronRightUrl from '../image/icon/chevron-right-black-12.svg'
import styles from './program-carousel-section.module.css'

const MAX_ITEMS = 8

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

        <PFText as="p" typo="bd-lg-sb" color="neutral-cool-700" className={styles.cardTarget}>
          {formatClassificationLabel(program.educationTargetLabel)}
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
  /** PC: 아이템 617px × 3 + gap → 약 3장 노출 · 모바일은 네이티브 가로 스크롤 */
  const visibleCount = isPcUp ? 3 : 1
  const [index, setIndex] = useState(0)

  const programs = useMemo(() => getMockPrograms().slice(0, MAX_ITEMS), [])
  const maxIndex = Math.max(0, programs.length - visibleCount)
  /* 브레이크포인트 전환으로 index가 범위를 벗어나면 렌더 시점에 클램프 */
  const clampedIndex = Math.min(index, maxIndex)

  if (programs.length === 0) {
    return null
  }

  const trackStyle = isPcUp
    ? ({ '--slide-index': clampedIndex } as CSSProperties)
    : undefined

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.content}>
          <div className={styles.header}>
            <PFText as="h2" typo="hd-lg" color="black" className={styles.title}>
              새로운 배움이 기다리고 있어요
            </PFText>
            <Link className={[styles.viewAllLink, 'typo-bd-lg-sb'].join(' ')} to={PROGRAMS_PATH}>
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
        </div>

        {isPcUp ? (
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
