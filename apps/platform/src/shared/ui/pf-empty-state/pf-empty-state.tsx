import type { ReactNode } from 'react'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import { PFText } from '../pf-text'
import styles from './pf-empty-state.module.css'

export type PFEmptyStateVariant = 'page' | 'inline'

export type PFEmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  className?: string
  /**
   * `page`: 목록 페이지 카드형(일러스트).
   * `inline`: 마이페이지 홈 캘린더 사이드와 같은 제목·설명만.
   */
  variant?: PFEmptyStateVariant
}

/** 목록·패널 빈 상태 — 페이지형은 인용 일러스트, 인라인은 홈 캘린더 빈 상태 */
export function PFEmptyState({
  title,
  description,
  className,
  variant = 'page',
}: PFEmptyStateProps) {
  const inline = variant === 'inline'
  return (
    <div
      className={[styles.root, inline ? styles.inline : undefined, className]
        .filter(Boolean)
        .join(' ')}
      role="status"
    >
      <div className={styles.content}>
        {inline ? null : (
          <img
            className={styles.illustration}
            src={illustQuotationUrl}
            alt=""
            width={100}
            height={100}
            aria-hidden="true"
          />
        )}
        <PFText
          as="p"
          typo={inline ? 'bd-md-bd' : 'hl-lg'}
          color="black"
          className={styles.title}
        >
          {title}
        </PFText>
        {description ? (
          <PFText
            as="p"
            typo={inline ? 'bd-sm-rg' : 'bd-md-rg'}
            color="neutral-cool-500"
            className={styles.description}
          >
            {description}
          </PFText>
        ) : null}
      </div>
    </div>
  )
}
