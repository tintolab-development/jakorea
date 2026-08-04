import type { CSSProperties } from 'react'
import type { GlobalValueId } from '../model/types'

const ICON_COLORS: Record<GlobalValueId, string> = {
  belief: '#01A1AF',
  connection: '#2B6CB0',
  integrity: '#C05621',
  excellence: '#6B46C1',
  respect: '#2F855A',
}

const wrapStyle = (bg: string): CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 8,
  background: bg,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
})

/** 고정 아이콘 — 수정·삭제 불가 (시안 플레이스홀더) */
export function GlobalValueFixedIcon({ iconKey }: { iconKey: GlobalValueId }) {
  const bg = ICON_COLORS[iconKey]
  return (
    <span style={wrapStyle(bg)} aria-hidden>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {iconKey === 'belief' && (
          <path
            d="M14 4.5L16.8 11.2L24 12.1L18.5 17L20.1 24.1L14 20.3L7.9 24.1L9.5 17L4 12.1L11.2 11.2L14 4.5Z"
            fill="white"
          />
        )}
        {iconKey === 'connection' && (
          <>
            <circle cx="9" cy="10" r="3.2" stroke="white" strokeWidth="2" />
            <circle cx="19" cy="10" r="3.2" stroke="white" strokeWidth="2" />
            <circle cx="14" cy="19" r="3.2" stroke="white" strokeWidth="2" />
            <path d="M11.5 12L12.8 16.2M16.5 12L15.2 16.2" stroke="white" strokeWidth="2" />
          </>
        )}
        {iconKey === 'integrity' && (
          <path
            d="M14 4L22 7.5V13.5C22 18.2 18.5 22.3 14 23.5C9.5 22.3 6 18.2 6 13.5V7.5L14 4Z"
            stroke="white"
            strokeWidth="2"
            fill="none"
          />
        )}
        {iconKey === 'excellence' && (
          <path
            d="M8 20L14 5L20 20H8ZM10.5 16.5H17.5"
            stroke="white"
            strokeWidth="2"
            strokeLinejoin="round"
            fill="none"
          />
        )}
        {iconKey === 'respect' && (
          <path
            d="M14 22C14 22 5 16.5 5 10.5C5 7.5 7.5 5.5 10 5.5C12 5.5 13.3 6.6 14 7.8C14.7 6.6 16 5.5 18 5.5C20.5 5.5 23 7.5 23 10.5C23 16.5 14 22 14 22Z"
            fill="white"
          />
        )}
      </svg>
    </span>
  )
}
