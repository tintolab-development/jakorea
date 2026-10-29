import { forwardRef } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import { joinClassNames } from '../lib/join-class-names.js'
import {
  resolveAdminButtonSize,
  resolveAdminButtonVariant,
  type AdminButtonSize,
  type AdminButtonVariant,
} from './resolve.js'
import './admin-button.css'

type AdminButtonPropsOmit =
  | 'size'
  | 'type'
  | 'htmlType'
  | 'children'
  | 'icon'
  | 'variant'
  | 'color'
  | 'className'
  | 'style'

const ANTD_SIZE: Record<ReturnType<typeof resolveAdminButtonSize>, ButtonProps['size']> = {
  h52: 'large',
  h44: 'large',
  h40: 'middle',
  h36: 'small',
  h32: 'small',
}

export const ADMIN_ACTION_BUTTON_WIDTH = 140
export const ADMIN_APPLICATION_LIST_BULK_BUTTON_WIDTH = 120
export const ADMIN_CERTIFICATE_ISSUE_BUTTON_WIDTH = 210

export interface AdminButtonProps extends Omit<ButtonProps, AdminButtonPropsOmit> {
  variant?: AdminButtonVariant
  size?: AdminButtonSize
  width?: number | string
  icon?: ReactNode
  iconPosition?: 'start' | 'end'
  children?: ReactNode
  className?: string
  style?: CSSProperties
  type?: 'button' | 'submit' | 'reset'
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      variant = 'primary',
      size = 'large',
      width,
      icon,
      iconPosition = 'start',
      children,
      className,
      style,
      disabled,
      type = 'button',
      loading,
      onClick,
      ...rest
    },
    ref
  ) => {
    const hasIcon = icon != null
    const resolvedWidth = width == null ? undefined : typeof width === 'number' ? `${width}px` : width
    const isFluidWidth =
      resolvedWidth === 'auto' ||
      resolvedWidth === 'max-content' ||
      resolvedWidth === 'fit-content' ||
      resolvedWidth === 'min-content'
    const widthStyle: CSSProperties | undefined =
      resolvedWidth == null
        ? undefined
        : isFluidWidth
          ? {
              width: resolvedWidth === 'auto' ? 'max-content' : resolvedWidth,
              minWidth: 'fit-content',
              maxWidth: 'none',
            }
          : { width: resolvedWidth, minWidth: resolvedWidth, maxWidth: resolvedWidth }

    const resolvedSize = resolveAdminButtonSize(size)
    const resolvedVariant = resolveAdminButtonVariant(variant)
    const isLoading = typeof loading === 'object' ? true : Boolean(loading)

    const cn = joinClassNames(
      'cms-button',
      `cms-button--${resolvedVariant}`,
      `cms-button--${resolvedSize}`,
      hasIcon && 'cms-button--has-icon',
      hasIcon && iconPosition === 'end' && 'cms-button--icon-end',
      className
    )

    const antType: ButtonProps['type'] = resolvedVariant === 'primary' ? 'primary' : 'default'

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (isLoading) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      onClick?.(event)
    }

    return (
      <Button
        ref={ref}
        type={antType}
        htmlType={type}
        danger={resolvedVariant === 'error'}
        size={ANTD_SIZE[resolvedSize]}
        className={cn}
        disabled={disabled}
        aria-busy={isLoading || undefined}
        style={{ outline: 'none', ...widthStyle, ...style }}
        {...rest}
        onClick={handleClick}
      >
        {children != null || hasIcon ? (
          <span className="btn-loading-only__content">
            {hasIcon && iconPosition === 'start' ? (
              <span className="cms-button__icon">{icon}</span>
            ) : null}
            {children != null ? <span className="cms-button__label">{children}</span> : null}
            {hasIcon && iconPosition === 'end' ? (
              <span className="cms-button__icon">{icon}</span>
            ) : null}
          </span>
        ) : null}
      </Button>
    )
  }
)

AdminButton.displayName = 'AdminButton'
