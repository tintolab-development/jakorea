/**
 * 회원 상세 — 학력/경력/자격 (DetailInfoForm + 프로그램 신청 강사 이력 카드 재사용)
 */

import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  INSTRUCTOR_RESUME_NO_DATA,
  InstructorResumeCareerCardBody,
  InstructorResumeEducationCardBody,
  InstructorResumeQualificationsCardBody,
  instructorCareerSectionDescription,
  instructorEducationSectionDescription,
  instructorQualificationsSectionDescription,
} from '@/features/program/program-detail/ui/applicant-list/instructor-resume-blocks'
import '@/features/program/program-detail/ui/applicant-list/applicant-instructor-resume.css'
import './instructor-resume-detail-forms.css'

function resumeSectionDescriptionNode(text: string) {
  const empty = text === INSTRUCTOR_RESUME_NO_DATA
  return (
    <span
      className={
        empty
          ? 'instructor-resume-detail-forms__description instructor-resume-detail-forms__description--empty'
          : 'instructor-resume-detail-forms__description'
      }
    >
      {text}
    </span>
  )
}

export function InstructorResumeDetailForms({ instructor }: { instructor: ApplicantInstructorRow }) {
  return (
    <>
      <DetailInfoForm
        title="학력사항"
        description={resumeSectionDescriptionNode(instructorEducationSectionDescription(instructor))}
        className="instructor-resume-detail-forms__section"
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeEducationCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="경력사항"
        description={resumeSectionDescriptionNode(instructorCareerSectionDescription(instructor))}
        className="instructor-resume-detail-forms__section"
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeCareerCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="자격 및 면허"
        description={resumeSectionDescriptionNode(
          instructorQualificationsSectionDescription(instructor)
        )}
        className="instructor-resume-detail-forms__section"
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeQualificationsCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}
