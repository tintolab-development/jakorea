/**
 * CMS 전용 텍스트 인풋 — Ant Input borderless + `.cms-field__box` 크롬 (`cms-field.css` 공통 스펙)
 * - size: xlarge 52 | large 44 | medium 40 | small 36
 * - 라벨 / 하단 메세지(선택) / value 있을 때 clear(hover·focus 시에만 노출)
 *
 * clear는 Ant `allowClear`(affix suffix)를 쓰지 않고 `.cms-input__control` flex 형제로 둔다.
 * affix + `width:100%` input 조합에서 클리어가 테두리에 잘리는 문제를 막기 위함.
 */

import { forwardRef, useId, useState } from 'react'
import type { ChangeEvent, CSSProperties, ReactNode } from 'react'
import { Input } from 'antd'
import type { InputProps, InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'
import {
  CmsFieldClearButton,
  CmsFieldFrame,
  hasCmsFieldNode,
  joinCmsClassNames,
  useCmsFieldStatus,
} from './cms-field'
import type { CmsFieldProps } from './cms-field'
import './cms-input.css'

export type CmsInputSize = CmsControlSize

export interface CmsInputProps
  extends Omit<InputProps, 'variant' | 'prefix' | 'size'>,
    CmsFieldProps {
  /** xlarge 52px / large 44px / medium 40px / small 36px */
  inputSize?: CmsInputSize
  /** 인풋 왼쪽 아이콘(선택) */
  icon?: ReactNode
  /** 지정 시 기본 width(240px) 대신 적용 (숫자는 px) */
  width?: number | string
  /** value 있을 때 clear 버튼 (기본 true) */
  allowClear?: boolean
}

function hasInputText(value: InputProps['value'] | InputProps['defaultValue']): boolean {
  if (value == null) return false
  return String(value).length > 0
}

export const CmsInput = forwardRef<InputRef, CmsInputProps>(
  (
    {
      className,
      label,
      required = false,
      error = false,
      message,
      icon,
      inputSize = 'large',
      width,
      disabled,
      style,
      rootClassName,
      allowClear = true,
      id,
      value,
      defaultValue,
      status,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    const isControlled = value !== undefined
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
    const currentValue = isControlled ? value : uncontrolledValue
    const isFilled = hasInputText(currentValue)
    const showClear = Boolean(allowClear && !disabled && isFilled)

    const { isError, message: resolvedMessage, hasMessage } = useCmsFieldStatus({
      error,
      status,
      message,
      disabled,
    })

    const hasIcon = icon != null
    const hasExplicitWidth = width != null
    const hasLabel = hasCmsFieldNode(label)
    const messageId = `${inputId}-message`

    const widthStyle: CSSProperties | undefined =
      width != null
        ? { width: typeof width === 'number' ? `${width}px` : width }
        : undefined

    const rootCn = joinCmsClassNames(
      'cms-input',
      `cms-input--${inputSize}`,
      hasIcon && 'cms-input--has-icon',
      hasExplicitWidth && 'cms-input--explicit-width',
      hasExplicitWidth && 'cms-field--explicit-width',
      showClear && 'cms-input--clearable',
      isError && 'cms-input--error',
      hasLabel && 'cms-input--has-label',
      hasMessage && 'cms-input--has-message',
      className
    )

    const controlCn = joinCmsClassNames(
      'cms-input__control',
      'cms-field__box',
      isFilled && 'cms-field__box--filled',
      disabled && 'cms-input__control--disabled',
      disabled && 'cms-field__box--disabled',
      isError && 'cms-input__control--error',
      isError && 'cms-field__box--error'
    )

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setUncontrolledValue(event.target.value)
      }
      onChange?.(event)
    }

    const handleClear = () => {
      if (!isControlled) {
        setUncontrolledValue('')
      }
      onChange?.({
        target: { value: '' },
        currentTarget: { value: '' },
      } as ChangeEvent<HTMLInputElement>)
    }

    return (
      <CmsFieldFrame
        size={inputSize}
        label={label}
        required={required}
        message={resolvedMessage}
        isError={isError}
        htmlFor={inputId}
        messageId={messageId}
        className={rootCn}
        style={{ ...widthStyle, ...style }}
        labelClassName="cms-input__label"
        requiredClassName="cms-input__required"
        messageClassName={joinCmsClassNames(
          'cms-input__message',
          isError && 'cms-input__message--error'
        )}
      >
        <span className={controlCn}>
          {hasIcon ? <span className="cms-input__icon cms-field__icon">{icon}</span> : null}
          <span className="cms-input__inner">
            <Input
              ref={ref}
              id={inputId}
              disabled={disabled}
              rootClassName={rootClassName}
              variant="borderless"
              allowClear={false}
              value={isControlled ? value : uncontrolledValue}
              onChange={handleChange}
              aria-invalid={isError || undefined}
              aria-describedby={hasMessage ? messageId : undefined}
              {...rest}
            />
          </span>
          {showClear ? (
            <CmsFieldClearButton className="cms-input__clear" onClear={handleClear} />
          ) : null}
        </span>
      </CmsFieldFrame>
    )
  }
)

CmsInput.displayName = 'CmsInput'
