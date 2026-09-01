/**
 * 게시 기간 — 단일 트리거 인풋 (CmsDatePicker 크롬) + Range 패널
 * 시작·종료를 한 필드로 선택 (시안: 「게시 기간을 선택하세요」)
 * 시작·종료가 모두 선택되면 패널을 닫는다 (클릭 투과로 즉시 재오픈 방지).
 */

import { useRef, useState, type CSSProperties } from 'react'
import { CalendarOutlined } from '@ant-design/icons'
import { DatePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import { CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX } from '@/shared/constants/modal-z-index'
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

/** 모달·테이블 행 위로 뜨도록 body 포탈 (CmsDatePicker와 동일) */
const periodDatePickerPopupContainer = () => document.body

/** 종료일 클릭이 트리거로 투과되며 바로 다시 열리는 것 방지 */
const REOPEN_GUARD_MS = 250

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
  const [open, setOpen] = useState(false)
  /** 패널이 열린 동안의 선택 초안 (controlled value와 충돌 방지) */
  const [draft, setDraft] = useState<CmsPeriodDatePickerValue | null>(null)
  const reopenGuardRef = useRef(false)
  const reopenGuardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = value?.[0] ?? null
  const end = value?.[1] ?? null
  const hasValue = Boolean(start && end)
  const displayText = hasValue
    ? `${formatAppDatepickerRangePlain(start)} ~ ${formatAppDatepickerRangePlain(end)}`
    : ''

  const pickerValue: CmsPeriodDatePickerValue | null = open
    ? (draft ?? (hasValue ? [start!, end!] : null))
    : hasValue
      ? [start!, end!]
      : null

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

  const armReopenGuard = () => {
    reopenGuardRef.current = true
    if (reopenGuardTimerRef.current) clearTimeout(reopenGuardTimerRef.current)
    reopenGuardTimerRef.current = setTimeout(() => {
      reopenGuardRef.current = false
      reopenGuardTimerRef.current = null
    }, REOPEN_GUARD_MS)
  }

  const closePanel = () => {
    armReopenGuard()
    setOpen(false)
    setDraft(null)
  }

  const openPanel = () => {
    if (disabled || reopenGuardRef.current) return
    setDraft(hasValue ? [start!, end!] : [null, null])
    setOpen(true)
  }

  return (
    <span
      className={wrapperCn}
      style={widthStyle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={hasValue ? displayText : placeholder}
      onClick={() => {
        if (open) return
        openPanel()
      }}
      onKeyDown={event => {
        if (disabled) return
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (!open) openPanel()
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
        popupClassName="cms-period-datepicker-dropdown"
        open={open}
        onOpenChange={next => {
          if (disabled) return
          if (next) {
            if (reopenGuardRef.current) return
            setDraft(hasValue ? [start!, end!] : [null, null])
            setOpen(true)
            return
          }
          setOpen(false)
          setDraft(null)
        }}
        value={pickerValue}
        onCalendarChange={dates => {
          const next: CmsPeriodDatePickerValue = [dates?.[0] ?? null, dates?.[1] ?? null]
          setDraft(next)
          if (next[0] && next[1]) {
            onChange?.(next)
            // 같은 클릭이 트리거/onOpenChange(true)로 다시 열리지 않도록 다음 틱에 닫기
            window.setTimeout(() => {
              closePanel()
            }, 0)
          }
        }}
        onChange={dates => {
          if (!dates || !dates[0] || !dates[1]) {
            onChange?.(null)
            setDraft(null)
            return
          }
          onChange?.([dates[0], dates[1]])
          closePanel()
        }}
        allowClear={allowClear}
        disabled={disabled}
        inputReadOnly
        getPopupContainer={periodDatePickerPopupContainer}
        styles={{
          popup: {
            root: { zIndex: CMS_DATE_TIME_PICKER_DEFAULT_Z_INDEX },
          },
        }}
      />
    </span>
  )
}
