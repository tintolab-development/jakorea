/**
 * 회원 상세 — 학력/경력/자격 (DetailInfoForm + 프로그램 신청 강사 이력 카드 재사용)
 */

import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  INSTRUCTOR_RESUME_NO_DATA,
  InstructorResumeAwardsCardBody,
  InstructorResumeCareerCardBody,
  InstructorResumeEducationCardBody,
  InstructorResumeFreeWritingSections,
  InstructorResumeQualificationsCardBody,
  instructorAwardsSectionDescription,
  instructorCareerSectionDescription,
  instructorEducationSectionDescription,
  instructorQualificationsSectionDescription,
} from '@/features/program/shared/ui/program-detail/applicant-list/instructor-resume-blocks'
import '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-resume.css'

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

export function InstructorResumeDetailForms({
  instructor,
}: {
  instructor: ApplicantInstructorRow
}) {
  return (
    <>
      <DetailInfoForm
        title="학력사항"
        headerNote={resumeSectionDescriptionNode(instructorEducationSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeEducationCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="경력사항"
        className="detail-info-form--gap"
        headerNote={resumeSectionDescriptionNode(instructorCareerSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeCareerCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="자격 및 면허"
        className="detail-info-form--gap"
        headerNote={resumeSectionDescriptionNode(
          instructorQualificationsSectionDescription(instructor)
        )}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeQualificationsCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="수상 및 수료 내역"
        className="detail-info-form--gap"
        headerNote={resumeSectionDescriptionNode(instructorAwardsSectionDescription(instructor))}
      >
        <DetailInfoForm.Row type="custom">
          <InstructorResumeAwardsCardBody d={instructor} />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="detail-info-form--gap detail-info-form--gap-bottom">
        <InstructorResumeFreeWritingSections d={instructor} />
      </div>
    </>
  )
}
