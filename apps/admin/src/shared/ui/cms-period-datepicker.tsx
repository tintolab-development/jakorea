/**
 * 게시 기간 — 단일 트리거 인풋 (CmsDatePicker 크롬) + Range 패널
 * 시작·종료를 한 필드로 선택 (시안: 「게시 기간을 선택하세요」)
 */

import { useRef, useState, type CSSProperties } from 'react'
import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import type { CmsControlSize } from './cms-control-size'
import { formatAppDatepickerRangePlain } from './app-datepicker'
import './cms-datepicker.css'
import './cms-period-datepicker.css'

export type CmsPeriodDatePickerValue = [Dayjs | null, Dayjs | null]

export type CmsPeriodDatePickerProps = {
  value?: CmsPeriodDatePickerValue | null
  onChange?: (next: CmsPeriodDatePickerValue | null) => void
  placeholder?: string
  inputSize?: CmsControlSize
  width?: number | string
  disabled?: boolean
  className?: string
  allowClear?: boolean
}

export function CmsPeriodDatePicker({
  value,
  onChange,
  placeholder = '게시 기간을 선택하세요',
  inputSize = 'large',
  width = '100%',
  disabled = false,
  className,
  allowClear = true,
}: CmsPeriodDatePickerProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  const start = value?.[0] ?? null
  const end = value?.[1] ?? null
  const hasValue = Boolean(start && end)
  const displayText = hasValue
    ? `${formatAppDatepickerRangePlain(start)} ~ ${formatAppDatepickerRangePlain(end)}`
    : ''

  const widthStyle: CSSProperties | undefined =
    width != null
      ? { width: typeof width === 'number' ? `${width}px` : width }
      : undefined

  const wrapperCn = [
    'cms-datepicker',
    'cms-period-datepicker',
    `cms-datepicker--${inputSize}`,
    width != null && 'cms-datepicker--explicit-width',
    disabled && 'cms-datepicker--disabled',
    open && 'cms-period-datepicker--open',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      ref={rootRef}
      className={wrapperCn}
      style={widthStyle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={hasValue ? displayText : placeholder}
      onClick={() => {
        if (disabled) return
        setOpen(true)
      }}
      onKeyDown={event => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setOpen(true)
        }
      }}
    >
      <CalendarOutlined className="cms-datepicker__calendar-icon" aria-hidden />
      <span
        className={[
          'cms-period-datepicker__text',
          !hasValue && 'cms-period-datepicker__text--placeholder',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {hasValue ? displayText : placeholder}
      </span>

      <DatePicker.RangePicker
        className="cms-period-datepicker__hidden-picker"
        open={open}
        onOpenChange={next => {
          if (disabled) return
          setOpen(next)
        }}
        value={hasValue ? [start!, end!] : null}
        onChange={dates => {
          if (!dates || !dates[0] || !dates[1]) {
            onChange?.(null)
            return
          }
          onChange?.([dates[0], dates[1]])
        }}
        allowClear={allowClear}
        disabled={disabled}
        inputReadOnly
        getPopupContainer={() => rootRef.current ?? document.body}
      />
    </span>
  )
}
