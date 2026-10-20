import styles from './pf-divider.module.css'

export type PFDividerVariant = 'default' | 'focus'
export type PFDividerOrientation = 'horizontal' | 'vertical'

export type PFDividerProps = {
  /** default: black-50 / focus: border-focus(민트) — 결과 확인 등 */
  variant?: PFDividerVariant
  orientation?: PFDividerOrientation
  className?: string
}

/**
 * 리스트·상세 디바이더.
 * - default: 2px solid black-50
 * - focus: 2px solid border-focus (#01A1AF)
 * - horizontal: border-top / vertical: border-left
 */
export function PFDivider({ variant = 'default', orientation = 'horizontal', className }: PFDividerProps) {
  const rootClassName = [styles.root, styles[orientation], styles[variant], className]
    .filter(Boolean)
    .join(' ')

  return <hr className={rootClassName} aria-hidden="true" />
}
