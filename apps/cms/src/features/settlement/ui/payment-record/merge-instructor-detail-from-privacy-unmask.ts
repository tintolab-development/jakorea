/**
 * 지급 현황 강사 상세 — instructor privacy/unmask 응답을 상세 표시 모델에 반영
 */

import type { PaymentOrderAdminInstructorDetail } from '@/features/settlement-management/model/payment-order-admin-list'
import { toApiBirthDate, toDisplayGender } from '@/features/user/api/map-member-gender-birth'
import type { HomeAddress } from '@/shared/api/generated/members/schemas/homeAddress'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'

function formatInstructorHomeAddress(homeAddress: HomeAddress | null | undefined): string {
  if (!homeAddress) return ''
  const line = homeAddress.line?.trim() ?? ''
  const detail = homeAddress.detail?.trim() ?? ''
  return [line, detail].filter(Boolean).join(' ')
}

function formatBirthDisplay(birthDate: string | null | undefined): string {
  const raw = birthDate?.trim()
  if (!raw) return '-'
  const api = toApiBirthDate(raw)
  if (api) {
    const [y, m, d] = api.split('-')
    if (y && m && d) return `${y}. ${m}. ${d}`
  }
  return raw
}

export function formatInstructorGenderBirthDisplay(
  gender: string | null | undefined,
  birthDate: string | null | undefined
): string {
  const genderPart = toDisplayGender(gender)
  const birthPart = formatBirthDisplay(birthDate)
  if (genderPart === '-' && birthPart === '-') return '-'
  return `${genderPart} | ${birthPart}`
}

export function mergeInstructorDetailFromPrivacyUnmask(
  detail: PaymentOrderAdminInstructorDetail,
  unmask: InstructorMemberDetailResponse | null | undefined
): PaymentOrderAdminInstructorDetail {
  if (!unmask) return detail
  const member = unmask.member
  const settlement = unmask.settlement
  const address = formatInstructorHomeAddress(unmask.profile?.homeAddress)
  const genderBirthDisplay =
    member != null
      ? formatInstructorGenderBirthDisplay(member.gender, member.birthDate)
      : detail.genderBirthDisplay
  return {
    ...detail,
    nameKo: member?.name?.trim() || detail.nameKo,
    phone: member?.phone?.trim() || detail.phone,
    email: member?.email?.trim() || detail.email,
    address: address || detail.address,
    bankName: settlement?.bankName?.trim() || detail.bankName,
    accountNumber: settlement?.accountNumber?.trim() || detail.accountNumber,
    accountHolder: settlement?.accountHolder?.trim() || detail.accountHolder,
    genderBirthDisplay: genderBirthDisplay ?? detail.genderBirthDisplay,
    scheduleChangeCancelCount:
      member?.scheduleChangeCancelCount ?? detail.scheduleChangeCancelCount,
  }
}

/** 마스킹 GET 강사 상세 → 조회 전 헤더 표시(원문 조회 전) */
export function mergeInstructorDetailFromMaskedMember(
  detail: PaymentOrderAdminInstructorDetail,
  masked: InstructorMemberDetailResponse | null | undefined
): PaymentOrderAdminInstructorDetail {
  if (!masked) return detail
  const member = masked.member
  const settlement = masked.settlement
  const address = formatInstructorHomeAddress(masked.profile?.homeAddress)
  return {
    ...detail,
    phone: member?.phone?.trim() || detail.phone,
    email: member?.email?.trim() || detail.email,
    address: address || detail.address,
    bankName: settlement?.bankName?.trim() || detail.bankName,
    accountNumber: settlement?.accountNumber?.trim() || detail.accountNumber,
    accountHolder: settlement?.accountHolder?.trim() || detail.accountHolder,
    genderBirthDisplay:
      member != null
        ? formatInstructorGenderBirthDisplay(member.gender, member.birthDate)
        : detail.genderBirthDisplay,
    scheduleChangeCancelCount:
      member?.scheduleChangeCancelCount ?? detail.scheduleChangeCancelCount,
  }
}
