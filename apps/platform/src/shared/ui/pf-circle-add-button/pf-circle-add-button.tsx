import type { ButtonHTMLAttributes } from 'react'
import styles from './pf-circle-add-button.module.css'

export type PFCircleAddButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'type' | 'children'
> & {
  type?: 'button' | 'submit' | 'reset'
  /** 기본: 항목 추가 */
  'aria-label'?: string
}

function PFCircleAddIcon() {
  return (
    <svg
      className={styles.icon}
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <rect width="28" height="28" rx="14" fill="white" />
      <rect width="28" height="28" rx="14" fill="#01A1AF" fillOpacity="0.1" />
      <rect
        x="0.5"
        y="0.5"
        width="27"
        height="27"
        rx="13.5"
        stroke="#01A1AF"
        strokeOpacity="0.1"
      />
      <path
        d="M13.5007 19.6654V14.4987H8.33398V13.4987H13.5007V8.33203H14.5007V13.4987H19.6673V14.4987H14.5007V19.6654H13.5007Z"
        fill="#01A1AF"
      />
    </svg>
  )
}

/** 원형 행추가 버튼 (28×28) — CMS 템플릿/학력 행추가와 동일 스펙 */
export function PFCircleAddButton({
  className,
  type = 'button',
  'aria-label': ariaLabel = '항목 추가',
  title,
  ...rest
}: PFCircleAddButtonProps) {
  return (
    <button
      type={type}
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      {...rest}
    >
      <PFCircleAddIcon />
    </button>
  )
}
