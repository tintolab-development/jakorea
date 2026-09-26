import { PFText } from '@/shared/ui'
import type { HistoryPageView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import styles from './origin-section.module.css'

type OriginSectionProps = {
  origin: HistoryPageView['origin']
}

export function OriginSection({ origin }: OriginSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="history-origin-title">
      {origin.yearMark.url ? (
        <img
          className={styles.yearMark}
          src={origin.yearMark.url}
          alt={origin.yearMark.alt}
          aria-hidden={origin.yearMark.alt ? undefined : true}
          width={995}
          height={342}
        />
      ) : null}
      <div className={styles.copy}>
        <div className={styles.headings}>
          {origin.englishTitle ? (
            <PFText as="p" typo="hd-lg" color="white" className={styles.english}>
              <PreservedLines text={origin.englishTitle} />
            </PFText>
          ) : null}
          <PFText as="h2" id="history-origin-title" typo="hd-lg" color="white" className={styles.korean}>
            <PreservedLines text={origin.koreanTitle} />
          </PFText>
        </div>
        <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
          <PreservedLines text={origin.body} />
        </PFText>
      </div>
    </section>
  )
}
