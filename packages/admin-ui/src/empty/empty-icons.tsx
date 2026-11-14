/**
 * 표 빈 화면 그림 — 시안 `Icon / Etc / Error / Empty` 80 원본(12230:51132 no data · 12230:51131 no result).
 * 연한 민트 원 배경까지 원본 그대로 인라인으로 그린다(이미지 파일 캐시로 예전 그림이 남는 문제 방지).
 */

const SVG_PROPS = {
  width: 80,
  height: 80,
  viewBox: '0 0 80 80',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: false,
} as const

const MINT = '#00A0AF'

export function AdminEmptyNoDataIcon() {
  return (
    <svg {...SVG_PROPS}>
      <rect width="80" height="80" rx="40" fill={MINT} fillOpacity="0.08" />
      <path
        d="M43 25H31C30.2044 25 29.4413 25.3161 28.8787 25.8787C28.3161 26.4413 28 27.2044 28 28V52C28 52.7956 28.3161 53.5587 28.8787 54.1213C29.4413 54.6839 30.2044 55 31 55H38"
        stroke={MINT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43 25L52 34V38"
        stroke={MINT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43 25V34H52"
        stroke={MINT}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M33 35H38M33 41H41" stroke={MINT} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M48 53C50.7614 53 53 50.7614 53 48C53 45.2386 50.7614 43 48 43C45.2386 43 43 45.2386 43 48C43 50.7614 45.2386 53 48 53Z"
        stroke={MINT}
        strokeWidth="2"
      />
      <path d="M51.5 51.5L55 55" stroke={MINT} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function AdminEmptyNoSearchIcon() {
  return (
    <svg {...SVG_PROPS}>
      <rect width="80" height="80" rx="40" fill={MINT} fillOpacity="0.08" />
      <path
        d="M38 49C44.0751 49 49 44.0751 49 38C49 31.9249 44.0751 27 38 27C31.9249 27 27 31.9249 27 38C27 44.0751 31.9249 49 38 49Z"
        stroke={MINT}
        strokeWidth="2"
      />
      <path d="M46.5 46.5L54 54" stroke={MINT} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M34.5 34.5L41.5 41.5M41.5 34.5L34.5 41.5"
        stroke={MINT}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
