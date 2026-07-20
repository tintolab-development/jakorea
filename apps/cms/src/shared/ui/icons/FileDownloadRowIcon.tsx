/**
 * 첨부 목록 행용 다운로드 아이콘 (18×18, currentColor)
 */

import type { SVGProps } from 'react'

export interface FileDownloadRowIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

export function FileDownloadRowIcon({ size = 18, ...rest }: FileDownloadRowIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      {...rest}
    >
      <path
        d="M10 13.333L6.25 9.583L7.188 8.625L9.375 10.812V3.333H10.625V10.812L12.812 8.625L13.75 9.583L10 13.333ZM5 16.667C4.655 16.667 4.36 16.545 4.115 16.302C3.872 16.057 3.75 15.762 3.75 15.417V12.917H5V15.417H15V12.917H16.25V15.417C16.25 15.762 16.128 16.057 15.885 16.302C15.64 16.545 15.345 16.667 15 16.667H5Z"
        fill="currentColor"
      />
    </svg>
  )
}
