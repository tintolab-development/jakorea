/**
 * 신청 강사 상세 - 학력사항 / 경력사항 / 자격 및 면허 / 수상 및 수료 내역 / 자기소개 및 질문 답변
 */

import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  INSTRUCTOR_RESUME_NO_DATA,
  InstructorResumeCareerCardBody,
  InstructorResumeEducationCardBody,
  InstructorResumeQualificationsCardBody,
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
            {(d.awards?.length ?? 0) > 0 ? `${d.awards?.length}개` : INSTRUCTOR_RESUME_NO_DATA}
          </span>
        </h3>
        <div className="instructor-resume-card">
          {(d.awards?.length ?? 0) > 0 ? (
            d.awards?.map((item, idx) => (
              <div key={idx} className="instructor-resume-row">
                <span className="instructor-resume-row-left">{item.year ?? INSTRUCTOR_RESUME_NO_DATA}</span>
                <span className="instructor-resume-row-right instructor-resume-row-right--black">
                  {item.name ?? INSTRUCTOR_RESUME_NO_DATA}
                </span>
              </div>
            ))
          ) : (
            <p className="instructor-resume-empty">{INSTRUCTOR_RESUME_NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 자기소개 및 질문 답변 */}
      {showFreeWritingSections
        ? [
            { title: '1. 자기소개 및 지원동기', content: d.freeWriting1 },
            {
              title: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.',
              content: d.freeWriting2,
            },
            {
              title:
                '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.',
              content: d.freeWriting3,
            },
            {
              title:
                '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.',
              content: d.freeWriting4,
            },
          ].map((item, idx) => (
            <section
              key={idx}
              className="instructor-resume-section instructor-resume-section--free-writing"
            >
              <h3 className="instructor-resume-section-title instructor-resume-section-title--free-writing">
                {item.title}
              </h3>
              <div className="instructor-resume-free-writing-card">
                <p className="instructor-resume-free-writing-text">
                  {item.content != null && String(item.content).trim() !== ''
                    ? item.content
                    : INSTRUCTOR_RESUME_NO_DATA}
                </p>
              </div>
            </section>
          ))
        : null}
    </div>
  )
}
