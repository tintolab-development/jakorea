/** 네이버 소셜 로그인 아이콘 (54×54) */

import type { SVGProps } from 'react'

export type NaverSocialLoginIconProps = SVGProps<SVGSVGElement>

export function NaverSocialLoginIcon(props: NaverSocialLoginIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="54"
      height="54"
      viewBox="0 0 54 54"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M0 27C0 12.0883 12.0883 0 27 0C41.9117 0 54 12.0883 54 27C54 41.9117 41.9117 54 27 54C12.0883 54 0 41.9117 0 27Z"
        fill="#03A94D"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30.5556 27.7111L23.1444 17H17V37H23.4444V26.3L30.8556 37H37V17H30.5556V27.7111Z"
        fill="white"
      />
    </svg>
  )
}
