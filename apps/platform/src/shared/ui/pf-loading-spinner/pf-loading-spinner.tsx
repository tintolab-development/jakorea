import styles from './pf-loading-spinner.module.css'
import { createPortal } from 'react-dom'

type PFLoadingSpinnerProps = {
  className?: string
  label?: string
  centered?: boolean
  /** 뷰포트 전체를 덮고 클릭을 막는다. `document.body`로 portal한다. */
  blocking?: boolean
}

/** 페이지 데이터 로딩 중 표시하는 레이아웃 안정형 스피너 */
export function PFLoadingSpinner({
  className,
  label = '콘텐츠를 불러오는 중',
  centered = false,
  blocking = false,
}: PFLoadingSpinnerProps) {
  const spinner = (
    <span
      className={[
        styles.root,
        blocking ? styles.blocking : null,
        centered && !blocking ? styles.centered : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role="status"
      aria-live="polite"
      aria-busy={blocking || undefined}
      aria-label={label}
    >
      <span className={styles.spinner} aria-hidden="true" />
    </span>
  )

  if (typeof document === 'undefined') return spinner
  if (blocking) return createPortal(spinner, document.body)
  if (!centered) return spinner

  const main = document.querySelector<HTMLElement>('[data-pf-main="true"]')
  return main ? createPortal(spinner, main) : spinner
}
