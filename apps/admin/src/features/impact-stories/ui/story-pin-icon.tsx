import { useId } from 'react'

type Props = {
  className?: string
  size?: number
  'aria-hidden'?: boolean
}

/** 상단 고정 pin 아이콘 — 공지 NoticePinnedIcon 과 동일 SVG */
export function StoryPinnedIcon({
  className,
  size = 20,
  'aria-hidden': ariaHidden = true,
}: Props) {
  const rawId = useId().replace(/:/g, '')
  const maskId = `story-pinned-mask-${rawId}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden={ariaHidden}
    >
      <mask
        id={maskId}
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <rect width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M11.8178 8.21439L13.9256 8.21439L14.8095 9.09828L12.1351 11.7726L15.3761 15.0135V15.8974H14.4922L11.2513 12.6565L8.57693 15.3308L7.69304 14.4469L7.69304 12.3392L3.44363 8.08977L2.85437 8.67902L1.97049 7.79514L7.27379 2.49184L8.15767 3.37572L7.56842 3.96498L11.8178 8.21439Z"
          fill="#01A1AF"
        />
      </g>
    </svg>
  )
}
