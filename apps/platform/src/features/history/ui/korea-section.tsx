import { PFText } from '@/shared/ui'
import type { HistoryTimelineView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import { TimelinePanel } from './timeline-panel'
import styles from './korea-section.module.css'

type KoreaSectionProps = {
  korea: HistoryTimelineView
}

export function KoreaSection({ korea }: KoreaSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="history-korea-title">
      <div className={styles.intro}>
        <PFText as="h2" id="history-korea-title" typo="hd-lg" color="black" className={styles.title}>
          <PreservedLines text={korea.title} />
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="black" className={styles.body}>
          <PreservedLines text={korea.body} />
        </PFText>
      </div>

      <div className={styles.media}>
        {korea.image.url ? (
          <img className={styles.photo} src={korea.image.url} alt={korea.image.alt} />
        ) : (
          <div className={styles.photo} role="img" aria-label={korea.image.alt || undefined} />
        )}
      </div>

      <div className={styles.panel}>
        <TimelinePanel theme="light" periods={korea.periods} ariaLabel="JA Korea 국내 연혁 시대 구간" />
      </div>
    </section>
  )
}
