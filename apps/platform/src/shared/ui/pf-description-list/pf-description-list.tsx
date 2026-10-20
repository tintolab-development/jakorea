import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-description-list.module.css'

export type PFDescriptionListProps = {
  items: readonly ReactNode[]
  className?: string
  'aria-label'?: string
}

/** 하단 안내사항용 점 목록 */
export function PFDescriptionList({
  items,
  className,
  'aria-label': ariaLabel,
}: PFDescriptionListProps) {
  return (
    <ul className={[styles.list, className].filter(Boolean).join(' ')} aria-label={ariaLabel}>
      {items.map((item, index) => (
        <li key={index}>
          <PFText as="span" typo="label-md" color="inherit">
            {item}
          </PFText>
        </li>
      ))}
    </ul>
  )
}
