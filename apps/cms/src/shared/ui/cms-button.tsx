/**
 * CMS 전용 버튼 — antd `Button` 래퍼 (`htmlType`·시각 스타일은 `cms-button.css`)
 */

import { forwardRef } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import './cms-button.css'
import './button-loading-only.css'

type CmsButtonPropsOmit =
  | 'size'
  | 'type'
  | 'htmlType'
  | 'children'
  | 'icon'
  | 'variant'
  | 'color'
  | 'className'
  | 'style'

export type CmsButtonVariant = 'primary' | 'secondary' | 'default' | 'delete'

export type CmsButtonSize = 'large' | 'medium' | 'small'

/** 승인·반려·취소 등 CMS 관리 액션 버튼 공통 폭(px) */
export const CMS_ACTION_BUTTON_WIDTH = 140

export interface CmsButtonProps extends Omit<ButtonProps, CmsButtonPropsOmit> {
  variant?: CmsButtonVariant
  size?: CmsButtonSize
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
  icon?: ReactNode
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /** 네이티브 `<button type>` → antd `htmlType` */
  type?: 'button' | 'submit' | 'reset'
}

export const CmsButton = forwardRef<HTMLButtonElement, CmsButtonProps>(
  (
    {
      variant = 'primary',
      size = 'large',
      width,
      icon,
      children,
      className,
      style,
      disabled,
      type = 'button',
      loading,
      ...rest
    },
    ref
  ) => {
    const hasIcon = icon != null
    const widthStyle: CSSProperties | undefined =
      width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

    const antdSize = size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'

    const cn = [
      'cms-button',
      'btn-loading-only',
      `cms-button--${variant}`,
      `cms-button--${size}`,
      hasIcon && 'cms-button--has-icon',
      loading && 'cms-button--loading-only',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const antType: ButtonProps['type'] =
      variant === 'primary' ? 'primary' : variant === 'delete' ? 'default' : 'default'

    return (
      <Button
        ref={ref}
        type={antType}
        htmlType={type}
        danger={variant === 'delete'}
        size={antdSize}
        className={cn}
        disabled={disabled}
        loading={loading}
        style={{ outline: 'none', ...widthStyle, ...style }}
        {...rest}
      >
        {children != null || hasIcon ? (
          <span className="btn-loading-only__content">
            {hasIcon ? <span className="cms-button__icon">{icon}</span> : null}
            {children != null ? <span className="cms-button__label">{children}</span> : null}
          </span>
        ) : null}
      </Button>
    )
  }
)

CmsButton.displayName = 'CmsButton'
