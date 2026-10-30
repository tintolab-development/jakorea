import type { ImgHTMLAttributes } from 'react'
import closeBlackUrl from './assets/close-black.svg'
import closeWhiteUrl from './assets/close-white.svg'

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
