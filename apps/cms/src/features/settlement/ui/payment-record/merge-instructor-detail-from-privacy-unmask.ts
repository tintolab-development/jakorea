/**
 * 지급 현황 강사 상세 — instructor privacy/unmask 응답을 상세 표시 모델에 반영
 */

import type { PaymentOrderAdminInstructorDetail } from '@/features/settlement-management/model/payment-order-admin-list'
import { formatGenderBirthDisplayLine } from '@/features/user/api/format-gender-birth-display'
import type { HomeAddress } from '@/shared/api/generated/members/schemas/homeAddress'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas/individualMemberDetailResponse'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'

function formatInstructorHomeAddress(homeAddress: HomeAddress | null | undefined): string {
  if (!homeAddress) return ''
  const line = homeAddress.line?.trim() ?? ''
  const detail = homeAddress.detail?.trim() ?? ''
  return [line, detail].filter(Boolean).join(' ')
}

export function formatInstructorGenderBirthDisplay(
  gender: string | null | undefined,
  birthDate: string | null | undefined,
  birthYear?: number | null
): string {
  return formatGenderBirthDisplayLine(gender, birthDate, { birthYear })
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
      ? formatInstructorGenderBirthDisplay(
          member.gender,
          member.birthDate,
          member.birthYear
        )
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
        ? formatInstructorGenderBirthDisplay(
            member.gender,
            member.birthDate,
            member.birthYear
          )
        : detail.genderBirthDisplay,
    scheduleChangeCancelCount:
      member?.scheduleChangeCancelCount ?? detail.scheduleChangeCancelCount,
  }
}

/**
 * 참여자·봉사자(영수증 정산) 신청자 — 개인회원 상세(마스킹 GET·원문 unmask 같은 응답 모양)를 기본 정보에 반영.
 * 개인회원 응답에는 정산 계좌가 없어 계좌 칸은 기존 값을 둔다. 성명은 원문(`includeName`)일 때만 덮는다.
 */
export function mergeInstructorDetailFromIndividualMember(
  detail: PaymentOrderAdminInstructorDetail,
  individual: IndividualMemberDetailResponse | null | undefined,
  options: { includeName?: boolean } = {}
): PaymentOrderAdminInstructorDetail {
  if (!individual) return detail
  const member = individual.member
  const address = [individual.address?.trim() ?? '', individual.addressDetail?.trim() ?? '']
    .filter(Boolean)
    .join(' ')
  return {
    ...detail,
    nameKo: (options.includeName ? member?.name?.trim() : '') || detail.nameKo,
    phone: member?.phone?.trim() || detail.phone,
    email: member?.email?.trim() || detail.email,
    address: address || detail.address,
    genderBirthDisplay:
      member != null
        ? formatInstructorGenderBirthDisplay(member.gender, member.birthDate, member.birthYear)
        : detail.genderBirthDisplay,
    scheduleChangeCancelCount:
      member?.scheduleChangeCancelCount ?? detail.scheduleChangeCancelCount,
  }
}

/**
 * 참여자·봉사자 신청자 상세 — 정산 계좌는 가장 최근 신청 건(영수증 신청 ID가 가장 큰 행)의 신청 당시 계좌를 쓴다
 * (기획 9번, CMS-FUNC-0498). 그 건에 계좌가 없으면(2026-11-11 이전 제출 등) 빈 값으로 두어 화면은 「-」.
 * 서버가 이미 마스킹한 값이며 원문 경로는 없다.
 */
export function applyLatestReceiptPayeeAccount(
  detail: PaymentOrderAdminInstructorDetail
): PaymentOrderAdminInstructorDetail {
  let latest: PaymentOrderAdminInstructorDetail['programRows'][number] | null = null
  for (const row of detail.programRows ?? []) {
    const id = row.individualSettlementApplicationId
    if (id == null) continue
    if (latest == null || id > (latest.individualSettlementApplicationId ?? 0)) latest = row
  }
  if (latest == null) return detail
  return {
    ...detail,
    bankName: latest.payeeBankName ?? '',
    accountNumber: latest.payeeAccountNumberMasked ?? '',
    accountHolder: latest.payeeAccountHolder ?? '',
  }
}
