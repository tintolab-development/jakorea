import { Link } from 'react-router-dom'
import type { NoticeListItem } from '../model/types'
import { noticeDetailPath } from '../lib/constants'
import { NOTICES_LIST_RETURN_STATE_KEY } from '../lib/list-params'
import { PFChevronButton, PFText } from '@/shared/ui'
import styles from './adjacent-nav.module.css'

type NoticeAdjacentNavProps = {
  previous: NoticeListItem | null
  next: NoticeListItem | null
  listReturnPath?: string
}

function adjacentState(listReturnPath?: string) {
  if (!listReturnPath) return undefined
  return { [NOTICES_LIST_RETURN_STATE_KEY]: listReturnPath }
}

export function NoticeAdjacentNav({
  previous,
  next,
  listReturnPath,
}: NoticeAdjacentNavProps) {
  if (!previous && !next) return null

  const linkState = adjacentState(listReturnPath)

  return (
    <nav className={styles.nav} aria-label="이전글 다음글">
      {previous ? (
        <Link
          className={styles.link}
          to={noticeDetailPath(previous.id)}
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
          to={noticeDetailPath(next.id)}
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
