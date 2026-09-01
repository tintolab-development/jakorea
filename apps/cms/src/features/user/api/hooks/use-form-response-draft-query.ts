import { useQuery } from '@tanstack/react-query'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

export type FormResponseDraftQueryResult = {
  draft: WritingFormDraft | null
  isLoading: boolean
  /** formResponseId는 있으나 제출본 draft를 아직 불러올 수 없음 (API 미연동 포함) */
  isUnavailable: boolean
}

/**
 * @deprecated 동의서 보기는 `useConsentFilledDocumentMutation` + filled-document POST를 사용한다.
 * 제출된 동의서(formResponse) → WritingFormDraft. 더 이상 호출하지 말 것.
 */
export function useFormResponseDraftQuery(
  formResponseId: number | undefined
): FormResponseDraftQueryResult {
  const query = useQuery({
    queryKey: ['formResponseDraft', formResponseId],
    enabled: formResponseId != null,
    queryFn: async (): Promise<WritingFormDraft | null> => {
      // TODO(api): formResponseId로 제출본 조회 후 WritingFormDraft로 변환
      return null
    },
    staleTime: Infinity,
    retry: false,
  })

  if (formResponseId == null) {
    return { draft: null, isLoading: false, isUnavailable: false }
  }

  const draft = query.data ?? null
  const isLoading = query.isLoading
  const isUnavailable = !isLoading && draft == null

  return { draft, isLoading, isUnavailable }
}
