import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatUjatVolunteerEssayCellValue,
  type UjatEssayColumnKey,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import '@/features/user/detail/ui/instructor-resume/resume.css'

const ESSAY_KEYS: UjatEssayColumnKey[] = [
  'essayIntro',
  'essayEducationExperience',
  'essayNecessity',
  'essayJaExperience',
]

const INSTRUCTOR_RESUME_NO_DATA = '작성 내용이 없습니다.'

export interface EssaySectionsProps {
  applicant: UjatVolunteerApplicantRow
}

export function EssaySections({ applicant }: EssaySectionsProps) {
  if (applicant.hasEducationExperience) {
    return null
  }

  return (
    <div className="ujat-volunteer-applicant-essay-sections">
      {ESSAY_KEYS.map(key => {
        const raw = applicant[key]
        const formatted = formatUjatVolunteerEssayCellValue('new', raw)
        const text =
          formatted != null && String(formatted).trim() !== '' ? formatted : INSTRUCTOR_RESUME_NO_DATA
        return (
          <DetailInfoForm
            key={key}
            title={UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES[key]}
            mode="view"
            className="ujat-volunteer-applicant-essay-sections__item"
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
