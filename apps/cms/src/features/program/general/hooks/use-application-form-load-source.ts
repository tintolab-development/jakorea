import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramFormBindings } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import {
  attachRegistrationFormDraftsToProgram,
  resolveApplicationFormLoadSource,
} from '@/features/program/general/lib/sync-registration-form-bindings'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'

export function useProgramApplicationFormLoadSource(
  program: Program,
  variant: ProgramParticipantApplicationEditorVariant,
  options?: { attachLocalDrafts?: boolean }
) {
  const queryClient = useQueryClient()
  const templateCode = getTemplateIdForParticipantApplicationVariant(variant)
  const bindingsQuery = useGeneralProgramFormBindings(program.id)
  const catalogTemplateId = getFormTemplateVersionCacheEntry(templateCode)?.templateId
  const source = resolveApplicationFormLoadSource({
    programId: program.id,
    templateCode,
    bindings: bindingsQuery.bindings,
    catalogTemplateId,
  })
  const attachLocalDrafts = options?.attachLocalDrafts === true

  useEffect(() => {
    if (!attachLocalDrafts) return
    void attachRegistrationFormDraftsToProgram(program).then(() => {
      void queryClient.invalidateQueries({
        queryKey: generalProgramQueryKeys.formBindings(program.id),
      })
    })
  }, [attachLocalDrafts, program, queryClient])

  return {
    templateCode,
    templateVersionId: source.templateVersionId,
    preferLocalDraft: source.preferLocalDraft,
    bindingsLoading: bindingsQuery.loading,
  }
}
