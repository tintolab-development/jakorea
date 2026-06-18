import type { AdminRegisterGender, AdminRegisterWizardData } from '@/types/admin-register'

export interface AdminRegisterReviewItem {
  label: string
  value: string
}

export function getAdminRegisterGenderLabel(gender?: AdminRegisterGender): string {
  if (gender === 'male') {
    return '남성'
  }
  if (gender === 'female') {
    return '여성'
  }
  return '-'
}

export function buildAdminRegisterReviewItems(
  data: AdminRegisterWizardData
): AdminRegisterReviewItem[] {
  return [
    { label: '회원유형', value: '관리자회원' },
    { label: '이름', value: data.verifiedName?.trim() || '-' },
    { label: '휴대폰 번호', value: data.verifiedPhone?.trim() || '-' },
    { label: '생년월일', value: data.birthDate ?? '-' },
    { label: '성별', value: getAdminRegisterGenderLabel(data.gender) },
    { label: '이메일 ID', value: data.email ?? '-' },
  ]
}
