import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import { GeminiRecruitmentInstitutionFields } from '@/features/program/gemini/ui/recruitment/gemini-recruitment-institution-fields'
import type { GeminiRecruitmentFormFieldValues } from '@/features/program/gemini/lib/recruitment/format-recruitment-fields'
import type { GeminiRecruitmentEducationForm } from '@/features/program/gemini/lib/recruitment/add-form-options'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const DEFAULT_VALUES: GeminiRecruitmentFormFieldValues = {
  title: '',
  announcementPublished: 'published',
  educationTargetLevels: [],
  educationTargetDetail: '',
  applicationPeriodStart: null,
  applicationPeriodEnd: null,
  trainingRequestPeriodStart: null,
  trainingRequestPeriodEnd: null,
  minStudentCount: 15,
  educationForm: 'online',
  inquiryContactName: '',
  inquiryTel: '',
  inquiryEmail: '',
  notesNotApplicable: false,
  notes: '',
  thumbnailFileName: null,
  programDescription: '',
  recruitmentGuide: '',
  applicationMethod: '',
  learningSupportContent: '',
  additionalContentMarkdown: '',
  attachmentFileNames: [],
}

/** Gemini 찾아가는 연수 모집 폼 — 참여 기관 모집 정보 단락 */
export function GeminiRecruitInstitutionInfoParagraph() {
  const [values, setValues] = useState<GeminiRecruitmentFormFieldValues>(DEFAULT_VALUES)
  const [applicationPeriod, setApplicationPeriod] = useState<[Dayjs | null, Dayjs | null] | null>(
    null
  )
  const [trainingRequestPeriod, setTrainingRequestPeriod] = useState<
    [Dayjs | null, Dayjs | null] | null
  >(null)

  const handleMinStudentCountChange = (raw: string) => {
    const trimmed = raw.trim()
    if (trimmed === '') {
      setValues(prev => ({ ...prev, minStudentCount: null }))
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    setValues(prev => ({
      ...prev,
      minStudentCount: Number.isFinite(parsed) && parsed >= 0 ? parsed : prev.minStudentCount,
    }))
  }

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode="edit">
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
            setValues(prev => ({
              ...prev,
              ...patch,
              educationForm:
                (patch.educationForm as GeminiRecruitmentEducationForm | undefined) ??
                prev.educationForm,
            }))
          }}
        />
      </DetailInfoForm>
    </div>
  )
}
