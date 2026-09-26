import { PFText } from '@/shared/ui'
import { resolveSoftBreaks, THRIVE_CARD_SOFT_BREAKS } from '../lib/soft-breaks'
import type { HistoryPageView } from '../model/view'
import { CopyLines } from './copy-break'
import { PreservedLines } from './preserved-lines'
import styles from './thrive-section.module.css'

type ThriveSectionProps = {
  thrive: HistoryPageView['thrive']
}

function cardTone(id: string) {
  if (id === 'empower') return styles.empower
  if (id === 'digital') return styles.digital
  if (id === 'partner') return styles.partner
  if (id === 'enablers') return styles.enablers
  return undefined
}

export function ThriveSection({ thrive }: ThriveSectionProps) {
  const lines = thrive.title.split('\n')
  const accent = lines[0] === 'Thrive:' ? lines[0] : ''
  const rest = accent ? lines.slice(1).join('\n') : thrive.title

  return (
    <section className={styles.section} aria-labelledby="history-thrive-title">
      <div className={styles.header}>
        <h2 id="history-thrive-title" className={styles.title}>
          {accent ? <span className={styles.accent}>{accent}</span> : null}
          <span className={styles.titleRest}>
            <PreservedLines text={rest} />
          </span>
        </h2>
        <PFText as="p" typo="bd-lg-rg" color="black" className={styles.lead}>
          <PreservedLines text={thrive.lead} />
        </PFText>
      </div>

      <ul className={styles.cards}>
        {thrive.cards.map((card, index) => {
          const description = resolveSoftBreaks(card.description, THRIVE_CARD_SOFT_BREAKS[card.id])

          return (
            <li key={`${card.id}-${index}`} className={[styles.card, cardTone(card.id)].filter(Boolean).join(' ')}>
              {card.decoration.url ? (
                <img
                  className={styles.decoration}
                  src={card.decoration.url}
                  alt={card.decoration.alt}
                  aria-hidden={card.decoration.alt ? undefined : true}
                />
              ) : null}
              <div className={styles.cardCopy}>
                <h3 className={styles.cardTitle}>
                  <PreservedLines text={card.title} />
                </h3>
                <PFText as="p" typo="hl-lg" color="white" className={styles.cardBody}>
                  <CopyLines pc={description.pc} mobile={description.mobile} />
                </PFText>
              </div>
            </li>
          )
        })}
      </ul>

      <PFText as="p" typo="hl-lg" color="neutral-cool-500" className={styles.footnote}>
        <PreservedLines text={thrive.footnote} />
      </PFText>
    </section>
  )
}
