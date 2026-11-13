import { useQuery } from '@tanstack/react-query'
import { cmsQueryKeys } from '@/shared/api/query-keys'
import { fetchCertificateEligibility } from '@/features/program/shared/api/certificate-serial-api'
import { parseCertificateSerialInt64 } from '@/features/program/shared/lib/certificate-serial'
import {
  resolveActivityCertificatePeriodHours,
  type ActivityCertificateEligibilityResponse,
  type ActivityCertificateEligibilityType,
  type ActivityCertificatePeriodHours,
} from '@/features/program/general/lib/activity-certificate-period-hours'

/**
 * 활동인증서 미리보기 — 참여자 1명 기준 `GET /api/admin/certificates/eligibility` 의
 * 참여기간·활동시수(서버 계산값)를 표시 문구로 돌려준다.
 * 조회 중·실패·필드 없음은 '-'. 발급 가능 여부·버튼 동작에는 쓰지 않는다.
 */
export function useActivityCertificatePeriodHours(input: {
  open: boolean
  participantId: string | number | null | undefined
  certificateType: ActivityCertificateEligibilityType
}): ActivityCertificatePeriodHours {
  const participantId = parseCertificateSerialInt64(input.participantId)
  const query = useQuery({
    queryKey: cmsQueryKeys.certificates.eligibility(participantId ?? 0, input.certificateType),
    queryFn: async () =>
      (await fetchCertificateEligibility({
        participantId: participantId as number,
        certificateType: input.certificateType,
      })) as ActivityCertificateEligibilityResponse,
    enabled: input.open && participantId != null,
  })
  return resolveActivityCertificatePeriodHours(query.isError ? null : query.data)
}
