import type {
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '@/features/program/gemini/model/performance/types'
import type { GeminiTrainingReportImportRow } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportImportRow'
import type { GeminiTrainingReportItem } from '@/shared/api/generated/dashboard/schemas/geminiTrainingReportItem'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

/**
 * OpenAPI training-report item → FE 실적 행.
 * 장소·주제·보조강사 등 FE 전용 컬럼은 갭 필드를 기본값으로 채움.
 */
export function mapGeminiTrainingReportItemToRow(
  dto: GeminiTrainingReportItem,
  index: number
): GeminiPerformanceRow {
  const minutes = dto.trainingMinutes ?? 0
  const hours = minutes > 0 ? Math.round((minutes / 60) * 10) / 10 : 0
  return {
    id: toId(dto.trainingReportId),
    no: index + 1,
    createdAt: dto.createdAt ?? new Date().toISOString(),
    duplicateKey: `remote-${toId(dto.trainingReportId)}`,
    trainingLocation: dto.schoolOrOrganizationName?.trim() || '-',
    trainingDate: dto.trainingDate ?? '',
    participantCount: 0,
    detailTimeText: minutes > 0 ? `${minutes}분` : '-',
    trainingHours: hours,
    trainingTopic: dto.programNameKo?.trim() || '-',
    instructorName: dto.instructorName?.trim() || '-',
    assistantInstructorNames: '-',
    instructorCount: 1,
    trainingFormat: '-',
    trainingMethod: 'OFFLINE',
    contact: '',
    instructorMemberId:
      dto.instructorMemberId != null ? String(dto.instructorMemberId) : undefined,
    calculatedAmount: dto.calculatedAmount ?? null,
    classCount: dto.classCount ?? null,
  }
}

export function mapUploadAndDisplayToImportRow(
  upload: GeminiPerformanceUploadRow,
  display: GeminiPerformanceRow
): GeminiTrainingReportImportRow {
  const memberId = display.instructorMemberId ? Number(display.instructorMemberId) : undefined
  return {
    instructorMemberId:
      memberId != null && Number.isFinite(memberId) ? memberId : undefined,
    instructorEmail: upload.email.trim() || undefined,
    instructorPhone: upload.contact.trim() || undefined,
    instructorName: upload.instructorName.trim() || undefined,
    assistantInstructorNames: upload.assistantInstructorNames.trim() || undefined,
    trainingLocation: upload.trainingLocation.trim() || undefined,
    schoolOrOrganizationName: upload.school.trim() || undefined,
    trainingDate: display.trainingDate || undefined,
    trainingStartTime: upload.trainingStartTime.trim() || undefined,
    trainingEndTime: upload.trainingEndTime.trim() || undefined,
    trainingMinutes:
      display.trainingHours > 0 ? Math.round(display.trainingHours * 60) : undefined,
  }
}
