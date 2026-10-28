import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { resolveApplicationAnswerKey } from '@/features/program/lib/application-answer-key'
import type { LectureReportContent } from '../api/lecture-report-client'

export type LectureReportPreviewFile = LectureReportContent['files'][number]

export function lectureReportFilesForParagraph(
  paragraph: WritingFormParagraph,
  content: LectureReportContent | null,
): LectureReportPreviewFile[] {
  const all = content?.files ?? []
  if (all.length === 0) return []

  const key = resolveApplicationAnswerKey(paragraph)
  const keys = new Set<string>()
  if (key) keys.add(key)
  if (paragraph.id) keys.add(paragraph.id)

  const matched = all.filter(file => {
    const questionKey = file.questionKey?.trim()
    return questionKey != null && questionKey.length > 0 && keys.has(questionKey)
  })
  if (matched.length > 0) return matched

  if (
    paragraph.kind === 'single_item' &&
    paragraph.variant === 'file_attachment' &&
    paragraph.id === LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationPhotos
  ) {
    return all
  }

  return []
}
