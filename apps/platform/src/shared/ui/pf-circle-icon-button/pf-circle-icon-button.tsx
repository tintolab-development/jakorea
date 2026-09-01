import type { ButtonHTMLAttributes } from 'react'
import arrowRightGray24Url from '@/shared/assets/icons/arrow-right-gray-24.svg'
import arrowRightWhite24Url from '@/shared/assets/icons/arrow-right-white-24.svg'
import arrowUpWhite24Url from '@/shared/assets/icons/arrow-up-white-24.svg'
import eventCalendarGrayUrl from '@/shared/assets/icons/event-calendar-gray.svg'
import eventCalendarWhiteUrl from '@/shared/assets/icons/event-calendar-white.svg'
import refreshGrayUrl from '@/shared/assets/icons/refresh-gray.svg'
import refreshMintUrl from '@/shared/assets/icons/refresh-mint.svg'
import searchGray24Url from '@/shared/assets/icons/search-gray-24.svg'
import searchWhite24Url from '@/shared/assets/icons/search-white-24.svg'
import trashGrayUrl from '@/shared/assets/icons/trash-gray.svg'
import trashMintUrl from '@/shared/assets/icons/trash-mint.svg'
import styles from './pf-circle-icon-button.module.css'

export type PFCircleIconButtonIcon =
  | 'forward'
  | 'search'
  | 'refresh'
  | 'delete'
  | 'eventCalendar'
  | 'scrollTop'

type IconUrls = {
  default: string
  hover?: string
  disabled?: string
}

type PFCircleIconButtonPropsBase = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  icon: PFCircleIconButtonIcon
}

export type PFCircleIconButtonProps =
  | (PFCircleIconButtonPropsBase & {
      decorative?: false
      'aria-label': string
    })
  | (PFCircleIconButtonPropsBase & {
      decorative: true
      'aria-label'?: string
    })

const iconUrlMap: Record<PFCircleIconButtonIcon, IconUrls> = {
  forward: {
    default: arrowRightWhite24Url,
    disabled: arrowRightGray24Url,
  },
  search: {
    default: searchWhite24Url,
    disabled: searchGray24Url,
  },
  refresh: {
    default: refreshGrayUrl,
    hover: refreshMintUrl,
  },
  delete: {
    default: trashMintUrl,
    disabled: trashGrayUrl,
  },
  eventCalendar: {
    default: eventCalendarWhiteUrl,
    disabled: eventCalendarGrayUrl,
  },
  scrollTop: {
    default: arrowUpWhite24Url,
  },
}

function renderIconContent(icons: IconUrls, disabled: boolean) {
  if (disabled && icons.disabled) {
    return <img className={styles.icon} src={icons.disabled} alt="" aria-hidden="true" />
  }

  if (icons.hover) {
    return (
      <>
        <img
          className={[styles.icon, styles.iconDefault].join(' ')}
          src={icons.default}
          alt=""
          aria-hidden="true"
        />
        <img
          className={[styles.icon, styles.iconHover].join(' ')}
          src={icons.hover}
          alt=""
          aria-hidden="true"
        />
      </>
    )
  }

  return (
    <img className={styles.icon} src={icons.default} alt="" aria-hidden="true" />
  )
}

export function PFCircleIconButton({
  icon,
  decorative = false,
  className,
  disabled = false,
  type = 'button',
  ...props
}: PFCircleIconButtonProps) {
  const icons = iconUrlMap[icon]
  const buttonClassName = [styles.button, styles[icon], className].filter(Boolean).join(' ')
  const content = renderIconContent(icons, disabled)

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
