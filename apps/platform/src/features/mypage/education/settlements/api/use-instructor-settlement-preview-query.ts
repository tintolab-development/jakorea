import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import {
  readInstructorTransportExclusion,
  type InstructorTransportExclusion,
} from '../lib/instructor-transport-exclusion.ts'
import { previewInstructorSettlementApplication } from './instructor-settlement-client.ts'

/**
 * 강사 지급조서 작성 화면의 교통비 제외 안내용 미리보기.
 * 오류(1사1교 409 주소 미확인, 503 지도 장애 등)는 여기서 알리지 않는다 — 제출 시 기존 오류 처리가 안내한다.
 */
export function useInstructorSettlementPreviewQuery(assignmentId: number | null | undefined) {
  const enabled =
    isRemoteApiConfigured() &&
    Boolean(getAccessToken()) &&
    assignmentId != null &&
    Number.isSafeInteger(assignmentId) &&
    assignmentId > 0
  const query = useQuery({
    queryKey: platformQueryKeys.mypage.instructorSettlementPreview(assignmentId ?? 0),
    queryFn: ({ signal }) => previewInstructorSettlementApplication(assignmentId!, signal),
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
  })
  const transportExclusion: InstructorTransportExclusion | null = query.isSuccess
    ? readInstructorTransportExclusion(query.data)
    : null
  return { enabled, transportExclusion }
}
