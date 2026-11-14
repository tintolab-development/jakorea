/**
 * 이전/다음 꺾쇠 — Figma `Icon / Button / w20` left·right 원본(20 프레임).
 * 날짜 선택 패널·달력의 월 이동 버튼에 쓴다. 색은 currentColor.
 */

import backwardUrl from './assets/chevron-backward-default.svg'
import forwardUrl from './assets/chevron-forward-default.svg'
import { MaskIcon, type MaskIconProps } from './mask-icon.js'

export function NavPrevIcon(props: MaskIconProps) {
  return <MaskIcon src={backwardUrl} {...props} />
}

export function NavNextIcon(props: MaskIconProps) {
  return <MaskIcon src={forwardUrl} {...props} />
}
