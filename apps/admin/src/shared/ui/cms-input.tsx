/**
 * CMS 전용 텍스트 인풋 — Ant Input borderless + `.cms-input__control` 크롬
 * - size: large | medium | small
 * - 왼쪽 아이콘 선택
 */

import { forwardRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'
import './cms-input.css'

export type CmsInputSize = CmsControlSize

export interface CmsInputProps extends Omit<InputProps, 'variant' | 'prefix' | 'size'> {
  /** large 44px / medium 40px / small 32px */
  inputSize?: CmsInputSize
  /** 입력 상단 라벨(선택) */
  label?: ReactNode
  /** 인풋 왼쪽 아이콘(선택) */
  icon?: ReactNode
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
}

export const CmsInput = forwardRef<InputRef, CmsInputProps>(
  (
    {
      className,
      label,
      icon,
      inputSize = 'large',
      width,
      disabled,
      style,
      rootClassName,
      ...rest
    },
    ref
  ) => {
    const hasIcon = icon != null
    const hasExplicitWidth = width != null
    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const rootCn = [
      'cms-input',
      `cms-input--${inputSize}`,
      hasIcon && 'cms-input--has-icon',
      hasExplicitWidth && 'cms-input--explicit-width',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const controlCn = [
      'cms-input__control',
      disabled && 'cms-input__control--disabled',
    ]
      .filter(Boolean)
      .join(' ')

    const inputNode = (
      <span className={rootCn} style={{ ...widthStyle, ...style }}>
        <span className={controlCn}>
          {hasIcon ? <span className="cms-input__icon">{icon}</span> : null}
          <span className="cms-input__inner">
            <Input
              ref={ref}
              disabled={disabled}
              rootClassName={rootClassName}
              variant="borderless"
              {...rest}
            />
          </span>
        </span>
      </span>
    )

    if (label == null || label === '') return inputNode
    return (
      <span className="cms-input__field">
        <span className="cms-input__label">{label}</span>
        {inputNode}
      </span>
    )
  }
)

CmsInput.displayName = 'CmsInput'
