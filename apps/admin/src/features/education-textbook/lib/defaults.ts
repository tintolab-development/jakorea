export const DEFAULT_TEXTBOOK_AUTHOR = '홍길동'

/** 시안용 기본 썸네일 (세로 226×320 비율 SVG) */
export const DEFAULT_TEXTBOOK_THUMBNAIL =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="226" height="320" viewBox="0 0 226 320">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0CBDCC"/>
          <stop offset="100%" stop-color="#46B17B"/>
        </linearGradient>
      </defs>
      <rect width="226" height="320" fill="url(#g)"/>
      <text x="113" y="168" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="16">Textbook</text>
    </svg>`,
  )
