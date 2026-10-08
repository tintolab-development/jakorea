/**
 * CMS 전용 시간 선택 — antd TimePicker 패널 + `cms-field.css` 공통 스펙 (CmsDatePicker 와 동일 구조)
 * - 형식: HH:mm (24시간)
 * - inputSize: xlarge | large | medium | small · 상단 라벨 / 하단 메세지(선택) · error · 값이 있으면 X
 */

import {
  forwardRef,
  type ComponentProps,
  type ComponentRef,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction,
  type Ref,
  type RefAttributes,
} from 'react'
import { TimePicker } from 'antd'
import type { CmsControlSize } from './cms-control-size'
import {
  CmsFieldFrame,
  cmsControlSizeClass,
  joinCmsClassNames,
  shouldRenderCmsFieldFrame,
  useCmsFieldStatus,
} from './cms-field'
import type { CmsFieldProps } from './cms-field'
import {
  CmsPickerPrefixIcon,
  cmsDatePickerPopupContainer,
  resolveCmsPickerAllowClear,
} from './cms-datepicker'
import type { CmsDatePickerRef } from './cms-datepicker'
import { FieldClockIcon } from './icons/FieldIcons'
import './cms-datepicker.css'

export const CMS_TIME_FORMAT = 'HH:mm'
export const DEFAULT_CMS_TIME_PLACEHOLDER = '시간을 선택하세요'

type InternalTimePickerRef = ComponentRef<typeof TimePicker>
type AntTimePickerProps = ComponentProps<typeof TimePicker>

export type CmsTimePickerRef = CmsDatePickerRef

export interface CmsTimePickerProps
  extends Omit<AntTimePickerProps, 'variant' | 'className' | 'size' | 'status'>,
    CmsFieldProps {
  className?: string
  pickerClassName?: string
  inputSize?: CmsControlSize
  /** 지정 시 기본 width(240px) 대신 적용 (숫자는 px) */
  width?: number | string
  status?: AntTimePickerProps['status']
}

const CmsTimePickerRender: ForwardRefRenderFunction<CmsTimePickerRef, CmsTimePickerProps> = (
  props,
  ref
) => {
  const {
    className,
    pickerClassName,
    format,
    prefix,
    suffixIcon,
    inputReadOnly,
    inputSize = 'large',
    width,
    placeholder,
    disabled,
    style,
    allowClear,
    label,
    required = false,
    message,
    error = false,
    status,
    value,
    getPopupContainer,
    ...rest
  } = props
  const framed = shouldRenderCmsFieldFrame(props, label)
  const { isError, message: resolvedMessage } = useCmsFieldStatus({
    error,
    status,
    message,
    disabled,
  })
  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null ? { width: typeof width === 'number' ? `${width}px` : width } : undefined

  const boxCn = joinCmsClassNames(
    'cms-datepicker',
    'cms-time-picker',
    `cms-datepicker--${inputSize}`,
    cmsControlSizeClass(inputSize),
    'cms-field__box',
    hasExplicitWidth && 'cms-datepicker--explicit-width',
    disabled && 'cms-datepicker--disabled',
    disabled && 'cms-field__box--disabled',
    isError && 'cms-field__box--error',
    value != null && 'cms-field__box--filled',
    framed ? undefined : className
  )
  const pickerCn = joinCmsClassNames('cms-datepicker__picker', 'cms-time-picker__picker', pickerClassName)

  const box = (
    <span className={boxCn} style={framed ? undefined : { ...widthStyle, ...style }}>
      <TimePicker
        ref={ref as Ref<InternalTimePickerRef>}
        variant="borderless"
        className={pickerCn}
        format={format ?? CMS_TIME_FORMAT}
        prefix={
          prefix ?? (
            <CmsPickerPrefixIcon>
              <FieldClockIcon className="cms-time-picker__clock-icon" />
            </CmsPickerPrefixIcon>
          )
        }
        suffixIcon={suffixIcon ?? null}
        inputReadOnly={inputReadOnly ?? true}
        placeholder={placeholder ?? DEFAULT_CMS_TIME_PLACEHOLDER}
        disabled={disabled}
        allowClear={resolveCmsPickerAllowClear(allowClear)}
        value={value}
        {...rest}
        getPopupContainer={getPopupContainer ?? cmsDatePickerPopupContainer}
      />
    </span>
  )

  if (!framed) return box

  return (
    <CmsFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      className={joinCmsClassNames(
        'cms-time-picker-field',
        hasExplicitWidth && 'cms-field--explicit-width',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      {box}
    </CmsFieldFrame>
  )
}

export const CmsTimePicker: ForwardRefExoticComponent<
  CmsTimePickerProps & RefAttributes<CmsTimePickerRef>
> = forwardRef(CmsTimePickerRender)

CmsTimePicker.displayName = 'CmsTimePicker'
