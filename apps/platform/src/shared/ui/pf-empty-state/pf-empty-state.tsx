import type { ReactNode } from 'react'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import { PFText } from '../pf-text'
import styles from './pf-empty-state.module.css'

export type PFEmptyStateProps = {
  title: ReactNode
  description?: ReactNode
  className?: string
}

/** 목록·패널 빈 상태 — 인용 일러스트 + 제목(+선택 설명) */
export function PFEmptyState({ title, description, className }: PFEmptyStateProps) {
  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')} role="status">
      <div className={styles.content}>
        <img
          className={styles.illustration}
          src={illustQuotationUrl}
          alt=""
          width={100}
          height={100}
          aria-hidden="true"
        />
        <PFText as="p" typo="hl-lg" color="black" className={styles.title}>
          {title}
        </PFText>
        {description ? (
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
            {description}
          </PFText>
        ) : null}
      </div>
    </div>
  )
}
