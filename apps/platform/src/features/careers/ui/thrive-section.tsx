import { useState } from 'react'
import addIconUrl from '../image/icon/add.svg'
import closeIconUrl from '../image/icon/close.svg'
import { THRIVE_DECORATION_URL, THRIVE_TITLE } from '../lib/mock-data'
import type { ThriveValue, ThriveValueId } from '../model/types'
import styles from './thrive-section.module.css'

export type ThriveSectionProps = {
  values: readonly ThriveValue[]
}

const ORDER_CLASS: Record<ThriveValueId, string> = {
  impact: styles.orderImpact,
  learn: styles.orderLearn,
  speak: styles.orderSpeak,
  help: styles.orderHelp,
}

function ThriveMoreButton({
  expanded,
  title,
  onClick,
}: {
  expanded: boolean
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={styles.more}
      aria-expanded={expanded}
      aria-label={expanded ? `${title} 상세 접기` : `${title} 상세 펼치기`}
      onClick={onClick}
    >
      <img
        className={styles.moreIcon}
        src={expanded ? closeIconUrl : addIconUrl}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
      />
    </button>
  )
}

function ThriveCard({
  value,
  expanded,
  onToggle,
  className,
}: {
  value: ThriveValue
  expanded: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <article
      className={[styles.card, styles[value.tone], className].filter(Boolean).join(' ')}
    >
      <img
        className={styles.decoration}
        src={THRIVE_DECORATION_URL[value.tone]}
        alt=""
        aria-hidden="true"
      />
      <div className={styles.cardBody}>
        {expanded ? null : <h3 className={styles.cardTitle}>{value.title}</h3>}
        <p className={expanded ? styles.cardSummaryExpanded : styles.cardSummary}>
          {value.summary}
        </p>
        {expanded ? <p className={styles.cardDetail}>{value.detail}</p> : null}
      </div>
      <ThriveMoreButton expanded={expanded} title={value.summary} onClick={onToggle} />
    </article>
  )
}

export function ThriveSection({ values }: ThriveSectionProps) {
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(() => new Set())

  const toggle = (id: string) => {
    setExpandedIds(current => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const leftValues = values
    .filter(value => value.column === 'left')
    .slice()
    .sort((a, b) => a.order - b.order)
  const rightValues = values
    .filter(value => value.column === 'right')
    .slice()
    .sort((a, b) => a.order - b.order)

  return (
    <section className={styles.section} aria-labelledby="careers-thrive-title">
      <div className={styles.board}>
        <div className={styles.leftColumn}>
          <div className={[styles.titleCard, styles.orderTitle].join(' ')}>
            <img
              className={styles.titleDecoration}
              src={THRIVE_TITLE.decorationUrl}
              alt=""
              aria-hidden="true"
            />
            <h2 id="careers-thrive-title" className={styles.titleText}>
              {THRIVE_TITLE.text}
            </h2>
          </div>
          {leftValues.map(value => (
            <ThriveCard
              key={value.id}
              value={value}
              className={ORDER_CLASS[value.id]}
              expanded={expandedIds.has(value.id)}
              onToggle={() => toggle(value.id)}
            />
          ))}
        </div>
        <div className={styles.rightColumn}>
          {rightValues.map(value => (
            <ThriveCard
              key={value.id}
              value={value}
              className={ORDER_CLASS[value.id]}
              expanded={expandedIds.has(value.id)}
              onToggle={() => toggle(value.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
