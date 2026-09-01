import {
  GEMINI_RECRUITMENT_ADD_SECTION_IDS,
} from '../../lib/recruitment/add-form-options'
import type { useGeminiRecruitmentAddForm } from '../../hooks/use-gemini-recruitment-add-form'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { GeminiRecruitmentInstitutionFields } from './gemini-recruitment-institution-fields'
import './add-institution-section.css'

export type GeminiRecruitmentAddInstitutionSectionProps = {
  form: ReturnType<typeof useGeminiRecruitmentAddForm>
}

export function GeminiRecruitmentAddInstitutionSection({
  form,
}: GeminiRecruitmentAddInstitutionSectionProps) {
  const {
    title,
    setTitle,
    announcementPublished,
    setAnnouncementPublished,
    educationTargetLevels,
    setEducationTargetLevels,
    educationTargetDetail,
    setEducationTargetDetail,
    applicationPeriod,
    setApplicationPeriod,
    trainingRequestPeriod,
    setTrainingRequestPeriod,
    handleMinStudentCountChange,
    educationForm,
    setEducationForm,
    inquiryContactName,
    setInquiryContactName,
    inquiryTel,
    setInquiryTel,
    inquiryEmail,
    setInquiryEmail,
    notesNotApplicable,
    setNotesNotApplicable,
    notes,
    setNotes,
    minStudentCount,
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
    thumbnailFileName: null,
    programDescription: '',
    recruitmentGuide: '',
    applicationMethod: '',
    learningSupportContent: '',
    additionalContentMarkdown: '',
    attachmentFileNames: [],
  }

  return (
    <div className="gemini-recruitment-add-institution-section__forms">
      <DetailInfoForm
        title="참여 기관 모집 정보"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <GeminiRecruitmentInstitutionFields
          mode="edit"
          values={values}
          showAnnouncementRow
          applicationPeriod={applicationPeriod}
          onApplicationPeriodChange={setApplicationPeriod}
          trainingRequestPeriod={trainingRequestPeriod}
          onTrainingRequestPeriodChange={setTrainingRequestPeriod}
          onMinStudentCountChange={handleMinStudentCountChange}
          onChange={patch => {
            if (patch.title != null) setTitle(patch.title)
            if (patch.announcementPublished != null) {
              setAnnouncementPublished(patch.announcementPublished)
            }
            if (patch.educationTargetLevels != null) {
              setEducationTargetLevels(patch.educationTargetLevels)
            }
            if (patch.educationTargetDetail != null) {
              setEducationTargetDetail(patch.educationTargetDetail)
            }
            if (patch.educationForm != null) setEducationForm(patch.educationForm)
            if (patch.inquiryContactName != null) setInquiryContactName(patch.inquiryContactName)
            if (patch.inquiryTel != null) setInquiryTel(patch.inquiryTel)
            if (patch.inquiryEmail != null) setInquiryEmail(patch.inquiryEmail)
            if (patch.notesNotApplicable != null) setNotesNotApplicable(patch.notesNotApplicable)
            if (patch.notes != null) setNotes(patch.notes)
          }}
        />
      </DetailInfoForm>
    </div>
  )
}

export const GEMINI_RECRUITMENT_INSTITUTION_SECTION_ID =
  GEMINI_RECRUITMENT_ADD_SECTION_IDS.institution
