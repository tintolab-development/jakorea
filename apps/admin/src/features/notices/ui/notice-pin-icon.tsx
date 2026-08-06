import { useId } from 'react'

type NoticePinnedIconProps = {
  className?: string
  /** 기본 20×20 (CMS 공지 시안과 동일) */
  size?: number
  'aria-hidden'?: boolean
}

/**
 * 공지 상단 고정 표시 아이콘 — CMS `NoticePinnedIcon` SVG 이식
 * @see apps/cms/src/features/posts/ui/notice-pinned-icon.tsx
 */
export function NoticePinnedIcon({
  className,
  size = 20,
  'aria-hidden': ariaHidden = true,
}: NoticePinnedIconProps) {
  const rawId = useId().replace(/:/g, '')
  const maskId = `notice-pinned-mask-${rawId}`

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

/** @deprecated `NoticePinnedIcon` 사용 */
export function NoticePinIcon(props: NoticePinnedIconProps) {
  return <NoticePinnedIcon {...props} />
}
