/**
 * 프로필 사진 플레이스홀더 아이콘 (48×48)
 * 게시글 카드·게시글 상세·댓글 영역 등에서 사용
 */

import { useId } from 'react'

export function ProfileAvatarIcon({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const clipId = `profile-avatar-clip-${id}`
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <rect width="48" height="48" rx="24" fill="#CECECE" />
        <circle opacity="0.7" cx="24" cy="19.5" r="9" fill="white" />
        <circle opacity="0.7" cx="24" cy="48" r="18" fill="white" />
      </g>
      <rect
        x="0.5"
        y="0.5"
        width="47"
        height="47"
        rx="23.5"
        stroke="#3D3D3D"
        strokeOpacity="0.1"
      />
      <defs>
        <clipPath id={clipId}>
          <rect width="48" height="48" rx="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
