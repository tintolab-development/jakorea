import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { useGeneralProgramFormBindings } from '@/features/program/general/hooks/use-general-program-posts-surveys'
import {
  ensureProgramScopedOperationalBinding,
  resolveApplicationFormLoadSource,
} from '@/features/program/general/lib/sync-registration-form-bindings'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'

/**
 * 신청 양식 로드 소스.
 * - 기본(미리보기): form-bindings GET + resolve만 — PATCH/PUT 없음.
 * - `ensureScopedBinding: true`(양식 수정 모달): catalog → program-scoped 승격 시도.
 */
export function useProgramApplicationFormLoadSource(
  program: Program,
  variant: ProgramParticipantApplicationEditorVariant,
  options?: {
    ensureScopedBinding?: boolean
    /** 원격 프로그램은 binding 응답이 없을 때 local seed로 대체하지 않는다. */
    remoteStrict?: boolean
    /** @deprecated use ensureScopedBinding */
    attachLocalDrafts?: boolean
  }
) {
  const queryClient = useQueryClient()
  const templateCode = getTemplateIdForParticipantApplicationVariant(variant)
  const bindingsQuery = useGeneralProgramFormBindings(program.id)
  const catalogTemplateId = getFormTemplateVersionCacheEntry(templateCode)?.templateId
  const ensureScopedBinding =
    options?.ensureScopedBinding === true || options?.attachLocalDrafts === true
  const remoteStrict = options?.remoteStrict === true
  const [scopedSource, setScopedSource] = useState<{
    templateVersionId?: number
    preferLocalDraft: boolean
    unavailableReason?: string
  } | null>(null)

  useEffect(() => {
    if (!ensureScopedBinding) {
      setScopedSource(null)
      return
    }
    let cancelled = false
    void ensureProgramScopedOperationalBinding(program, templateCode, {
      strictRemote: remoteStrict,
    })
      .then(next => {
        if (cancelled) return
        setScopedSource(next)
        void queryClient.invalidateQueries({
          queryKey: generalProgramQueryKeys.formBindings(program.id),
        })
      })
      .catch(error => {
        if (cancelled) return
        setScopedSource({
          preferLocalDraft: false,
          unavailableReason:
            error instanceof Error ? error.message : '신청 양식을 불러오지 못했습니다.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [ensureScopedBinding, program, queryClient, remoteStrict, templateCode])

  const fallbackSource = resolveApplicationFormLoadSource({
    programId: program.id,
    program,
    templateCode,
    bindings: bindingsQuery.bindings,
    catalogTemplateId,
    strictRemote: remoteStrict,
  })
  const source = ensureScopedBinding && scopedSource != null ? scopedSource : fallbackSource
  const unavailableReason =
    remoteStrict && bindingsQuery.error != null
      ? '신청 양식 바인딩을 불러오지 못했습니다.'
      : source.unavailableReason

  return {
    templateCode,
    templateVersionId: source.templateVersionId,
    preferLocalDraft: remoteStrict ? false : source.preferLocalDraft,
    bindingsLoading: bindingsQuery.loading || (ensureScopedBinding && scopedSource == null),
    error: bindingsQuery.error,
    isRemoteDataSource: bindingsQuery.isRemoteDataSource,
    unavailableReason,
  }
}
