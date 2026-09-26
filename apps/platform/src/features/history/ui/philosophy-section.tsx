import { PFText } from '@/shared/ui'
import {
  PHILOSOPHY_CARD_SOFT_BREAKS,
  resolveSoftBreaks,
} from '../lib/soft-breaks'
import type { HistoryPageView } from '../model/view'
import { CopyLines } from './copy-break'
import { PreservedLines } from './preserved-lines'
import styles from './philosophy-section.module.css'

type PhilosophySectionProps = {
  philosophy: HistoryPageView['philosophy']
}

function cardTone(id: string) {
  if (id === 'role-model') return styles.roleModel
  if (id === 'practice') return styles.practice
  if (id === 'mindset') return styles.mindset
  if (id === 'support') return styles.support
  return undefined
}

export function PhilosophySection({ philosophy }: PhilosophySectionProps) {
  return (
    <section className={styles.section} aria-labelledby="history-philosophy-title">
      <div className={styles.header}>
        <div className={styles.headings}>
          <PFText as="p" typo="hl-sm" color="primary-500" className={styles.eyebrow}>
            <PreservedLines text={philosophy.eyebrow} />
          </PFText>
          <PFText as="h2" id="history-philosophy-title" typo="page-title-md" color="black" className={styles.title}>
            <PreservedLines text={philosophy.title} />
          </PFText>
        </div>
        <PFText as="p" typo="bd-lg-rg" color="black" className={styles.lead}>
          <PreservedLines text={philosophy.lead} />
        </PFText>
      </div>

      <ul className={styles.cards}>
        {philosophy.cards.map((card, index) => {
          const description = resolveSoftBreaks(
            card.description,
            PHILOSOPHY_CARD_SOFT_BREAKS[card.id],
          )

          return (
            <li key={`${card.id}-${index}`} className={[styles.card, cardTone(card.id)].filter(Boolean).join(' ')}>
              {card.image.url ? (
                <img className={styles.photo} src={card.image.url} alt={card.image.alt} />
              ) : (
                <div className={styles.photo} role="img" aria-label={card.image.alt || undefined} />
              )}
              <div className={styles.overlay} aria-hidden="true" />
              <div className={styles.cardCopy}>
                <PFText as="h3" typo="hl-lg" color="white" className={styles.cardTitle}>
                  <PreservedLines text={card.title} />
                </PFText>
                <PFText as="p" typo="bd-lg-rg" color="white" className={styles.cardBody}>
                  <CopyLines pc={description.pc} mobile={description.mobile} />
                </PFText>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
