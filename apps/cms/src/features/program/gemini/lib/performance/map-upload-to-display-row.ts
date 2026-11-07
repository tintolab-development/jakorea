import { calculateInstructorCount } from './calculate-instructor-count'
import { calculatePaymentAmount } from './calculate-payment-amount'
import { calculateTrainingHours, formatDetailTimeText } from './calculate-training-hours'
import { buildPerformanceDuplicateKey } from './duplicate-key'
import { toJavaLocalDate } from './import-wire-values'
import { resolveTrainingMethod } from './resolve-training-method'
import type {
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '../../model/performance/types'

function parseTrainingDate(raw: string): string {
  return toJavaLocalDate(raw) ?? ''
}

function createRowId(): string {
  return `gperf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function mapUploadToDisplayRow(
  upload: GeminiPerformanceUploadRow
): GeminiPerformanceRow {
  const trainingDate = parseTrainingDate(upload.trainingDate)
  const classCount = upload.classCount

  return {
    id: createRowId(),
    no: 0,
    createdAt: new Date().toISOString(),
    duplicateKey: buildPerformanceDuplicateKey({
      instructorName: upload.instructorName,
      contact: upload.contact,
      trainingDate,
      trainingLocation: upload.trainingLocation,
      trainingStartTime: upload.trainingStartTime,
    }),
    trainingLocation: upload.trainingLocation.trim(),
    trainingDate,
    participantCount: upload.participantCount ?? 0,
    detailTimeText: formatDetailTimeText(upload.trainingStartTime, upload.trainingEndTime),
    trainingHours: calculateTrainingHours(upload.trainingStartTime, upload.trainingEndTime),
    trainingTopic: '제미나이 아카데미',
    instructorName: upload.instructorName.trim(),
    assistantInstructorNames: upload.assistantInstructorNames.trim(),
    instructorCount: calculateInstructorCount(upload.assistantInstructorNames),
    trainingFormat: upload.trainingFormat.trim(),
    trainingMethod: resolveTrainingMethod(upload.trainingLocation),
    contact: upload.contact.trim(),
    calculatedAmount: calculatePaymentAmount(classCount),
    classCount,
  }
}

export function assignDisplayNumbers(rows: GeminiPerformanceRow[]): GeminiPerformanceRow[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const total = sorted.length
  return sorted.map((row, index) => ({
    ...row,
    no: total - index,
  }))
}
