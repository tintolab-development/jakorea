import type { ReactNode } from 'react'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatInstitutionApplicationTeacherContact } from './ujat-institution-application-detail-types'

const ADDRESS_BLUR_STYLE: React.CSSProperties = {
  filter: 'blur(5px)',
  WebkitFilter: 'blur(5px)',
  userSelect: 'none',
  display: 'inline-block',
  verticalAlign: 'baseline',
}

/** 읍·면·동까지 노출, 이후 블러 — 사용자 자택 주소 전용(기관 소재지·상세 주소 미적용) */
function splitAddressAfterDong(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{2,12}동)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const dong = m[1]
  const i = address.indexOf(dong)
  if (i === -1) return null
  const end = i + dong.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function splitAddressAfterGu(address: string): { head: string; tail: string } | null {
  const re = /(?:^|\s)([가-힣]{1,12}구)(?=\s|$)/u
  const m = address.match(re)
  if (!m) return null
  const gu = m[1]
  const i = address.indexOf(gu)
  if (i === -1) return null
  const end = i + gu.length
  return { head: address.slice(0, end), tail: address.slice(end) }
}

function splitAddressForPrivacyBlur(address: string): { head: string; tail: string } | null {
  return splitAddressAfterDong(address) ?? splitAddressAfterGu(address)
}

export function maskUjatTeacherPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, '')
  return MASKING_POLICY.phone(cleaned) || phone
}

export function maskUjatTeacherEmail(email: string): string {
  return MASKING_POLICY.email(email)
}

/** 자택 주소(전체 한 줄) — 동·구까지 노출 후 나머지 블러 */
export function HomeAddressPrivacyValue({
  address,
  revealed,
}: {
  address: string
  revealed: boolean
}) {
  if (!address.trim()) return <>-</>
  if (revealed) return <>{address}</>

  const split = splitAddressForPrivacyBlur(address)
  if (!split) {
    return (
      <span style={ADDRESS_BLUR_STYLE} aria-hidden>
        {address}
      </span>
    )
  }
  const { head, tail } = split
  if (!tail.trim()) return <>{head}</>
  return (
    <>
      {head}
      <span style={ADDRESS_BLUR_STYLE} aria-hidden>
        {tail}
      </span>
    </>
  )
}

export function UjatInstitutionTeacherInfoValue({
  contact,
  revealed,
}: {
  contact: UjatInstitutionApplicationTeacherContact
  revealed: boolean
}) {
  const tel = revealed ? contact.tel : maskUjatTeacherPhone(contact.tel)
  const mobile = revealed ? contact.mobile : maskUjatTeacherPhone(contact.mobile)
  const email = revealed ? contact.email : maskUjatTeacherEmail(contact.email)

  const segments: ReactNode[] = [
    <span key="name">담당 교사 : {contact.teacherName}</span>,
    <span key="tel">Tel : {tel}</span>,
    <span key="mobile">M : {mobile}</span>,
    <span key="email">E-mail : {email}</span>,
  ]

  return (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
      {segments.map((segment, index) => (
        <TeacherInfoSegment key={index} index={index} segment={segment} />
      ))}
    </div>
  )
}

function TeacherInfoSegment({ index, segment }: { index: number; segment: ReactNode }) {
  return (
    <>
      {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
      {segment}
    </>
  )
}
