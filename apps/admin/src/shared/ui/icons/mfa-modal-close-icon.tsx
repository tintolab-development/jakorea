/** MFA 모달 닫기(X) 아이콘 */

import type { SVGProps } from 'react'

export type MfaModalCloseIconProps = SVGProps<SVGSVGElement>

export function MfaModalCloseIcon(props: MfaModalCloseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      {...props}
    >
      <g>
        <path
          d="M18 6L6 18"
          stroke="#3D3D3D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6 6L18 18"
          stroke="#3D3D3D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}
