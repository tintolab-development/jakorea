/**
 * 회원 상세 — 학력/경력/자격 (DetailInfoForm + 프로그램 신청 강사 이력 카드 재사용)
 */

import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  InstructorResumeAwardsCardBody,
  InstructorResumeCareerCardBody,
  InstructorResumeEducationCardBody,
  InstructorResumeFreeWritingSections,
  InstructorResumeJaKoreaCardBody,
  InstructorResumeQualificationsCardBody,
  instructorAwardsSectionDescription,
  instructorCareerSectionDescription,
  instructorEducationSectionDescription,
  instructorJaKoreaSectionDescription,
  instructorQualificationsSectionDescription,
} from '@/features/user/detail/ui/instructor-resume/blocks'
import '@/features/user/detail/ui/instructor-resume/resume.css'
import './instructor-resume-detail-forms.css'

function resumeSectionDescription(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return undefined
  return <span className="instructor-resume-section-count">{trimmed}</span>
}

/**
 * 소속 구분선(`**대학교 │ 경제학과`) 간격이 직군별로 다르다(시안):
 * - teacher: 교사 겸 강사 상세(학교(교사) 회원) 1×12 · 앞뒤 12
 * - instructor: 강사 상세·강사 권한 승인 상세 1×13 · 앞뒤 8
 */
export type InstructorResumeDetailFormsVariant = 'teacher' | 'instructor'

export function InstructorResumeDetailForms({
  instructor,
  variant = 'instructor',
}: {
  instructor: ApplicantInstructorRow
  variant?: InstructorResumeDetailFormsVariant
}) {
  const formClassName = `instructor-resume-detail-forms__form instructor-resume-detail-forms__form--${variant}`
  return (
    <>
      <DetailInfoForm
        title="학력사항"
        className={formClassName}
        description={resumeSectionDescription(instructorEducationSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeEducationCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="경력사항"
        className={`detail-info-form--gap ${formClassName}`}
        description={resumeSectionDescription(instructorCareerSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeCareerCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="JA Korea 활동 경험"
        className={`detail-info-form--gap ${formClassName}`}
        description={resumeSectionDescription(instructorJaKoreaSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeJaKoreaCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="자격 및 면허"
        className={`detail-info-form--gap ${formClassName}`}
        description={resumeSectionDescription(
          instructorQualificationsSectionDescription(instructor)
        )}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeQualificationsCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="수상 및 수료 내역"
        className={`detail-info-form--gap ${formClassName}`}
        description={resumeSectionDescription(instructorAwardsSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeAwardsCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="detail-info-form--gap detail-info-form--gap-bottom instructor-resume-detail-forms__free-writing">
        <InstructorResumeFreeWritingSections d={instructor} />
      </div>
    </>
  )
}
