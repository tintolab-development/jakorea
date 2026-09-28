import { useMemo, useSyncExternalStore } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getMockWritingFormSections,
  getWritingFormSectionsRemote,
} from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { useFormsSurveysRemoteEnabled } from '@/features/template/hooks/use-forms-surveys-remote-enabled'
import { WRITING_FORM_SECTION_CATALOG } from '@/features/template/api/form-template-catalog'
import {
  getUserCreatedWritingTemplatesVersion,
  mergeUserCreatedWritingTemplates,
  subscribeUserCreatedWritingTemplates,
} from '@/features/template/lib/user-created-writing-template-catalog'
import type { TemplateSection } from '@/features/template/model/template.schema'

function emptyWritingSections(): TemplateSection[] {
  return WRITING_FORM_SECTION_CATALOG.map(section => ({
    key: section.key,
    title: section.title,
    description: section.description,
    rows: [],
  }))
}

export function useWritingFormSections() {
  const remoteEnabled = useFormsSurveysRemoteEnabled()
  const userCreatedVersion = useSyncExternalStore(
    subscribeUserCreatedWritingTemplates,
    getUserCreatedWritingTemplatesVersion,
    getUserCreatedWritingTemplatesVersion
  )

  const query = useQuery({
    queryKey: formTemplateQueryKeys.writingSections(),
    queryFn: getWritingFormSectionsRemote,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const sections = useMemo<TemplateSection[]>(() => {
    const base = !remoteEnabled
      ? getMockWritingFormSections()
      : query.isError || query.data == null
        ? emptyWritingSections()
        : query.data
    return mergeUserCreatedWritingTemplates(base)
  }, [remoteEnabled, query.isError, query.data, userCreatedVersion])

  return {
    sections,
    isLoading: remoteEnabled && query.isLoading,
    /** remote ON + 성공 */
    isRemote: remoteEnabled && !query.isError && query.data != null,
    /** remote OFF — FE mock 카탈로그 (로컬 개발용) */
    isMockCatalog: !remoteEnabled,
    isError: remoteEnabled && query.isError,
    error: remoteEnabled ? query.error : null,
  }
}
