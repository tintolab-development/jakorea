/** 모달 닫기(X) 아이콘 — 민트 헤더는 `tone="white"` */

import type { ImgHTMLAttributes } from 'react'
import closeBlackUrl from '@/shared/assets/icons/close-black.svg'
import closeWhiteUrl from '@/shared/assets/icons/close-white.svg'

export type ModalCloseIconProps = ImgHTMLAttributes<HTMLImageElement> & {
  tone?: 'black' | 'white'
}

export function ModalCloseIcon({ tone = 'black', ...props }: ModalCloseIconProps) {
  return (
    <img
      src={tone === 'white' ? closeWhiteUrl : closeBlackUrl}
      width={28}
      height={28}
      alt=""
      aria-hidden
      {...props}
    />
  )
}
