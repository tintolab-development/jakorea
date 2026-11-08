import { Fragment, type ReactNode } from 'react'
import type { Program } from '@/types/domain'
import { DetailInfoForm, DetailInfoFormTdDivider } from '@/shared/components/detail-info-form'
import { splitPipeSeparatedText } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  decodeSponsorManagerContactRef,
  formatSponsorManagerPersonLabel,
} from '@/features/program/general/model/common-info-edit-schema'
import type {
  SponsorContactRow,
  SponsorManagementRow,
} from '@/features/sponsor/model/sponsor-management.types'
import {
  isProgramSponsorManagerUnselected,
  isSponsorContactUnselectedLabel,
  SPONSOR_CONTACT_UNSELECTED_LABEL,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

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

/** 복수 담당자 — 담당자별 한 줄씩 세로 정렬 */
export function SponsorManagerLinesStackView({
  lines,
}: {
  lines: readonly string[]
}): ReactNode {
  const filtered = lines.map(line => line.trim()).filter(Boolean)
  if (filtered.length === 0) return <>-</>
  if (filtered.length === 1) {
    return <SponsorManagerLineInlineView text={filtered[0]} />
  }
  return (
    <div className="program-detail-info-tab__sponsor-manager-stack">
      {filtered.map((line, index) => (
        <div
          key={`${line}-${index}`}
          className="program-detail-info-tab__sponsor-manager-stack-row"
        >
          <SponsorManagerLineInlineView text={line} />
        </div>
      ))}
    </div>
  )
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

/** contact ref 기반 조회 — 담당자 여러 명이면 세로 스택 */
export function SponsorManagerContactsView({
  program,
  sponsorRows,
  sponsorNameById,
  contactsBySponsorId,
}: {
  program: Program
  sponsorRows: readonly SponsorManagementRow[]
  /** 후원사 행이 없을 때(조회 화면) 배정 응답의 후원사명 — sponsorManagementId → 이름 */
  sponsorNameById?: Readonly<Record<string, string>>
  contactsBySponsorId: Record<string, readonly SponsorContactRow[] | undefined>
}): ReactNode {
  const sponsorCount = Math.max(sponsorRows.length, Object.keys(sponsorNameById ?? {}).length)
  if (
    isProgramSponsorManagerUnselected({
      sponsorManagerContactIds: program.generalCommonInfo?.sponsorManagerContactIds,
      sponsorManagerContactId: program.generalCommonInfo?.sponsorManagerContactId,
      managerLine: program.generalCommonInfo?.sponsorManagerLine,
      managerName: program.managerName,
    })
  ) {
    return <>{SPONSOR_CONTACT_UNSELECTED_LABEL}</>
  }

  const refs = program.generalCommonInfo?.sponsorManagerContactIds ?? []
  const multi = refs.length > 1 || sponsorCount > 1
  const lines: string[][] = []
  for (const ref of refs) {
    const decoded = decodeSponsorManagerContactRef(ref)
    if (!decoded) continue
    const sponsor = sponsorRows.find(row => row.id === decoded.sponsorManagementId)
    const contact = contactsBySponsorId[decoded.sponsorManagementId]?.find(
      row => row.id === decoded.contactId
    )
    const storedName = program.generalCommonInfo?.sponsorManagerContactNames?.[ref]?.trim()
    const contactName = contact?.name?.trim() || storedName
    if (!contactName) continue
    const personLabel = formatSponsorManagerPersonLabel({
      contactName,
      position: contact?.position,
    })
    const parts = [
      multi
        ? sponsor?.name?.trim() || sponsorNameById?.[decoded.sponsorManagementId]?.trim()
        : '',
      personLabel,
      contact?.phone?.trim(),
    ].filter((part): part is string => Boolean(part))
    if (parts.length > 0) lines.push(parts)
  }
  if (lines.length > 0) {
    return (
      <div className="program-detail-info-tab__sponsor-manager-stack">
        {lines.map(parts => (
          <div
            key={parts.join('-')}
            className="program-detail-info-tab__sponsor-manager-stack-row"
          >
            <SponsorManagerPartsInlineView parts={parts} />
          </div>
        ))}
      </div>
    )
  }
  const managerName = program.managerName?.trim()
  if (!managerName || isSponsorContactUnselectedLabel(managerName)) {
    return <>{sponsorCount > 0 ? SPONSOR_CONTACT_UNSELECTED_LABEL : '-'}</>
  }
  return (
    <>
      {managerName}
      {program.contactPhone ? (
        <>
          {'\u00A0'}
          <span>{program.contactPhone}</span>
        </>
      ) : null}
    </>
  )
}
