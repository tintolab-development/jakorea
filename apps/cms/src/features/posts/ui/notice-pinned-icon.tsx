import pinUrl from '@/shared/assets/icons/posts/pin.svg'

type NoticePinnedIconProps = {
  className?: string
  /** 기본 20×20 */
  size?: number
  'aria-hidden'?: boolean
}

/**
 * 공지 상단 고정 표시 아이콘 — 시안 `Icon / Etc / Basic` pin 원본(20)
 */
export function NoticePinnedIcon({
  className,
  size = 20,
  'aria-hidden': ariaHidden = true,
}: NoticePinnedIconProps) {
  return (
    <img
      src={pinUrl}
      width={size}
      height={size}
      alt=""
      className={className}
      aria-hidden={ariaHidden}
      draggable={false}
    />
  )
}
