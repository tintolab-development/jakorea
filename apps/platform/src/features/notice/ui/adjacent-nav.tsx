import type { NoticeListItem } from '../model/types'
import { noticeDetailPath } from '../lib/constants'
import { PFChevronButton, PFText } from '@/shared/ui'
import styles from './adjacent-nav.module.css'

type NoticeAdjacentNavProps = {
  previous: NoticeListItem | null
  next: NoticeListItem | null
}

export function NoticeAdjacentNav({ previous, next }: NoticeAdjacentNavProps) {
  if (!previous && !next) return null

  return (
    <nav className={styles.nav} aria-label="이전글 다음글">
      {previous ? (
        <a
          className={styles.link}
          href={noticeDetailPath(previous.id)}
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
            >
              {previous.title}
            </PFText>
          </span>
        </a>
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}

      {next ? (
        <a
          className={[styles.link, styles.linkNext].join(' ')}
          href={noticeDetailPath(next.id)}
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
            >
              {next.title}
            </PFText>
          </span>
          <PFChevronButton direction="right" decorative />
        </a>
      ) : (
        <span className={styles.placeholder} aria-hidden="true" />
      )}
    </nav>
  )
}
