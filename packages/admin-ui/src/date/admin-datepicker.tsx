import {
  cloneElement,
  forwardRef,
  isValidElement,
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
import {
  AdminClearIconSvg,
  AdminFieldFrame,
  cmsControlSizeClass,
  joinClassNames,
  shouldRenderFieldFrame,
  useAdminFieldStatus,
  type AdminControlSize,
  type AdminFieldProps,
} from '../field/index.js'
import { FieldCalendarIcon } from '../icons/field-icons.js'
import { NavNextIcon, NavPrevIcon } from '../icons/nav-icons.js'
import {
  DEFAULT_ADMIN_DATE_PLACEHOLDER,
  formatAdminDatePlain,
  formatAdminDateTimePlain,
} from './date-format.js'
import {
  applySplitDateRangeEndChange,
  applySplitDateRangeStartChange,
} from './split-date-range.js'
import './admin-datepicker.css'

/** 날짜 선택 패널 이전/다음 달 — 시안 `Icon / Button / w20` left·right (연도 «» 버튼은 시안 없음 → antd 기본 유지) */
const PANEL_PREV_ICON = <NavPrevIcon className="cms-datepicker__panel-nav-icon" />
const PANEL_NEXT_ICON = <NavNextIcon className="cms-datepicker__panel-nav-icon" />

/**
 * 년도·연월 선택 팝업 — 디자인 시스템 `Popup / Date Picker`(type=year · year-month) 모양 (`admin-datepicker.css`).
 * 일반 날짜(date) 팝업은 건드리지 않도록 `picker` 가 year·month 일 때만 팝업 루트 클래스를 붙인다.
 */
const YEAR_MONTH_POPUP_CLASS = 'cms-datepicker-popup--year-month'

/** 년도·연월 패널은 «» 버튼만 있어(연도·10년 단위 이동) 시안 꺾쇠 1개 아이콘으로 바꾼다 */
const YEAR_MONTH_PANEL_NAV_ICONS = {
  superPrevIcon: PANEL_PREV_ICON,
  superNextIcon: PANEL_NEXT_ICON,
} as const

type PickerMode = DatePickerProps['picker']
type PickerClassNames = DatePickerProps['classNames']

function isYearMonthPicker(picker: PickerMode): boolean {
  return picker === 'year' || picker === 'month'
}

function resolveYearMonthPopupClassNames(
  picker: PickerMode,
  classNames: PickerClassNames
): PickerClassNames {
  if (!isYearMonthPicker(picker)) return classNames
  return {
    ...classNames,
    popup: {
      ...classNames?.popup,
      root: joinClassNames(YEAR_MONTH_POPUP_CLASS, classNames?.popup?.root),
    },
  }
}

type PickerLocale = DatePickerProps['locale']

/**
 * 년도·연월 팝업 헤더 — 시안 `2026` / `2020-2029` 처럼 연도에 「년」을 붙이지 않는다.
 * antd ko_KR `yearFormat`(`YYYY년`)은 헤더에만 쓰이므로 year·month 피커에서만 `YYYY` 로 덮는다.
 */
function resolveYearMonthLocale(picker: PickerMode, locale: PickerLocale): PickerLocale {
  if (!isYearMonthPicker(picker) || locale?.lang == null) return locale
  return { ...locale, lang: { ...locale.lang, yearFormat: 'YYYY' } }
}

type PickerCellRender = DatePickerProps['cellRender']

/** 시안 Calendar / Picker / Cell `status=select` — 올해(연도 패널)·이번 달(월 패널) */
const YEAR_MONTH_CURRENT_CELL_CLASS = 'cms-datepicker__cell--current'

/**
 * antd(rc-picker)는 날짜 패널에만 `-cell-today` 를 붙이고 년도·월 패널에는 붙이지 않는다.
 * 그래서 year·month 피커에서 호출부가 `cellRender` 를 넘기지 않았을 때만, 올해·이번 달 칸 안쪽에 클래스를 붙인다.
 */
function resolveYearMonthCellRender(
  picker: PickerMode,
  cellRender: PickerCellRender
): PickerCellRender {
  if (!isYearMonthPicker(picker) || cellRender != null) return cellRender
  return (current, info) => {
    const origin = info.originNode
    if (
      (info.type === 'year' || info.type === 'month') &&
      typeof current === 'object' &&
      current.isSame(info.today, info.type) &&
      isValidElement<{ className?: string }>(origin)
    ) {
      return cloneElement(origin, {
        className: joinClassNames(origin.props.className, YEAR_MONTH_CURRENT_CELL_CLASS),
      })
    }
    return origin
  }
}

/** 호출부가 superPrev/NextIcon 을 넘기지 않았을 때만 시안 아이콘 — `undefined` 를 넘기면 antd 기본 아이콘이 사라진다 */
function resolveYearMonthNavIcons(picker: PickerMode) {
  return isYearMonthPicker(picker) ? YEAR_MONTH_PANEL_NAV_ICONS : undefined
}

export type AdminDatePickerRef = {
  nativeElement: HTMLElement
  focus: (options?: FocusOptions) => void
  blur: () => void
}

type InternalDatePickerRef = ComponentRef<typeof DatePicker>
type RangePickerProps = ComponentProps<typeof DatePicker.RangePicker>
type PickerAllowClear = DatePickerProps['allowClear']

export const adminDatePickerPopupContainer = () => document.body

export function AdminPickerPrefixIcon({ children }: { children: ReactNode }) {
  return (
    <span className="cms-field__icon cms-datepicker__icon" aria-hidden>
      {children}
    </span>
  )
}

export function resolveAdminPickerAllowClear(allowClear: PickerAllowClear): PickerAllowClear {
  if (allowClear === false) return false
  const clearIcon = (
    <span className="cms-field__clear cms-datepicker__clear-icon">
      <AdminClearIconSvg />
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

export interface AdminDatePickerProps
  extends Omit<DatePickerProps, 'variant' | 'className' | 'size' | 'status'>,
    AdminFieldProps {
  className?: string
  pickerClassName?: string
  inputSize?: AdminControlSize
  width?: number | string
  status?: DatePickerProps['status']
}

const AdminDatePickerRender: ForwardRefRenderFunction<AdminDatePickerRef, AdminDatePickerProps> = (
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
    classNames,
    ...rest
  } = props
  const { getPopupContainer, ...pickerRest } = rest
  const framed = shouldRenderFieldFrame(props, label)
  const { isError, message: resolvedMessage } = useAdminFieldStatus({
    error,
    status,
    message,
    disabled,
  })
  const hasExplicitWidth = width != null
  const widthStyle = toWidthStyle(width)

  const resolvedFormat =
    formatProp ?? (showTime ? formatAdminDateTimePlain : formatAdminDatePlain)

  const boxCn = joinClassNames(
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
            <AdminPickerPrefixIcon>
              <FieldCalendarIcon className="cms-datepicker__calendar-icon" />
            </AdminPickerPrefixIcon>
          )
        }
        suffixIcon={suffixIcon ?? null}
        prevIcon={PANEL_PREV_ICON}
        nextIcon={PANEL_NEXT_ICON}
        inputReadOnly={inputReadOnly ?? true}
        showNow={false}
        placeholder={placeholder ?? DEFAULT_ADMIN_DATE_PLACEHOLDER}
        disabled={disabled}
        allowClear={resolveAdminPickerAllowClear(allowClear)}
        value={value}
        {...resolveYearMonthNavIcons(props.picker)}
        {...pickerRest}
        locale={resolveYearMonthLocale(props.picker, props.locale)}
        cellRender={resolveYearMonthCellRender(props.picker, props.cellRender)}
        classNames={resolveYearMonthPopupClassNames(props.picker, classNames)}
        getPopupContainer={getPopupContainer ?? adminDatePickerPopupContainer}
      />
    </span>
  )

  if (!framed) return box

  return (
    <AdminFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      className={joinClassNames(
        'cms-datepicker-field',
        hasExplicitWidth && 'cms-field--explicit-width',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      {box}
    </AdminFieldFrame>
  )
}

export const AdminDatePicker: ForwardRefExoticComponent<
  AdminDatePickerProps & RefAttributes<AdminDatePickerRef>
> = forwardRef(AdminDatePickerRender)

AdminDatePicker.displayName = 'AdminDatePicker'

export interface AdminDateRangePickerProps
  extends Omit<RangePickerProps, 'variant' | 'className' | 'size' | 'status'>,
    AdminFieldProps {
  className?: string
  pickerClassName?: string
  inputSize?: AdminControlSize
  width?: number | string
  status?: RangePickerProps['status']
  oneMonthFromStart?: boolean
  /** `same-day`(기본): 시작+1개월 동일일. `inclusive-month`: 시작+1개월−1일 (Admin 기존) */
  oneMonthEndMode?: 'same-day' | 'inclusive-month'
}

const AdminDateRangePickerRender: ForwardRefRenderFunction<
  AdminDatePickerRef,
  AdminDateRangePickerProps
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
    oneMonthEndMode = 'same-day',
    getPopupContainer,
    label,
    required = false,
    message,
    error = false,
    status,
    classNames,
    ...rest
  } = props
  const startPickerRef = useRef<InternalDatePickerRef>(null)
  const framed = shouldRenderFieldFrame(props, label)
  const disabledAll = typeof disabled === 'boolean' ? disabled : Boolean(disabled?.[0] && disabled?.[1])
  const { isError, message: resolvedMessage } = useAdminFieldStatus({
    error,
    status,
    message,
    disabled: disabledAll,
  })
  const pickerCn = ['cms-datepicker__picker', pickerClassName].filter(Boolean).join(' ')
  const fmt = formatProp ?? formatAdminDatePlain
  const hasExplicitWidth = width != null
  const widthStyle = toWidthStyle(width)

  const start = value?.[0] ?? null
  const end = value?.[1] ?? null

  const disabledStart = typeof disabled === 'boolean' ? disabled : (disabled?.[0] ?? false)
  const disabledEnd = typeof disabled === 'boolean' ? disabled : (disabled?.[1] ?? false)

  const placeholderTuple: [string, string] = Array.isArray(placeholder)
    ? [
        placeholder[0] ?? DEFAULT_ADMIN_DATE_PLACEHOLDER,
        placeholder[1] ?? DEFAULT_ADMIN_DATE_PLACEHOLDER,
      ]
    : [placeholder ?? DEFAULT_ADMIN_DATE_PLACEHOLDER, placeholder ?? DEFAULT_ADMIN_DATE_PLACEHOLDER]

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
      const rangeEnd =
        oneMonthEndMode === 'inclusive-month' ? d.add(1, 'month').subtract(1, 'day') : d.add(1, 'month')
      onChange?.([d, rangeEnd], ['', ''])
      return
    }
    const [nextStart, nextEnd] = applySplitDateRangeStartChange(end, d)
    onChange?.([nextStart, nextEnd], ['', ''])
  }

  const handleEndChange = (d: Dayjs | null) => {
    const [nextStart, nextEnd] = applySplitDateRangeEndChange(start, d)
    onChange?.([nextStart, nextEnd], ['', ''])
  }

  const rootCn = joinClassNames(
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
    Array.isArray(defaultPickerValue) && defaultPickerValue[1] ? defaultPickerValue[1] : undefined

  const sharedPickerProps = rest as Omit<
    DatePickerProps,
    'variant' | 'className' | 'value' | 'onChange' | 'placeholder' | 'size'
  >

  const resolvedPopupContainer = getPopupContainer ?? adminDatePickerPopupContainer
  const resolvedAllowClear = resolveAdminPickerAllowClear(allowClear)
  const yearMonthNavIcons = resolveYearMonthNavIcons(props.picker)
  const resolvedClassNames = resolveYearMonthPopupClassNames(props.picker, classNames)
  const resolvedLocale = resolveYearMonthLocale(props.picker, props.locale)
  const resolvedCellRender = resolveYearMonthCellRender(
    props.picker,
    props.cellRender as PickerCellRender
  )

  const segmentCn = (segmentDisabled: boolean, filled: boolean) =>
    joinClassNames(
      'cms-datepicker__segment',
      'cms-field__box',
      segmentDisabled && 'cms-datepicker__segment--disabled',
      segmentDisabled && 'cms-field__box--disabled',
      isError && 'cms-field__box--error',
      filled && 'cms-field__box--filled'
    )

  const renderPrefix = () =>
    prefix ?? (
      <AdminPickerPrefixIcon>
        <FieldCalendarIcon className="cms-datepicker__calendar-icon" />
      </AdminPickerPrefixIcon>
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
          prevIcon={PANEL_PREV_ICON}
          nextIcon={PANEL_NEXT_ICON}
          inputReadOnly={inputReadOnly ?? true}
          showNow={false}
          value={start}
          onChange={handleStartChange}
          allowClear={resolvedAllowClear}
          disabled={disabledStart}
          placeholder={placeholderTuple[0]}
          id={startId}
          defaultPickerValue={defaultStart}
          {...yearMonthNavIcons}
          {...sharedPickerProps}
          locale={resolvedLocale}
          cellRender={resolvedCellRender}
          classNames={resolvedClassNames}
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
          prevIcon={PANEL_PREV_ICON}
          nextIcon={PANEL_NEXT_ICON}
          inputReadOnly={inputReadOnly ?? true}
          showNow={false}
          value={end}
          onChange={handleEndChange}
          allowClear={resolvedAllowClear}
          disabled={disabledEnd}
          placeholder={placeholderTuple[1]}
          id={endId}
          defaultPickerValue={defaultEnd}
          {...yearMonthNavIcons}
          {...sharedPickerProps}
          locale={resolvedLocale}
          cellRender={resolvedCellRender}
          classNames={resolvedClassNames}
          getPopupContainer={resolvedPopupContainer}
        />
      </span>
    </span>
  )

  if (!framed) return range

  return (
    <AdminFieldFrame
      size={inputSize}
      label={label}
      required={required}
      message={resolvedMessage}
      isError={isError}
      className={joinClassNames(
        'cms-datepicker-field',
        'cms-datepicker-field--range',
        hasExplicitWidth && 'cms-field--explicit-width',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      {range}
    </AdminFieldFrame>
  )
}

export const AdminDateRangePicker: ForwardRefExoticComponent<
  AdminDateRangePickerProps & RefAttributes<AdminDatePickerRef>
> = forwardRef(AdminDateRangePickerRender)

AdminDateRangePicker.displayName = 'AdminDateRangePicker'
