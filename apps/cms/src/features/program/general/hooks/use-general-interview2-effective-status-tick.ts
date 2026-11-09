import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  GENERAL_INTERVIEW2_STATUS_POLL_MS,
  getGeneralInterview2NextStatusTransitionDelayMs,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import {
  useInterview2EffectiveStatusTick,
  type UseInterview2EffectiveStatusTickOptions,
} from '@/features/program/shared/hooks/use-interview2-effective-status-tick'

/**
 * 배정 면접 종료 시각 경과에 따라 대기↔완료가 바뀌도록 주기적 재렌더.
 * 서버 필터 모드에서는 고정 주기 refetch로 목록·건수를 BE와 맞춘다.
 * @see apps/cms/.cursor/rules/process/general-volunteer-interview2-screening-status-spec.md
 */
export function useGeneralInterview2EffectiveStatusTick(
  rows: GeneralVolunteerApplicantRow[],
  options?: UseInterview2EffectiveStatusTickOptions
): void {
  useInterview2EffectiveStatusTick(rows, getGeneralInterview2NextStatusTransitionDelayMs, {
    ...options,
    serverRefetchIntervalMs: options?.serverRefetchIntervalMs ?? GENERAL_INTERVIEW2_STATUS_POLL_MS,
  })
}
