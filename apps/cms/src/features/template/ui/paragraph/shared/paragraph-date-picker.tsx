import type { CSSProperties, ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import { CmsDatePicker, CmsDateRangePicker } from '@/shared/ui/cms-datepicker'

type ParagraphRangeValue = [Dayjs | null, Dayjs | null]

interface ParagraphDatePickerBaseProps {
  label?: ReactNode
  width?: number | string
  className?: string
  style?: CSSProperties
}

interface ParagraphDatePickerRangeProps extends ParagraphDatePickerBaseProps {
  mode: 'range'
  value: ParagraphRangeValue
  onChange: (next: ParagraphRangeValue) => void
  placeholder?: [string, string]
}

interface ParagraphDatePickerSingleProps extends ParagraphDatePickerBaseProps {
  mode?: 'single'
  value: Dayjs | null
  onChange: (next: Dayjs | null) => void
  placeholder?: string
}

export type ParagraphDatePickerProps =
  | ParagraphDatePickerRangeProps
  | ParagraphDatePickerSingleProps

export function ParagraphDatePicker(props: ParagraphDatePickerProps) {
  const { label, className, style, width = '500px' } = props

  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}
    >
      {label != null ? <span className="fs-16 nowrap">{label}</span> : null}
      {props.mode === 'range' ? (
        <CmsDateRangePicker
          width={width}
          value={props.value}
          placeholder={props.placeholder}
          onChange={dates => props.onChange([dates?.[0] ?? null, dates?.[1] ?? null])}
        />
      ) : (
        <CmsDatePicker
          width={width}
          value={props.value}
          placeholder={props.placeholder}
          onChange={date => props.onChange(date ?? null)}
        />
      )}
    </div>
  )
}
