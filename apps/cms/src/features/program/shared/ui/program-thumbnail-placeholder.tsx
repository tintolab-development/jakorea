import { useId } from 'react'

/**
 * 프로그램 썸네일 미업로드 시 기본 이미지 (등록·모집 상세 정보 공통)
 */
export function ProgramThumbnailPlaceholder({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  const clipId = `program-thumb-clip-${id}`
  const maskId = `program-thumb-mask-${id}`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="86"
      height="86"
      viewBox="0 0 86 86"
      fill="none"
      className={className}
      aria-hidden
    >
      <g clipPath={`url(#${clipId})`}>
        <rect width="86" height="86" rx="8" fill="white" />
        <mask
          id={maskId}
          style={{ maskType: 'alpha' }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="86"
          height="86"
        >
          <rect width="86" height="86" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M62.2606 61.1848H23.8293C23.3217 61.1848 22.941 60.9459 22.6872 60.4681C22.4333 59.9903 22.4856 59.5125 22.8439 59.0348L30.5481 49.0014C30.8467 48.6431 31.205 48.4639 31.6231 48.4639C32.0412 48.4639 32.3995 48.6431 32.6981 49.0014L39.9543 58.9452L50.7043 45.0598C51.003 44.7014 51.3613 44.5223 51.7793 44.5223C52.1974 44.5223 52.5557 44.7014 52.8543 45.0598L63.3356 59.0348C63.6342 59.5125 63.6566 59.9903 63.4028 60.4681C63.149 60.9459 62.7682 61.1848 62.2606 61.1848Z"
            fill="#E0E0E0"
          />
          <path
            d="M34.9377 30.4469C34.9377 31.6939 34.5047 32.754 33.6387 33.6271C32.7728 34.5003 31.7163 34.9368 30.4693 34.9368C29.2223 34.9368 28.1622 34.5039 27.2891 33.6379C26.4159 32.7719 25.9793 31.7154 25.9793 30.4684C25.9793 29.2214 26.4123 28.1614 27.2783 27.2882C28.1443 26.4151 29.2008 25.9785 30.4478 25.9785C31.6948 25.9785 32.7548 26.4115 33.628 27.2775C34.5011 28.1434 34.9377 29.1999 34.9377 30.4469Z"
            fill="#E0E0E0"
          />
        </g>
      </g>
      <rect x="0.5" y="0.5" width="85" height="85" rx="7.5" stroke="#E0E0E0" />
      <defs>
        <clipPath id={clipId}>
          <rect width="86" height="86" rx="8" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
}
