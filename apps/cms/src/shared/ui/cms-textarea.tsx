/**
 * CMS 전용 텍스트영역 (`CmsInput`과 동일한 래핑·사이즈 체계, `cms-field.css` 공통 스펙)
 * - size: xlarge | large | medium | small (박스 min-height = 사이즈 높이)
 * - 상단 라벨 / 하단 메세지(선택) · error · 폭 지정 옵션 동일
 */

import { forwardRef, useId } from 'react'
import type { CSSProperties } from 'react'
import { Input } from 'antd'
import type { TextAreaProps, TextAreaRef } from 'antd/es/input/TextArea'
import type { CmsControlSize } from './cms-control-size'
import {
  CmsFieldFrame,
  cmsControlSizeClass,
  joinCmsClassNames,
  shouldRenderCmsFieldFrame,
  useCmsFieldStatus,
} from './cms-field'
import type { CmsFieldProps } from './cms-field'
import './cms-textarea.css'

export type CmsTextAreaSize = CmsControlSize

export interface CmsTextAreaProps extends Omit<TextAreaProps, 'variant' | 'size'>, CmsFieldProps {
  /** xlarge 52px / large 44px / medium 40px / small 36px 기준 min-height */
  inputSize?: CmsTextAreaSize
  /** 지정 시 기본 width(240px) 대신 적용 (숫자는 px) */
  width?: number | string
  /**
   * true이면 `rows={1}`일 때 말줄임·`resize: none`(`cms-textarea--rows-1-single-line`)을 쓰지 않음.
   * 한 줄 높이로 시작하고 세로로 늘리는 입력(연수 공문 등). 세로 중앙은 `rows={1}` 공통 스타일.
   */
  expandableFromSingleRow?: boolean
}

export const CmsTextArea = forwardRef<TextAreaRef, CmsTextAreaProps>((props, ref) => {
  const {
    className,
    label,
    required = false,
    error = false,
    message,
    inputSize = 'large',
    width,
    disabled,
    style,
    rootClassName,
    expandableFromSingleRow = true,
    id,
    status,
    ...rest
  } = props
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const messageId = `${textareaId}-message`
  const framed = shouldRenderCmsFieldFrame(props, label)

  const { isError, message: resolvedMessage, hasMessage } = useCmsFieldStatus({
    error,
    status,
    message,
    disabled,
  })

  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  // CMS 전역: 글자 수(0/2000) UI 미표시 — maxLength 검증은 유지 (Platform은 별도 컴포넌트)
  const { rows, showCount: _showCount, ...textareaRest } = rest
  const isRows1 = rows === 1
  const rows1SingleLine = isRows1 && !expandableFromSingleRow

  const rootCn = joinCmsClassNames(
    'cms-textarea',
    `cms-textarea--${inputSize}`,
    cmsControlSizeClass(inputSize),
    hasExplicitWidth && 'cms-textarea--explicit-width',
    isRows1 && 'cms-textarea--rows-1',
    rows1SingleLine && 'cms-textarea--rows-1-single-line',
    expandableFromSingleRow && isRows1 && 'cms-textarea--expandable-single-row',
    isError && 'cms-textarea--error',
    className
  )

  const controlCn = joinCmsClassNames(
    'cms-textarea__control',
    'cms-field__box',
    disabled && 'cms-textarea__control--disabled',
    disabled && 'cms-field__box--disabled',
    isError && 'cms-field__box--error'
  )

  const inputNode = (
    <span className={rootCn} style={{ ...widthStyle, ...style }}>
      <span className={controlCn}>
        <span className="cms-textarea__inner">
          <Input.TextArea
            ref={ref}
            id={textareaId}
            disabled={disabled}
            rootClassName={rootClassName}
            variant="borderless"
            rows={rows}
            aria-invalid={isError || undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            {...textareaRest}
          />
        </span>
      </span>
    </span>
  )

  if (!framed) return inputNode

  return (
    <CmsFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      htmlFor={textareaId}
      messageId={messageId}
      className="cms-textarea__field"
      labelClassName="cms-textarea__label"
    >
      {inputNode}
    </CmsFieldFrame>
  )
})

CmsTextArea.displayName = 'CmsTextArea'
