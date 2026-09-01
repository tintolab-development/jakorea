import type { ButtonHTMLAttributes } from 'react'
import arrowRightGray24Url from '@/shared/assets/icons/arrow-right-gray-24.svg'
import arrowRightGray32Url from '@/shared/assets/icons/arrow-right-gray-32.svg'
import arrowRightMint24Url from '@/shared/assets/icons/arrow-right-mint-24.svg'
import arrowRightMint32Url from '@/shared/assets/icons/arrow-right-mint-32.svg'
import arrowRightWhite24Url from '@/shared/assets/icons/arrow-right-white-24.svg'
import arrowRightWhite32Url from '@/shared/assets/icons/arrow-right-white-32.svg'
import styles from './pf-arrow-button.module.css'

export type PFArrowButtonSize = 'large' | 'medium'
export type PFArrowButtonVariant = 'primary' | 'secondary'

export type PFArrowButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  size?: PFArrowButtonSize
  variant?: PFArrowButtonVariant
  /** 행 클릭 등 부모가 동작할 때 장식용 span으로 렌더 */
  decorative?: boolean
}

const iconUrlMap = {
  large: {
    primary: arrowRightWhite32Url,
    secondary: arrowRightMint32Url,
    disabled: arrowRightGray32Url,
  },
  medium: {
    primary: arrowRightWhite24Url,
    secondary: arrowRightMint24Url,
    disabled: arrowRightGray24Url,
  },
} as const

export function PFArrowButton({
  size = 'medium',
  variant = 'primary',
  decorative = false,
  className,
  disabled = false,
  type = 'button',
  ...props
}: PFArrowButtonProps) {
  const iconUrl = disabled
    ? iconUrlMap[size].disabled
    : iconUrlMap[size][variant]

  const buttonClassName = [
    styles.button,
    styles[size],
    styles[variant],
    disabled ? styles.disabled : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const icon = <img className={styles.icon} src={iconUrl} alt="" aria-hidden="true" />

  if (decorative) {
    return (
      <span className={buttonClassName} aria-hidden="true">
        {icon}
      </span>
    )
  }

  return (
    <button className={buttonClassName} type={type} disabled={disabled} {...props}>
      {icon}
    </button>
  )
}
