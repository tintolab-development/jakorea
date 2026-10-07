import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  renameFormTemplateByCode,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import {
  getUserCreatedWritingTemplateName,
  renameUserCreatedWritingTemplate,
} from '@/features/template/lib/user-created-writing-template-catalog'

type UseFormTemplateModalTitleArgs = {
  /** forms-surveys templateCode — 없으면 UI만 갱신 */
  templateCode?: string | null
  initialName: string
}

/**
 * 양식 상세 풀페이지 상단 제목(연필 편집) — 로컬 표시 + 원격 templateName PATCH.
 */
export function useFormTemplateModalTitle({
  templateCode,
  initialName,
}: UseFormTemplateModalTitleArgs) {
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(initialName)

  useEffect(() => {
    setDisplayName(initialName)
  }, [initialName, templateCode])

  const commitTitle = useCallback(
    (nextTitle: string) => {
      const next = nextTitle.trim()
      if (next === '') return
      const prev = displayName
      setDisplayName(next)

      const code = templateCode?.trim()
      if (code == null || code === '') return

      const prevLocalName = getUserCreatedWritingTemplateName(code)
      const localRenamed = renameUserCreatedWritingTemplate(code, next)
      if (!shouldUseFormsSurveysRemoteApi()) return

      void (async () => {
        try {
          await renameFormTemplateByCode(code, next)
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: formTemplateQueryKeys.writingSections(),
            }),
            queryClient.invalidateQueries({
              queryKey: formTemplateQueryKeys.issuanceSections(),
            }),
          ])
        } catch (error) {
          console.warn('[form-templates] rename failed', error)
          // 서버 ID가 없는 로컬 복제본은 세션 카탈로그 이름을 유지한다
          if (localRenamed && getFormTemplateVersionCacheEntry(code)?.templateId == null) return
          if (localRenamed && prevLocalName != null) {
            renameUserCreatedWritingTemplate(code, prevLocalName)
          }
          setDisplayName(prev)
        }
      })()
    },
    [displayName, queryClient, templateCode]
  )

  return { displayName, commitTitle, setDisplayName }
}
