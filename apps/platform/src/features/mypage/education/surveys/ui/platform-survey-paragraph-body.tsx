import type {
  DateParagraph,
  FileAttachmentParagraph,
  LectureReportProgramProgressParagraph,
  MultipleChoiceParagraph,
  ScaleTypeParagraph,
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
  StarRateParagraph,
  TimeParagraph,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { getUserInfoSelectedEntries, isUserInfoParagraph } from '@jakorea/form-schema/writing-form'
import {
  FillParagraphBody,
  FormTemplateHost,
  type FormUpdateParagraph,
  VerticalTablePreviewBody,
  patchVerticalTableBottomConsent,
  patchVerticalTableCell,
  patchVerticalTableCompositeTime,
  patchVerticalTableFileNames,
  patchVerticalTableMultipleChoice,
} from '@jakorea/form-template-runtime'
import { SurveyDateField } from './fields/date-field'
import { SurveyFileAttachmentField } from './fields/file-attachment-field'
import { SurveyMultipleChoiceField } from './fields/multiple-choice-field'
import { SurveyScaleTypeField } from './fields/scale-type-field'
import { SurveyShortEssayField } from './fields/short-essay-field'
import { SurveyStarRateField } from './fields/star-rate-field'
import { SurveyTimeField } from './fields/time-field'
import { SurveyUserInfoField } from './fields/user-info-field'
import type { SurveySidecarState } from '../lib/survey-sidecar'
import { resolveApplicationAnswerKey } from '@/features/program/lib/application-answer-key'
import { LectureReportProgramProgressField } from '@/features/mypage/education/schedules/ui/lecture-report-program-progress-field'
export type { SurveySidecarState }

export type PlatformSurveyParagraphBodyProps = {
  paragraph: WritingFormParagraph
  programTitle: string
  onUpdateParagraph: FormUpdateParagraph
  sidecar: SurveySidecarState
  onSidecarChange: (next: SurveySidecarState) => void
  onFileAdd?: (paragraphId: string, files: File[], questionKey: string) => void
  onFileRemove?: (paragraphId: string, index: number, questionKey: string) => void
  uploadingFile?: boolean
  /** 설문자 정보 fieldKey → 표시값 (로그인·프로그램 컨텍스트) */
  userInfoValues?: Record<string, string>
  /** 공개 공유 설문처럼 설문자 정보를 직접 작성해야 할 때 */
  userInfoEditable?: boolean
  userInfoRequiredFieldKeys?: readonly string[]
  readOnly?: boolean
}

export function PlatformSurveyParagraphBody({
  paragraph,
  onUpdateParagraph,
  sidecar,
  onSidecarChange,
  onFileAdd,
  onFileRemove,
  uploadingFile = false,
  userInfoValues,
  userInfoEditable = false,
  userInfoRequiredFieldKeys,
  readOnly = false,
}: PlatformSurveyParagraphBodyProps) {
  if (isUserInfoParagraph(paragraph)) {
    const entries = getUserInfoSelectedEntries(paragraph)
    if (entries.length === 0) return null
    return (
      <SurveyUserInfoField
        entries={entries}
        values={userInfoEditable ? paragraph.fieldAnswers : userInfoValues}
        editable={userInfoEditable}
        requiredFieldKeys={userInfoRequiredFieldKeys}
        disabled={readOnly}
        onValueChange={
          userInfoEditable && !readOnly
            ? (key, value) =>
                onUpdateParagraph(paragraph.id, current =>
                  isUserInfoParagraph(current)
                    ? {
                        ...current,
                        fieldAnswers: { ...(current.fieldAnswers ?? {}), [key]: value },
                      }
                    : current
                )
            : undefined
        }
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return (
      <SurveyMultipleChoiceField
        paragraph={paragraph as MultipleChoiceParagraph}
        onUpdateParagraph={onUpdateParagraph}
        disabled={readOnly}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'scale_type') {
    return (
      <SurveyScaleTypeField
        paragraph={paragraph as ScaleTypeParagraph}
        onUpdateParagraph={onUpdateParagraph}
        disabled={readOnly}
      />
    )
  }

  if (
    paragraph.kind === 'single_item' &&
    (paragraph.variant === 'short_essay' || paragraph.variant === 'session_plan_short_essay')
  ) {
    return (
      <SurveyShortEssayField
        paragraph={paragraph as ShortEssayParagraph | SessionPlanShortEssayParagraph}
        onUpdateParagraph={onUpdateParagraph}
        disabled={readOnly}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'star_rate') {
    return (
      <SurveyStarRateField
        paragraph={paragraph as StarRateParagraph}
        onUpdateParagraph={onUpdateParagraph}
        disabled={readOnly}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'date') {
    return (
      <SurveyDateField
        paragraph={paragraph as DateParagraph}
        value={sidecar.dateValues[paragraph.id] ?? ''}
        onValueChange={next => {
          if (readOnly) return
          onSidecarChange({
            ...sidecar,
            dateValues: { ...sidecar.dateValues, [paragraph.id]: next },
          })
        }}
        disabled={readOnly}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'time') {
    return (
      <SurveyTimeField
        paragraph={paragraph as TimeParagraph}
        value={sidecar.timeValues[paragraph.id] ?? ''}
        onValueChange={next => {
          if (readOnly) return
          onSidecarChange({
            ...sidecar,
            timeValues: { ...sidecar.timeValues, [paragraph.id]: next },
          })
        }}
        disabled={readOnly}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') {
    return (
      <SurveyFileAttachmentField
        paragraph={paragraph as FileAttachmentParagraph}
        fileNames={sidecar.fileNames[paragraph.id] ?? []}
        onFileNamesChange={next => {
          if (readOnly) return
          onSidecarChange({
            ...sidecar,
            fileNames: { ...sidecar.fileNames, [paragraph.id]: next },
          })
        }}
        onFileAdd={next => {
          if (readOnly) return
          onFileAdd?.(paragraph.id, next, resolveApplicationAnswerKey(paragraph))
        }}
        onFileRemove={index => {
          if (readOnly) return
          onFileRemove?.(paragraph.id, index, resolveApplicationAnswerKey(paragraph))
        }}
        disabled={readOnly}
        uploading={uploadingFile}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'lecture_report_program_progress') {
    return (
      <LectureReportProgramProgressField
        paragraph={paragraph as LectureReportProgramProgressParagraph}
        onUpdateParagraph={onUpdateParagraph}
        readOnly={readOnly}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'vertical_table') {
    return (
      <FormTemplateHost surface="platformUser">
        <VerticalTablePreviewBody
          paragraph={paragraph}
          interactionMode={readOnly ? 'preview' : 'user'}
          onBottomConsentChange={value =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'vertical_table'
                ? patchVerticalTableBottomConsent(current, value)
                : current
            )
          }
          onCellChange={(rowIndex, stageIndex, value) =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'vertical_table'
                ? patchVerticalTableCell(current, rowIndex, stageIndex, value)
                : current
            )
          }
          onCompositeTimeChange={(rowIndex, stageIndex, value) =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'vertical_table'
                ? patchVerticalTableCompositeTime(current, rowIndex, stageIndex, value)
                : current
            )
          }
          onMultipleChoiceChange={(rowIndex, stageIndex, values) =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'vertical_table'
                ? patchVerticalTableMultipleChoice(current, rowIndex, stageIndex, values)
                : current
            )
          }
          onFileNamesChange={(rowIndex, stageIndex, fileNames) =>
            onUpdateParagraph(paragraph.id, current =>
              current.kind === 'single_item' && current.variant === 'vertical_table'
                ? patchVerticalTableFileNames(current, rowIndex, stageIndex, fileNames)
                : current
            )
          }
        />
      </FormTemplateHost>
    )
  }

  if (
    paragraph.kind === 'single_item' &&
    (paragraph.variant === 'horizontal_table' || paragraph.variant === 'agreement_explanation_text')
  ) {
    return (
      <FormTemplateHost surface="platformUser">
        <FillParagraphBody
          paragraph={paragraph}
          interactionMode={readOnly ? 'preview' : 'user'}
          onUpdateParagraph={readOnly ? undefined : onUpdateParagraph}
        />
      </FormTemplateHost>
    )
  }

  return null
}
