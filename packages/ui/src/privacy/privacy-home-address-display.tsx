/**
 * 자택 주소 마스킹 표시 — CMS program-pii-display SSOT.
 * BE MASKED 응답을 FE에서 재마스킹하지 않고, `*****`(FE blur) / `****`(BE maskAddress) 구간만 blur.
 */

import type { ReactNode } from 'react'
import {
  PRIVACY_ADDRESS_BE_MASK_RUN,
  PRIVACY_ADDRESS_BLUR_TOKEN,
} from './constants'
import './privacy-home-address-display.css'

export { PRIVACY_ADDRESS_BLUR_TOKEN, PRIVACY_ADDRESS_BE_MASK_RUN } from './constants'
export { displayServerPiiAsIs } from './display-server-pii'

export function isPrivacyAddressBlurToken(value: string | null | undefined): boolean {
  return (value ?? '').trim() === PRIVACY_ADDRESS_BLUR_TOKEN
}

export function isFullyMaskedAddressDetailSegment(value: string | null | undefined): boolean {
  const trimmed = (value ?? '').trim()
  return trimmed === PRIVACY_ADDRESS_BLUR_TOKEN || trimmed === PRIVACY_ADDRESS_BE_MASK_RUN
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

function HomeAddressValueShell({
  children,
  shellClassName,
}: {
  children: ReactNode
  shellClassName: string
}) {
  return <span className={shellClassName}>{children}</span>
}

function renderAddressWithBlurToken(
  address: string,
  blurClassName: string,
  token: string
): ReactNode {
  const idx = address.indexOf(token)
  if (idx === -1) return address

  const head = address.slice(0, idx)
  const tail = address.slice(idx + token.length)
  return (
    <>
      {head}
      <AddressBlurSpan className={blurClassName}>{token}</AddressBlurSpan>
      {tail}
    </>
  )
}

/** BE maskAddress 등 문자열 안의 `****` / `*****` 연속 구간을 각각 blur */
function renderMaskedAsteriskRuns(address: string, blurClassName: string): ReactNode {
  const parts = address.split(/(\*{4,5})/g)
  if (parts.length === 1) return address

  return parts.map((part, index) => {
    if (part === PRIVACY_ADDRESS_BLUR_TOKEN || part === PRIVACY_ADDRESS_BE_MASK_RUN) {
      return (
        <AddressBlurSpan key={`${index}-${part}`} className={blurClassName}>
          {part}
        </AddressBlurSpan>
      )
    }
    return part
  })
}

function maskedSingleLineBody(
  base: string,
  blurClassName: string
): ReactNode {
  if (base.includes(PRIVACY_ADDRESS_BLUR_TOKEN)) {
    return renderAddressWithBlurToken(base, blurClassName, PRIVACY_ADDRESS_BLUR_TOKEN)
  }
  if (base.includes(PRIVACY_ADDRESS_BE_MASK_RUN)) {
    return renderMaskedAsteriskRuns(base, blurClassName)
  }
  return (
    <>
      {base}
      {' '}
      <AddressBlurSpan className={blurClassName}>{PRIVACY_ADDRESS_BLUR_TOKEN}</AddressBlurSpan>
    </>
  )
}

export type PrivacyHomeAddressDisplayProps = {
  address?: string | null
  addressDetail?: string | null
  revealed?: boolean
  /** @deprecated `revealed={!mask}` 와 동일 */
  mask?: boolean
  empty?: ReactNode
  blurClassName?: string
  /** 래퍼 클래스. CMS는 `program-detail-home-address-value` */
  valueShellClassName?: string
}

export function PrivacyHomeAddressDisplay({
  address,
  addressDetail,
  revealed,
  mask,
  empty = '-',
  blurClassName = 'program-pii-address-blur',
  valueShellClassName = 'program-detail-home-address-value',
}: PrivacyHomeAddressDisplayProps): ReactNode {
  const isRevealed = revealed ?? (mask === undefined ? false : !mask)

  const base = address?.trim() ?? ''
  const detailRaw = addressDetail === undefined ? undefined : addressDetail
  const detail = detailRaw == null ? null : detailRaw.trim()

  if (!base && (detail == null || detail === '')) {
    return <HomeAddressValueShell shellClassName={valueShellClassName}>{empty}</HomeAddressValueShell>
  }

  let body: ReactNode

  if (isRevealed) {
    if (detailRaw === undefined) {
      body = base || empty
    } else {
      const parts = [base, detail && !isFullyMaskedAddressDetailSegment(detail) ? detail : null].filter(
        Boolean
      ) as string[]
      if (detail && isFullyMaskedAddressDetailSegment(detail)) {
        body = base || empty
      } else {
        body = parts.length > 0 ? parts.join(' ') : empty
      }
    }
  } else if (detailRaw !== undefined) {
    if (!base && !detail) {
      body = empty
    } else if (detail == null || detail === '') {
      if (base.includes(PRIVACY_ADDRESS_BLUR_TOKEN)) {
        body = renderAddressWithBlurToken(base, blurClassName, PRIVACY_ADDRESS_BLUR_TOKEN)
      } else if (base.includes(PRIVACY_ADDRESS_BE_MASK_RUN)) {
        body = renderMaskedAsteriskRuns(base, blurClassName)
      } else {
        body = base || empty
      }
    } else if (isFullyMaskedAddressDetailSegment(detail)) {
      let baseNode: ReactNode = base
      if (base.includes(PRIVACY_ADDRESS_BLUR_TOKEN)) {
        baseNode = renderAddressWithBlurToken(base, blurClassName, PRIVACY_ADDRESS_BLUR_TOKEN)
      } else if (base.includes(PRIVACY_ADDRESS_BE_MASK_RUN)) {
        baseNode = renderMaskedAsteriskRuns(base, blurClassName)
      }
      body = (
        <>
          {baseNode}
          {base ? ' ' : null}
          <AddressBlurSpan className={blurClassName}>
            {detail === PRIVACY_ADDRESS_BE_MASK_RUN ? PRIVACY_ADDRESS_BE_MASK_RUN : PRIVACY_ADDRESS_BLUR_TOKEN}
          </AddressBlurSpan>
        </>
      )
    } else {
      body = [base, detail].filter(Boolean).join(' ')
    }
  } else if (!base) {
    body = empty
  } else {
    body = maskedSingleLineBody(base, blurClassName)
  }

  return <HomeAddressValueShell shellClassName={valueShellClassName}>{body}</HomeAddressValueShell>
}

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
      valueShellClassName="program-detail-home-address-value"
    />
  )
}
