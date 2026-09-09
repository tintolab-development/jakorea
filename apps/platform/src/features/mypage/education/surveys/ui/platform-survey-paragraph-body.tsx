import type {
  DateParagraph,
  FileAttachmentParagraph,
  MultipleChoiceParagraph,
  ScaleTypeParagraph,
  ShortEssayParagraph,
  StarRateParagraph,
  TimeParagraph,
  UserInfoParagraph,
  WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { SurveyDateField } from './fields/date-field'
import { SurveyFileAttachmentField } from './fields/file-attachment-field'
import { SurveyMultipleChoiceField } from './fields/multiple-choice-field'
import { SurveyScaleTypeField } from './fields/scale-type-field'
import { SurveyShortEssayField } from './fields/short-essay-field'
import { SurveyStarRateField } from './fields/star-rate-field'
import { SurveyTimeField } from './fields/time-field'
import { SurveyUserInfoField } from './fields/user-info-field'
import type { SurveySidecarState } from '../lib/survey-sidecar'

export type { SurveySidecarState }

export type PlatformSurveyParagraphBodyProps = {
  paragraph: WritingFormParagraph
  programTitle: string
  onUpdateParagraph: FormUpdateParagraph
  sidecar: SurveySidecarState
  onSidecarChange: (next: SurveySidecarState) => void
  userInfoWriteField?: { key: string; label: string }
}

export function PlatformSurveyParagraphBody({
  paragraph,
  onUpdateParagraph,
  sidecar,
  onSidecarChange,
  userInfoWriteField,
}: PlatformSurveyParagraphBodyProps) {
  if (paragraph.kind === 'single_item' && paragraph.variant === 'user_info') {
    if (userInfoWriteField == null) return null
    return (
      <SurveyUserInfoField
        paragraph={paragraph as UserInfoParagraph}
        fieldKey={userInfoWriteField.key}
        label={userInfoWriteField.label}
        onUpdateParagraph={onUpdateParagraph}
        sidecar={sidecar}
        onSidecarChange={onSidecarChange}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return (
      <SurveyMultipleChoiceField
        paragraph={paragraph as MultipleChoiceParagraph}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'scale_type') {
    return (
      <SurveyScaleTypeField
        paragraph={paragraph as ScaleTypeParagraph}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'short_essay') {
    return (
      <SurveyShortEssayField
        paragraph={paragraph as ShortEssayParagraph}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'star_rate') {
    return (
      <SurveyStarRateField
        paragraph={paragraph as StarRateParagraph}
        onUpdateParagraph={onUpdateParagraph}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'date') {
    return (
      <SurveyDateField
        paragraph={paragraph as DateParagraph}
        value={sidecar.dateValues[paragraph.id] ?? ''}
        onValueChange={next => {
          onSidecarChange({
            ...sidecar,
            dateValues: { ...sidecar.dateValues, [paragraph.id]: next },
          })
        }}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'time') {
    return (
      <SurveyTimeField
        paragraph={paragraph as TimeParagraph}
        value={sidecar.timeValues[paragraph.id] ?? ''}
        onValueChange={next => {
          onSidecarChange({
            ...sidecar,
            timeValues: { ...sidecar.timeValues, [paragraph.id]: next },
          })
        }}
      />
    )
  }

  if (paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment') {
    return (
      <SurveyFileAttachmentField
        paragraph={paragraph as FileAttachmentParagraph}
        fileName={sidecar.fileNames[paragraph.id] ?? null}
        onFileNameChange={next => {
          onSidecarChange({
            ...sidecar,
            fileNames: { ...sidecar.fileNames, [paragraph.id]: next },
          })
        }}
      />
    )
  }

  return null
}
