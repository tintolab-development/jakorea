import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatGeneralVolunteerEssayCellValue,
  type GeneralEssayColumnKey,
} from '@/features/program/general/lib/volunteer-screening-constants'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-resume.css'

const ESSAY_KEYS: GeneralEssayColumnKey[] = [
  'essayIntro',
  'essayEducationExperience',
  'essayNecessity',
  'essayJaExperience',
]

const NO_DATA = '작성 내용이 없습니다.'

export interface GeneralVolunteerApplicantEssaySectionsProps {
  applicant: GeneralVolunteerApplicantRow
}

export function GeneralVolunteerApplicantEssaySections({
  applicant,
}: GeneralVolunteerApplicantEssaySectionsProps) {
  if (applicant.applicationType === 'ujat-graduate') return null

  return (
    <div className="general-volunteer-applicant-essay-sections">
      {ESSAY_KEYS.map(key => {
        const raw = applicant[key]
        const formatted = formatGeneralVolunteerEssayCellValue(applicant.applicationType, raw)
        const text =
          formatted != null && String(formatted).trim() !== '' ? formatted : NO_DATA
        return (
          <DetailInfoForm
            key={key}
            title={GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES[key]}
            mode="view"
            className="general-volunteer-applicant-essay-sections__item"
          >
            <DetailInfoForm.Row type="custom">
              <div className="instructor-resume-free-writing-card">
                <p className="instructor-resume-free-writing-text">{text}</p>
              </div>
            </DetailInfoForm.Row>
          </DetailInfoForm>
        )
      })}
    </div>
  )
}
