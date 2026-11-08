import { type AdminMutationAlert } from '@/shared/lib/api-error-message'
import { mapAdminMutationAlert, REQUIRED_FIELDS_INCOMPLETE_ALERT } from '@/shared/ui'

export function educationProgramIntroMutationFailureAlert(error: unknown): AdminMutationAlert {
  const common = mapAdminMutationAlert(error)
  if (common) return common

  if (error instanceof Error && /이미지를 등록|assetId/.test(error.message)) {
    return REQUIRED_FIELDS_INCOMPLETE_ALERT
  }

  return {
    title: '저장 실패',
    content: '프로그램 소개 저장에 실패했습니다. 다시 시도해 주세요.',
  }
}
