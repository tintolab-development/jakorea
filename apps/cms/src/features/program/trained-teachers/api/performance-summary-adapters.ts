import type { TrainedTeacherPerformanceSummaryResponse } from '@/shared/api/generated/dashboard/schemas/trainedTeacherPerformanceSummaryResponse'

export type TrainedTeacherPerformanceSummaryView = {
  programId: string
  teacherTrainingEnabled: boolean
  educationJournalEnabled: boolean
  organizationApplicationCount: number
  teacherTrainingParticipantCount: number
  trainedTeacherCount: number
  studentCount: number
  classCount: number
  journalSubmittedCount: number
  journalNotSubmittedCount: number
  availableActions: string[]
}

function toCount(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

export function mapTrainedTeacherPerformanceSummary(
  dto: TrainedTeacherPerformanceSummaryResponse
): TrainedTeacherPerformanceSummaryView {
  return {
    programId: dto.programId != null ? String(dto.programId) : '',
    teacherTrainingEnabled: dto.teacherTrainingEnabled === true,
    educationJournalEnabled: dto.educationJournalEnabled === true,
    organizationApplicationCount: toCount(dto.organizationApplicationCount),
    teacherTrainingParticipantCount: toCount(dto.teacherTrainingParticipantCount),
    trainedTeacherCount: toCount(dto.trainedTeacherCount),
    studentCount: toCount(dto.studentCount),
    classCount: toCount(dto.classCount),
    journalSubmittedCount: toCount(dto.journalSubmittedCount),
    journalNotSubmittedCount: toCount(dto.journalNotSubmittedCount),
    availableActions: Array.isArray(dto.availableActions) ? dto.availableActions : [],
  }
}
