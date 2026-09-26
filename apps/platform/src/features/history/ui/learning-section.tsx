import { PFText } from '@/shared/ui'
import patternLeftUrl from '../image/illustration/pattern-learning-left.svg'
import patternRightUrl from '../image/illustration/pattern-learning-right.svg'
import type { HistoryPageView } from '../model/view'
import { PreservedLines } from './preserved-lines'
import styles from './learning-section.module.css'

type LearningSectionProps = {
  learning: HistoryPageView['learning']
}

export function LearningSection({ learning }: LearningSectionProps) {
  return (
    <section className={styles.section} aria-labelledby="history-learning-title">
      <img
        className={styles.patternLeft}
        src={patternLeftUrl}
        alt=""
        aria-hidden="true"
        width={580}
        height={580}
      />
      <img
        className={styles.patternRight}
        src={patternRightUrl}
        alt=""
        aria-hidden="true"
        width={640}
        height={638}
      />

      <div className={styles.inner}>
        <div className={styles.intro}>
          <div className={styles.headings}>
            <PFText as="p" typo="hl-sm" color="inherit" className={styles.eyebrow}>
              <PreservedLines text={learning.eyebrow} />
            </PFText>
            <PFText as="h2" id="history-learning-title" typo="page-title" color="white" className={styles.title}>
              <PreservedLines text={learning.title} />
            </PFText>
          </div>
          <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
            <PreservedLines text={learning.body} />
          </PFText>
        </div>

        <div className={styles.media}>
          {learning.image.url ? (
            <img className={styles.photo} src={learning.image.url} alt={learning.image.alt} />
          ) : (
            <div className={styles.photo} role="img" aria-label={learning.image.alt || undefined} />
          )}
        </div>

        <div className={styles.outro}>
          <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
            <PreservedLines text={learning.outro} />
          </PFText>
          <PFText as="p" typo="hl-lg" color="white" className={styles.emphasis}>
            <PreservedLines text={learning.emphasis} />
          </PFText>
        </div>
      </div>
    </section>
  )
}
