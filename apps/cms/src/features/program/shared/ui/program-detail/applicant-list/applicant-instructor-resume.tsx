/**
 * 신청 강사 상세 - 학력사항 / 경력사항 / 자격 및 면허 / 수상 및 수료 내역 / 자기소개 및 질문 답변
 */

import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
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

export interface ApplicantInstructorResumeProps {
  instructor: ApplicantInstructorRow
  /** 자기소개/질문 답변 섹션 표시 여부 */
  showFreeWritingSections?: boolean
}

function ResumeSectionTitle({ title, summary }: { title: string; summary: string }) {
  const trimmed = summary.trim()
  return (
    <h3 className="instructor-resume-section-title">
      {title}
      {trimmed ? <span className="instructor-resume-section-count">{trimmed}</span> : null}
    </h3>
  )
}

export function ApplicantInstructorResume({
  instructor: d,
  showFreeWritingSections = true,
}: ApplicantInstructorResumeProps) {
  const educationSummary = instructorEducationSectionDescription(d)
  const careerSummary = instructorCareerSectionDescription(d)
  const jaKoreaSummary = instructorJaKoreaSectionDescription(d)
  const qualificationSummary = instructorQualificationsSectionDescription(d)
  const awardsSummary = instructorAwardsSectionDescription(d)

  return (
    <div className="applicant-instructor-resume">
      <section className="instructor-resume-section">
        <ResumeSectionTitle title="학력사항" summary={educationSummary} />
        <InstructorResumeEducationCardBody d={d} />
      </section>

      <section className="instructor-resume-section">
        <ResumeSectionTitle title="경력사항" summary={careerSummary} />
        <InstructorResumeCareerCardBody d={d} />
      </section>

      <section className="instructor-resume-section">
        <ResumeSectionTitle title="JA Korea 활동 경험" summary={jaKoreaSummary} />
        <InstructorResumeJaKoreaCardBody d={d} />
      </section>

      <section className="instructor-resume-section">
        <ResumeSectionTitle title="자격 및 면허" summary={qualificationSummary} />
        <InstructorResumeQualificationsCardBody d={d} />
      </section>

      {/* 수상 및 수료 내역 */}
      <section className="instructor-resume-section">
        <ResumeSectionTitle title="수상 및 수료 내역" summary={awardsSummary} />
        <InstructorResumeAwardsCardBody d={d} />
      </section>

      {/* 자기소개 및 질문 답변 */}
      {showFreeWritingSections ? <InstructorResumeFreeWritingSections d={d} /> : null}
    </div>
  )
}
