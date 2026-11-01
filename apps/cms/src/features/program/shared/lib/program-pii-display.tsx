/**
 * 프로그램 관리 개인정보 표시 — BE MASKED 응답을 FE에서 재마스킹하지 않는다.
 * @see backend docs/frontend/program-management-pii-masking-frontend-handoff-2026-09-16.md
 */

import type { ReactNode } from 'react'
import './program-pii-display.css'

/** 자택 주소 상세 블러 토큰 (서버 `*` 마스킹과 구분) */
export const PRIVACY_ADDRESS_BLUR_TOKEN = '*****'

export function isPrivacyAddressBlurToken(value: string | null | undefined): boolean {
  return (value ?? '').trim() === PRIVACY_ADDRESS_BLUR_TOKEN
}

/**
 * 전화·이메일·학교명 등: 서버 마스킹 문자열을 그대로 표시.
 * FE에서 MASKING_POLICY를 다시 씌우지 않는다.
 */
export function displayServerPiiAsIs(value: string | null | undefined, empty = '-'): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : empty
}

function AddressBlurSpan({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  return (
    <span className={className} aria-hidden="true">
      {children}
    </span>
  )
}

function HomeAddressValueShell({ children }: { children: ReactNode }) {
  return <span className="program-detail-home-address-value">{children}</span>
}

function renderAddressWithBlurToken(
  address: string,
  blurClassName: string
): ReactNode {
  const idx = address.indexOf(PRIVACY_ADDRESS_BLUR_TOKEN)
  if (idx === -1) return address

  const head = address.slice(0, idx)
  const tail = address.slice(idx + PRIVACY_ADDRESS_BLUR_TOKEN.length)
  return (
    <>
      {head}
      <AddressBlurSpan className={blurClassName}>{PRIVACY_ADDRESS_BLUR_TOKEN}</AddressBlurSpan>
      {tail}
    </>
  )
}

export type PrivacyHomeAddressDisplayProps = {
  /** 단일 문자열 주소 또는 split의 동 이하 구간 */
  address?: string | null
  /** split 상세. `*****`이면 CSS blur, `null`이면 미입력 */
  addressDetail?: string | null
  /**
   * true면 블러 없이 표시 (privacy unmask / 개인정보 상세보기 후).
   * false면 `*****` 토큰만 블러.
   */
  revealed?: boolean
  /** @deprecated `revealed={!mask}` 와 동일. 기존 호출부 호환 */
  mask?: boolean
  empty?: ReactNode
  blurClassName?: string
}

/**
 * 자택 주소 표시.
 * - 단일: `강서구 화곡동 *****` → 토큰만 blur
 * - split: `homeAddress` + `homeAddressDetail === "*****"` → detail만 blur
 * - 기관/조직 주소에는 사용하지 않는다.
 */
export function PrivacyHomeAddressDisplay({
  address,
  addressDetail,
  revealed,
  mask,
  empty = '-',
  blurClassName = 'program-pii-address-blur',
}: PrivacyHomeAddressDisplayProps): ReactNode {
  const isRevealed = revealed ?? (mask === undefined ? false : !mask)

  const base = address?.trim() ?? ''
  const detailRaw = addressDetail === undefined ? undefined : addressDetail
  const detail = detailRaw == null ? null : detailRaw.trim()

  if (!base && (detail == null || detail === '')) {
    return <HomeAddressValueShell>{empty}</HomeAddressValueShell>
  }

  let body: ReactNode

  if (isRevealed) {
    if (detailRaw === undefined) {
      body = base || empty
    } else {
      const parts = [base, detail && !isPrivacyAddressBlurToken(detail) ? detail : null].filter(
        Boolean
      ) as string[]
      if (detail && isPrivacyAddressBlurToken(detail)) {
        // unmask 전이 아닌데 detail이 토큰만 있으면 동 구간만
        body = base || empty
      } else {
        body = parts.length > 0 ? parts.join(' ') : empty
      }
    }
  } else if (detailRaw !== undefined) {
    // split detail
    if (!base && !detail) {
      body = empty
    } else if (detail == null || detail === '') {
      body = base || empty
    } else if (isPrivacyAddressBlurToken(detail)) {
      body = (
        <>
          {base}
          {base ? ' ' : null}
          <AddressBlurSpan className={blurClassName}>{PRIVACY_ADDRESS_BLUR_TOKEN}</AddressBlurSpan>
        </>
      )
    } else {
      // 서버가 평문 detail을 준 경우(또는 레거시) — 재마스킹하지 않음
      body = [base, detail].filter(Boolean).join(' ')
    }
  } else if (!base) {
    body = empty
  } else if (base.includes(PRIVACY_ADDRESS_BLUR_TOKEN)) {
    body = renderAddressWithBlurToken(base, blurClassName)
  } else {
    // MASKED인데 토큰이 없으면(시군구·동만) 블러 꼬리로 마스킹 영역 표시
    body = (
      <>
        {base}
        {' '}
        <AddressBlurSpan className={blurClassName}>{PRIVACY_ADDRESS_BLUR_TOKEN}</AddressBlurSpan>
      </>
    )
  }

  return <HomeAddressValueShell>{body}</HomeAddressValueShell>
}

/** 기존 `HomeAddressDisplay({ address, mask })` 호출부용 래퍼 */
export function HomeAddressDisplay({
  address,
  mask,
  blurClassName,
}: {
  address: string | undefined
  mask: boolean
  blurClassName?: string
}): ReactNode {
  return (
    <PrivacyHomeAddressDisplay
      address={address}
      mask={mask}
      blurClassName={blurClassName ?? 'program-pii-address-blur'}
    />
  )
}
