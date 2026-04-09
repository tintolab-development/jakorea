/**
 * 강사 이력서 — 학력/경력/자격 카드 본문 (신청 강사 상세·회원 상세 공용)
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

export const INSTRUCTOR_RESUME_NO_DATA = '데이터 없음'

export function getEducationLevelBadge(educationLevel?: string, schoolType?: string): string {
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

export function formatEducationPeriod(item: ApplicantInstructorEducationItem): string {
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

export function formatCareerPeriod(item: ApplicantInstructorCareerDetail): string {
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

export function getTotalCareerYears(items: ApplicantInstructorCareerDetail[] | undefined): number {
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

export function instructorEducationSectionDescription(d: ApplicantInstructorRow): string {
  const educationBadge =
    d.educations?.[0]?.schoolType != null
      ? getEducationLevelBadge(undefined, d.educations[0].schoolType)
      : getEducationLevelBadge(d.educationLevel)
  const hasEducation =
    (d.educations?.length ?? 0) > 0 || (d.educationLevel ?? d.educationSchoolName)
  return hasEducation ? educationBadge : INSTRUCTOR_RESUME_NO_DATA
}

export function instructorCareerSectionDescription(d: ApplicantInstructorRow): string {
  const totalCareerYears = getTotalCareerYears(d.careerDetails)
  return (d.careerDetails?.length ?? 0) > 0 ? `${totalCareerYears}년` : INSTRUCTOR_RESUME_NO_DATA
}

export function instructorQualificationsSectionDescription(d: ApplicantInstructorRow): string {
  return (d.qualifications?.length ?? 0) > 0 ? `${d.qualifications?.length}개` : INSTRUCTOR_RESUME_NO_DATA
}

export function InstructorResumeEducationCardBody({ d }: { d: ApplicantInstructorRow }) {
  const hasEducation =
    (d.educations?.length ?? 0) > 0 || (d.educationLevel ?? d.educationSchoolName)

  return (
    <div className="instructor-resume-card">
      {(d.educations?.length ?? 0) > 0 ? (
        d.educations?.map((item, idx) => {
          const period = formatEducationPeriod(item)
          const schoolLabel = item.schoolName
            ? [
                item.schoolName,
                item.schoolType ? `(${getEducationLevelBadge(undefined, item.schoolType)})` : '',
              ]
                .filter(Boolean)
                .join(' ')
            : INSTRUCTOR_RESUME_NO_DATA
          return (
            <div key={idx} className="instructor-resume-row instructor-resume-row--career">
              <span className="instructor-resume-row-left">{period || INSTRUCTOR_RESUME_NO_DATA}</span>
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
        <p className="instructor-resume-empty">{INSTRUCTOR_RESUME_NO_DATA}</p>
      )}
    </div>
  )
}

export function InstructorResumeCareerCardBody({ d }: { d: ApplicantInstructorRow }) {
  return (
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
                  INSTRUCTOR_RESUME_NO_DATA
                )}
              </span>
            </div>
          )
        })
      ) : (
        <p className="instructor-resume-empty">{INSTRUCTOR_RESUME_NO_DATA}</p>
      )}
    </div>
  )
}

export function InstructorResumeQualificationsCardBody({ d }: { d: ApplicantInstructorRow }) {
  return (
    <div className="instructor-resume-card">
      {(d.qualifications?.length ?? 0) > 0 ? (
        d.qualifications?.map((item, idx) => (
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
  )
}
