import dayjs from 'dayjs'
import type { TrainedTeachersEducationJournalEntry } from '@/data/mock/trained-teachers-institution-detail'
import type { EducationJournalResponse } from '@/shared/api/generated/dashboard/schemas/educationJournalResponse'

function toId(value: number | string | undefined): string {
  if (value == null) return ''
  return String(value)
}

export function mapEducationJournalResponseToEntry(
  dto: EducationJournalResponse,
  index: number
): TrainedTeachersEducationJournalEntry {
  const submittedAtRaw = dto.submittedAt ?? dto.createdAt ?? ''
  const submitted = submittedAtRaw ? dayjs(submittedAtRaw) : null
  const date = submitted?.isValid() ? submitted.format('YYYY.MM.DD') : ''
  const dayOfWeek = submitted?.isValid() ? submitted.format('dd') : ''
  const submittedAt = submitted?.isValid()
    ? submitted.format('YYYY.MM.DD HH:mm:ss')
    : submittedAtRaw

  return {
    id: toId(dto.journalId),
    no: index + 1,
    date,
    dayOfWeek,
    timeRange: '',
    roundOrScheduleLabel: dto.journalTitle?.trim() || undefined,
    fileName: dto.originalFilename?.trim() || dto.journalTitle?.trim() || `교육일지_${toId(dto.journalId)}`,
    submittedAt,
  }
}
