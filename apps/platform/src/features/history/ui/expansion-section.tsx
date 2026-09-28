import { PFText } from '@/shared/ui'
import type { HistoryTimelineView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import { TimelinePanel } from './timeline-panel'
import styles from './expansion-section.module.css'

type ExpansionSectionProps = {
  world: HistoryTimelineView
}

export function ExpansionSection({ world }: ExpansionSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="history-expansion-title">
      <div className={styles.intro}>
        <PFText as="h2" id="history-expansion-title" typo="hd-lg" color="white" className={styles.title}>
          <PreservedLines text={world.title} />
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
          <PreservedLines text={world.body} />
        </PFText>
      </div>

      <div className={styles.media}>
        {world.image.url ? (
          <img className={styles.photo} src={world.image.url} alt={world.image.alt} />
        ) : (
          <div className={styles.photo} role="img" aria-label={world.image.alt || undefined} />
        )}
      </div>

      <div className={styles.panel}>
        <TimelinePanel theme="dark" periods={world.periods} ariaLabel="세계 JA 연혁 시대 구간" />
      </div>
    </section>
  )
}
