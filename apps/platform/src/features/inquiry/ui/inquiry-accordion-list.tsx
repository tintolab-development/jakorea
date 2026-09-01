import chevronDownBlackUrl from '@/shared/assets/icons/chevron-down-black.svg'
import { PFCategoryBadge, PFCircleIconButton, PFText } from '@/shared/ui'
import type { OneToOneInquiryItem, OneToOneInquiryStatus } from '../model/types'
import styles from './inquiry-accordion-list.module.css'

export type InquiryAccordionListItem = OneToOneInquiryItem

export type InquiryAccordionListProps = {
  items: InquiryAccordionListItem[]
  expandedId?: string | null
  onExpandedChange?: (id: string | null) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
  className?: string
}

const STATUS_LABEL: Record<OneToOneInquiryStatus, string> = {
  pending: '답변대기',
  answered: '답변완료',
}

export function InquiryAccordionList({
  items,
  expandedId = null,
  onExpandedChange,
  onDelete,
  emptyMessage = '등록된 1:1 문의가 없습니다.',
  className,
}: InquiryAccordionListProps) {
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
        const panelId = `inquiry-accordion-panel-${item.id}`
        const isDeleteDisabled = item.status === 'answered'

        return (
          <article key={item.id} className={styles.item}>
            <div className={styles.trigger}>
              <button
                type="button"
                className={styles.expandButton}
                aria-expanded={isExpanded}
                aria-controls={panelId}
                onClick={() => handleToggle(item.id)}
              >
                <div className={styles.badgeContainer}>
                  <PFCategoryBadge size="small" variant="secondary" className={styles.badge}>
                    {item.category}
                  </PFCategoryBadge>
                </div>

                <div className={styles.textArea}>
                  <div className={styles.rowPrimary}>
                    <PFText as="span" typo="hl-sm" color="black" className={styles.title}>
                      {item.title}
                    </PFText>
                    <PFText
                      as="span"
                      typo="bd-md-sb"
                      color={item.status === 'pending' ? 'primary-500' : undefined}
                      className={[
                        styles.status,
                        item.status === 'answered' ? styles.statusAnswered : undefined,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {STATUS_LABEL[item.status]}
                    </PFText>
                  </div>

                  <div className={styles.rowMeta}>
                    <PFText as="span" typo="bd-md-rg" color="neutral-cool-600" className={styles.date}>
                      {item.createdAt}
                    </PFText>
                    <span className={styles.metaDivider} aria-hidden="true" />
                    <PFText
                      as="span"
                      typo="bd-md-rg"
                      color="neutral-cool-500"
                      className={styles.programName}
                    >
                      {item.programName}
                    </PFText>
                  </div>
                </div>
              </button>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.chevronButton}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  aria-label={isExpanded ? '문의 내용 접기' : '문의 내용 펼치기'}
                  onClick={() => handleToggle(item.id)}
                >
                  <img
                    className={[styles.chevron, isExpanded ? styles.chevronExpanded : undefined]
                      .filter(Boolean)
                      .join(' ')}
                    src={chevronDownBlackUrl}
                    alt=""
                    aria-hidden="true"
                  />
                </button>

                <span className={styles.actionDivider} aria-hidden="true" />

                <PFCircleIconButton
                  icon="delete"
                  disabled={isDeleteDisabled}
                  aria-label="문의 삭제"
                  onClick={event => {
                    event.stopPropagation()
                    if (!isDeleteDisabled) {
                      onDelete?.(item.id)
                    }
                  }}
                />
              </div>
            </div>

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
                {item.answer ? (
                  <div className={styles.panelRow}>
                    <PFText as="span" typo="page-title-sm" color="black" className={styles.label}>
                      A.
                    </PFText>
                    <PFText as="p" typo="bd-lg-rg" color="black" className={styles.body}>
                      {item.answer}
                    </PFText>
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
