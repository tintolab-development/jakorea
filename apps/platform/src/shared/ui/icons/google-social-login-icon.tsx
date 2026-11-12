import { useId, type SVGProps } from 'react'
import googleSocialLoginImageUrl from './google-social-login.png'

export type GoogleSocialLoginIconProps = SVGProps<SVGSVGElement>

/** 시안 원본이 래스터 이미지라 PNG를 원형으로 잘라 그린다(모서리 흰 배경이 바탕색 위에 드러나지 않게). */
export function GoogleSocialLoginIcon(props: GoogleSocialLoginIconProps) {
  const clipId = useId()
  return (
    <svg
      width="54"
      height="54"
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      {...props}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="27" cy="27" r="27" />
        </clipPath>
      </defs>
      <image
        href={googleSocialLoginImageUrl}
        width="54"
        height="54"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  )
}
