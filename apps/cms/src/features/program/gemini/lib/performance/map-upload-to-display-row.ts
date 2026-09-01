import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { calculateInstructorCount } from './calculate-instructor-count'
import { calculatePaymentAmount } from './calculate-payment-amount'
import { calculateTrainingHours, formatDetailTimeText } from './calculate-training-hours'
import { buildPerformanceDuplicateKey } from './duplicate-key'
import { matchInstructorMemberId } from './match-instructor-member'
import { resolveTrainingMethod } from './resolve-training-method'
import type {
  GeminiPerformanceRow,
  GeminiPerformanceUploadRow,
} from '../../model/performance/types'

dayjs.extend(customParseFormat)

const DATE_FORMATS = ['YYYY-MM-DD', 'YYYY.M.D', 'YYYY. M. D', 'YYYY/MM/DD', 'M/D/YYYY'] as const

function parseTrainingDate(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  for (const format of DATE_FORMATS) {
    const parsed = dayjs(trimmed, format, true)
    if (parsed.isValid()) return parsed.format('YYYY-MM-DD')
  }

  const loose = dayjs(trimmed)
  return loose.isValid() ? loose.format('YYYY-MM-DD') : trimmed
}

function createRowId(): string {
  return `gperf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export async function mapUploadToDisplayRow(
  upload: GeminiPerformanceUploadRow
): Promise<GeminiPerformanceRow> {
  const trainingDate = parseTrainingDate(upload.trainingDate)
  const classCount = upload.classCount
  const instructorMemberId = await matchInstructorMemberId(upload.instructorName, upload.contact)

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
    instructorMemberId,
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
