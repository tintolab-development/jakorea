import { forwardRef } from 'react'
import {
  AdminDatePicker,
  AdminDateRangePicker,
  AdminPickerPrefixIcon,
  adminDatePickerPopupContainer,
  resolveAdminPickerAllowClear,
  type AdminDatePickerProps,
  type AdminDatePickerRef,
  type AdminDateRangePickerProps,
} from '@jakorea/admin-ui/date'
import {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDateTimeDisplay,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
} from './app-datepicker'
import { CMS_DATE_PICKER_LOCALE } from './cms-datepicker-locale'

export type CmsDatePickerRef = AdminDatePickerRef
export type CmsDatePickerProps = AdminDatePickerProps
export type CmsDateRangePickerProps = AdminDateRangePickerProps

export {
  DEFAULT_APP_DATE_PLACEHOLDER,
  formatAppDatepickerDateTimeDisplay,
  formatAppDatepickerDisplay,
  formatAppDatepickerRangePlain,
}

export const cmsDatePickerPopupContainer = adminDatePickerPopupContainer
export const CmsPickerPrefixIcon = AdminPickerPrefixIcon
export const resolveCmsPickerAllowClear = resolveAdminPickerAllowClear

export const CmsDatePicker = forwardRef<CmsDatePickerRef, CmsDatePickerProps>((props, ref) => {
  const format =
    props.format ??
    (props.showTime ? formatAppDatepickerDateTimeDisplay : formatAppDatepickerDisplay)
  return (
    <AdminDatePicker
      {...props}
      ref={ref as never}
      format={format}
      locale={props.locale ?? CMS_DATE_PICKER_LOCALE}
    />
  )
})
CmsDatePicker.displayName = 'CmsDatePicker'

export const CmsDateRangePicker = forwardRef<CmsDatePickerRef, CmsDateRangePickerProps>(
  (props, ref) => {
    return (
      <AdminDateRangePicker
        {...props}
        ref={ref as never}
        format={props.format ?? formatAppDatepickerRangePlain}
        locale={props.locale ?? CMS_DATE_PICKER_LOCALE}
      />
    )
  }
)
CmsDateRangePicker.displayName = 'CmsDateRangePicker'
