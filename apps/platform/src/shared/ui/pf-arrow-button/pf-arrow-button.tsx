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
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={buttonClassName} type={type} disabled={disabled} {...props}>
      <img className={styles.icon} src={iconUrl} alt="" aria-hidden="true" />
    </button>
  )
}
