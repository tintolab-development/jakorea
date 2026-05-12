/**
 * userPreview 쿼리와 TemplateWritingPreview 모달 보조 동기화:
 * - 히스토리에서 userPreview=1 이 제거될 때만 미리보기 닫기(ref로 이전 값 추적)
 * - 미리보기 X로 닫을 때 쿼리의 userPreview 제거
 */

import { useEffect, useRef } from 'react'
import type { SetQueryParamsOptions } from '@/shared/hooks/use-query-params'
import { TEMPLATE_USER_PREVIEW_ACTIVE } from '@/features/template/lib/template-user-preview-url'

type ParamsWithUserPreview = { userPreview?: string }

export function useWritingUserPreviewUrlAuxiliarySync<
  T extends ParamsWithUserPreview = ParamsWithUserPreview,
>(
  params: T,
  setParams: (updates: Partial<T>, options?: SetQueryParamsOptions) => void,
  isWritingUserPreviewOpen: boolean,
  closeWritingUserPreview: () => void
) {
  const prevUserPreviewForCloseRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    const prev = prevUserPreviewForCloseRef.current
    const cur = params.userPreview
    prevUserPreviewForCloseRef.current = cur

    if (prev !== TEMPLATE_USER_PREVIEW_ACTIVE) return
    if (cur === TEMPLATE_USER_PREVIEW_ACTIVE) return
    if (!isWritingUserPreviewOpen) return
    closeWritingUserPreview()
  }, [params.userPreview, isWritingUserPreviewOpen, closeWritingUserPreview])

  useEffect(() => {
    if (isWritingUserPreviewOpen) return
    if (params.userPreview !== TEMPLATE_USER_PREVIEW_ACTIVE) return
    setParams({ userPreview: undefined } as Partial<T>)
  }, [isWritingUserPreviewOpen, params.userPreview, setParams])
}
