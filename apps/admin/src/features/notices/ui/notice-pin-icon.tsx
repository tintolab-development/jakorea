import { useId } from 'react'

type NoticePinnedIconProps = {
  className?: string
  /** 기본 20×20 (CMS 공지 시안과 동일) */
  size?: number
  'aria-hidden'?: boolean
}

/**
 * 공지 상단 고정 표시 아이콘 — 시안 `Icon / Etc / Basic` pin 원본(20)
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
          d="M11.6723 8.06819C11.766 8.16196 11.8932 8.21464 12.0258 8.21464L13.7194 8.21464C13.852 8.21464 13.9792 8.26732 14.0729 8.36108L14.4568 8.74497C14.6521 8.94023 14.6521 9.25681 14.4568 9.45207L12.4896 11.4193C12.2943 11.6146 12.2943 11.9311 12.4896 12.1264L15.2305 14.8673C15.3243 14.9611 15.3769 15.0883 15.3769 15.2209L15.3769 15.3976C15.3769 15.6738 15.1531 15.8976 14.8769 15.8976L14.7002 15.8976C14.5676 15.8976 14.4404 15.845 14.3466 15.7512L11.6057 13.0103C11.4104 12.815 11.0939 12.815 10.8986 13.0103L8.93137 14.9775C8.7361 15.1728 8.41952 15.1728 8.22426 14.9775L7.84038 14.5936C7.74661 14.4999 7.69393 14.3727 7.69393 14.2401L7.69393 12.5465C7.69393 12.4139 7.64125 12.2867 7.54748 12.193L3.73914 8.38464C3.57642 8.22192 3.3126 8.22192 3.14988 8.38464C2.98717 8.54736 2.72335 8.54736 2.56063 8.38464L2.32493 8.14893C2.12966 7.95367 2.12966 7.63709 2.32493 7.44183L6.92112 2.84563C7.11638 2.65037 7.43296 2.65037 7.62823 2.84563L7.86393 3.08134C8.02665 3.24405 8.02665 3.50787 7.86393 3.67059C7.70121 3.83331 7.70121 4.09713 7.86393 4.25985L11.6723 8.06819Z"
          fill="#00A0AF"
        />
      </g>
    </svg>
  )
}

/** @deprecated `NoticePinnedIcon` 사용 */
export function NoticePinIcon(props: NoticePinnedIconProps) {
  return <NoticePinnedIcon {...props} />
}
