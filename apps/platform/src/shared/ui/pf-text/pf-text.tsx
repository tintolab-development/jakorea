import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'
import styles from './pf-text.module.css'

type PFTypography =
  | 'page-title'
  | 'hd-lg'
  | 'hd-md'
  | 'hd-sm'
  | 'hl-lg'
  | 'hl-sm'
  | 'bd-lg-rg'
  | 'bd-lg-sb'
  | 'bd-md-rg'
  | 'bd-md-md'
  | 'bd-md-sb'
  | 'bd-md-bd'
  | 'bd-sm-rg'
  | 'bd-sm-md'
  | 'bd-sm-sb'
  | 'label-md'
  | 'caption-rg'
  | 'caption-sb'

type PFTextColor =
  | 'inherit'
  | 'black'
  | 'white'
  | 'neutral-cool-500'
  | 'neutral-cool-600'
  | 'neutral-warm-500'
  | 'neutral-warm-600'
  | 'primary-500'
  | 'primary-700'
  | 'primary-800'
  | 'error'
  | 'success'
  | 'gradient-primary-01'

type PFTextOwnProps<T extends ElementType> = {
  as?: T
  typo?: PFTypography
  color?: PFTextColor
  className?: string
  children: ReactNode
}

type PFTextProps<T extends ElementType> = PFTextOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof PFTextOwnProps<T>>

const typographyClassMap: Record<PFTypography, string> = {
  'page-title': 'typo-page-title',
  'hd-lg': 'typo-hd-lg',
  'hd-md': 'typo-hd-md',
  'hd-sm': 'typo-hd-sm',
  'hl-lg': 'typo-hl-lg',
  'hl-sm': 'typo-hl-sm',
  'bd-lg-rg': 'typo-bd-lg-rg',
  'bd-lg-sb': 'typo-bd-lg-sb',
  'bd-md-rg': 'typo-bd-md-rg',
  'bd-md-md': 'typo-bd-md-md',
  'bd-md-sb': 'typo-bd-md-sb',
  'bd-md-bd': 'typo-bd-md-bd',
  'bd-sm-rg': 'typo-bd-sm-rg',
  'bd-sm-md': 'typo-bd-sm-md',
  'bd-sm-sb': 'typo-bd-sm-sb',
  'label-md': 'typo-label-md',
  'caption-rg': 'typo-caption-rg',
  'caption-sb': 'typo-caption-sb',
}

const colorClassMap: Record<PFTextColor, string> = {
  inherit: styles.colorInherit,
  black: styles.colorBlack,
  white: styles.colorWhite,
  'neutral-cool-500': styles.colorNeutralCool500,
  'neutral-cool-600': styles.colorNeutralCool600,
  'neutral-warm-500': styles.colorNeutralWarm500,
  'neutral-warm-600': styles.colorNeutralWarm600,
  'primary-500': styles.colorPrimary500,
  'primary-700': styles.colorPrimary700,
  'primary-800': styles.colorPrimary800,
  error: styles.colorError,
  success: styles.colorSuccess,
  'gradient-primary-01': styles.colorGradientPrimary01,
}

export function PFText<T extends ElementType = 'span'>({
  as,
  typo = 'bd-md-rg',
  color = 'inherit',
  className,
  children,
  ...props
}: PFTextProps<T>) {
  const Component = as ?? 'span'
  const textClassName = [styles.root, typographyClassMap[typo], colorClassMap[color], className]
    .filter(Boolean)
    .join(' ')

  return (
    <Component className={textClassName} {...props}>
      {children}
    </Component>
  )
}
