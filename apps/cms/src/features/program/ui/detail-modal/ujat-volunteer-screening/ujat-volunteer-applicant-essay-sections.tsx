import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import {
  UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES,
  formatUjatVolunteerEssayCellValue,
  type UjatEssayColumnKey,
} from '@/features/program/model/ujat-volunteer-screening-constants'
import '@/features/program/program-detail/ui/applicant-list/applicant-instructor-resume.css'

const ESSAY_KEYS: UjatEssayColumnKey[] = [
  'essayIntro',
  'essayEducationExperience',
  'essayNecessity',
  'essayJaExperience',
]

const INSTRUCTOR_RESUME_NO_DATA = '작성 내용이 없습니다.'

export interface UjatVolunteerApplicantEssaySectionsProps {
  applicant: UjatVolunteerApplicantRow
}

export function UjatVolunteerApplicantEssaySections({ applicant }: UjatVolunteerApplicantEssaySectionsProps) {
  return (
    <div className="instructor-resume-free-writing-stack ujat-volunteer-applicant-essay-sections">
      {ESSAY_KEYS.map(key => {
        const raw = applicant[key]
        const formatted = formatUjatVolunteerEssayCellValue(applicant.applicationType, raw)
        const text =
          formatted != null && String(formatted).trim() !== '' ? formatted : INSTRUCTOR_RESUME_NO_DATA
        return (
          <section
            key={key}
            className="instructor-resume-section instructor-resume-section--free-writing"
          >
            <div className="info-section-title">{UJAT_VOLUNTEER_ESSAY_COLUMN_TITLES[key]}</div>
            <div className="instructor-resume-free-writing-card">
              <p className="instructor-resume-free-writing-text">{text}</p>
            </div>
          </section>
        )
      })}
    </div>
  )
}
