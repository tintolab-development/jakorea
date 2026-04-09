/**
 * CMS 전용 셀렉트 (AppSelect와 동일하게 span 래퍼 + borderless Select)
 * - inputSize: large | medium | small (CmsInput 치수 정렬)
 */

import { forwardRef } from 'react'
import type { CSSProperties } from 'react'
import { Select } from 'antd'
import type { SelectProps } from 'antd'
import type { RefSelectProps } from 'antd/es/select'
import type { CmsControlSize } from './cms-control-size'
import './cms-select.css'

export interface CmsSelectProps extends Omit<SelectProps, 'variant' | 'size'> {
  /** Ant Select 루트(.ant-select)에만 붙는 클래스 */
  selectClassName?: string
  /** large 44px / medium 40px / small 32px */
  inputSize?: CmsControlSize
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
}

export const CmsSelect = forwardRef<RefSelectProps, CmsSelectProps>(
  (
    {
      className,
      selectClassName,
      inputSize = 'large',
      width,
      disabled,
      style,
      ...rest
    },
    ref
  ) => {
    const hasExplicitWidth = width != null
    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const wrapperCn = [
      'cms-select',
      `cms-select--${inputSize}`,
      hasExplicitWidth && 'cms-select--explicit-width',
      disabled && 'cms-select--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <span className={wrapperCn} style={{ ...widthStyle, ...style }}>
        <Select
          ref={ref}
          variant="borderless"
          className={selectClassName}
          disabled={disabled}
          {...rest}
        />
      </span>
    )
  }
)

CmsSelect.displayName = 'CmsSelect'
