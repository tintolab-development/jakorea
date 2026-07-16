/**
 * 댓글 전송 아이콘 (30×30)
 */

import { useId } from 'react'

export function CommentSendIcon({ active }: { active?: boolean }) {
  const maskId = useId().replace(/:/g, '')
  if (active) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
        <mask id={maskId} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path d="M4.375 24.0625V17.0913L13.0288 15L4.375 12.9088V5.9375L25.8894 15L4.375 24.0625Z" fill="#01A1AF" />
        </g>
      </svg>
    )
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <g opacity="0.5">
        <mask id={maskId} style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
          <rect width="30" height="30" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M4.375 24.0625V5.9375L25.8894 15L4.375 24.0625ZM6.25 21.25L21.0625 15L6.25 8.75V13.3653L13.0288 15L6.25 16.6347V21.25Z"
            fill="#3D3D3D"
          />
        </g>
      </g>
    </svg>
  )
}
