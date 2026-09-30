import { Fragment, type ReactNode } from 'react'
import { DetailInfoForm, DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { splitPipeSeparatedText } from '@/features/program/shared/ui/program-detail-td-divider'

function looksLikePhoneSegment(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  const digits = trimmed.replace(/\D/g, '')
  return digits.length >= 9 && /^[\d\s\-+()]+$/.test(trimmed)
}

/** `소속 | 이름 | 연락처` — 마지막이 전화번호면 head / phone 으로 분리 */
export function splitSponsorManagerPipeLine(text: string): { head: string[]; phone?: string } {
  const parts = splitPipeSeparatedText(text)
  if (parts.length <= 1) return { head: parts }
  const last = parts[parts.length - 1]!
  if (looksLikePhoneSegment(last)) {
    return { head: parts.slice(0, -1), phone: last }
  }
  return { head: parts }
}

type DividerComponent = typeof DetailInfoForm.InputsSeparator

function renderSponsorManagerHeadAndPhone(
  head: string[],
  phone: string | undefined,
  Divider: DividerComponent
): ReactNode {
  if (head.length === 0 && !phone) return '-'
  return (
    <>
      {head.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {index > 0 ? <Divider /> : null}
          {part}
        </Fragment>
      ))}
      {phone ? (
        <>
          {head.length > 0 ? '\u00A0' : null}
          <span>{phone}</span>
        </>
      ) : null}
    </>
  )
}

/** 후원사 담당자 조회 — 이름(·소속)과 연락처 사이 세로 구분선 없음 */
export function SponsorManagerLineInlineView({
  text,
}: {
  text: string | undefined | null
}): ReactNode {
  const trimmed = text?.trim()
  if (!trimmed || trimmed === '-') return <>-</>
  const { head, phone } = splitSponsorManagerPipeLine(trimmed)
  return <>{renderSponsorManagerHeadAndPhone(head, phone, DetailInfoForm.InputsSeparator)}</>
}

/** 구조화된 세그먼트(마지막이 연락처일 때) — 테이블 td 등 */
export function SponsorManagerPartsInlineView({ parts }: { parts: string[] }): ReactNode {
  const filtered = parts.map(part => part.trim()).filter(Boolean)
  if (filtered.length === 0) return <>-</>
  const last = filtered[filtered.length - 1]!
  const phone =
    filtered.length >= 2 && looksLikePhoneSegment(last) ? last : undefined
  const head = phone ? filtered.slice(0, -1) : filtered
  return <>{renderSponsorManagerHeadAndPhone(head, phone, DetailInfoFormTdDivider)}</>
}
