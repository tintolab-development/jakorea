import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'

/** `PATCH /api/admin/programs/{programId}/schedules/same-date` */
export type ProgramSameDateScheduleChangeRequest = {
  fromDate: string
  toDate: string
}

export type ProgramSameDateScheduleChangeResponse = {
  programId: number
  fromDate: string
  toDate: string
  changedScheduleIds: number[]
}

/**
 * 같은 날짜에 시작하는 참여 기관 교육 일정을 한 번에 옮긴다.
 * @see apps/cms/docs/api/program-same-date-institution-schedule-frontend-handoff-2026-10-02.md
 */
export async function patchProgramSchedulesSameDate(
  programId: string,
  body: ProgramSameDateScheduleChangeRequest
): Promise<ProgramSameDateScheduleChangeResponse> {
  return unwrapApiBody<ProgramSameDateScheduleChangeResponse>(
    await customInstance({
      url: `/api/admin/programs/${encodeURIComponent(programId)}/schedules/same-date`,
      method: 'PATCH',
      data: body,
    })
  )
}
