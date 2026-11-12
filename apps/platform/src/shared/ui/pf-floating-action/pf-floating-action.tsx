import type { ReactNode } from 'react'
import { PFButton } from '../pf-button'
import styles from './pf-floating-action.module.css'

type PFFloatingActionProps = {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  'aria-label'?: string
}

/**
 * 화면 하단에 고정되는 주요 행동 버튼 (QA-0232 후원하기·문의하기·신청하기).
 * 모바일은 하단 전체 폭, PC는 우측 하단. 고정 버튼이 페이지 끝 내용을 가리지 않도록 같은 높이의 여백을 함께 둔다.
 */
export function PFFloatingAction({
  children,
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: PFFloatingActionProps) {
  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />
      <div className={styles.wrap}>
        <PFButton
          size="xlarge"
          variant="primary"
          className={styles.button}
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {children}
        </PFButton>
      </div>
    </>
  )
}
