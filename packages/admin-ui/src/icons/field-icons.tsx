import calendarUrl from './assets/calendar-default.svg'
import chevronDownUrl from './assets/chevron-down-default.svg'
import deleteUrl from './assets/delete-default.svg'
import searchUrl from './assets/search-focus.svg'
import timeUrl from './assets/time-default.svg'
import { MaskIcon, type MaskIconProps } from './mask-icon.js'

export type FieldIconProps = MaskIconProps

export function FieldSearchIcon(props: FieldIconProps) {
  return <MaskIcon src={searchUrl} {...props} />
}

export function FieldDeleteIcon(props: FieldIconProps) {
  return <MaskIcon src={deleteUrl} {...props} />
}

export function FieldChevronDownIcon(props: FieldIconProps) {
  return <MaskIcon src={chevronDownUrl} {...props} />
}

export function FieldCalendarIcon(props: FieldIconProps) {
  return <MaskIcon src={calendarUrl} {...props} />
}

export function FieldClockIcon(props: FieldIconProps) {
  return <MaskIcon src={timeUrl} {...props} />
}
