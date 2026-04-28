import type { CSSProperties } from 'react'
import { ClockCircleOutlined } from '@ant-design/icons'
import { TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import '@/shared/ui/cms-datepicker.css'

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export interface ParagraphTimePickerProps {
  value?: Dayjs | null
  onChange?: (next: Dayjs | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  style?: CSSProperties
  width?: number | string
}

const popupContainer = () => document.body

/** 단락·폼 에디터 공용 시간 선택 (antd TimePicker + CMS DatePicker 치수·크롬) */
export function ParagraphTimePicker({
  value = null,
  onChange,
  placeholder = '시간 선택',
  disabled,
  className,
  style,
  width,
}: ParagraphTimePickerProps) {
  const hasExplicitWidth = width != null
  const widthStyle: CSSProperties | undefined =
    width != null
      ? { width: typeof width === 'number' ? `${width}px` : width }
      : undefined

  return (
    <span
      className={cn(
        'cms-datepicker',
        'cms-datepicker--large',
        hasExplicitWidth && 'cms-datepicker--explicit-width',
        disabled && 'cms-datepicker--disabled',
        className
      )}
      style={{ ...widthStyle, ...style }}
    >
      <TimePicker
        variant="borderless"
        className="cms-datepicker__picker"
        value={value}
        onChange={v => onChange?.(v)}
        placeholder={placeholder}
        prefix={<ClockCircleOutlined className="cms-datepicker__calendar-icon" aria-hidden />}
        suffixIcon={null}
        inputReadOnly
        disabled={disabled}
        format="HH:mm"
        minuteStep={1}
        getPopupContainer={popupContainer}
      />
    </span>
  )
}
