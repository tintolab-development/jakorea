/**
 * 교육 진행 > 참여 봉사자 — Figma Popup / Multiple / w1200 (10014:42865)
 * 일반 프로그램 참여 봉사자 추가 등록 폼과 동일. UJAT은 recruitHalf만 붙인다.
 */

import { useQueryClient } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props'
import { ParticipatingVolunteerAddRegistrationModal } from '@/features/program/general/ui/participating-volunteer-add-registration-modal'
import { registerVolunteerParticipantRemote } from '@/features/program/general/api/program-progress-api-client'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { shouldUseProgramProgressHttpRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { parseUjatVolAddMemberIdParam } from '@/features/program/ujat/lib/ujat-program-detail-url'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { attachUjatProgressVolunteerRegisterContext } from './ujat-volunteer-participant-register-request'

/** 등록 submit 전 memberId 검증 — 단위 테스트용 export */
export function resolveVolunteerRegisterMemberId(memberId: string): number | null {
  const parsed = parseUjatVolAddMemberIdParam(memberId)
  return parsed == null ? null : Number(parsed)
}

export type UjatVolunteerAddRegistrationModalProps = {
  open: boolean
  memberId: string
  program: Program
  volunteerHalf: UjatVolunteerRecruitHalf
  educationRegionCode?: string | null
  onClose: () => void
  onComplete: (memberId: string) => void | Promise<void>
}

export function UjatVolunteerAddRegistrationModal({
  open,
  memberId,
  program,
  volunteerHalf,
  educationRegionCode,
  onClose,
  onComplete,
}: UjatVolunteerAddRegistrationModalProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()

  return (
    <ParticipatingVolunteerAddRegistrationModal
      open={open && Boolean(memberId)}
      memberId={memberId || null}
      programId={program.id}
      hideBasicInfoSection
      zIndex={1200}
      onClose={onClose}
      onConfirm={async request => {
        const numericMemberId = resolveVolunteerRegisterMemberId(memberId)
        if (numericMemberId == null) {
          showAlert({ title: '안내', content: '등록할 봉사자를 다시 선택해 주세요.' })
          throw new Error('invalid-member')
        }

        const remoteEnabled =
          shouldUseUjatApplicationsRemoteApi() || shouldUseProgramProgressHttpRemoteApi()
        if (!remoteEnabled) {
          notifyProgramApiUnavailable(
            'ujat-progress-volunteer-register',
            'UJAT 진행 현황 · 봉사자 추가 등록'
          )
          throw new Error('remote-unavailable')
        }

        try {
          await registerVolunteerParticipantRemote(
            program.id,
            attachUjatProgressVolunteerRegisterContext(
              request,
              volunteerHalf,
              educationRegionCode
            )
          )
          await queryClient.invalidateQueries({
            queryKey: ujatQueryKeys.volunteerApplicationsRoot(program.id),
          })
          await Promise.resolve(onComplete(memberId))
        } catch (error) {
          showAlert({
            title: '봉사자 등록 실패',
            content: getGeneralProgramApiErrorMessage(
              error,
              '봉사자 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.'
            ),
          })
          throw error
        }
      }}
    />
  )
}
