import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  renameFormTemplateByCode,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'

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
      if (code == null || code === '' || !shouldUseFormsSurveysRemoteApi()) {
        return
      }

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
          setDisplayName(prev)
        }
      })()
    },
    [displayName, queryClient, templateCode]
  )

  return { displayName, commitTitle, setDisplayName }
}
