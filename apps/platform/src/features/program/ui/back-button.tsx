import { Link } from 'react-router-dom'
import { PFChevronButton, PFText } from '@/shared/ui'
import type { PFChevronButtonSize } from '@/shared/ui'
import styles from './back-button.module.css'

type ProgramBackButtonProps = {
  label: string
  onClick?: () => void
  /** 있으면 버튼 대신 라우터 링크로 이동한다 */
  to?: string
  /** 양식 페이지 등 — small 셰브론 + 14/600 라벨 */
  size?: PFChevronButtonSize
}

export function ProgramBackButton({ label, onClick, to, size = 'large' }: ProgramBackButtonProps) {
  const isSmall = size === 'small'
  const className = [styles.button, isSmall ? styles.buttonSmall : undefined]
    .filter(Boolean)
    .join(' ')
  const content = (
    <>
      <PFChevronButton size={size} direction="left" decorative />
      <PFText
        as="span"
        typo={isSmall ? 'bd-sm-sb' : 'bd-lg-sb'}
        color="neutral-cool-500"
        className={isSmall ? styles.labelSmall : undefined}
      >
        {label}
      </PFText>
    </>
  )

  if (to) {
    return (
      <Link className={className} to={to} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  )
}
