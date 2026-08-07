import styles from './pf-divider.module.css'

export type PFDividerVariant = 'default' | 'focus'

export type PFDividerProps = {
  /** default: black-50 / focus: border-focus(민트) — 결과 확인 등 */
  variant?: PFDividerVariant
  className?: string
}

/**
 * 리스트·상세 상단 디바이더.
 * - default: border-top 2px solid black-50
 * - focus: border-top 2px solid border-focus (#01A1AF)
 */
export function PFDivider({ variant = 'default', className }: PFDividerProps) {
  const rootClassName = [styles.root, styles[variant], className].filter(Boolean).join(' ')

  return <hr className={rootClassName} aria-hidden="true" />
}
