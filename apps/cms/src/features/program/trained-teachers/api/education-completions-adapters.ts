import type { EducationCompletionResponse } from '@/shared/api/generated/dashboard/schemas/educationCompletionResponse'

export type TrainedTeacherEducationCompletionView = {
  completionId: string
  programId: string
  organizationApplicationId: string
  programScheduleId: string
  completionStatus: string
  studentCount: number
  maleCount: number
  femaleCount: number
  classCount: number
  evidenceSource: string
  completedAt: string
  cancelledAt: string
  cancelReason: string
  /** ACTIVE(미취소) 완료만 true — 실적 SSOT */
  isActiveCompletion: boolean
}

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

function toCount(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isCancelled(dto: EducationCompletionResponse): boolean {
  if (dto.cancelledAt) return true
  const status = dto.completionStatus?.trim().toUpperCase() ?? ''
  return status === 'CANCELLED' || status === 'CANCELED'
}

export function mapEducationCompletionResponseToView(
  dto: EducationCompletionResponse
): TrainedTeacherEducationCompletionView {
  const cancelled = isCancelled(dto)
  return {
    completionId: toId(dto.completionId),
    programId: toId(dto.programId),
    organizationApplicationId: toId(dto.organizationApplicationId),
    programScheduleId: toId(dto.programScheduleId),
    completionStatus: dto.completionStatus?.trim() || (cancelled ? 'CANCELLED' : 'COMPLETED'),
    studentCount: toCount(dto.studentCountSnapshot),
    maleCount: toCount(dto.maleCountSnapshot),
    femaleCount: toCount(dto.femaleCountSnapshot),
    classCount: toCount(dto.classCountSnapshot),
    evidenceSource: dto.evidenceSource?.trim() || '',
    completedAt: dto.completedAt ?? '',
    cancelledAt: dto.cancelledAt ?? '',
    cancelReason: dto.cancelReason?.trim() || '',
    isActiveCompletion: !cancelled,
  }
}

/** 활성 완료 건수 — 일지 제출 수와 혼동하지 않음 */
export function countActiveEducationCompletions(
  items: readonly TrainedTeacherEducationCompletionView[]
): number {
  return items.filter(item => item.isActiveCompletion).length
}
