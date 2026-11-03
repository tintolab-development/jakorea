import { useCallback, useEffect, useRef, useState } from 'react'
import { clearRecipientCandidateQueries } from '@/features/notifications/api/recipient-candidates-cache'
import {
  readRecipientCandidatePrivacyFailure,
  recipientCandidatePrivacyMessage,
  type RecipientCandidatePrivacyFailure,
} from '@/features/notifications/model/shared/recipient-candidate-privacy'

/**
 * 수신자 후보 원문 조회 실패를 한 번만 고정한다.
 * 403·감사 실패 이후 자동 재조회는 하지 않는다.
 */
export function useRecipientCandidatePrivacyGate(input: {
  screenOpen: boolean
  programKey: string
  onFailure: (failure: RecipientCandidatePrivacyFailure) => void
}) {
  const onFailureRef = useRef(input.onFailure)
  onFailureRef.current = input.onFailure
  const [failure, setFailure] = useState<RecipientCandidatePrivacyFailure | null>(null)

  useEffect(() => {
    setFailure(null)
  }, [input.programKey, input.screenOpen])

  useEffect(() => {
    return () => {
      clearRecipientCandidateQueries()
    }
  }, [])

  useEffect(() => {
    if (input.screenOpen) return
    clearRecipientCandidateQueries()
  }, [input.screenOpen])

  useEffect(() => {
    if (!failure) return
    onFailureRef.current(failure)
    clearRecipientCandidateQueries()
  }, [failure])

  const report = useCallback((error: unknown) => {
    const next = readRecipientCandidatePrivacyFailure(error)
    if (!next) return false
    setFailure(current => current ?? next)
    return true
  }, [])

  return {
    failure,
    queryEnabled: failure == null,
    blockSelection: failure != null,
    blockSend: failure === 'audit-unavailable',
    notice: failure ? recipientCandidatePrivacyMessage(failure) : null,
    report,
  }
}

export function useReportRecipientCandidateQueryError(
  report: (error: unknown) => boolean,
  isError: boolean,
  error: unknown
) {
  useEffect(() => {
    if (!isError) return
    report(error)
  }, [error, isError, report])
}
