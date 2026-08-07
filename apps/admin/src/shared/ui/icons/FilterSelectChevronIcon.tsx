import type { SVGProps } from 'react'

/** 필터·멀티셀렉트 드롭다운 화살표 (시안 SVG) */
export function FilterSelectChevronIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={12}
      height={7}
      viewBox="0 0 12 7"
      fill="none"
      aria-hidden
      {...props}
    >
      <path
        d="M5.28071 6.1472C5.52331 6.30741 5.85327 6.28022 6.06685 6.06664L11.0668 1.06664C11.3109 0.822558 11.3109 0.426924 11.0668 0.182846C10.8228 -0.0612316 10.4271 -0.0612316 10.1831 0.182846L5.62495 4.74095L1.06685 0.182846C0.82277 -0.0612316 0.427136 -0.0612316 0.183058 0.182846C-0.0610194 0.426924 -0.0610194 0.822558 0.183058 1.06664L5.18306 6.06664L5.28071 6.1472Z"
        fill="#85969D"
      />
    </svg>
  )
}
