/**
 * CMS 전용 버튼 — antd `Button` 래퍼 (`htmlType`·시각 스타일은 `cms-button.css`)
 */

import { forwardRef } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import './cms-button.css'
import './button-loading-only.css'
import { guardAdminAction, type AdminActionKind } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'

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

export type CmsButtonVariant = 'primary' | 'secondary' | 'default' | 'cancel' | 'delete'

export type CmsButtonSize = 'large' | 'medium' | 'small'

/** 승인·반려·취소 등 CMS 관리 액션 버튼 공통 폭(px) */
export const CMS_ACTION_BUTTON_WIDTH = 140

/** 「수료증/참여인증서 발급」 버튼 공통 폭(px) */
export const CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH = 210

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
  /** 지정 시 클릭을 해당 조작으로 가드. `variant="delete"` 는 미지정 시 delete */
  adminAction?: AdminActionKind
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
      adminAction,
      onClick,
      ...rest
    },
    ref
  ) => {
    const roleCode = useSessionAdminRoleCode()
    const hasIcon = icon != null
    const resolvedWidth = width == null ? undefined : typeof width === 'number' ? `${width}px` : width
    /**
     * 고정 폭: width/min/max를 동일 값으로 덮어 size·has-icon 기본 min-width를 깬다.
     * fluid(`auto`/`max-content`/`fit-content`): max-content 기준으로 긴 라벨이 잘리지 않게 한다.
     * (`auto`에 min=max=auto를 넣으면 has-icon 180 고정·정렬이 깨질 수 있음)
     */
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

    const antdSize = size === 'large' ? 'large' : size === 'small' ? 'small' : 'middle'
    const isLoading = Boolean(loading)

    const cn = [
      'cms-button',
      'btn-loading-only',
      `cms-button--${variant}`,
      `cms-button--${size}`,
      hasIcon && 'cms-button--has-icon',
      isLoading && 'cms-button--loading-only',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const antType: ButtonProps['type'] =
      variant === 'primary' ? 'primary' : variant === 'delete' ? 'default' : 'default'

    /**
     * Ant DefaultLoadingIcon: `icon` 없으면 CSSMotion(width 애니메이션) →
     * 스피너 absolute 중앙 정렬이 깨짐. 로딩 중 더미 icon으로 existIcon 경로 사용.
     */
    const antdIcon = isLoading ? <span className="cms-button__loading-slot" aria-hidden /> : undefined
    const resolvedAdminAction = adminAction ?? (variant === 'delete' ? 'delete' : undefined)

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (
        resolvedAdminAction &&
        !guardAdminAction({ roleCode, action: resolvedAdminAction })
      ) {
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
        danger={variant === 'delete'}
        size={antdSize}
        className={cn}
        disabled={disabled}
        loading={loading}
        icon={antdIcon}
        style={{ outline: 'none', ...widthStyle, ...style }}
        {...rest}
        onClick={handleClick}
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
