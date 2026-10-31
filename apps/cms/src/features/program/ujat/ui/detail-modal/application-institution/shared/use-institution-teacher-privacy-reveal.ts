import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { unmaskOrganizationApplicationPrivacyRemote } from '@/features/program/general/api/applications-api-client'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'

/**
 * UJAT 기관 신청 상세 — 담당 교사 PII unmask.
 * unmask remote 응답을 organizationDetail 쿼리 캐시에 넣고, 화면은 그 캐시(SSOT)만 읽는다.
 */
export function useUjatInstitutionTeacherPrivacyReveal(input: {
  institutionId: string
  programId?: string | null
  accessItemLabel: string
}) {
  const { institutionId, programId, accessItemLabel } = input
  const queryClient = useQueryClient()

  const revealPersonalInfo = useCallback(
    async (reason: string) => {
      const programIdNumber = Number(programId)
      const dto = await unmaskOrganizationApplicationPrivacyRemote(
        institutionId,
        reason,
        Number.isFinite(programIdNumber) ? programIdNumber : undefined
      )
      return cacheProjectedProgramPrivacy(
        queryClient,
        ujatQueryKeys.organizationDetail(String(programId ?? ''), institutionId),
        programId ?? '',
        dto
      )
    },
    [institutionId, programId, queryClient]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
    programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId,
    resolveProgramRole: () => resolveSessionProgramRole(programId),
    resolveAccessItem: () => accessItemLabel,
    revealPersonalInfo,
    resetDeps: [institutionId],
    controlMode: 'headerStickyNoop',
  })

  return {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal,
    programPrivacyPending,
  }
}
