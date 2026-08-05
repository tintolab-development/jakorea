/**
 * 앱 공통 날짜 선택 (재사용)
 * CMS 전역에서 표시 형식 YYYY. MM. DD(요일) 및 스타일 통일
 */

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type ComponentRef,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction,
  type Ref,
  type RefAttributes,
} from 'react'
import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker } from 'antd'
import type { DatePickerProps } from 'antd'
import type { Dayjs } from 'dayjs'
import './app-datepicker.css'

/** DatePicker ref 공개 형태(선언 파일에 rc-picker 경로가 새지 않도록 명시) */
export type AppDatePickerRef = {
  nativeElement: HTMLElement
  focus: (options?: FocusOptions) => void
  blur: () => void
}

type InternalDatePickerRef = ComponentRef<typeof DatePicker>
type RangePickerProps = ComponentProps<typeof DatePicker.RangePicker>

/** 일~토 한 글자 요일 (표시용) */
const WEEKDAY_KO_MIN = ['일', '월', '화', '수', '목', '금', '토'] as const

/** placeholder 미지정 시 공통 기본값 */
export const DEFAULT_APP_DATE_PLACEHOLDER = '날짜를 선택하세요'

export function formatAppDatepickerDisplay(value: Dayjs | null | undefined): string {
  if (value == null) return ''
  return `${value.format('YYYY. MM. DD')}(${WEEKDAY_KO_MIN[value.day()]})`
}

/** 기간 필터 등: 요일 없이 YYYY. MM. DD (시안과 동일) */
export function formatAppDatepickerRangePlain(value: Dayjs | null | undefined): string {
  if (value == null) return ''
  return value.format('YYYY. MM. DD')
}

const appDatePickerPopupContainer = () => document.body

export interface AppDatePickerProps extends Omit<DatePickerProps, 'variant' | 'className'> {
  /** span.app-datepicker 래퍼 클래스 */
  className?: string
  /** Ant DatePicker(.ant-picker) 루트 클래스 */
  pickerClassName?: string
  /** filter: 44px·8px radius 등 통일 필터 토큰 */
  uiVariant?: 'default' | 'filter'
}

const AppDatePickerRender: ForwardRefRenderFunction<AppDatePickerRef, AppDatePickerProps> = (
  {
    className,
    pickerClassName,
    format: formatProp,
    prefix,
    suffixIcon,
    inputReadOnly,
    uiVariant = 'default',
    placeholder,
    ...rest
  },
  ref
) => {
  const { getPopupContainer, ...pickerRest } = rest
  const wrapperCn = [
    'app-datepicker',
    uiVariant === 'filter' && 'app-datepicker--filter',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const pickerCn = ['app-datepicker__picker', pickerClassName].filter(Boolean).join(' ')

  return (
    <span className={wrapperCn}>
      <DatePicker
        ref={ref as Ref<InternalDatePickerRef>}
        variant="borderless"
        className={pickerCn}
        format={formatProp ?? formatAppDatepickerDisplay}
        prefix={
          prefix ?? <CalendarOutlined className="app-datepicker__calendar-icon" aria-hidden />
        }
        suffixIcon={suffixIcon ?? null}
        inputReadOnly={inputReadOnly ?? true}
        placeholder={placeholder ?? DEFAULT_APP_DATE_PLACEHOLDER}
        {...pickerRest}
        getPopupContainer={getPopupContainer ?? appDatePickerPopupContainer}
      />
    </span>
  )
}

export const AppDatePicker: ForwardRefExoticComponent<
  AppDatePickerProps & RefAttributes<AppDatePickerRef>
> = forwardRef(AppDatePickerRender)

AppDatePicker.displayName = 'AppDatePicker'

export interface AppDateRangePickerProps extends Omit<RangePickerProps, 'variant' | 'className'> {
  className?: string
  pickerClassName?: string
  uiVariant?: 'default' | 'filter'
}

const AppDateRangePickerRender: ForwardRefRenderFunction<
  AppDatePickerRef,
  AppDateRangePickerProps
> = (
  {
    className,
    pickerClassName,
    format: formatProp,
    prefix,
    suffixIcon,
    inputReadOnly,
    uiVariant = 'default',
    separator: _separator,
    value,
    onChange,
    allowClear,
    disabled,
    size,
    style,
    placeholder,
    id: rangeId,
    defaultPickerValue,
    onCalendarChange: _onCalendarChange,
    order: _order,
    getPopupContainer,
    ...rest
  },
  ref
) => {
  const startPickerRef = useRef<InternalDatePickerRef>(null)
  const pickerCn = ['app-datepicker__picker', pickerClassName].filter(Boolean).join(' ')
  const fmt = formatProp ?? formatAppDatepickerRangePlain

  const start = value?.[0] ?? null
  const end = value?.[1] ?? null

  const disabledStart = typeof disabled === 'boolean' ? disabled : disabled?.[0] ?? false
  const disabledEnd = typeof disabled === 'boolean' ? disabled : disabled?.[1] ?? false

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
    'app-datepicker',
    'app-datepicker--range-split',
    uiVariant === 'filter' && 'app-datepicker--filter',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const startId =
    typeof rangeId === 'object' && rangeId != null ? rangeId.start : undefined
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
    'variant' | 'className' | 'value' | 'onChange' | 'placeholder'
  >

  const resolvedPopupContainer = getPopupContainer ?? appDatePickerPopupContainer

  return (
    <span className={wrapperCn} style={style}>
      <span className="app-datepicker__segment">
        <DatePicker
          ref={startPickerRef}
          variant="borderless"
          className={pickerCn}
          format={fmt}
          prefix={
            prefix ?? <CalendarOutlined className="app-datepicker__calendar-icon" aria-hidden />
          }
          suffixIcon={suffixIcon ?? null}
          inputReadOnly={inputReadOnly ?? true}
          value={start}
          onChange={handleStartChange}
          allowClear={allowClear}
          disabled={disabledStart}
          size={size}
          placeholder={placeholderTuple[0]}
          id={startId}
          defaultPickerValue={defaultStart}
          {...sharedPickerProps}
          getPopupContainer={resolvedPopupContainer}
        />
      </span>
      <span className="app-datepicker__range-separator" aria-hidden>
        ~
      </span>
      <span className="app-datepicker__segment">
        <DatePicker
          variant="borderless"
          className={pickerCn}
          format={fmt}
          prefix={
            prefix ?? <CalendarOutlined className="app-datepicker__calendar-icon" aria-hidden />
          }
          suffixIcon={suffixIcon ?? null}
          inputReadOnly={inputReadOnly ?? true}
          value={end}
          onChange={handleEndChange}
          allowClear={allowClear}
          disabled={disabledEnd}
          size={size}
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

export const AppDateRangePicker: ForwardRefExoticComponent<
  AppDateRangePickerProps & RefAttributes<AppDatePickerRef>
> = forwardRef(AppDateRangePickerRender)

AppDateRangePicker.displayName = 'AppDateRangePicker'
