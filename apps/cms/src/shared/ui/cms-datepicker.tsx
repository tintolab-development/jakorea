/**
 * CMS 전용 날짜 선택 (AppDatePicker와 동일 동작 + `cms-field.css` 공통 스펙)
 * - inputSize: xlarge | large | medium | small
 * - 상단 라벨 / 하단 메세지(선택) · error · 값이 있으면 우측 X 노출
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
  type ReactNode,
  type Ref,
  type RefAttributes,
} from 'react'
import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import type { Dayjs } from 'dayjs'
import type { CmsControlSize } from './cms-control-size'
import {
  CmsClearIconSvg,
  CmsFieldFrame,
  cmsControlSizeClass,
  joinCmsClassNames,
  shouldRenderCmsFieldFrame,
  useCmsFieldStatus,
} from './cms-field'
import type { CmsFieldProps } from './cms-field'
import {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDateTimeDisplay,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
} from './app-datepicker'
import type { AppDatePickerRef } from './app-datepicker'
import { FieldCalendarIcon } from './icons/FieldIcons'
import {
  applySplitDateRangeEndChange,
  applySplitDateRangeStartChange,
} from '@/shared/lib/split-date-range-on-change'
import './cms-datepicker.css'

export type CmsDatePickerRef = AppDatePickerRef

export {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDateTimeDisplay,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
}

type InternalDatePickerRef = ComponentRef<typeof DatePicker>
type RangePickerProps = ComponentProps<typeof DatePicker.RangePicker>
type PickerAllowClear = DatePickerProps['allowClear']

export const cmsDatePickerPopupContainer = () => document.body

/** 좌측 아이콘 — 사이즈별 크기·placeholder/filled 색은 `.cms-field__icon` */
export function CmsPickerPrefixIcon({ children }: { children: ReactNode }) {
  return (
    <span className="cms-field__icon cms-datepicker__icon" aria-hidden>
      {children}
    </span>
  )
}

/** antd 기본 clear 아이콘을 CMS 공통 X(사이즈별 크기)로 교체 */
export function resolveCmsPickerAllowClear(allowClear: PickerAllowClear): PickerAllowClear {
  if (allowClear === false) return false
  const clearIcon = (
    <span className="cms-field__clear cms-datepicker__clear-icon">
      <CmsClearIconSvg />
    </span>
  )
  if (allowClear != null && typeof allowClear === 'object') {
    return { clearIcon, ...allowClear }
  }
  return { clearIcon }
}

function toWidthStyle(width: number | string | undefined): CSSProperties | undefined {
  if (width == null) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

export interface CmsDatePickerProps
  extends Omit<DatePickerProps, 'variant' | 'className' | 'size' | 'status'>,
    CmsFieldProps {
  className?: string
  pickerClassName?: string
  inputSize?: CmsControlSize
  /** 지정 시 기본 width(240px) 대신 적용 (숫자는 px) */
  width?: number | string
  status?: DatePickerProps['status']
}

const CmsDatePickerRender: ForwardRefRenderFunction<CmsDatePickerRef, CmsDatePickerProps> = (
  props,
  ref
) => {
  const {
    className,
    pickerClassName,
    format: formatProp,
    showTime,
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
    ...rest
  } = props
  const { getPopupContainer, ...pickerRest } = rest
  const framed = shouldRenderCmsFieldFrame(props, label)
  const { isError, message: resolvedMessage } = useCmsFieldStatus({
    error,
    status,
    message,
    disabled,
  })
  const hasExplicitWidth = width != null
  const widthStyle = toWidthStyle(width)

  const resolvedFormat =
    formatProp ??
    (showTime ? formatAppDatepickerDateTimeDisplay : formatAppDatepickerDisplay)

  const boxCn = joinCmsClassNames(
    'cms-datepicker',
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
  const pickerCn = ['cms-datepicker__picker', pickerClassName].filter(Boolean).join(' ')

  const box = (
    <span className={boxCn} style={framed ? undefined : { ...widthStyle, ...style }}>
      <DatePicker
        ref={ref as Ref<InternalDatePickerRef>}
        variant="borderless"
        className={pickerCn}
        format={resolvedFormat}
        showTime={showTime === true ? { format: 'HH:mm' } : showTime}
        prefix={
          prefix ?? (
            <CmsPickerPrefixIcon>
              <FieldCalendarIcon className="cms-datepicker__calendar-icon" />
            </CmsPickerPrefixIcon>
          )
        }
        suffixIcon={suffixIcon ?? null}
        inputReadOnly={inputReadOnly ?? true}
        placeholder={placeholder ?? DEFAULT_APP_DATE_PLACEHOLDER}
        disabled={disabled}
        allowClear={resolveCmsPickerAllowClear(allowClear)}
        value={value}
        {...pickerRest}
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
        'cms-datepicker-field',
        hasExplicitWidth && 'cms-field--explicit-width',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      {box}
    </CmsFieldFrame>
  )
}

export const CmsDatePicker: ForwardRefExoticComponent<
  CmsDatePickerProps & RefAttributes<CmsDatePickerRef>
> = forwardRef(CmsDatePickerRender)

CmsDatePicker.displayName = 'CmsDatePicker'

export interface CmsDateRangePickerProps
  extends Omit<RangePickerProps, 'variant' | 'className' | 'size' | 'status'>,
    CmsFieldProps {
  className?: string
  pickerClassName?: string
  inputSize?: CmsControlSize
  width?: number | string
  status?: RangePickerProps['status']
  /** 시작일 선택 시 종료일을 `시작+1개월`(동일일)로 설정 (분할 Range UI) */
  oneMonthFromStart?: boolean
}

const CmsDateRangePickerRender: ForwardRefRenderFunction<
  CmsDatePickerRef,
  CmsDateRangePickerProps
> = (props, ref) => {
  const {
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
    label,
    required = false,
    message,
    error = false,
    status,
    ...rest
  } = props
  const startPickerRef = useRef<InternalDatePickerRef>(null)
  const framed = shouldRenderCmsFieldFrame(props, label)
  const disabledAll = typeof disabled === 'boolean' ? disabled : Boolean(disabled?.[0] && disabled?.[1])
  const { isError, message: resolvedMessage } = useCmsFieldStatus({
    error,
    status,
    message,
    disabled: disabledAll,
  })
  const pickerCn = ['cms-datepicker__picker', pickerClassName].filter(Boolean).join(' ')
  const fmt = formatProp ?? formatAppDatepickerRangePlain
  const hasExplicitWidth = width != null
  const widthStyle = toWidthStyle(width)

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
    const [nextStart, nextEnd] = applySplitDateRangeStartChange(end, d)
    onChange?.([nextStart, nextEnd], ['', ''])
  }

  const handleEndChange = (d: Dayjs | null) => {
    const [nextStart, nextEnd] = applySplitDateRangeEndChange(start, d)
    onChange?.([nextStart, nextEnd], ['', ''])
  }

  const rootCn = joinCmsClassNames(
    'cms-datepicker',
    'cms-datepicker--range-split',
    `cms-datepicker--${inputSize}`,
    cmsControlSizeClass(inputSize),
    hasExplicitWidth && 'cms-datepicker--explicit-width',
    framed ? undefined : className
  )

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
  const resolvedAllowClear = resolveCmsPickerAllowClear(allowClear)

  const segmentCn = (segmentDisabled: boolean, filled: boolean) =>
    joinCmsClassNames(
      'cms-datepicker__segment',
      'cms-field__box',
      segmentDisabled && 'cms-datepicker__segment--disabled',
      segmentDisabled && 'cms-field__box--disabled',
      isError && 'cms-field__box--error',
      filled && 'cms-field__box--filled'
    )

  const renderPrefix = () =>
    prefix ?? (
      <CmsPickerPrefixIcon>
        <FieldCalendarIcon className="cms-datepicker__calendar-icon" />
      </CmsPickerPrefixIcon>
    )

  const range = (
    <span className={rootCn} style={framed ? undefined : { ...widthStyle, ...style }}>
      <span className={segmentCn(disabledStart, start != null)}>
        <DatePicker
          ref={startPickerRef}
          variant="borderless"
          className={pickerCn}
          format={fmt}
          prefix={renderPrefix()}
          suffixIcon={suffixIcon ?? null}
          inputReadOnly={inputReadOnly ?? true}
          value={start}
          onChange={handleStartChange}
          allowClear={resolvedAllowClear}
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
      <span className={segmentCn(disabledEnd, end != null)}>
        <DatePicker
          variant="borderless"
          className={pickerCn}
          format={fmt}
          prefix={renderPrefix()}
          suffixIcon={suffixIcon ?? null}
          inputReadOnly={inputReadOnly ?? true}
          value={end}
          onChange={handleEndChange}
          allowClear={resolvedAllowClear}
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

  if (!framed) return range

  return (
    <CmsFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      className={joinCmsClassNames(
        'cms-datepicker-field',
        'cms-datepicker-field--range',
        hasExplicitWidth && 'cms-field--explicit-width',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      {range}
    </CmsFieldFrame>
  )
}

export const CmsDateRangePicker: ForwardRefExoticComponent<
  CmsDateRangePickerProps & RefAttributes<CmsDatePickerRef>
> = forwardRef(CmsDateRangePickerRender)

CmsDateRangePicker.displayName = 'CmsDateRangePicker'
