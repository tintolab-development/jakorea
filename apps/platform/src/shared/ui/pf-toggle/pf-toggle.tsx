import type { ButtonHTMLAttributes, ReactNode } from 'react'
import checkOffLargeUrl from '@/shared/assets/icons/check-off-large.svg'
import checkOffSmallUrl from '@/shared/assets/icons/check-off-small.svg'
import checkOnLargeUrl from '@/shared/assets/icons/check-on-large.svg'
import checkOnSmallUrl from '@/shared/assets/icons/check-on-small.svg'
import styles from './pf-toggle.module.css'

export type PFToggleVariant = 'check-large' | 'check-small' | 'text'

type PFToggleBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children'> & {
  checked: boolean
  onChange: (checked: boolean) => void
}

type PFToggleCheckProps = PFToggleBaseProps & {
  variant: 'check-large' | 'check-small'
  children?: ReactNode
  offLabel?: never
  onLabel?: never
}

type PFToggleTextProps = PFToggleBaseProps & {
  variant: 'text'
  offLabel: string
  onLabel: string
  children?: never
}

export type PFToggleProps = PFToggleCheckProps | PFToggleTextProps

const iconMap = {
  'check-large': {
    on: checkOnLargeUrl,
    off: checkOffLargeUrl,
    className: styles.iconCheckLarge,
  },
  'check-small': {
    on: checkOnSmallUrl,
    off: checkOffSmallUrl,
    className: styles.iconCheckSmall,
  },
} as const

export function PFToggle(props: PFToggleProps) {
  const {
    variant,
    checked,
    onChange,
    disabled = false,
    className,
    type = 'button',
    ...rest
  } = props

  const toggleClassName = [
    styles.toggle,
    styles[variant],
    variant === 'text' && checked ? styles.textOn : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (disabled) return

    onChange(!checked)
  }

  const label =
    variant === 'text' ? (checked ? props.onLabel : props.offLabel) : null

  return (
    <button
      type={type}
      className={toggleClassName}
      disabled={disabled}
      aria-pressed={checked}
      onClick={handleClick}
      {...rest}
    >
      {variant === 'text' ? (
        <span className={styles.label}>{label}</span>
      ) : (
        <>
          <img
            className={[styles.icon, iconMap[variant].className].join(' ')}
            src={checked ? iconMap[variant].on : iconMap[variant].off}
            alt=""
            aria-hidden="true"
          />
          {props.children ? <span className={styles.content}>{props.children}</span> : null}
        </>
      )}
    </button>
  )
}
