/**
 * CMS 전용 버튼 — antd `Button` 래퍼 (`htmlType`·시각 스타일은 `cms-button.css`)
 */

import { forwardRef } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import type { CSSProperties, ReactNode, MouseEvent } from 'react'
import './cms-button.css'
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

/** `cancel`=default, `delete`=error 별칭 */
export type CmsButtonVariant = 'primary' | 'secondary' | 'default' | 'error' | 'cancel' | 'delete'

/** `large`=h44, `medium`=h40, `small`=h32 별칭 */
export type CmsButtonSize = 'h52' | 'h44' | 'h40' | 'h36' | 'h32' | 'large' | 'medium' | 'small'

export type CmsButtonResolvedSize = 'h52' | 'h44' | 'h40' | 'h36' | 'h32'
export type CmsButtonResolvedVariant = 'primary' | 'secondary' | 'default' | 'error'

export function resolveCmsButtonSize(size: CmsButtonSize): CmsButtonResolvedSize {
  if (size === 'large') return 'h44'
  if (size === 'medium') return 'h40'
  if (size === 'small') return 'h32'
  return size
}

export function resolveCmsButtonVariant(variant: CmsButtonVariant): CmsButtonResolvedVariant {
  if (variant === 'cancel') return 'default'
  if (variant === 'delete') return 'error'
  return variant
}

const ANTD_SIZE: Record<CmsButtonResolvedSize, ButtonProps['size']> = {
  h52: 'large',
  h44: 'large',
  h40: 'middle',
  h36: 'small',
  h32: 'small',
}

/** 승인·반려·취소 등 CMS 관리 액션 버튼 공통 폭(px) — 모달·상세 등 */
export const CMS_ACTION_BUTTON_WIDTH = 140

/** 신청 목록 툴바 일괄 액션 — 선택 승인·반려·합격·불합격 (h40은 FilterTableToolbarButton·공통 CSS) */
export const CMS_APPLICATION_LIST_BULK_BUTTON_WIDTH = 120

/** 「수료증/참여인증서 발급」 버튼 공통 폭(px) */
export const CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH = 210

export interface CmsButtonProps extends Omit<ButtonProps, CmsButtonPropsOmit> {
  variant?: CmsButtonVariant
  size?: CmsButtonSize
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
  icon?: ReactNode
  /** 아이콘 위치 — 라벨 앞(start) / 뒤(end) */
  iconPosition?: 'start' | 'end'
  children?: ReactNode
  className?: string
  style?: CSSProperties
  /** 네이티브 `<button type>` → antd `htmlType` */
  type?: 'button' | 'submit' | 'reset'
  /** 지정 시 클릭을 해당 조작으로 가드. `variant="error"`(`delete`)는 미지정 시 delete */
  adminAction?: AdminActionKind
}

export const CmsButton = forwardRef<HTMLButtonElement, CmsButtonProps>(
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

    const resolvedSize = resolveCmsButtonSize(size)
    const resolvedVariant = resolveCmsButtonVariant(variant)
    const isLoading = typeof loading === 'object' ? true : Boolean(loading)

    const cn = [
      'cms-button',
      `cms-button--${resolvedVariant}`,
      `cms-button--${resolvedSize}`,
      hasIcon && 'cms-button--has-icon',
      hasIcon && iconPosition === 'end' && 'cms-button--icon-end',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const antType: ButtonProps['type'] = resolvedVariant === 'primary' ? 'primary' : 'default'
    const resolvedAdminAction = adminAction ?? (resolvedVariant === 'error' ? 'delete' : undefined)

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (isLoading) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
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

CmsButton.displayName = 'CmsButton'
