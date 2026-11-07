import type { GeminiApprovedTrainingDetailResponse } from '@/shared/api/generated/dashboard/schemas/geminiApprovedTrainingDetailResponse'
import { getApiErrorCode, getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { toGenderLabelOrRaw } from '@/features/user/api/map-member-gender-birth'

export type GeminiApprovedTrainingPrivacyUnmasked = {
  teacherName?: string
  teacherGender?: string
  teacherBirthDate?: string
  teacherPhone?: string
  teacherEmail?: string
  teacherHomeAddress?: string
  teacherAccountNumber: string | null
  instructor: {
    phone?: string
    email?: string
    homeAddress?: string
  } | null
}

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function mapGeminiApprovedTrainingPrivacyUnmask(
  dto: GeminiApprovedTrainingDetailResponse
): GeminiApprovedTrainingPrivacyUnmasked {
  const assigned = dto.assignedInstructor
  return {
    teacherName: nonEmpty(dto.teacherName),
    teacherGender: toGenderLabelOrRaw(nonEmpty(dto.teacherGender)),
    teacherBirthDate: nonEmpty(dto.teacherBirthDate),
    teacherPhone: nonEmpty(dto.teacherPhone),
    teacherEmail: nonEmpty(dto.teacherEmail),
    teacherHomeAddress: nonEmpty(dto.teacherHomeAddress),
    teacherAccountNumber: nonEmpty(dto.teacherAccountNumber) ?? null,
    instructor:
      assigned == null
        ? null
        : {
            phone: nonEmpty(assigned.phone),
            email: nonEmpty(assigned.email),
            homeAddress: nonEmpty(assigned.homeAddress),
          },
  }
}

export function toGeminiApprovedTrainingUnmaskError(error: unknown): Error {
  const status = getApiErrorHttpStatus(error)
  const code = getApiErrorCode(error)
  if (status === 403) return new Error('개인정보 원문을 볼 권한이 없습니다.')
  if (status === 404 || code === 'GEMINI_APPROVED_TRAINING_NOT_FOUND') {
    return new Error('승인된 연수를 찾을 수 없습니다.')
  }
  if (status === 410 || code === 'GEMINI_APPROVED_TRAINING_PERSONAL_INFO_UNAVAILABLE') {
    return new Error('담당 교사 개인정보를 확인할 수 없습니다.')
  }
  return new Error('개인정보 원문 조회에 실패했습니다.')
}
