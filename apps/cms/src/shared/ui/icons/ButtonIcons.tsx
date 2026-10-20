/**
 * CmsButton 전용 아이콘 — 원본 `shared/assets/icons/buttons/*.svg`.
 * mask로 그려 색은 currentColor(버튼 variant·disabled 글자색)를 따른다.
 * 글리프만 담긴 원본(add·copy·delete)은 Figma 24 프레임 대비 비율로 `maskSize`를 지정해 여백을 유지한다.
 */

import addUrl from '@/shared/assets/icons/buttons/add-mint.svg'
import calendarUrl from '@/shared/assets/icons/buttons/calendar-mint.svg'
import checkUrl from '@/shared/assets/icons/buttons/check-mint.svg'
import clockUrl from '@/shared/assets/icons/inputs/clock-mint.svg'
import copyUrl from '@/shared/assets/icons/buttons/copy-mint.svg'
import deleteUrl from '@/shared/assets/icons/buttons/delete-mint.svg'
import downloadUrl from '@/shared/assets/icons/buttons/download-white.svg'
import listUrl from '@/shared/assets/icons/buttons/list-mint.svg'
import { MaskIcon, type MaskIconProps } from './MaskIcon'

export type ButtonIconProps = MaskIconProps

/** 24 프레임 — 13×13 글리프 중앙 */
export function ButtonAddIcon(props: ButtonIconProps) {
  return <MaskIcon src={addUrl} maskSize="54.167%" {...props} />
}

/** 24 프레임 — 16×19 글리프 중앙 */
export function ButtonCopyIcon(props: ButtonIconProps) {
  return <MaskIcon src={copyUrl} maskSize="66.667% 79.167%" {...props} />
}

/** 24 프레임 — 15×17 글리프 중앙 */
export function ButtonDeleteIcon(props: ButtonIconProps) {
  return <MaskIcon src={deleteUrl} maskSize="62.5% 70.833%" {...props} />
}

/** 20 프레임 — 글자 높이에 맞는 체크 글리프 */
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
