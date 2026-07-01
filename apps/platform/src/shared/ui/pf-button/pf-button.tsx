import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import styles from './pf-button.module.css'

type PFButtonSize = 'small' | 'medium' | 'large' | 'xlarge'
type PFButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text'

type PFButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: PFButtonSize
  variant?: PFButtonVariant
  selected?: boolean
  width?: CSSProperties['width']
  children: ReactNode
}

const sizeTypographyClassMap: Record<PFButtonSize, string> = {
  small: 'typo-label-md',
  medium: 'typo-bd-sm-md',
  large: 'typo-bd-md-sb',
  xlarge: 'typo-bd-lg-sb',
}

export function PFButton({
  size = 'medium',
  variant = 'primary',
  selected = false,
  width,
  className,
  style,
  children,
  type = 'button',
  ...props
}: PFButtonProps) {
  const buttonClassName = [
    styles.button,
    styles[size],
    styles[variant],
    selected && variant === 'tertiary' ? styles['tertiary-selected'] : undefined,
    selected && variant === 'text' ? styles['text-selected'] : undefined,
    sizeTypographyClassMap[size],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={buttonClassName} type={type} style={{ ...style, width }} {...props}>
      {children}
    </button>
  )
}
