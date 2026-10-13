import { useCallback, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { fetchPortalApplicationOptions } from '../api/application-client'
import {
  pickApplicationOption,
  type ProgramApplicationSelection,
} from '../api/pick-application-option'
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
        onProceed()
      } finally {
        setIsChecking(false)
      }
    },
    [fetchSelectedOption, programId, readGateModalForOptions],
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
