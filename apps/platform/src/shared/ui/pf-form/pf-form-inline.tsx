import type { HTMLAttributes, ReactNode } from 'react'
import styles from './pf-form.module.css'

export type PFFormInlineRowProps = {
  children: ReactNode
  className?: string
}

/** Divider 세그먼트 줄바꿈 컨테이너 — 폭 부족 시 Separator 기준으로만 wrap */
export function PFFormInlineRow({ children, className }: PFFormInlineRowProps) {
  return (
    <div className={[styles.inlineRow, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormInlineSegmentProps = {
  children: ReactNode
  className?: string
}

/** 세그먼트 내부는 nowrap — Divider 사이에서만 개행 */
export function PFFormInlineSegment({ children, className }: PFFormInlineSegmentProps) {
  return (
    <div className={[styles.inlineSegment, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormInlineSeparatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  className?: string
}

/** 인라인 세로 구분선 1×13 — 줄바꿈 경계 */
export function PFFormInlineSeparator({ className, ...rest }: PFFormInlineSeparatorProps) {
  return (
    <span
      className={[styles.inlineSeparator, className].filter(Boolean).join(' ')}
      aria-hidden
      {...rest}
    />
  )
}
