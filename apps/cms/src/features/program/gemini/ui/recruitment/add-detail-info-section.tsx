import {
  GEMINI_RECRUITMENT_ADD_SECTION_IDS,
} from '../../lib/recruitment/add-form-options'
import type { useGeminiRecruitmentAddForm } from '../../hooks/use-gemini-recruitment-add-form'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { GeminiRecruitmentDetailFields } from './gemini-recruitment-detail-fields'

export type GeminiRecruitmentAddDetailInfoSectionProps = {
  form: ReturnType<typeof useGeminiRecruitmentAddForm>
}

export function GeminiRecruitmentAddDetailInfoSection({
  form,
}: GeminiRecruitmentAddDetailInfoSectionProps) {
  const {
    thumbnailFileName,
    setThumbnailFileName,
    thumbnailFileObjectId,
    setThumbnailFileObjectId,
    programDescription,
    setProgramDescription,
    recruitmentGuide,
    applicationMethod,
    learningSupportContent,
    additionalContentMarkdown,
    registerRichTextGetter,
    markRichTextTouched,
    attachmentFileNames,
    setAttachmentFileNames,
    attachmentFileObjectIds,
    setAttachmentFileObjectIds,
    title,
    announcementPublished,
    educationTargetLevels,
    educationTargetDetail,
    applicationPeriod,
    trainingRequestPeriod,
    minStudentCount,
    educationForm,
    inquiryContactName,
    inquiryTel,
    inquiryEmail,
    notesNotApplicable,
    notes,
  } = form

  const values = {
    title,
    announcementPublished,
    educationTargetLevels,
    educationTargetDetail,
    applicationPeriodStart: applicationPeriod?.[0]?.toISOString() ?? null,
    applicationPeriodEnd: applicationPeriod?.[1]?.toISOString() ?? null,
    trainingRequestPeriodStart: trainingRequestPeriod?.[0]?.toISOString() ?? null,
    trainingRequestPeriodEnd: trainingRequestPeriod?.[1]?.toISOString() ?? null,
    minStudentCount: minStudentCount ?? null,
    educationForm,
    inquiryContactName,
    inquiryTel,
    inquiryEmail,
    notesNotApplicable,
    notes,
    thumbnailFileName,
    thumbnailFileObjectId,
    programDescription,
    recruitmentGuide,
    applicationMethod,
    learningSupportContent,
    additionalContentMarkdown,
    attachmentFileNames,
    attachmentFileObjectIds,
  }

  return (
    <DetailInfoForm
      title="상세 정보"
      hideHeader
      mode="edit"
      className="program-registration-paragraph gemini-recruitment-add-form__detail-form"
    >
      <GeminiRecruitmentDetailFields
        mode="edit"
        values={values}
        richTextResetKey="gemini-recruitment-add"
        registerRichTextGetter={registerRichTextGetter}
        onRichTextEdit={markRichTextTouched}
        onChange={patch => {
          if (patch.thumbnailFileName !== undefined) setThumbnailFileName(patch.thumbnailFileName)
          if (patch.thumbnailFileObjectId !== undefined) {
            setThumbnailFileObjectId(patch.thumbnailFileObjectId)
          }
          if (patch.programDescription != null) setProgramDescription(patch.programDescription)
          if (patch.attachmentFileNames != null) setAttachmentFileNames(patch.attachmentFileNames)
          if (patch.attachmentFileObjectIds != null) {
            setAttachmentFileObjectIds(patch.attachmentFileObjectIds)
          }
        }}
      />
    </DetailInfoForm>
  )
}

export const GEMINI_RECRUITMENT_DETAIL_SECTION_ID = GEMINI_RECRUITMENT_ADD_SECTION_IDS.detail
