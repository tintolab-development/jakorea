import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import {
  fetchPortalApplicationForm,
  fetchPortalApplicationOptions,
} from '../api/application-client'
import type { PortalApplicationOption } from '../api/application-types'
import {
  pickApplicationOption,
  type ProgramApplicationSelection,
} from '../api/pick-application-option'
import { getApplicationApiErrorCode } from '../lib/application-api-error'
import {
  resolveProgramApplyGateModal,
  type ProgramApplyGateModalKind,
} from '../lib/application-apply-gate'
import { parsePortalProgramId } from '../api/mappers'

export function useProgramApplyGate(
  programId: string | null | undefined,
  selection?: ProgramApplicationSelection | null,
) {
  const queryClient = useQueryClient()
  const [gateModal, setGateModal] = useState<ProgramApplyGateModalKind | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const readGateModalForOptions = useCallback(
    (canApply?: boolean, blockedReason?: string | null) => {
      const modal = resolveProgramApplyGateModal(canApply, blockedReason)
      return modal === 'proceed' ? null : modal
    },
    [],
  )

  const fetchSelectedOption = useCallback(async () => {
    const numericId = parsePortalProgramId(programId)
    if (numericId == null) return null
    const options = await queryClient.fetchQuery({
      queryKey: platformQueryKeys.program.applicationOptions(String(numericId)),
      queryFn: ({ signal }) => fetchPortalApplicationOptions(numericId, signal),
    })
    return pickApplicationOption(options, selection)
  }, [programId, queryClient, selection])

  /**
   * 일부 대상 불일치 응답은 application-options에서 canApply/blockedReason가
   * 완전히 내려오지 않고 form-bindings 조회에서 403으로 확정된다.
   * 신청서 화면으로 이동하기 전에 같은 모집 양식을 사전 조회해 이동 게이트를 완성한다.
   */
  const preflightSelectedForm = useCallback(
    async (option: PortalApplicationOption | null) => {
      const numericId = parsePortalProgramId(programId)
      const bindingId = option?.formBindingId
      const recruitmentId = option?.recruitmentId
      const applicationType = option?.applicationType?.trim()

      if (
        numericId == null ||
        bindingId == null ||
        recruitmentId == null ||
        !applicationType ||
        option?.canApply === true
      ) {
        return null
      }

      try {
        await queryClient.fetchQuery({
          queryKey: platformQueryKeys.program.applicationForm({
            programId: String(numericId),
            bindingId,
            recruitmentId,
            applicationType,
          }),
          queryFn: ({ signal }) =>
            fetchPortalApplicationForm(
              numericId,
              bindingId,
              { recruitmentId, applicationType },
              signal,
            ),
          retry: false,
          staleTime: 0,
        })
      } catch (error) {
        return readGateModalForOptions(undefined, getApplicationApiErrorCode(error))
      }

      return null
    },
    [programId, queryClient, readGateModalForOptions],
  )

  const runApplyGate = useCallback(
    async (onProceed: () => void) => {
      const remote = isRemoteApiConfigured()
      const numericId = parsePortalProgramId(programId)
      if (!remote || numericId == null || !getAccessToken()) {
        onProceed()
        return
      }

      setIsChecking(true)
      try {
        const option = await fetchSelectedOption()
        const modal = readGateModalForOptions(option?.canApply, option?.blockedReason ?? null)
        if (modal) {
          setGateModal(modal)
          return
        }

        const preflightModal = await preflightSelectedForm(option)
        if (preflightModal) {
          setGateModal(preflightModal)
          return
        }

        onProceed()
      } finally {
        setIsChecking(false)
      }
    },
    [fetchSelectedOption, preflightSelectedForm, programId, readGateModalForOptions],
  )

  const closeGateModal = useCallback(() => {
    setGateModal(null)
  }, [])

  return {
    gateModal,
    setGateModal,
    closeGateModal,
    isChecking,
    runApplyGate,
    readGateModalForOptions,
  }
}
