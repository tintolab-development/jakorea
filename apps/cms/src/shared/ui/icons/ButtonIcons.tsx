/**
 * CmsButton 전용 아이콘 — 원본 `shared/assets/icons/buttons/*.svg`.
 * mask로 그려 색은 currentColor(버튼 variant·disabled 글자색)를 따른다.
 * 원본은 Figma `Icon / Button` 프레임(24·20) 그대로 — 여백 포함.
 */

import addUrl from '@/shared/assets/icons/buttons/add.svg'
import calendarUrl from '@/shared/assets/icons/buttons/calendar-mint.svg'
import checkUrl from '@/shared/assets/icons/buttons/check.svg'
import clockUrl from '@/shared/assets/icons/inputs/clock-mint.svg'
import copyUrl from '@/shared/assets/icons/buttons/copy.svg'
import deleteUrl from '@/shared/assets/icons/buttons/delete.svg'
import downloadUrl from '@/shared/assets/icons/buttons/download-white.svg'
import leftUrl from '@/shared/assets/icons/buttons/left.svg'
import listUrl from '@/shared/assets/icons/buttons/list-mint.svg'
import rightUrl from '@/shared/assets/icons/buttons/right.svg'
import { MaskIcon, type MaskIconProps } from './MaskIcon'

export type ButtonIconProps = MaskIconProps

/** 24 프레임 */
export function ButtonAddIcon(props: ButtonIconProps) {
  return <MaskIcon src={addUrl} {...props} />
}

/** 24 프레임 */
export function ButtonCopyIcon(props: ButtonIconProps) {
  return <MaskIcon src={copyUrl} {...props} />
}

/** 24 프레임 */
export function ButtonDeleteIcon(props: ButtonIconProps) {
  return <MaskIcon src={deleteUrl} {...props} />
}

/** 20 프레임 */
export function ButtonCheckIcon(props: ButtonIconProps) {
  return <MaskIcon src={checkUrl} {...props} />
}

/** 20 프레임 */
export function ButtonDownloadIcon(props: ButtonIconProps) {
  return <MaskIcon src={downloadUrl} {...props} />
}

/** 20 프레임 */
export function ButtonCalendarIcon(props: ButtonIconProps) {
  return <MaskIcon src={calendarUrl} {...props} />
}

/** 20 프레임 */
export function ButtonClockIcon(props: ButtonIconProps) {
  return <MaskIcon src={clockUrl} {...props} />
}

/** 20 프레임 */
export function ButtonListIcon(props: ButtonIconProps) {
  return <MaskIcon src={listUrl} {...props} />
}

/** 20 프레임 — 이전(달력·페이지 이동) */
export function ButtonLeftIcon(props: ButtonIconProps) {
  return <MaskIcon src={leftUrl} {...props} />
}

/** 20 프레임 — 다음(달력·페이지 이동·경로 표시) */
export function ButtonRightIcon(props: ButtonIconProps) {
  return <MaskIcon src={rightUrl} {...props} />
}
