/**
 * Custom Button Component
 * 다양한 스타일과 변형을 지원하는 버튼 컴포넌트
 * M3 디자인 언어를 기반으로 하지만 더 많은 다양성 제공
 */

import { type ReactNode } from 'react'
import MdSpinner from '../m3/MdSpinner'
import './CustomButton.css'

export type ButtonVariant =
  | 'primary' // 주요 액션 (filled 스타일)
  | 'secondary' // 보조 액션 (outlined 스타일)
  | 'tertiary' // 3차 액션 (text 스타일)
  | 'danger' // 위험한 액션 (filled, error 색상)
  | 'success' // 성공 액션 (filled, success 색상)
  | 'warning' // 경고 액션 (filled, warning 색상)
  | 'ghost' // 최소한의 시각적 영향 (투명 배경)
  | 'icon' // 아이콘만 표시

export type ButtonSize = 'small' | 'medium' | 'large'

interface CustomButtonProps {
  children?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  ariaLabel?: string
}

export default function CustomButton({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  type = 'button',
  className = '',
  ariaLabel,
}: CustomButtonProps) {
  const isDisabled = disabled || loading

  const buttonClasses = [
    'custom-button',
    `custom-button--${variant}`,
    `custom-button--${size}`,
    fullWidth && 'custom-button--full-width',
    loading && 'custom-button--loading',
    isDisabled && 'custom-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading && (
        <span className="custom-button__spinner">
          <MdSpinner size="small" />
        </span>
      )}
      {!loading && startIcon && <span className="custom-button__start-icon">{startIcon}</span>}
      {children && <span className="custom-button__label">{children}</span>}
      {!loading && endIcon && <span className="custom-button__end-icon">{endIcon}</span>}
    </button>
  )
}
