import styles from './pf-divider.module.css'

export type PFDividerProps = {
  className?: string
}

/** 리스트 상단 디바이더 — border-top: 2px solid rgba(61, 61, 61, 0.50) */
export function PFDivider({ className }: PFDividerProps) {
  const rootClassName = [styles.root, className].filter(Boolean).join(' ')

  return <hr className={rootClassName} aria-hidden="true" />
}
