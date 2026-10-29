import { forwardRef } from 'react'
import {
  AdminDatePicker,
  AdminDateRangePicker,
  type AdminDatePickerProps,
  type AdminDatePickerRef,
  type AdminDateRangePickerProps,
} from '@jakorea/admin-ui/date'
import type { CmsControlSize } from './cms-control-size'
import {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
} from './app-datepicker'

export type CmsDatePickerRef = AdminDatePickerRef
export type CmsDatePickerProps = Omit<AdminDatePickerProps, 'inputSize'> & {
  inputSize?: CmsControlSize
}
export type CmsDateRangePickerProps = Omit<AdminDateRangePickerProps, 'inputSize'> & {
  inputSize?: CmsControlSize
}

export { DEFAULT_APP_DATE_PLACEHOLDER, formatAppDatepickerDisplay, formatAppDatepickerRangePlain }

function mapSize(size?: CmsControlSize): AdminDatePickerProps['inputSize'] {
  if (size === 'small') return 'compact'
  return size ?? 'large'
}

export const CmsDatePicker = forwardRef<CmsDatePickerRef, CmsDatePickerProps>((props, ref) => {
  const { inputSize, format, ...rest } = props
  return (
    <AdminDatePicker
      {...rest}
      ref={ref as never}
      inputSize={mapSize(inputSize)}
      format={format ?? formatAppDatepickerDisplay}
    />
  )
})
CmsDatePicker.displayName = 'CmsDatePicker'

export const CmsDateRangePicker = forwardRef<CmsDatePickerRef, CmsDateRangePickerProps>(
  (props, ref) => {
    const { inputSize, format, oneMonthEndMode, ...rest } = props
    return (
      <AdminDateRangePicker
        {...rest}
        ref={ref as never}
        inputSize={mapSize(inputSize)}
        format={format ?? formatAppDatepickerRangePlain}
        oneMonthEndMode={oneMonthEndMode ?? 'inclusive-month'}
      />
    )
  }
)
CmsDateRangePicker.displayName = 'CmsDateRangePicker'
