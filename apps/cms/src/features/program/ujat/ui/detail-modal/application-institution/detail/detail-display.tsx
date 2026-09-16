import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  displayServerPiiAsIs,
  PrivacyHomeAddressDisplay,
} from '@/features/program/shared/lib/program-pii-display'
import type { UjatInstitutionApplicationTeacherContact } from './detail-types'

/** @deprecated identity — 서버 마스킹 문자열을 그대로 표시 */
export function maskUjatTeacherPhone(phone: string): string {
  return displayServerPiiAsIs(phone, phone)
}

/** @deprecated identity — 서버 마스킹 문자열을 그대로 표시 */
export function maskUjatTeacherEmail(email: string): string {
  return displayServerPiiAsIs(email, email)
}

/** 자택 주소(전체 한 줄) — `*****` 토큰만 블러 */
export function HomeAddressPrivacyValue({
  address,
  revealed,
}: {
  address: string
  revealed: boolean
}) {
  return <PrivacyHomeAddressDisplay address={address} revealed={revealed} />
}

export function UjatInstitutionTeacherInfoValue({
  contact,
  revealed: _revealed,
}: {
  contact: UjatInstitutionApplicationTeacherContact
  revealed: boolean
}) {
  const tel = displayServerPiiAsIs(contact.tel, contact.tel)
  const mobile = displayServerPiiAsIs(contact.mobile, contact.mobile)
  const email = displayServerPiiAsIs(contact.email, contact.email)

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
