/**
 * 입력 컴포넌트 아이콘 — 원본 `shared/assets/icons/inputs/{type}-{default|focus|disabled}.svg` (22 프레임).
 * 상태별 원본은 색만 달라 파일 하나를 mask로 쓰고, 상태 색은 `cms-field.css`에서 지정한다.
 */

import calendarUrl from '@/shared/assets/icons/inputs/calendar-default.svg'
import chevronDownUrl from '@/shared/assets/icons/inputs/chevron-down-default.svg'
import deleteUrl from '@/shared/assets/icons/inputs/delete-default.svg'
import searchUrl from '@/shared/assets/icons/inputs/search-focus.svg'
import timeUrl from '@/shared/assets/icons/inputs/time-default.svg'
import { MaskIcon, type MaskIconProps } from './MaskIcon'

export type FieldIconProps = MaskIconProps

/** search-default는 글리프가 작게 export되어 focus·disabled 원본으로 통일 */
export function FieldSearchIcon(props: FieldIconProps) {
  return <MaskIcon src={searchUrl} {...props} />
}

export function FieldCalendarIcon(props: FieldIconProps) {
  return <MaskIcon src={calendarUrl} {...props} />
}

export function FieldClockIcon(props: FieldIconProps) {
  return <MaskIcon src={timeUrl} {...props} />
}

/** 값 삭제(X) */
export function FieldDeleteIcon(props: FieldIconProps) {
  return <MaskIcon src={deleteUrl} {...props} />
}

/** 셀렉트 화살표 (열림 시 CSS로 회전) */
export function FieldChevronDownIcon(props: FieldIconProps) {
  return <MaskIcon src={chevronDownUrl} {...props} />
}
