import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getMockWritingFormSections,
  getWritingFormSectionsRemote,
} from '@/features/template/api/admin-form-templates-service'
import { formTemplateQueryKeys } from '@/features/template/api/form-template-query-keys'
import { useFormsSurveysRemoteEnabled } from '@/features/template/hooks/use-forms-surveys-remote-enabled'
import type { TemplateSection } from '@/features/template/model/template.schema'

export function useWritingFormSections() {
  const remoteEnabled = useFormsSurveysRemoteEnabled()

  const query = useQuery({
    queryKey: formTemplateQueryKeys.writingSections(),
    queryFn: getWritingFormSectionsRemote,
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
  })

  const sections = useMemo<TemplateSection[]>(() => {
    if (!remoteEnabled || query.isError || query.data == null) {
      return getMockWritingFormSections()
    }
    return query.data
  }, [remoteEnabled, query.isError, query.data])

  return {
    sections,
    isLoading: remoteEnabled && query.isLoading,
    isRemote: remoteEnabled && !query.isError && query.data != null,
    isError: remoteEnabled && query.isError,
  }
}
