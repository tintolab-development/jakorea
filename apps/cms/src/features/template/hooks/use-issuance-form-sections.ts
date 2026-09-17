import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getIssuanceFormSectionsRemote,
  getMockIssuanceFormSections,
} from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { useFormsSurveysRemoteEnabled } from '@/features/template/hooks/use-forms-surveys-remote-enabled'
import { ISSUANCE_FORM_SECTION_CATALOG } from '@/features/template/api/form-template-catalog'
import type { TemplateSection } from '@/features/template/model/template.schema'

function emptyIssuanceSections(): TemplateSection[] {
  return ISSUANCE_FORM_SECTION_CATALOG.map(section => ({
    key: section.key,
    title: section.title,
    description: section.description,
    rows: [],
  }))
}

export function useIssuanceFormSections() {
  const remoteEnabled = useFormsSurveysRemoteEnabled()

  const query = useQuery({
    queryKey: formTemplateQueryKeys.issuanceSections(),
    queryFn: getIssuanceFormSectionsRemote,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const sections = useMemo<TemplateSection[]>(() => {
    if (!remoteEnabled) {
      return getMockIssuanceFormSections()
    }
    if (query.isError || query.data == null) {
      return emptyIssuanceSections()
    }
    return query.data
  }, [remoteEnabled, query.isError, query.data])

  return {
    sections,
    isLoading: remoteEnabled && query.isLoading,
    isRemote: remoteEnabled && !query.isError && query.data != null,
    isMockCatalog: !remoteEnabled,
    isError: remoteEnabled && query.isError,
    error: remoteEnabled ? query.error : null,
  }
}
