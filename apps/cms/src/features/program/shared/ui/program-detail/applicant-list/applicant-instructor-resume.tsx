/**
 * 신청 강사 상세 - 학력사항 / 경력사항 / 자격 및 면허 (+ full 시 JA·수상·자기소개)
 */

import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
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

export type ApplicantInstructorResumeLayout = 'application' | 'full'

export interface ApplicantInstructorResumeProps {
  instructor: ApplicantInstructorRow
  /**
   * application: 시안·참여 강사 신청정보와 동일 — 학력 / 경력 / 자격만
   * full: 회원 상세 등 — JA Korea · 수상 · 자기소개 포함
   */
  layout?: ApplicantInstructorResumeLayout
  /** @deprecated layout="application"이면 무시. full일 때만 적용 */
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
  layout = 'full',
  showFreeWritingSections = true,
}: ApplicantInstructorResumeProps) {
  const isApplicationLayout = layout === 'application'
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

      {isApplicationLayout ? null : (
        <section className="instructor-resume-section">
          <ResumeSectionTitle title="JA Korea 활동 경험" summary={jaKoreaSummary} />
          <InstructorResumeJaKoreaCardBody d={d} />
        </section>
      )}

      <section className="instructor-resume-section">
        <ResumeSectionTitle title="자격 및 면허" summary={qualificationSummary} />
        <InstructorResumeQualificationsCardBody d={d} />
      </section>

      {isApplicationLayout ? null : (
        <>
          <section className="instructor-resume-section">
            <ResumeSectionTitle title="수상 및 수료 내역" summary={awardsSummary} />
            <InstructorResumeAwardsCardBody d={d} />
          </section>
          {showFreeWritingSections ? <InstructorResumeFreeWritingSections d={d} /> : null}
        </>
      )}
    </div>
  )
}
