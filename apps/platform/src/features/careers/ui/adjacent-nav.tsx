import { Link } from 'react-router-dom'
import type { CareerJobListItem } from '../model/types'
import { careerPostingDetailPath } from '../lib/constants'
import { CAREERS_LIST_RETURN_STATE_KEY } from '../lib/list-params'
import { PFChevronButton, PFText } from '@/shared/ui'
import styles from './adjacent-nav.module.css'

type CareerPostingAdjacentNavProps = {
  previous: CareerJobListItem | null
  next: CareerJobListItem | null
  listReturnPath?: string
}

function adjacentState(listReturnPath?: string) {
  if (!listReturnPath) return undefined
  return { [CAREERS_LIST_RETURN_STATE_KEY]: listReturnPath }
}

export function CareerPostingAdjacentNav({
  previous,
  next,
  listReturnPath,
}: CareerPostingAdjacentNavProps) {
  if (!previous && !next) return null

  const linkState = adjacentState(listReturnPath)

  return (
    <nav className={styles.nav} aria-label="이전글 다음글">
      {previous ? (
        <Link
          className={styles.link}
          to={careerPostingDetailPath(previous.id)}
          state={linkState}
          data-pf-chevron-hover=""
        >
          <PFChevronButton direction="left" decorative />
          <span className={styles.copy}>
            <PFText as="span" typo="bd-lg-sb" color="black">
              이전글
            </PFText>
            <PFText
              as="span"
              typo="bd-md-md"
              color="neutral-cool-700"
              className={styles.linkTitle}
              title={previous.title}
            >
              {previous.title}
            </PFText>
          </span>
        </Link>
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}

      {next ? (
        <Link
          className={[styles.link, styles.linkNext].join(' ')}
          to={careerPostingDetailPath(next.id)}
          state={linkState}
          data-pf-chevron-hover=""
        >
          <span className={[styles.copy, styles.copyNext].join(' ')}>
            <PFText as="span" typo="bd-lg-sb" color="black">
              다음글
            </PFText>
            <PFText
              as="span"
              typo="bd-md-md"
              color="neutral-cool-700"
              className={styles.linkTitle}
              title={next.title}
            >
              {next.title}
            </PFText>
          </span>
          <PFChevronButton direction="right" decorative />
        </Link>
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}
    </nav>
  )
}
