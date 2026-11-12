import { useEffect, useState } from 'react'
import type { ImgHTMLAttributes } from 'react'

type FallbackImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  fallbackSrc: string
}

/** 원격 URL 로드 실패 시에만 번들 이미지로 교체한다. 교체 후에는 `srcSet`도 버려 대체 이미지가 보이게 한다. */
export function FallbackImage({ src, fallbackSrc, srcSet, onError, ...rest }: FallbackImageProps) {
  const [current, setCurrent] = useState(src)

  useEffect(() => {
    setCurrent(src)
  }, [src])

  return (
    <img
      {...rest}
      src={current}
      srcSet={current === src ? srcSet : undefined}
      onError={event => {
        onError?.(event)
        if (current !== fallbackSrc) setCurrent(fallbackSrc)
      }}
    />
  )
}
