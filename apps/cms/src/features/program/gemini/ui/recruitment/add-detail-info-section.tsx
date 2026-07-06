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
    programDescription,
    setProgramDescription,
    recruitmentGuide,
    setRecruitmentGuide,
    applicationMethod,
    setApplicationMethod,
    learningSupportContent,
    setLearningSupportContent,
    attachmentFileNames,
    setAttachmentFileNames,
    editor,
    editorMinHeight,
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
    programDescription,
    recruitmentGuide,
    applicationMethod,
    learningSupportContent,
    additionalContentMarkdown: '',
    attachmentFileNames,
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
        editor={editor}
        editorMinHeight={editorMinHeight}
        onChange={patch => {
          if (patch.thumbnailFileName !== undefined) setThumbnailFileName(patch.thumbnailFileName)
          if (patch.programDescription != null) setProgramDescription(patch.programDescription)
          if (patch.recruitmentGuide != null) setRecruitmentGuide(patch.recruitmentGuide)
          if (patch.applicationMethod != null) setApplicationMethod(patch.applicationMethod)
          if (patch.learningSupportContent != null) {
            setLearningSupportContent(patch.learningSupportContent)
          }
          if (patch.attachmentFileNames != null) setAttachmentFileNames(patch.attachmentFileNames)
        }}
      />
    </DetailInfoForm>
  )
}

export const GEMINI_RECRUITMENT_DETAIL_SECTION_ID = GEMINI_RECRUITMENT_ADD_SECTION_IDS.detail
