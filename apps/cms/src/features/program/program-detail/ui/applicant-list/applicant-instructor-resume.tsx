/**
 * 신청 강사 상세 - 학력사항 / 경력사항 / 자격 및 면허 / 수상 및 수료 내역 / 자기소개 및 질문 답변
 */

import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  InstructorResumeAwardsCardBody,
  InstructorResumeCareerCardBody,
  InstructorResumeEducationCardBody,
  InstructorResumeFreeWritingSections,
  InstructorResumeQualificationsCardBody,
  instructorAwardsSectionDescription,
  instructorCareerSectionDescription,
  instructorEducationSectionDescription,
  instructorQualificationsSectionDescription,
} from './instructor-resume-blocks'
import './applicant-instructor-resume.css'

export interface ApplicantInstructorResumeProps {
  instructor: ApplicantInstructorRow
  /** 자기소개/질문 답변 섹션 표시 여부 */
  showFreeWritingSections?: boolean
}

export function ApplicantInstructorResume({
  instructor: d,
  showFreeWritingSections = true,
}: ApplicantInstructorResumeProps) {
  return (
    <div className="applicant-instructor-resume">
      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          학력사항
          <span className="instructor-resume-section-count">
            {instructorEducationSectionDescription(d)}
          </span>
        </h3>
        <InstructorResumeEducationCardBody d={d} />
      </section>

      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          경력사항
          <span className="instructor-resume-section-count">
            {instructorCareerSectionDescription(d)}
          </span>
        </h3>
        <InstructorResumeCareerCardBody d={d} />
      </section>

      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          자격 및 면허
          <span className="instructor-resume-section-count">
            {instructorQualificationsSectionDescription(d)}
          </span>
        </h3>
        <InstructorResumeQualificationsCardBody d={d} />
      </section>

      {/* 수상 및 수료 내역 */}
      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          수상 및 수료 내역
          <span className="instructor-resume-section-count">
            {instructorAwardsSectionDescription(d)}
          </span>
        </h3>
        <InstructorResumeAwardsCardBody d={d} />
      </section>

      {/* 자기소개 및 질문 답변 */}
      {showFreeWritingSections ? <InstructorResumeFreeWritingSections d={d} /> : null}
    </div>
  )
}
