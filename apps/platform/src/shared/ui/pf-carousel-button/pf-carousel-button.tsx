import type { ButtonHTMLAttributes } from 'react'
import arrowLeftGray24Url from '@/shared/assets/icons/arrow-left-gray-24.svg'
import arrowLeftMint24Url from '@/shared/assets/icons/arrow-left-mint-24.svg'
import arrowRightGray24Url from '@/shared/assets/icons/arrow-right-gray-24.svg'
import arrowRightMint24Url from '@/shared/assets/icons/arrow-right-mint-24.svg'
import chevronLeftBlack46Url from '@/shared/assets/icons/chevron-left-black-46.svg'
import chevronLeftGray46Url from '@/shared/assets/icons/chevron-left-gray-46.svg'
import chevronRightBlack46Url from '@/shared/assets/icons/chevron-right-black-46.svg'
import chevronRightGray46Url from '@/shared/assets/icons/chevron-right-gray-46.svg'
import styles from './pf-carousel-button.module.css'

export type PFCarouselButtonSize = 'large' | 'small'
export type PFCarouselButtonDirection = 'left' | 'right'

export type PFCarouselButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  size?: PFCarouselButtonSize
  direction?: PFCarouselButtonDirection
  /** 행 클릭 등 부모가 동작을 담당할 때 span으로 렌더 */
  decorative?: boolean
}

const iconUrlMap = {
  large: {
    left: {
      default: chevronLeftBlack46Url,
      disabled: chevronLeftGray46Url,
    },
    right: {
      default: chevronRightBlack46Url,
      disabled: chevronRightGray46Url,
    },
  },
  small: {
    left: {
      default: arrowLeftMint24Url,
      disabled: arrowLeftGray24Url,
    },
    right: {
      default: arrowRightMint24Url,
      disabled: arrowRightGray24Url,
    },
  },
} as const

export function PFCarouselButton({
  size = 'large',
  direction = 'left',
  decorative = false,
  className,
  disabled = false,
  type = 'button',
  ...props
}: PFCarouselButtonProps) {
  const icons = iconUrlMap[size][direction]
  const iconUrl = disabled ? icons.disabled : icons.default
  const buttonClassName = [
    styles.button,
    styles[size],
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
