/**
 * 교육받은 교사 — 참여 기관 상세 타입·표시 헬퍼.
 * 지망 일정·교육일지 행은 remote API. 시드 배열 없음.
 */

import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import type {
  ApplicantPreferredScheduleBlock,
  ApplicantPreferredScheduleSessionTime,
} from '@/features/program/shared/model/applicant-institution'

dayjs.extend(customParseFormat)

export type TrainedTeachersPreferredScheduleSessionTime = ApplicantPreferredScheduleSessionTime

export type TrainedTeachersPreferredScheduleBlock = ApplicantPreferredScheduleBlock

export type TrainedTeachersEducationJournalEntry = {
  id: string
  no: number
  date: string
  dayOfWeek: string
  timeRange: string
  roundOrScheduleLabel?: string
  fileName: string
  submittedAt: string
  fileUrl?: string
}

/** @deprecated remote ON에서는 ApplicantSchoolRow.preferredScheduleBlocks 사용 */
export function getTrainedTeachersPreferredScheduleBlocks(
  _institutionId: string
): TrainedTeachersPreferredScheduleBlock[] {
  void _institutionId
  return []
}

export function getTrainedTeachersEducationJournals(
  _institutionId: string
): TrainedTeachersEducationJournalEntry[] {
  void _institutionId
  return []
}

export function formatTrainedTeachersEducationJournalScheduleLabel(
  entry: TrainedTeachersEducationJournalEntry
): string {
  const datePart = `${entry.date.replace(/\./g, '. ')}(${entry.dayOfWeek})`.replace(/\s+/g, ' ')
  const parts = [datePart, entry.timeRange]
  if (entry.roundOrScheduleLabel?.trim()) {
    parts.push(entry.roundOrScheduleLabel.trim())
  }
  return parts.join(' | ')
}

const SUBMITTED_AT_PARSE_FORMATS = [
  'YYYY.MM.DD HH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD',
  'YYYY.MM.DD',
] as const

export function formatTrainedTeachersEducationJournalSubmittedDate(
  submittedAt: string
): string {
  const trimmed = submittedAt.trim()
  if (!trimmed) return '-'

  for (const format of SUBMITTED_AT_PARSE_FORMATS) {
    const parsed = dayjs(trimmed, format, true)
    if (parsed.isValid()) {
      return parsed.format('YYYY. MM. DD')
    }
  }

  const fallback = dayjs(trimmed)
  return fallback.isValid() ? fallback.format('YYYY. MM. DD') : trimmed
}
