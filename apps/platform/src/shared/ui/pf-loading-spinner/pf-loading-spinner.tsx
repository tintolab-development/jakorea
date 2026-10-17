import styles from './pf-loading-spinner.module.css'
import { createPortal } from 'react-dom'

type PFLoadingSpinnerProps = {
  className?: string
  label?: string
  centered?: boolean
}

/** 페이지 데이터 로딩 중 표시하는 레이아웃 안정형 스피너 */
export function PFLoadingSpinner({
  className,
  label = '콘텐츠를 불러오는 중',
  centered = false,
}: PFLoadingSpinnerProps) {
  const spinner = (
    <span
      className={[styles.root, centered ? styles.centered : null, className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-label={label}
    >
      <span className={styles.spinner} aria-hidden="true" />
    </span>
  )

  if (!centered || typeof document === 'undefined') return spinner

  const main = document.querySelector<HTMLElement>('[data-pf-main="true"]')
  return main ? createPortal(spinner, main) : spinner
}
