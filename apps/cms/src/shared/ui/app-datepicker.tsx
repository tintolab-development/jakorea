/**
 * 앱 공통 날짜 선택 (재사용)
 * CMS 전역에서 표시 형식 YYYY. MM. DD(요일) 및 스타일 통일
 */

import {
  forwardRef,
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
type InternalRangePickerRef = ComponentRef<typeof DatePicker.RangePicker>

/** 일~토 한 글자 요일 (표시용) */
const WEEKDAY_KO_MIN = ['일', '월', '화', '수', '목', '금', '토'] as const

export function formatAppDatepickerDisplay(value: Dayjs | null | undefined): string {
  if (value == null) return ''
  return `${value.format('YYYY. MM. DD')}(${WEEKDAY_KO_MIN[value.day()]})`
}

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
    ...rest
  },
  ref
) => {
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
        {...rest}
      />
    </span>
  )
}

export const AppDatePicker: ForwardRefExoticComponent<
  AppDatePickerProps & RefAttributes<AppDatePickerRef>
> = forwardRef(AppDatePickerRender)

AppDatePicker.displayName = 'AppDatePicker'

type RangePickerProps = ComponentProps<typeof DatePicker.RangePicker>

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
    separator,
    ...rest
  },
  ref
) => {
  const wrapperCn = [
    'app-datepicker',
    'app-datepicker--range',
    uiVariant === 'filter' && 'app-datepicker--filter',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const pickerCn = ['app-datepicker__picker', pickerClassName].filter(Boolean).join(' ')

  const rangeSeparator =
    separator ?? <span className="app-datepicker__range-separator">~</span>

  return (
    <span className={wrapperCn}>
      <DatePicker.RangePicker
        ref={ref as Ref<InternalRangePickerRef>}
        variant="borderless"
        className={pickerCn}
        format={formatProp ?? formatAppDatepickerDisplay}
        prefix={
          prefix ?? <CalendarOutlined className="app-datepicker__calendar-icon" aria-hidden />
        }
        suffixIcon={suffixIcon ?? null}
        inputReadOnly={inputReadOnly ?? true}
        separator={rangeSeparator}
        {...rest}
      />
    </span>
  )
}

export const AppDateRangePicker: ForwardRefExoticComponent<
  AppDateRangePickerProps & RefAttributes<AppDatePickerRef>
> = forwardRef(AppDateRangePickerRender)

AppDateRangePicker.displayName = 'AppDateRangePicker'
