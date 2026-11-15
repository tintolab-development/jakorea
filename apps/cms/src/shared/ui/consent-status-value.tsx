/**
 * 동의 상태 값 칸 — 시안 16299:623421 「내 정보 확인」 약관 및 동의.
 * [상태] | [버튼] [일시] 순서, 항목 사이 16px. 구분선은 공통 TdDivider(1×13 #3D3D3D 50%).
 * 일시는 14px Medium #3D3D3D 50%, 버튼은 h32·최소 폭 100px.
 * 상태 뒤에 버튼이나 일시가 있을 때만 구분선을 하나 둔다(미동의만 있으면 상태 문구만).
 *
 * 내 정보 확인 · 회원 상세 · 회원/강사 등록 · 교사 상세 등 동의 칸은 모두 이 컴포넌트로 그린다.
 */

import type { ReactNode } from 'react'

import { DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'

import './consent-status-value.css'

export interface ConsentStatusValueProps {
  /** 「동의」「미동의」「동의 만료」 등 */
  status: ReactNode
  /** 상태 뒤 버튼 (CmsButton size="h32") */
  action?: ReactNode
  /** 동의 일시·만료일. 비었거나 「-」이면 표시하지 않는다 */
  datetime?: string | null
  /** 화면에 보이지 않는 요소(숨김 Form.Item 등) — 상태 앞에 둔다 */
  children?: ReactNode
  className?: string
}

function hasDatetime(datetime: string | null | undefined): datetime is string {
  const trimmed = datetime?.trim()
  return Boolean(trimmed) && trimmed !== '-'
}

export function ConsentStatusValue({
  status,
  action,
  datetime,
  children,
  className,
}: ConsentStatusValueProps) {
  const showDatetime = hasDatetime(datetime)
  const showDivider = action != null || showDatetime
  return (
    <span className={className ? `consent-status-value ${className}` : 'consent-status-value'}>
      {children}
      <span className="consent-status-value__status">{status}</span>
      {showDivider ? <DetailInfoFormTdDivider /> : null}
      {action}
      {showDatetime ? <span className="consent-status-value__datetime">{datetime}</span> : null}
    </span>
  )
}

/** `동의 | 2026.01.15 09:15:42` 형태 문자열을 상태·일시로 나눠 그린다 */
export function ConsentStatusText({ value }: { value: ReactNode }) {
  if (typeof value !== 'string') return <>{value}</>
  const idx = value.indexOf('|')
  if (idx === -1) return <ConsentStatusValue status={value.trim()} />
  return (
    <ConsentStatusValue
      status={value.slice(0, idx).trim()}
      datetime={value.slice(idx + 1).trim()}
    />
  )
}
