/**
 * 참여 봉사자 상세 — 자유 작성 항목 (신청 당시 서술형 응답)
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  GENERAL_VOLUNTEER_ESSAY_COLUMN_TITLES,
  type GeneralEssayColumnKey,
} from '@/features/program/general/lib/volunteer-screening-constants'
import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import '@/features/user/detail/ui/instructor-resume/resume.css'

const NO_DATA = '작성 내용이 없습니다.'

function resolveEssayKeys(volunteer: ParticipatingVolunteerDetailRow): GeneralEssayColumnKey[] {
  const base: GeneralEssayColumnKey[] = ['essayIntro', 'essayEducationExperience', 'essayNecessity']
  if (!volunteer.hasJaVolunteerExperience) {
    return [...base, 'essayJaExperience']
  }
  return base
}

export interface ParticipatingVolunteerEssaySectionsProps {
  volunteer: ParticipatingVolunteerDetailRow
}

export function ParticipatingVolunteerEssaySections({
  volunteer,
}: ParticipatingVolunteerEssaySectionsProps) {
  const keys = resolveEssayKeys(volunteer)

  return (
    <div className="general-volunteer-applicant-essay-sections">
      {keys.map(key => {
        const raw = volunteer[key]
        const text = raw != null && String(raw).trim() !== '' ? raw : NO_DATA

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
