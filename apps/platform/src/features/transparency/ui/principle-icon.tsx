import type { TransparencyPrincipleIcon } from '../model/types'

type PrincipleIconProps = {
  icon: TransparencyPrincipleIcon
}

/**
 * 운영 원칙 아이콘 — 시안 커스텀 컬러 아이콘의 플레이스홀더.
 * 디자인 에셋 수급 시 image/icon/*.svg 로 교체한다.
 */
export function PrincipleIcon({ icon }: PrincipleIconProps) {
  switch (icon) {
    case 'audit':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="17" height="17" rx="3" fill="#285f74" />
          <rect x="27" y="4" width="17" height="17" rx="3" fill="#e3e24f" />
          <rect x="4" y="27" width="17" height="17" rx="3" fill="#01a1af" />
          <circle cx="35.5" cy="35.5" r="8.5" fill="#46b17b" />
          <path
            d="M31 12.5h7M34.5 9v7"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'governance':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="18" cy="20" r="11" stroke="#285f74" strokeWidth="5" />
          <circle cx="31" cy="28" r="11" stroke="#bbd153" strokeWidth="5" />
          <circle cx="30" cy="14" r="5" fill="#01a1af" />
        </svg>
      )
    case 'privacy':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <path
            d="M24 6c-9 0-16 6.5-16 15 0 5.4 2.8 10 7 12.6V42h18v-8.4c4.2-2.7 7-7.2 7-12.6 0-8.5-7-15-16-15Z"
            fill="#285f74"
          />
          <circle cx="18" cy="20" r="3" fill="#4cd9e5" />
          <circle cx="28" cy="15" r="3" fill="#bbd153" />
          <circle cx="30" cy="25" r="3" fill="#e3e24f" />
          <path
            d="M18 20l10-5M18 20l12 5"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'asset':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="14" cy="24" r="9" stroke="#e3e24f" strokeWidth="5" />
          <path
            d="M23 24h20M36 24v7M43 24v5"
            stroke="#285f74"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'partnership':
      return (
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="19" stroke="#bbd153" strokeWidth="5" />
          <circle cx="24" cy="24" r="10" fill="#01a1af" />
          <circle cx="24" cy="24" r="4.5" fill="#285f74" />
        </svg>
      )
  }
}
