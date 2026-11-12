import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { cmsQueryKeys } from '@/shared/api/query-keys'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { fetchCertificateEligibility } from '@/features/program/shared/api/certificate-serial-api'
import { parseCertificateSerialInt64 } from '@/features/program/shared/lib/certificate-serial'
import type {
  ActivityCertificateEligibilityResponse,
  ActivityCertificateEligibilityType,
} from '@/features/program/general/lib/activity-certificate-period-hours'
import {
  ACTIVITY_CERTIFICATE_BLOCKED_TITLE,
  activityCertificateBlockMessage,
} from '@/features/program/general/lib/activity-certificate-issue-block'

/**
 * 활동인증서 [발급] 클릭 시 — 서버 발급 자격(`GET /api/admin/certificates/eligibility`)을 먼저 보고
 * 막히면 '활동인증서 발급 불가 안내' 팝업을 띄운다(수료증·참가인증서 발급 전 확인과 같은 흐름).
 * 조회 실패·ID 없음은 막지 않는다 — 발급 API가 최종 판정한다.
 * 미리보기의 참여기간·활동시수 조회와 같은 쿼리 키를 써서 응답을 다시 쓴다.
 */
export function useActivityCertificateIssuePrecheck() {
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()

  return useCallback(
    async (
      participantIdInput: string | number | null | undefined,
      certificateType: ActivityCertificateEligibilityType
    ): Promise<boolean> => {
      const participantId = parseCertificateSerialInt64(participantIdInput)
      if (participantId == null) return true
      try {
        const eligibility = await queryClient.fetchQuery({
          queryKey: cmsQueryKeys.certificates.eligibility(participantId, certificateType),
          queryFn: async () =>
            (await fetchCertificateEligibility({
              participantId,
              certificateType,
            })) as ActivityCertificateEligibilityResponse,
        })
        const blockMessage = activityCertificateBlockMessage(eligibility)
        if (blockMessage == null) return true
        showAlert({ title: ACTIVITY_CERTIFICATE_BLOCKED_TITLE, content: blockMessage })
        return false
      } catch {
        return true
      }
    },
    [queryClient, showAlert]
  )
}
