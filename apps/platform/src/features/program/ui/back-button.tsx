import { PFChevronButton, PFText } from '@/shared/ui'
import type { PFChevronButtonSize } from '@/shared/ui'
import styles from './back-button.module.css'

type ProgramBackButtonProps = {
  label: string
  onClick: () => void
  /** 양식 페이지 등 — small 셰브론 + 14/600 라벨 */
  size?: PFChevronButtonSize
}

export function ProgramBackButton({ label, onClick, size = 'large' }: ProgramBackButtonProps) {
  const isSmall = size === 'small'

  return (
    <button
      className={[styles.button, isSmall ? styles.buttonSmall : undefined]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
    >
      <PFChevronButton size={size} direction="left" decorative />
      <PFText
        as="span"
        typo={isSmall ? 'bd-sm-sb' : 'bd-lg-sb'}
        color="neutral-cool-500"
        className={isSmall ? styles.labelSmall : undefined}
      >
        {label}
      </PFText>
    </button>
  )
}
