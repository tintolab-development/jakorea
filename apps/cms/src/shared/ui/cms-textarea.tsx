/**
 * CMS 전용 텍스트영역 (`CmsInput`과 동일한 래핑·사이즈 체계)
 * - size: large | medium | small
 * - 상단 라벨·폭 지정 옵션 동일
 */

import { forwardRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Input } from 'antd'
import type { TextAreaProps, TextAreaRef } from 'antd/es/input/TextArea'
import type { CmsControlSize } from './cms-control-size'
import './cms-textarea.css'

export type CmsTextAreaSize = CmsControlSize

export interface CmsTextAreaProps extends Omit<TextAreaProps, 'variant' | 'size'> {
  /** large 44px 기준 min-height / medium 40px / small 32px */
  inputSize?: CmsTextAreaSize
  /** 입력 상단 라벨(선택) */
  label?: ReactNode
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
  /**
   * true이면 `rows={1}`일 때 말줄임·`resize: none`(`cms-textarea--rows-1-single-line`)을 쓰지 않음.
   * 한 줄 높이로 시작하고 세로로 늘리는 입력(연수 공문 등). 세로 중앙은 `rows={1}` 공통 스타일.
   */
  expandableFromSingleRow?: boolean
}

export const CmsTextArea = forwardRef<TextAreaRef, CmsTextAreaProps>(
  (
    {
      className,
      label,
      inputSize = 'large',
      width,
      disabled,
      style,
      rootClassName,
      expandableFromSingleRow = true,
      ...rest
    },
    ref
  ) => {
    const hasExplicitWidth = width != null
    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const { rows, ...textareaRest } = rest
    const isRows1 = rows === 1
    const rows1SingleLine = isRows1 && !expandableFromSingleRow

    const rootCn = [
      'cms-textarea',
      `cms-textarea--${inputSize}`,
      hasExplicitWidth && 'cms-textarea--explicit-width',
      isRows1 && 'cms-textarea--rows-1',
      rows1SingleLine && 'cms-textarea--rows-1-single-line',
      expandableFromSingleRow && isRows1 && 'cms-textarea--expandable-single-row',
      className,
    ]
      .filter(Boolean)
      .join(' ')

    const controlCn = [
      'cms-textarea__control',
      disabled && 'cms-textarea__control--disabled',
    ]
      .filter(Boolean)
      .join(' ')

    const inputNode = (
      <span className={rootCn} style={{ ...widthStyle, ...style }}>
        <span className={controlCn}>
          <span className="cms-textarea__inner">
            <Input.TextArea
              ref={ref}
              disabled={disabled}
              rootClassName={rootClassName}
              variant="borderless"
              rows={rows}
              {...textareaRest}
            />
          </span>
        </span>
      </span>
    )

    if (label == null || label === '') return inputNode
    return (
      <span className="cms-textarea__field">
        <span className="cms-textarea__label">{label}</span>
        {inputNode}
      </span>
    )
  }
)

CmsTextArea.displayName = 'CmsTextArea'
