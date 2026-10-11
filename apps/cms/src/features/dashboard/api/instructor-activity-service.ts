/**
 * 강사/봉사자 본인 활동 데이터 조회 API
 */

import type { UUID, Schedule } from '@/types'

export type MyProgramStatus = 'completed' | 'in_progress' | 'scheduled' | 'application_completed'

export interface InstructorActivitySummary {
  programs: {
    total: number
    applicationCompleted: number
    scheduled: number
    inProgress: number
    completed: number
  }
  schedules: {
    total: number
    upcoming: Schedule[]
  }
  pendingTasks: {
    reportPending: number
    settlementPending: number
    todoCount: number
    settlementTasks: Array<{
      id: string
      programId: string
      programTitle: string
      matchingId: string
    }>
  }
}

const EMPTY_SUMMARY: InstructorActivitySummary = {
  programs: {
    total: 0,
    applicationCompleted: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
  },
  schedules: { total: 0, upcoming: [] },
  pendingTasks: {
    reportPending: 0,
    settlementPending: 0,
    todoCount: 0,
    settlementTasks: [],
  },
}

export async function getInstructorActivitySummary(
  _instructorId: UUID
): Promise<InstructorActivitySummary> {
  return EMPTY_SUMMARY
}
