import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import styles from './pf-accordion-list.module.css'

export type PFAccordionListItem = {
  id: string
  categoryLabel: string
  title: string
  question: string
  answer: string
}

export type PFAccordionListProps = {
  items: PFAccordionListItem[]
  expandedId?: string | null
  onExpandedChange?: (id: string | null) => void
  emptyMessage?: string
  className?: string
}

export function PFAccordionList({
  items,
  expandedId = null,
  onExpandedChange,
  emptyMessage = '등록된 FAQ가 없습니다.',
  className,
}: PFAccordionListProps) {
  const rootClassName = [styles.list, className].filter(Boolean).join(' ')

  if (items.length === 0) {
    return (
      <div className={rootClassName}>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.empty}>
          {emptyMessage}
        </PFText>
      </div>
    )
  }

  const handleToggle = (id: string) => {
    onExpandedChange?.(expandedId === id ? null : id)
  }

  return (
    <div className={rootClassName}>
      {items.map(item => {
        const isExpanded = expandedId === item.id
        const panelId = `pf-accordion-panel-${item.id}`

        return (
          <article key={item.id} className={styles.item}>
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={isExpanded}
              aria-controls={panelId}
              onClick={() => handleToggle(item.id)}
            >
              <div className={styles.badgeContainer}>
                <PFCategoryBadge size="small" variant="secondary" className={styles.badge}>
                  {item.categoryLabel}
                </PFCategoryBadge>
              </div>
              <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
                {item.title}
              </PFText>
              <img
                className={[styles.chevron, isExpanded ? styles.chevronExpanded : undefined]
                  .filter(Boolean)
                  .join(' ')}
                src={chevronDownBlackUrl}
                alt=""
                aria-hidden="true"
              />
            </button>

            {isExpanded ? (
              <div id={panelId} className={styles.panel} role="region" aria-label={item.title}>
                <div className={styles.panelRow}>
                  <PFText as="span" typo="page-title-sm" color="black" className={styles.label}>
                    Q.
                  </PFText>
                  <PFText as="p" typo="bd-lg-rg" color="black" className={styles.body}>
                    {item.question}
                  </PFText>
                </div>
                <div className={styles.panelRow}>
                  <PFText as="span" typo="page-title-sm" color="black" className={styles.label}>
                    A.
                  </PFText>
                  <PFText as="p" typo="bd-lg-rg" color="black" className={styles.body}>
                    {item.answer}
                  </PFText>
                </div>
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
