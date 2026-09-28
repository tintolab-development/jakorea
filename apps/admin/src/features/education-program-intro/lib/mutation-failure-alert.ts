import { mapCommonRemoteMutationFailure } from '@/shared/lib/api-error-message'

export function educationProgramIntroMutationFailureAlert(error: unknown): {
  title: string
  content: string
} {
  const common = mapCommonRemoteMutationFailure(error)
  if (common) return common

  if (error instanceof Error && /이미지를 등록|assetId/.test(error.message)) {
    return {
      title: '입력 확인',
      content: error.message,
    }
  }

  return {
    title: '저장 실패',
    content: '프로그램 소개 저장에 실패했습니다. 다시 시도해 주세요.',
  }
}
