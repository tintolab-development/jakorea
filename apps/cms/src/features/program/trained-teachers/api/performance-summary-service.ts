import { mapTrainedTeacherPerformanceSummary } from './performance-summary-adapters'
import type { TrainedTeacherPerformanceSummaryView } from './performance-summary-adapters'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { fetchTrainedTeacherPerformanceSummaryRemote } from './performance-summary-client'

function assertRemoteReady(): void {
  if (shouldUseTrainedTeacherProgramsRemoteApi()) return
  throw new Error(
    '교육받은 교사 API가 활성화되지 않았습니다. VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED 또는 trainedTeacherPrograms를 확인해 주세요.'
  )
}

/** remote OFF 시 빈 요약 — UI는 숨기거나 대시 표시 */
export function emptyTrainedTeacherPerformanceSummary(
  programId: string
): TrainedTeacherPerformanceSummaryView {
  return {
    programId,
    teacherTrainingEnabled: false,
    educationJournalEnabled: false,
    organizationApplicationCount: 0,
    teacherTrainingParticipantCount: 0,
    trainedTeacherCount: 0,
    studentCount: 0,
    classCount: 0,
    journalSubmittedCount: 0,
    journalNotSubmittedCount: 0,
    availableActions: [],
  }
}

export async function getTrainedTeacherPerformanceSummary(
  programId: string
): Promise<TrainedTeacherPerformanceSummaryView> {
  if (!shouldUseTrainedTeacherProgramsRemoteApi()) {
    return emptyTrainedTeacherPerformanceSummary(programId)
  }
  assertRemoteReady()
  const dto = await fetchTrainedTeacherPerformanceSummaryRemote(programId)
  return mapTrainedTeacherPerformanceSummary(dto)
}
