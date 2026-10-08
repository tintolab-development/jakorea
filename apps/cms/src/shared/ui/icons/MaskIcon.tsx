/**
 * svg 파일을 CSS mask로 그리는 아이콘 — 모양은 svg 파일, 색은 currentColor.
 * 상태·variant별로 색만 다른 원본(svg 여러 벌)을 파일 하나로 대체할 때 쓴다.
 */

import type { CSSProperties, HTMLAttributes } from 'react'
import './mask-icon.css'

export type MaskIconProps = HTMLAttributes<HTMLSpanElement>

type MaskIconSourceProps = MaskIconProps & {
  src: string
  /** svg 프레임이 표시 박스보다 타이트할 때 글리프 비율 (`mask-size`) */
  maskSize?: string
}

export function MaskIcon({ src, maskSize, className, style, ...props }: MaskIconSourceProps) {
  const maskStyle = {
    '--cms-mask-icon-src': `url("${src}")`,
    ...(maskSize ? { '--cms-mask-icon-size': maskSize } : null),
    ...style,
  } as CSSProperties

  return (
    <span
      aria-hidden
      className={className ? `cms-mask-icon ${className}` : 'cms-mask-icon'}
      style={maskStyle}
      {...props}
    />
  )
}
