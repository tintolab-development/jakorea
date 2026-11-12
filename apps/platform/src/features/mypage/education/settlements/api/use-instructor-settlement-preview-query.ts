import { useQuery } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { getAccessToken } from '@/shared/lib/auth-token'
import {
  readInstructorTransportExclusion,
  type InstructorTransportExclusion,
} from '../lib/instructor-transport-exclusion.ts'
import {
  DEFAULT_INSTRUCTOR_EXPENSE_POLICIES,
  readInstructorExpensePolicies,
  type InstructorExpensePolicies,
} from '../lib/instructor-expense-items.ts'
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
  /** 식사비·활동비 신청 가능·한도·영수증 필요 여부 (K14). 받기 전에는 기존 동작 */
  const expensePolicies: InstructorExpensePolicies = query.isSuccess
    ? readInstructorExpensePolicies(query.data)
    : DEFAULT_INSTRUCTOR_EXPENSE_POLICIES
  /** 미리보기 차단 사유. 사업 운영 종료 후면 SETTLEMENT_BUSINESS_PERIOD_CLOSED (A1) */
  const blockerCode =
    query.isSuccess && typeof query.data?.blockerCode === 'string' && query.data.blockerCode.trim()
      ? query.data.blockerCode.trim().toUpperCase()
      : null
  return { enabled, transportExclusion, expensePolicies, blockerCode }
}
