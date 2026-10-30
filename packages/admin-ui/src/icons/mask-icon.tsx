import type { CSSProperties, HTMLAttributes } from 'react'
import './mask-icon.css'

export type MaskIconProps = HTMLAttributes<HTMLSpanElement>

type MaskIconSourceProps = MaskIconProps & {
  src: string
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
