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

/**
 * - `default`: `rows` / `autoSize` / `expandableFromSingleRow` 조합을 그대로 따름
 * - `fixed`: 리사이즈 핸들 없음 · 안에서 줄바꿈 + 세로 스크롤 (`expandableFromSingleRow` 무시)
 *   - `rows`만 주면 그 높이로 박스 고정
 *   - `autoSize={{ minRows: 1, maxRows: 2 }}`를 주면 짧은 글은 1줄, 길면 2줄까지 커진 뒤 스크롤
 */
export type CmsTextAreaLayout = 'default' | 'fixed'

export interface CmsTextAreaProps extends Omit<TextAreaProps, 'variant' | 'size'> {
  /** large 44px 기준 min-height / medium 40px / small 32px */
  inputSize?: CmsTextAreaSize
  /** 입력 상단 라벨(선택) */
  label?: ReactNode
  /** 지정 시 사이즈별 기본 width 대신 적용 (숫자는 px) */
  width?: number | string
  /**
   * true이면 `rows={1}`일 때 말줄임·`resize: none`을 쓰지 않음.
   */
  expandableFromSingleRow?: boolean
  /** 박스 크기 동작. 기본 `default` */
  layout?: CmsTextAreaLayout
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
      expandableFromSingleRow: expandableFromSingleRowProp = true,
      layout = 'default',
      ...rest
    },
    ref
  ) => {
    const hasExplicitWidth = width != null
    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const isFixed = layout === 'fixed'
    const expandableFromSingleRow = !isFixed && expandableFromSingleRowProp
    const { rows, autoSize, ...textareaRest } = rest
    const isRows1 = rows === 1
    const rows1SingleLine = isRows1 && !isFixed && !expandableFromSingleRow

    const rootCn = [
      'cms-textarea',
      `cms-textarea--${inputSize}`,
      hasExplicitWidth && 'cms-textarea--explicit-width',
      isRows1 && 'cms-textarea--rows-1',
      isFixed && 'cms-textarea--fixed-rows',
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
        <span
          className={controlCn}
          // 표 안에서 행 높이에 맞춰 늘어난 박스의 빈 영역을 눌러도 입력이 시작되도록
          onMouseDown={event => {
            if (event.target instanceof HTMLTextAreaElement) return
            const textarea = event.currentTarget.querySelector('textarea')
            if (!textarea || textarea.readOnly || textarea.disabled) return
            event.preventDefault()
            textarea.focus()
          }}
        >
          <span className="cms-textarea__inner">
            <Input.TextArea
              ref={ref}
              disabled={disabled}
              rootClassName={rootClassName}
              variant="borderless"
              rows={rows}
              autoSize={isFixed ? (autoSize ?? false) : autoSize}
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
