/**
 * 신청 강사 상세 - 학력사항 / 경력사항 / 자격 및 면허 / 수상 및 수료 내역 / 자기소개 및 질문 답변
 */

import type {
  ApplicantInstructorRow,
  ApplicantInstructorCareerDetail,
  ApplicantInstructorEducationItem,
} from '@/data/mock/applicant-instructors'
import {
  ProgramDetailTdDivider,
  withProgramDetailTdDivider,
} from '@/features/program/ui/program-detail-td-divider'
import './applicant-instructor-resume.css'

const NO_DATA = '데이터 없음'

function getEducationLevelBadge(educationLevel?: string, schoolType?: string): string {
  const raw = schoolType ?? educationLevel ?? ''
  const map: Record<string, string> = {
    '4년제 졸업': '대학교 4년제',
    '2년제 졸업': '대학교 2년제',
    '고등학교 졸업': '고등학교',
    '4년제 휴학': '대학교 4년제',
    '4년제 중퇴': '대학교 4년제',
    대학원: '대학원',
    '대학 4년제': '대학교 4년제',
    '대학 2・3년제': '대학교 2·3년제',
    고등학교: '고등학교',
    중학교: '중학교',
  }
  return map[raw] || raw || '-'
}

function formatEducationPeriod(item: ApplicantInstructorEducationItem): string {
  const start = item.enrollmentYear
  const end = item.graduationYear
  if (!start) return '-'
  if (!end) return start
  return `${start} ~ ${end}`
}

function getMonthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split('.').map(Number)
  const [y2, m2] = to.split('.').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

function formatCareerPeriod(item: ApplicantInstructorCareerDetail): string {
  const start = item.startDate
  if (!start) return '-'
  if (item.isCurrent) return `${start} ~ 재직중`
  const end = item.endDate
  if (!end) return start
  const months = getMonthsBetween(start, end)
  const years = Math.floor(months / 12)
  const yearLabel = years >= 1 ? `(${years}년)` : ''
  return `${start} ~ ${end}${yearLabel}`
}

function getTotalCareerYears(items: ApplicantInstructorCareerDetail[] | undefined): number {
  if (!items?.length) return 0
  const today = new Date()
  let totalMonths = 0
  for (const item of items) {
    const start = item.startDate
    if (!start) continue
    const [y1, m1] = start.split('.').map(Number)
    const end = item.isCurrent
      ? { year: today.getFullYear(), month: today.getMonth() + 1 }
      : item.endDate
        ? (() => {
            const [y2, m2] = item.endDate!.split('.').map(Number)
            return { year: y2, month: m2 }
          })()
        : null
    if (!end) continue
    totalMonths += (end.year - y1) * 12 + (end.month - m1)
  }
  return Math.floor(totalMonths / 12)
}

export interface ApplicantInstructorResumeProps {
  instructor: ApplicantInstructorRow
}

export function ApplicantInstructorResume({ instructor: d }: ApplicantInstructorResumeProps) {
  const totalCareerYears = getTotalCareerYears(d.careerDetails)
  const educationBadge =
    d.educations?.[0]?.schoolType != null
      ? getEducationLevelBadge(undefined, d.educations[0].schoolType)
      : getEducationLevelBadge(d.educationLevel)
  const hasEducation =
    (d.educations?.length ?? 0) > 0 || (d.educationLevel ?? d.educationSchoolName)

  return (
    <div className="applicant-instructor-resume">
      {/* 학력사항 */}
      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          학력사항
          <span className="instructor-resume-section-count">
            {hasEducation ? educationBadge : NO_DATA}
          </span>
        </h3>
        <div className="instructor-resume-card">
          {(d.educations?.length ?? 0) > 0 ? (
            d.educations?.map((item, idx) => {
              const period = formatEducationPeriod(item)
              const schoolLabel = item.schoolName
                ? [
                    item.schoolName,
                    item.schoolType
                      ? `(${getEducationLevelBadge(undefined, item.schoolType)})`
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                : NO_DATA
              return (
                <div key={idx} className="instructor-resume-row instructor-resume-row--career">
                  <span className="instructor-resume-row-left">{period || NO_DATA}</span>
                  <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                    <span className="instructor-resume-emphasis">{schoolLabel}</span>
                    {item.major ? (
                      <>
                        <ProgramDetailTdDivider />
                        <span className="instructor-resume-role">{item.major}</span>
                      </>
                    ) : null}
                  </span>
                </div>
              )
            })
          ) : hasEducation ? (
            <div className="instructor-resume-row instructor-resume-row--career">
              <span className="instructor-resume-row-left">-</span>
                <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                <span className="instructor-resume-emphasis">
                  {withProgramDetailTdDivider(
                    [d.educationLevel, d.educationSchoolName].filter(Boolean) as string[]
                  )}
                </span>
              </span>
            </div>
          ) : (
            <p className="instructor-resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 경력사항 */}
      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          경력사항
          <span className="instructor-resume-section-count">
            {(d.careerDetails?.length ?? 0) > 0 ? `${totalCareerYears}년` : NO_DATA}
          </span>
        </h3>
        <div className="instructor-resume-card">
          {(d.careerDetails?.length ?? 0) > 0 ? (
            d.careerDetails?.map((item, idx) => {
              const period = formatCareerPeriod(item)
              const isSingleYear = !period.includes(' ~ ')
              return (
                <div key={idx} className="instructor-resume-row instructor-resume-row--career">
                  <span
                    className={`instructor-resume-row-left ${isSingleYear ? 'instructor-resume-row-left--single-year' : ''}`}
                  >
                    {period}
                  </span>
                  <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                    {item.companyName || item.role ? (
                      <>
                        {item.companyName && (
                          <span className="instructor-resume-emphasis">{item.companyName}</span>
                        )}
                        {item.companyName && item.role ? <ProgramDetailTdDivider /> : null}
                        {item.role != null && item.role !== '' ? (
                          <span className="instructor-resume-role">{item.role}</span>
                        ) : null}
                      </>
                    ) : (
                      NO_DATA
                    )}
                  </span>
                </div>
              )
            })
          ) : (
            <p className="instructor-resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 자격 및 면허 */}
      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          자격 및 면허
          <span className="instructor-resume-section-count">
            {(d.qualifications?.length ?? 0) > 0 ? `${d.qualifications?.length}개` : NO_DATA}
          </span>
        </h3>
        <div className="instructor-resume-card">
          {(d.qualifications?.length ?? 0) > 0 ? (
            d.qualifications?.map((item, idx) => (
              <div key={idx} className="instructor-resume-row">
                <span className="instructor-resume-row-left">{item.year ?? NO_DATA}</span>
                <span className="instructor-resume-row-right instructor-resume-row-right--black">
                  {item.name ?? NO_DATA}
                </span>
              </div>
            ))
          ) : (
            <p className="instructor-resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 수상 및 수료 내역 */}
      <section className="instructor-resume-section">
        <h3 className="instructor-resume-section-title">
          수상 및 수료 내역
          <span className="instructor-resume-section-count">
            {(d.awards?.length ?? 0) > 0 ? `${d.awards?.length}개` : NO_DATA}
          </span>
        </h3>
        <div className="instructor-resume-card">
          {(d.awards?.length ?? 0) > 0 ? (
            d.awards?.map((item, idx) => (
              <div key={idx} className="instructor-resume-row">
                <span className="instructor-resume-row-left">{item.year ?? NO_DATA}</span>
                <span className="instructor-resume-row-right instructor-resume-row-right--black">
                  {item.name ?? NO_DATA}
                </span>
              </div>
            ))
          ) : (
            <p className="instructor-resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 자기소개 및 질문 답변 */}
      {[
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
              {item.content != null && String(item.content).trim() !== '' ? item.content : NO_DATA}
            </p>
          </div>
        </section>
      ))}
    </div>
  )
}
