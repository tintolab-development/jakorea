import { useState, type KeyboardEvent } from 'react'
import { PFText } from '@/shared/ui'
import type { HistoryTimelinePeriod } from '../model/types'
import styles from './timeline-panel.module.css'

export type TimelinePanelProps = {
  theme: 'dark' | 'light'
  periods: readonly HistoryTimelinePeriod[]
  ariaLabel: string
}

export function TimelinePanel({ theme, periods, ariaLabel }: TimelinePanelProps) {
  const [activeId, setActiveId] = useState(periods[0]?.id ?? '')
  const active = periods.find(period => period.id === activeId) ?? periods[0]

  if (!active) return null

  const moveTab = (fromIndex: number, offset: number) => {
    const nextIndex = (fromIndex + offset + periods.length) % periods.length
    const nextId = periods[nextIndex]?.id
    if (!nextId) return
    setActiveId(nextId)
    document.getElementById(`history-tab-${nextId}`)?.focus()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      moveTab(index, 1)
      return
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      moveTab(index, -1)
    }
  }

  return (
    <aside className={`${styles.panel} ${styles[theme]}`}>
      <div className={styles.tabs} role="tablist" aria-label={ariaLabel}>
        {periods.map((period, index) => {
          const isActive = period.id === active.id

          return (
            <button
              key={period.id}
              id={`history-tab-${period.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`history-tabpanel-${period.id}`}
              tabIndex={isActive ? 0 : -1}
              className={isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              onClick={() => setActiveId(period.id)}
              onKeyDown={event => handleTabKeyDown(event, index)}
            >
              {period.label}
            </button>
          )
        })}
      </div>

      <div
        id={`history-tabpanel-${active.id}`}
        role="tabpanel"
        aria-labelledby={`history-tab-${active.id}`}
        tabIndex={0}
        className={styles.tabpanel}
      >
        {active.title ? (
          <PFText as="h3" typo="hd-sm" color={theme === 'dark' ? 'white' : 'black'} className={styles.title}>
            {active.title}
          </PFText>
        ) : null}

        {active.events.length > 0 ? (
          <ul className={styles.list}>
            {active.events.map(event => (
              <li key={`${active.id}-${event.year}-${event.lines[0]}`} className={styles.item}>
                <PFText as="span" typo="bd-md-sb" color={theme === 'dark' ? 'white' : 'black'} className={styles.year}>
                  {event.year}
                </PFText>
                <div className={styles.event}>
                  {event.lines.map(line => (
                    <PFText
                      key={line}
                      as="p"
                      typo="bd-md-rg"
                      color={theme === 'dark' ? 'white' : 'black'}
                      className={styles.eventLine}
                    >
                      {line}
                    </PFText>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </aside>
  )
}
