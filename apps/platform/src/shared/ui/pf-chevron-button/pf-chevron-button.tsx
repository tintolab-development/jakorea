import type { ButtonHTMLAttributes } from 'react'
import chevronLeftMintUrl from '@/shared/assets/icons/chevron-left-mint.svg'
import chevronLeftPrimaryUrl from '@/shared/assets/icons/chevron-left-primary.svg'
import chevronRightMintUrl from '@/shared/assets/icons/chevron-right-mint.svg'
import chevronRightPrimaryUrl from '@/shared/assets/icons/chevron-right-primary.svg'
import chevronLeftDisabledUrl from './icons/chevron-left-disabled.svg'
import chevronRightDisabledUrl from './icons/chevron-right-disabled.svg'
import styles from './pf-chevron-button.module.css'

export type PFChevronButtonDirection = 'left' | 'right'

export type PFChevronButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  direction?: PFChevronButtonDirection
  /** 행·텍스트 버튼 등 부모가 클릭을 담당할 때 span으로 렌더 */
  decorative?: boolean
}

const iconUrlMap = {
  left: {
    default: chevronLeftPrimaryUrl,
    hover: chevronLeftMintUrl,
    disabled: chevronLeftDisabledUrl,
  },
  right: {
    default: chevronRightPrimaryUrl,
    hover: chevronRightMintUrl,
    disabled: chevronRightDisabledUrl,
  },
} as const

export function PFChevronButton({
  direction = 'left',
  decorative = false,
  className,
  disabled = false,
  type = 'button',
  ...props
}: PFChevronButtonProps) {
  const icons = iconUrlMap[direction]
  const buttonClassName = [styles.button, className].filter(Boolean).join(' ')

  const content = disabled ? (
    <img className={styles.icon} src={icons.disabled} alt="" aria-hidden="true" />
  ) : (
    <>
      <img className={[styles.icon, styles.iconDefault].join(' ')} src={icons.default} alt="" aria-hidden="true" />
      <img className={[styles.icon, styles.iconHover].join(' ')} src={icons.hover} alt="" aria-hidden="true" />
    </>
  )

  if (decorative) {
    return (
      <span className={buttonClassName} aria-hidden="true">
        {content}
      </span>
    )
  }

  return (
    <button className={buttonClassName} type={type} disabled={disabled} {...props}>
      {content}
    </button>
  )
}
