import type { ButtonHTMLAttributes } from 'react'
import rChevronLeftBlack18Url from '@/shared/assets/icons/r-chevron-left-black-18.svg'
import rChevronLeftBlack22Url from '@/shared/assets/icons/r-chevron-left-black-22.svg'
import rChevronLeftGray18Url from '@/shared/assets/icons/r-chevron-left-gray-18.svg'
import rChevronLeftGray22Url from '@/shared/assets/icons/r-chevron-left-gray-22.svg'
import rChevronRightBlack18Url from '@/shared/assets/icons/r-chevron-right-black-18.svg'
import rChevronRightBlack22Url from '@/shared/assets/icons/r-chevron-right-black-22.svg'
import rChevronRightGray18Url from '@/shared/assets/icons/r-chevron-right-gray-18.svg'
import rChevronRightGray22Url from '@/shared/assets/icons/r-chevron-right-gray-22.svg'
import styles from './pf-page-button.module.css'

export type PFPageButtonSize = 'large' | 'small'
export type PFPageButtonDirection = 'left' | 'right'

export type PFPageButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  size?: PFPageButtonSize
  direction?: PFPageButtonDirection
  /** 행 클릭 등 부모가 동작을 담당할 때 span으로 렌더 */
  decorative?: boolean
}

const iconUrlMap = {
  large: {
    left: {
      default: rChevronLeftBlack22Url,
      disabled: rChevronLeftGray22Url,
    },
    right: {
      default: rChevronRightBlack22Url,
      disabled: rChevronRightGray22Url,
    },
  },
  small: {
    left: {
      default: rChevronLeftBlack18Url,
      disabled: rChevronLeftGray18Url,
    },
    right: {
      default: rChevronRightBlack18Url,
      disabled: rChevronRightGray18Url,
    },
  },
} as const

export function PFPageButton({
  size = 'large',
  direction = 'left',
  decorative = false,
  className,
  disabled = false,
  type = 'button',
  ...props
}: PFPageButtonProps) {
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
