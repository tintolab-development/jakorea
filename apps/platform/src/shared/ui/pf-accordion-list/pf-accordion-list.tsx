import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import { PFCategoryBadge, PFText } from '@/shared/ui'
import { PFLoadingSpinner } from '../pf-loading-spinner'
import { PublicContentPageStatus } from '../public-content-page-loading/public-content-page-status'
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
  loading?: boolean
  className?: string
  /** FAQ 시안은 질문 제목만. 1:1 문의 목록은 카테고리 칩을 둔다. */
  hideCategoryBadge?: boolean
}

export function PFAccordionList({
  items,
  expandedId = null,
  onExpandedChange,
  emptyMessage = '등록된 FAQ가 없습니다.',
  loading = false,
  className,
  hideCategoryBadge = false,
}: PFAccordionListProps) {
  const rootClassName = [
    styles.list,
    hideCategoryBadge ? styles.hideCategory : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (items.length === 0) {
    return (
      <div className={rootClassName}>
        <PublicContentPageStatus layout="list">
          {loading ? (
            <PFLoadingSpinner label="목록을 불러오는 중" />
          ) : (
            <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
              {emptyMessage}
            </PFText>
          )}
        </PublicContentPageStatus>
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
              <div className={styles.content}>
                {hideCategoryBadge ? null : (
                  <div className={styles.badgeContainer}>
                    <PFCategoryBadge size="small" variant="secondary" className={styles.badge}>
                      {item.categoryLabel}
                    </PFCategoryBadge>
                  </div>
                )}
                <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
                  {item.title}
                </PFText>
              </div>
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
