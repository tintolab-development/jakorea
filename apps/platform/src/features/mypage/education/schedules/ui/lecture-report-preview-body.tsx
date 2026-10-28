import type {
  FileAttachmentParagraph,
  LectureReportProgramProgressParagraph,
  WritingFormDraft,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
} from '@jakorea/form-schema/writing-form'
import { FillParagraphBody, FormTemplateHost } from '@jakorea/form-template-runtime'
import { resolveApplicationAnswerKey } from '@/features/program/lib/application-answer-key'
import type { LectureReportContent } from '../api/lecture-report-client'
import { lectureReportFilesForParagraph } from '../lib/lecture-report-preview-files'
import { LectureReportEducationPhotosPreview } from './lecture-report-education-photos-preview'
import styles from './lecture-report-preview-body.module.css'

type LectureReportPreviewBodyProps = {
  draft: WritingFormDraft
  content: LectureReportContent | null
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function text(value: unknown): string {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(item => text(item)).filter(Boolean).join(', ')
  return String(value).trim()
}

function displayValue(value: unknown): string {
  return text(value) || '-'
}

function answerFor(paragraph: WritingFormParagraph, content: LectureReportContent | null): unknown {
  const key = resolveApplicationAnswerKey(paragraph)
  return key && content?.answers ? content.answers[key] : undefined
}

function paragraphTitle(paragraph: WritingFormParagraph): string {
  return paragraph.paragraphTitle?.trim() || '문항'
}

function paragraphDescription(paragraph: WritingFormParagraph): string | null {
  const value = paragraph.paragraphDescription?.trim()
  return value && value !== '설명 입력' ? value : null
}

function answerObjectItems(paragraph: WritingFormParagraph, content: LectureReportContent | null) {
  const answer = record(answerFor(paragraph, content))
  return Array.isArray(answer.items) ? answer.items : []
}

function itemAnswer(
  paragraph: WritingFormParagraph,
  itemId: string,
  itemIndex: number,
  content: LectureReportContent | null,
): string {
  const directAnswer = answerFor(paragraph, content)
  if (typeof directAnswer === 'string' && itemIndex === 0) return directAnswer.trim()
  const items = answerObjectItems(paragraph, content)
  const byId = items.find(item => record(item).id === itemId)
  return text(record(byId).bodyText) || text(record(items[itemIndex]).bodyText)
}

function selectedLabels(
  paragraph: Extract<WritingFormParagraph, { kind: 'single_item'; variant: 'multiple_choice' }>,
  content: LectureReportContent | null,
): string[] {
  const answer = answerFor(paragraph, content)
  const selectedIds = paragraph.allowMultiple
    ? Array.isArray(answer) && answer.every(item => typeof item === 'string')
      ? answer
      : paragraph.selectedPreviewMultipleIds ?? []
    : typeof answer === 'string'
      ? [answer]
      : paragraph.selectedPreviewSingleId
        ? [paragraph.selectedPreviewSingleId]
        : []
  return paragraph.items.filter(item => selectedIds.includes(item.id)).map(item => item.label)
}

function ProgressTable({
  paragraph,
  content,
}: {
  paragraph: LectureReportProgramProgressParagraph
  content: LectureReportContent | null
}) {
  const answer = record(answerFor(paragraph, content))
  const value = (field: keyof LectureReportProgramProgressParagraph) =>
    text(answer[field]) || text(paragraph[field])
  const rows: Array<[string, string, string, string]> = [
    ['프로그램명', value('programName'), '사용교재 및 진행단원', [value('textbookName'), value('progressUnit')].filter(Boolean).join(' | ')],
    ['기관명', value('institutionName'), '기관 소재지', value('institutionLocation')],
    ['교육 진행일', value('educationDate'), '교육 진행 시간(차시)', [value('sessionTime'), value('sessionIndex')].filter(Boolean).join(' | ')],
    ['교육 대상', value('educationTarget'), '학급 및 학생 수', [value('classLabel'), value('studentCount')].filter(Boolean).join(' | ')],
  ]

  return (
    <table className={styles.infoTable}>
      <tbody>
        {rows.map(row => (
          <tr key={row[0]}>
            <th>{row[0]}</th>
            <td>{displayValue(row[1])}</td>
            <th>{row[2]}</th>
            <td>{displayValue(row[3])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SessionAnswer({
  paragraph,
  content,
}: {
  paragraph: Extract<WritingFormParagraph, { kind: 'single_item'; variant: 'short_essay' | 'session_plan_short_essay' }>
  content: LectureReportContent | null
}) {
  const items = paragraph.items ?? []
  if (items.length === 0) {
    const directAnswer = text(answerFor(paragraph, content))
    const answer = record(answerFor(paragraph, content))
    return <p className={styles.answerText}>{displayValue(directAnswer || text(answer.bodyText) || paragraph.bodyText)}</p>
  }

  return (
    <div className={styles.questionList}>
      {items.map((item, index) => (
        <article className={styles.questionCard} key={item.id}>
          <div className={styles.questionHeader}>
            <strong>{item.label || paragraphTitle(paragraph)}</strong>
            {'titleHint' in item && text(item.titleHint) ? <span>{text(item.titleHint)}</span> : null}
          </div>
          <p className={styles.answerText}>{displayValue(itemAnswer(paragraph, item.id, index, content) || item.bodyText)}</p>
        </article>
      ))}
    </div>
  )
}

function UserInfoAnswer({ paragraph, content }: { paragraph: WritingFormParagraph; content: LectureReportContent | null }) {
  if (!isUserInfoParagraph(paragraph)) return null
  const answer = record(answerFor(paragraph, content))
  const entries = getUserInfoSelectedEntries(paragraph)
  return (
    <dl className={styles.userInfoList}>
      {entries.map(entry => (
        <div key={entry.key}>
          <dt>{entry.label}</dt>
          <dd>{displayValue(answer[entry.key] ?? paragraph.fieldAnswers?.[entry.key])}</dd>
        </div>
      ))}
    </dl>
  )
}

function ParagraphBody({ paragraph, content }: { paragraph: WritingFormParagraph; content: LectureReportContent | null }) {
  if (paragraph.kind === 'single_item' && paragraph.variant === 'lecture_report_program_progress') {
    return <ProgressTable paragraph={paragraph} content={content} />
  }
  if (paragraph.kind === 'single_item' && (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay')) {
    return <SessionAnswer paragraph={paragraph} content={content} />
  }
  if (isUserInfoParagraph(paragraph)) return <UserInfoAnswer paragraph={paragraph} content={content} />

  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return <p className={styles.answerText}>{displayValue(selectedLabels(paragraph, content).join(', '))}</p>
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'scale_type') {
    const answer = answerFor(paragraph, content)
    const selectedId = typeof answer === 'string' ? answer : paragraph.selectedPreviewItemId
    return <p className={styles.answerText}>{displayValue(paragraph.items?.find(item => item.id === selectedId)?.label)}</p>
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'star_rate') {
    const answer = answerFor(paragraph, content)
    const stars = typeof answer === 'number' ? answer : paragraph.selectedPreviewStars ?? 0
    return <p className={styles.answerText}>{stars > 0 ? `${'★'.repeat(stars)}${'☆'.repeat(Math.max(0, 5 - stars))}` : '-'}</p>
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'date') {
    return <p className={styles.answerText}>{displayValue(answerFor(paragraph, content))}</p>
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'time') {
    return <p className={styles.answerText}>{displayValue(answerFor(paragraph, content))}</p>
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') {
    const files = lectureReportFilesForParagraph(paragraph, content)
    return (
      <LectureReportEducationPhotosPreview
        paragraph={paragraph as FileAttachmentParagraph}
        files={files}
      />
    )
  }
  if (paragraph.kind === 'description') {
    if (paragraph.variant === 'closing') return <p className={styles.answerText}>{displayValue(paragraph.body)}</p>
    if (paragraph.variant === 'static_description_lines') return <p className={styles.answerText}>{paragraph.lines.join('\n')}</p>
    return null
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
    return <p className={styles.answerText}>{displayValue(paragraph.bodyText)}</p>
  }
  if (paragraph.kind === 'single_item' && (paragraph.variant === 'horizontal_table' || paragraph.variant === 'vertical_table')) {
    return (
      <FormTemplateHost surface="platformUser">
        <FillParagraphBody paragraph={paragraph} interactionMode="preview" />
      </FormTemplateHost>
    )
  }
  return <p className={styles.answerText}>-</p>
}

export function LectureReportPreviewBody({ draft, content }: LectureReportPreviewBodyProps) {
  return (
    <div className={styles.body}>
      {draft.paragraphs.map(paragraph => {
        if (paragraph.kind === 'description' && paragraph.variant === 'system') return null
        if (paragraph.kind === 'description' && paragraph.variant === 'closing') {
          return <ParagraphBody key={paragraph.id} paragraph={paragraph} content={content} />
        }
        if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') {
          return (
            <ParagraphBody key={paragraph.id} paragraph={paragraph} content={content} />
          )
        }
        const description = paragraphDescription(paragraph)
        return (
          <section className={styles.section} key={paragraph.id}>
            <header className={styles.sectionHeader}>
              <h2>{paragraphTitle(paragraph)}</h2>
              {paragraph.requiredMark ? <span className={styles.required}>*</span> : null}
              {description ? <p>{description}</p> : null}
            </header>
            <div className={styles.sectionBody}>
              <ParagraphBody paragraph={paragraph} content={content} />
            </div>
          </section>
        )
      })}
    </div>
  )
}
