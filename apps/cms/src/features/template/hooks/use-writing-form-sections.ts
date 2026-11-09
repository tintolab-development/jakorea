import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWritingFormSectionsRemote } from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { useFormsSurveysRemoteEnabled } from '@/features/template/hooks/use-forms-surveys-remote-enabled'
import { WRITING_FORM_SECTION_CATALOG } from '@/features/template/api/form-template-catalog'
import type { TemplateSection } from '@/features/template/model/template.schema'

function emptyWritingSections(): TemplateSection[] {
  return WRITING_FORM_SECTION_CATALOG.map(section => ({
    key: section.key,
    title: section.title,
    description: section.description,
    rows: [],
  }))
}

/**
 * 작성 양식(템플릿 관리) 목록. `GET /api/admin/form-templates`는 FORM_TEMPLATE_READ라 조회 전용 역할은 403이다.
 * 목록이 필요 없는 화면(예: 프로그램 상세 설문 관리의 조회 전용)은 `enabled: false`로 호출을 막는다.
 */
export function useWritingFormSections(options?: { enabled?: boolean }) {
  const remoteEnabled = useFormsSurveysRemoteEnabled() && (options?.enabled ?? true)

  const query = useQuery({
    queryKey: formTemplateQueryKeys.writingSections(),
    queryFn: getWritingFormSectionsRemote,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const sections = useMemo<TemplateSection[]>(() => {
    if (!remoteEnabled) return emptyWritingSections()
    if (query.isError || query.data == null) return emptyWritingSections()
    return query.data
  }, [remoteEnabled, query.isError, query.data])

  return {
    sections,
    isLoading: remoteEnabled && query.isLoading,
    isFetching: remoteEnabled && query.isFetching,
    isRemote: remoteEnabled && !query.isError && query.data != null,
    isFormsApiUnavailable: !remoteEnabled,
    isError: remoteEnabled && query.isError,
    error: remoteEnabled ? query.error : null,
  }
}
