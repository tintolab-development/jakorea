/**
 * CMS 전용 날짜 선택 (AppDatePicker와 동일 동작 + CmsInput 치수)
 */

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type ComponentRef,
  type CSSProperties,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction,
  type Ref,
  type RefAttributes,
} from 'react'
import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import type { Dayjs } from 'dayjs'
import type { CmsControlSize } from './cms-control-size'
import {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
} from './app-datepicker'
import type { AppDatePickerRef } from './app-datepicker'
import './cms-datepicker.css'

export type CmsDatePickerRef = AppDatePickerRef

export {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
}

type InternalDatePickerRef = ComponentRef<typeof DatePicker>
type RangePickerProps = ComponentProps<typeof DatePicker.RangePicker>

export interface CmsDatePickerProps extends Omit<DatePickerProps, 'variant' | 'className' | 'size'> {
  className?: string
  pickerClassName?: string
  inputSize?: CmsControlSize
  width?: number | string
}

const cmsDatePickerPopupContainer = () => document.body

const CmsDatePickerRender: ForwardRefRenderFunction<CmsDatePickerRef, CmsDatePickerProps> = (
  {
    className,
    pickerClassName,
    format: formatProp,
    prefix,
    suffixIcon,
    inputReadOnly,
    inputSize = 'large',
    width,
    placeholder,
    disabled,
    style,
    ...rest
  },
  ref
) => {
  const { getPopupContainer, ...pickerRest } = rest
  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null
      ? { width: typeof width === 'number' ? `${width}px` : width }
      : undefined

  const wrapperCn = [
    'cms-datepicker',
    `cms-datepicker--${inputSize}`,
    hasExplicitWidth && 'cms-datepicker--explicit-width',
    disabled && 'cms-datepicker--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const pickerCn = ['cms-datepicker__picker', pickerClassName].filter(Boolean).join(' ')

  return (
    <span className={wrapperCn} style={{ ...widthStyle, ...style }}>
      <DatePicker
        ref={ref as Ref<InternalDatePickerRef>}
        variant="borderless"
        className={pickerCn}
        format={formatProp ?? formatAppDatepickerDisplay}
        prefix={
          prefix ?? <CalendarOutlined className="cms-datepicker__calendar-icon" aria-hidden />
        }
        suffixIcon={suffixIcon ?? null}
        inputReadOnly={inputReadOnly ?? true}
        placeholder={placeholder ?? DEFAULT_APP_DATE_PLACEHOLDER}
        disabled={disabled}
        {...pickerRest}
        getPopupContainer={getPopupContainer ?? cmsDatePickerPopupContainer}
      />
    </span>
  )
}

export const CmsDatePicker: ForwardRefExoticComponent<
  CmsDatePickerProps & RefAttributes<CmsDatePickerRef>
> = forwardRef(CmsDatePickerRender)

CmsDatePicker.displayName = 'CmsDatePicker'

export interface CmsDateRangePickerProps extends Omit<RangePickerProps, 'variant' | 'className' | 'size'> {
  className?: string
  pickerClassName?: string
  inputSize?: CmsControlSize
  width?: number | string
  /** 시작일 선택 시 종료일을 `시작+1개월`(동일일)로 설정 (분할 Range UI) */
  oneMonthFromStart?: boolean
}

const CmsDateRangePickerRender: ForwardRefRenderFunction<
  CmsDatePickerRef,
  CmsDateRangePickerProps
> = (
  {
    className,
    pickerClassName,
    format: formatProp,
    prefix,
    suffixIcon,
    inputReadOnly,
    inputSize = 'large',
    width,
    separator: _separator,
    value,
    onChange,
    allowClear,
    disabled,
    style,
    placeholder,
    id: rangeId,
    defaultPickerValue,
    onCalendarChange: _onCalendarChange,
    order: _order,
    oneMonthFromStart = false,
    getPopupContainer,
    ...rest
  },
  ref
) => {
  const startPickerRef = useRef<InternalDatePickerRef>(null)
  const pickerCn = ['cms-datepicker__picker', pickerClassName].filter(Boolean).join(' ')
  const fmt = formatProp ?? formatAppDatepickerRangePlain
  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null
      ? { width: typeof width === 'number' ? `${width}px` : width }
      : undefined

  const start = value?.[0] ?? null
  const end = value?.[1] ?? null

  const disabledStart = typeof disabled === 'boolean' ? disabled : (disabled?.[0] ?? false)
  const disabledEnd = typeof disabled === 'boolean' ? disabled : (disabled?.[1] ?? false)

  const placeholderTuple: [string, string] = Array.isArray(placeholder)
    ? [
        placeholder[0] ?? DEFAULT_APP_DATE_PLACEHOLDER,
        placeholder[1] ?? DEFAULT_APP_DATE_PLACEHOLDER,
      ]
    : [placeholder ?? DEFAULT_APP_DATE_PLACEHOLDER, placeholder ?? DEFAULT_APP_DATE_PLACEHOLDER]

  useImperativeHandle(ref, () => ({
    get nativeElement() {
      return startPickerRef.current?.nativeElement ?? document.createElement('span')
    },
    focus: (options?: FocusOptions) => {
      startPickerRef.current?.focus?.(options)
    },
    blur: () => {
      startPickerRef.current?.blur?.()
    },
  }))

  const handleStartChange = (d: Dayjs | null) => {
    if (oneMonthFromStart && d) {
      onChange?.([d, d.add(1, 'month')], ['', ''])
      return
    }
    if (d && end && d.isAfter(end)) {
      onChange?.([d, d], ['', ''])
    } else {
      onChange?.([d, end], ['', ''])
    }
  }

  const handleEndChange = (d: Dayjs | null) => {
    if (d && start && d.isBefore(start)) {
      onChange?.([d, start], ['', ''])
    } else {
      onChange?.([start, d], ['', ''])
    }
  }

  const wrapperCn = [
    'cms-datepicker',
    'cms-datepicker--range-split',
    `cms-datepicker--${inputSize}`,
    hasExplicitWidth && 'cms-datepicker--explicit-width',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const startId = typeof rangeId === 'object' && rangeId != null ? rangeId.start : undefined
  const endId = typeof rangeId === 'object' && rangeId != null ? rangeId.end : undefined

  const defaultStart =
    Array.isArray(defaultPickerValue) && defaultPickerValue[0]
      ? defaultPickerValue[0]
      : !Array.isArray(defaultPickerValue)
        ? defaultPickerValue
        : undefined
  const defaultEnd =
    Array.isArray(defaultPickerValue) && defaultPickerValue[1]
      ? defaultPickerValue[1]
      : undefined

  const sharedPickerProps = rest as Omit<
    DatePickerProps,
    'variant' | 'className' | 'value' | 'onChange' | 'placeholder' | 'size'
  >

  const resolvedPopupContainer = getPopupContainer ?? cmsDatePickerPopupContainer

  const segmentStartCn = [
    'cms-datepicker__segment',
    disabledStart && 'cms-datepicker__segment--disabled',
  ]
    .filter(Boolean)
    .join(' ')
  const segmentEndCn = [
    'cms-datepicker__segment',
    disabledEnd && 'cms-datepicker__segment--disabled',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={wrapperCn} style={{ ...widthStyle, ...style }}>
      <span className={segmentStartCn}>
        <DatePicker
          ref={startPickerRef}
          variant="borderless"
          className={pickerCn}
          format={fmt}
          prefix={
            prefix ?? <CalendarOutlined className="cms-datepicker__calendar-icon" aria-hidden />
          }
          suffixIcon={suffixIcon ?? null}
          inputReadOnly={inputReadOnly ?? true}
          value={start}
          onChange={handleStartChange}
          allowClear={allowClear}
          disabled={disabledStart}
          placeholder={placeholderTuple[0]}
          id={startId}
          defaultPickerValue={defaultStart}
          {...sharedPickerProps}
          getPopupContainer={resolvedPopupContainer}
        />
      </span>
      <span className="cms-datepicker__range-separator" aria-hidden>
        ~
      </span>
      <span className={segmentEndCn}>
        <DatePicker
          variant="borderless"
          className={pickerCn}
          format={fmt}
          prefix={
            prefix ?? <CalendarOutlined className="cms-datepicker__calendar-icon" aria-hidden />
          }
          suffixIcon={suffixIcon ?? null}
          inputReadOnly={inputReadOnly ?? true}
          value={end}
          onChange={handleEndChange}
          allowClear={allowClear}
          disabled={disabledEnd}
          placeholder={placeholderTuple[1]}
          id={endId}
          defaultPickerValue={defaultEnd}
          {...sharedPickerProps}
          getPopupContainer={resolvedPopupContainer}
        />
      </span>
    </span>
  )
}

export const CmsDateRangePicker: ForwardRefExoticComponent<
  CmsDateRangePickerProps & RefAttributes<CmsDatePickerRef>
> = forwardRef(CmsDateRangePickerRender)

CmsDateRangePicker.displayName = 'CmsDateRangePicker'
