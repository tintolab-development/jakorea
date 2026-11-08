import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { normalizeBirthDateDigits, toApiGender } from '@jakorea/identity-verification'

import type { AdminRegisterWizardData } from '@/types/admin-register'

export interface AdminRegisterReviewItem {
  label: string
  value: string
}

/** 본인인증 생년월일(`YYYYMMDD` / `YYYY-MM-DD` 등) → `YYYY.MM.DD` */
export function formatAdminRegisterBirthDate(birthDate?: string): string {
  const digits = normalizeBirthDateDigits(birthDate)
  if (digits.length !== 8) {
    return birthDate?.trim() || '-'
  }
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`
}

/** 본인인증 성별(`M`/`F`/`male`/`남성` 등) → `남성`/`여성` */
export function formatAdminRegisterGender(gender?: string): string {
  const apiGender = toApiGender(gender)
  if (apiGender === 'M') return '남성'
  if (apiGender === 'F') return '여성'
  return gender?.trim() || '-'
}

export function buildAdminRegisterReviewItems(
  data: AdminRegisterWizardData
): AdminRegisterReviewItem[] {
  return [
    { label: '회원 유형', value: '관리자 회원' },
    { label: '이름', value: data.verifiedName?.trim() || '-' },
    {
      label: '휴대폰 번호',
      value: data.verifiedPhone?.trim() ? formatKoreanPhoneNumber(data.verifiedPhone.trim()) : '-',
    },
    { label: '생년월일', value: formatAdminRegisterBirthDate(data.verifiedBirthDate) },
    { label: '성별', value: formatAdminRegisterGender(data.verifiedGender) },
    { label: '이메일 ID', value: data.email ?? '-' },
  ]
}
