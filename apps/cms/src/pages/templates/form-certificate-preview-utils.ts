import type { KeyboardEvent, MouseEvent } from 'react'

export function labelToGraphemes(label: string): string[] {
  return Array.from(label)
}

/** Asia/Seoul 달력일(년·월·일). 서버 발급 일시(UTC)와 파일명 날짜를 같은 기준으로 맞춘다. */
function seoulDateParts(date: Date): { y: string; m: string; d: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const v = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return { y: v.year ?? '', m: v.month ?? '', d: v.day ?? '' }
}

/** 발급일자 — 년·월·일 (한국어, Asia/Seoul) */
export function formatCertificateIssueDate(date: Date = new Date()): string {
  const { y, m, d } = seoulDateParts(date)
  return `${y}년 ${Number(m)}월 ${Number(d)}일`
}

export function certificateIssueDateIso(date: Date = new Date()): string {
  const { y, m, d } = seoulDateParts(date)
  return `${y}-${m}-${d}`
}

export function splitParticipantValues(text: string, count: number): string[] {
  const lines = text.split(/\n/)
  const out = [...lines]
  while (out.length < count) out.push('')
  return out.slice(0, count)
}

export function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/** 인증서 좌측 상단 고유번호 텍스트 — 미리보기 플레이스홀더 / PDF 실번호 */
export const FORM_CERTIFICATE_SERIAL_TEXT_SELECTOR =
  '.form-certificate-preview__serial-text, [data-certificate-serial="text"]'

export function stopAndSelect(fieldName: string, onRegionClick?: (fieldName: string) => void) {
  return (e: MouseEvent) => {
    e.stopPropagation()
    onRegionClick?.(fieldName)
  }
}

/** `role="button"` 영역 — 클릭·Enter·Space로 필드 선택 동기화 */
export function getRegionActivationHandlers(
  fieldName: string,
  onRegionClick?: (fieldName: string) => void
) {
  return {
    onClick: stopAndSelect(fieldName, onRegionClick),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onRegionClick?.(fieldName)
      }
    },
  }
}

/** 인증서 큰 제목 — 캔버스 1144px에서 좌우 40px씩 뺀 폭 (`__title` max-width와 같음) */
export const CERTIFICATE_TITLE_MAX_WIDTH_PX = 1064
/** 제목 영역 높이 — `__title` height와 같음 */
export const CERTIFICATE_TITLE_BOX_HEIGHT_PX = 150
const CERTIFICATE_TITLE_BASE_FONT_SIZE_PX = 100
/** 한 줄 유지 최소 글자 크기. 이보다 작아져야 하면 두 줄로 줄바꿈한다. */
const CERTIFICATE_TITLE_MIN_SINGLE_LINE_FONT_SIZE_PX = 56
const CERTIFICATE_TITLE_MIN_WRAP_FONT_SIZE_PX = 40
/** 기본 100px / 자간 16px 비율 */
const CERTIFICATE_TITLE_LETTER_SPACING_EM = 0.16
const CERTIFICATE_TITLE_WRAP_LINE_HEIGHT = 1.3
/** 줄바꿈 위치에 따른 손실 여유 */
const CERTIFICATE_TITLE_WRAP_SLACK = 0.85

const WIDE_GLYPH_PATTERN = /[ᄀ-ᇿ⺀-鿿가-힯豈-﫿＀-￯]/

/** 글자 폭 추정(em). 한글·한자·전각은 1em, 공백 0.35em, 그 외(영문·숫자) 0.62em + 자간 */
function estimateCertificateTitleWidthEm(text: string): number {
  return Array.from(text).reduce((sum, ch) => {
    const glyph = WIDE_GLYPH_PATTERN.test(ch) ? 1 : ch === ' ' ? 0.35 : 0.62
    return sum + glyph + CERTIFICATE_TITLE_LETTER_SPACING_EM
  }, 0)
}

export type CertificateTitleLayout = {
  fontSize: number
  letterSpacing: number
  /** true면 최대 두 줄로 줄바꿈 */
  wrap: boolean
  lineHeight: number
}

/**
 * 제목 길이에 따라 글자 크기를 줄이고, 최소 크기로도 한 줄에 안 들어가면 두 줄로 줄바꿈한다.
 * DOM 측정 없이 문자열만으로 계산해 화면 미리보기와 PDF 캡처 DOM이 같은 결과를 갖는다.
 */
export function resolveCertificateTitleLayout(text: string): CertificateTitleLayout {
  const em = estimateCertificateTitleWidthEm(text.trim())
  const toLayout = (fontSize: number, wrap: boolean): CertificateTitleLayout => ({
    fontSize,
    letterSpacing: Math.round(fontSize * CERTIFICATE_TITLE_LETTER_SPACING_EM),
    wrap,
    lineHeight: wrap
      ? Math.round(fontSize * CERTIFICATE_TITLE_WRAP_LINE_HEIGHT)
      : CERTIFICATE_TITLE_BOX_HEIGHT_PX,
  })
  if (em <= 0) return toLayout(CERTIFICATE_TITLE_BASE_FONT_SIZE_PX, false)

  const singleLine = Math.floor(CERTIFICATE_TITLE_MAX_WIDTH_PX / em)
  if (singleLine >= CERTIFICATE_TITLE_MIN_SINGLE_LINE_FONT_SIZE_PX) {
    return toLayout(Math.min(CERTIFICATE_TITLE_BASE_FONT_SIZE_PX, singleLine), false)
  }
  const twoLines = Math.floor(
    ((CERTIFICATE_TITLE_MAX_WIDTH_PX * 2) / em) * CERTIFICATE_TITLE_WRAP_SLACK
  )
  const fontSize = Math.max(
    CERTIFICATE_TITLE_MIN_WRAP_FONT_SIZE_PX,
    Math.min(CERTIFICATE_TITLE_MIN_SINGLE_LINE_FONT_SIZE_PX, twoLines)
  )
  return toLayout(fontSize, true)
}
