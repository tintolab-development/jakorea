/**
 * UJAT 봉사자 신청 — 서류/최종 결과·담당자 평가 remote mutations
 * (일반 `admin-applications-service` 재사용, UJAT UI에서만 호출)
 */

import {
  submitGeneralVolunteerDocumentResult,
  submitGeneralVolunteerDocumentResultBulk,
  submitGeneralVolunteerFinalResult,
  submitGeneralVolunteerFinalResultBulk,
  updateGeneralVolunteerDocumentEvaluation,
  mapSecondInterviewStatusToFinalResultPayload,
  giveUpGeneralVolunteerApplication,
} from '@/features/program/general/api/admin-applications-service'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatSecondInterviewScreeningStatus } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export function assertUjatVolunteerMutationsRemoteReady(): void {
  if (shouldUseUjatApplicationsRemoteApi()) return
  throw new Error(
    'UJAT 신청 API가 활성화되지 않았습니다. applications 모듈·원격 JWT를 확인해 주세요.'
  )
}

export async function submitUjatVolunteerDocumentResultsRemote(
  applicationIds: string[],
  status: 'pass' | 'fail',
  reason?: string
): Promise<void> {
  assertUjatVolunteerMutationsRemoteReady()
  const payload = {
    result: status === 'pass' ? ('PASS' as const) : ('FAIL' as const),
    reason,
  }
  if (applicationIds.length === 1) {
    await submitGeneralVolunteerDocumentResult(applicationIds[0]!, payload)
    return
  }
  await submitGeneralVolunteerDocumentResultBulk(applicationIds, payload)
}

export async function updateUjatVolunteerDocumentEvaluationRemote(
  applicationId: string,
  managerSlot: 'A' | 'B',
  evaluation: UjatManagerEvaluation
): Promise<void> {
  assertUjatVolunteerMutationsRemoteReady()
  await updateGeneralVolunteerDocumentEvaluation(applicationId, managerSlot, evaluation)
}

export async function submitUjatVolunteerFinalResultsRemote(
  applicationIds: string[],
  status: Extract<
    UjatSecondInterviewScreeningStatus,
    'pass' | 'fail' | 'reserve1' | 'reserve2' | 'reserve3' | 'reserve4'
  >,
  reason?: string
): Promise<void> {
  assertUjatVolunteerMutationsRemoteReady()
  const payload = mapSecondInterviewStatusToFinalResultPayload(status, reason)
  if (applicationIds.length === 1) {
    await submitGeneralVolunteerFinalResult(applicationIds[0]!, payload)
    return
  }
  await submitGeneralVolunteerFinalResultBulk(applicationIds, payload)
}

export async function giveUpUjatVolunteerApplicationRemote(
  applicationId: string,
  reason: string
): Promise<void> {
  assertUjatVolunteerMutationsRemoteReady()
  await giveUpGeneralVolunteerApplication(applicationId, reason)
}
