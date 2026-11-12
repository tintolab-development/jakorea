/**
 * GNB 아이콘 — 원본 `shared/assets/icons/gnb/*.svg` (Figma `Icon / Etc / Toggle` alarm, 20 프레임).
 * mask로 그려 색은 currentColor를 따른다.
 */

import alarmOffUrl from '@/shared/assets/icons/gnb/alarm-off.svg'
import alarmOnUrl from '@/shared/assets/icons/gnb/alarm-on.svg'
import { MaskIcon, type MaskIconProps } from './MaskIcon'

export type GnbAlarmIconProps = MaskIconProps & {
  /** 안 읽은 알림이 있으면 채운 종(status=on), 없으면 선 종(status=off) */
  active?: boolean
}

export function GnbAlarmIcon({ active = false, ...props }: GnbAlarmIconProps) {
  return <MaskIcon src={active ? alarmOnUrl : alarmOffUrl} {...props} />
}
