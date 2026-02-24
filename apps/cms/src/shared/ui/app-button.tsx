/**
 * 앱 공통 버튼 (재사용)
 * variant·size로 페이지/모달 액션 버튼 스타일 통일
 */

import { forwardRef } from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import './app-button.css'

export type AppButtonVariant =
  | 'primary' // 청록 채움 (저장, 추가, 미리보기, 강사 추가 등)
  | 'cancel' // 청록 아웃라인 (모달 취소, 닫기)
  | 'danger' // 붉은 아웃라인 (수정 취소, 삭제)
  | 'viewDetails' // 연청 아웃라인 (내역 보기 등 테이블 내 액션)
  | 'default' // Ant 기본

export type AppButtonSize = 'small' | 'middle' | 'large' | 'tableAction' | 'filter'

export interface AppButtonProps extends Omit<ButtonProps, 'size' | 'variant'> {
  /** 스타일 변형 */
  variant?: AppButtonVariant
  /** 크기: large = 120×40, tableAction = 160×40 (테이블용), filter = 140×44 (필터 박스 조회 버튼) */
  size?: AppButtonSize
  /** danger variant에서만: hover 시 배경 채움 (삭제 버튼 등) */
  dangerFillOnHover?: boolean
  /** primary를 모달 청록(--color-modal-header)으로 사용 */
  modalTeal?: boolean
  children?: React.ReactNode
}

const variantToAntType: Record<AppButtonVariant, ButtonProps['type']> = {
  primary: 'primary',
  cancel: 'default',
  danger: 'default',
  viewDetails: 'default',
  default: 'default',
}

export const AppButton = forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    {
      variant = 'default',
      size = 'middle',
      className,
      danger: antDanger,
      type: antType,
      dangerFillOnHover = false,
      modalTeal = false,
      ...rest
    },
    ref
  ) => {
    const isVariantDanger = variant === 'danger'
    const antSize =
      size === 'large' || size === 'tableAction' || size === 'filter'
        ? 'large'
        : size === 'small'
          ? 'small'
          : 'middle'
    const type = antType ?? (isVariantDanger ? undefined : variantToAntType[variant])
    const cn = [
      'app-button',
      `app-button--${variant}`,
      `app-button--${size}`,
      dangerFillOnHover && 'app-button--fill-on-hover',
      modalTeal && 'app-button--modal-teal',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <Button
        ref={ref}
        type={type}
        danger={isVariantDanger ? true : antDanger}
        size={antSize}
        className={cn}
        {...rest}
      />
    )
  }
)

AppButton.displayName = 'AppButton'
