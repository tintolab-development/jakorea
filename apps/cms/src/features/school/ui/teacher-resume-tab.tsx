/**
 * 교사 회원 상세 모달 — 강사 이력서 탭
 * applicant-instructor-detail-modal의 이력서 UI를 그대로 재사용
 */

import type {
  TeacherDetailData,
  TeacherResumeCareer,
  TeacherResumeEducation,
} from '@/data/mock/school-detail'
import '@/features/program/ui/applicant-instructor-detail-modal.css'

function getEducationLevelBadge(educationLevel?: string, schoolType?: string): string {
  const raw = schoolType ?? educationLevel ?? ''
  const map: Record<string, string> = {
    '4년제 졸업': '대학교 4년제', '2년제 졸업': '대학교 2년제', '고등학교 졸업': '고등학교',
    '4년제 휴학': '대학교 4년제', '4년제 중퇴': '대학교 4년제', '대학원': '대학원',
    '대학 4년제': '대학교 4년제', '대학 2・3년제': '대학교 2·3년제', '고등학교': '고등학교',
  }
  return map[raw] || raw || '-'
}

function formatEducationPeriod(item: TeacherResumeEducation): string {
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

function formatCareerPeriod(item: TeacherResumeCareer): string {
  const start = item.startDate
  if (!start) return '-'
  if (item.isCurrent) return `${start} ~ 재직중`
  const end = item.endDate
  if (!end) return start
  const years = getMonthsBetween(start, end) / 12
  const yearLabel = years >= 1 ? `(${Math.floor(years)}년)` : ''
  return `${start} ~ ${end}${yearLabel}`
}

function getTotalCareerYears(items: TeacherResumeCareer[] | undefined): number {
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
        ? (() => { const [y2, m2] = item.endDate!.split('.').map(Number); return { year: y2, month: m2 } })()
        : null
    if (!end) continue
    totalMonths += (end.year - y1) * 12 + (end.month - m1)
  }
  return Math.floor(totalMonths / 12)
}

export interface TeacherResumeTabProps {
  detail: TeacherDetailData
}

export function TeacherResumeTab({ detail }: TeacherResumeTabProps) {
  const NO_DATA = '데이터 없음'
  const totalCareerYears = getTotalCareerYears(detail.careerDetails)
  const educationBadge = detail.educations?.[0]?.schoolType != null
    ? getEducationLevelBadge(undefined, detail.educations[0].schoolType)
    : getEducationLevelBadge(detail.education)
  const hasEducation = (detail.educations?.length ?? 0) > 0 || detail.education

  return (
    <div className="applicant-instructor-detail-modal__resume applicant-instructor-detail-modal__resume--has-content">
      {/* 학력사항 */}
      <section className="applicant-instructor-detail-modal__resume-section">
        <h3 className="applicant-instructor-detail-modal__resume-section-title">
          학력사항
          <span className="applicant-instructor-detail-modal__resume-section-count">
            {hasEducation ? educationBadge : NO_DATA}
          </span>
        </h3>
        <div className="applicant-instructor-detail-modal__resume-card">
          {(detail.educations?.length ?? 0) > 0 ? (
            detail.educations?.map((item, idx) => {
              const period = formatEducationPeriod(item)
              const schoolLabel = item.schoolName
                ? [item.schoolName, item.schoolType ? `(${getEducationLevelBadge(undefined, item.schoolType)})` : ''].filter(Boolean).join(' ')
                : NO_DATA
              const majorPart = item.major ? ` | ${item.major}` : ''
              return (
                <div key={idx} className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career">
                  <span className="applicant-instructor-detail-modal__resume-row-left">{period || NO_DATA}</span>
                  <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                    <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">{schoolLabel}</span>
                    {majorPart ? <span className="applicant-instructor-detail-modal__resume-role">{majorPart}</span> : null}
                  </span>
                </div>
              )
            })
          ) : hasEducation ? (
            <div className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career">
              <span className="applicant-instructor-detail-modal__resume-row-left">-</span>
              <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">
                  {[detail.education, detail.university].filter(Boolean).join(' | ') || NO_DATA}
                </span>
              </span>
            </div>
          ) : (
            <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 경력사항 */}
      <section className="applicant-instructor-detail-modal__resume-section">
        <h3 className="applicant-instructor-detail-modal__resume-section-title">
          경력사항
          <span className="applicant-instructor-detail-modal__resume-section-count">
            {(detail.careerDetails?.length ?? 0) > 0 ? `${totalCareerYears}년` : NO_DATA}
          </span>
        </h3>
        <div className="applicant-instructor-detail-modal__resume-card">
          {(detail.careerDetails?.length ?? 0) > 0 ? (
            detail.careerDetails?.map((item, idx) => {
              const period = formatCareerPeriod(item)
              const isSingleYear = !period.includes(' ~ ')
              return (
                <div key={idx} className="applicant-instructor-detail-modal__resume-row applicant-instructor-detail-modal__resume-row--career">
                  <span className={'applicant-instructor-detail-modal__resume-row-left' + (isSingleYear ? ' applicant-instructor-detail-modal__resume-row-left--single-year' : '')}>
                    {period}
                  </span>
                  <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--with-divider">
                    {item.companyName || item.role ? (
                      <>
                        {item.companyName && <span className="applicant-instructor-detail-modal__resume-emphasis applicant-instructor-detail-modal__resume-emphasis--left">{item.companyName}</span>}
                        {item.companyName && item.role ? ' | ' : ''}
                        {item.role != null && item.role !== '' ? <span className="applicant-instructor-detail-modal__resume-role">{item.role}</span> : null}
                      </>
                    ) : NO_DATA}
                  </span>
                </div>
              )
            })
          ) : (
            <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 자격 및 면허 */}
      <section className="applicant-instructor-detail-modal__resume-section">
        <h3 className="applicant-instructor-detail-modal__resume-section-title">
          자격 및 면허
          <span className="applicant-instructor-detail-modal__resume-section-count">
            {(detail.qualifications?.length ?? 0) > 0 ? `${detail.qualifications?.length}개` : NO_DATA}
          </span>
        </h3>
        <div className="applicant-instructor-detail-modal__resume-card">
          {(detail.qualifications?.length ?? 0) > 0 ? (
            detail.qualifications?.map((item, idx) => (
              <div key={idx} className="applicant-instructor-detail-modal__resume-row">
                <span className="applicant-instructor-detail-modal__resume-row-left">{item.year ?? NO_DATA}</span>
                <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--black">
                  {item.name ? <span className="applicant-instructor-detail-modal__resume-emphasis">{item.name}</span> : NO_DATA}
                </span>
              </div>
            ))
          ) : (
            <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 수상 및 수료 내역 */}
      <section className="applicant-instructor-detail-modal__resume-section">
        <h3 className="applicant-instructor-detail-modal__resume-section-title">
          수상 및 수료 내역
          <span className="applicant-instructor-detail-modal__resume-section-count">
            {(detail.awards?.length ?? 0) > 0 ? `${detail.awards?.length}개` : NO_DATA}
          </span>
        </h3>
        <div className="applicant-instructor-detail-modal__resume-card">
          {(detail.awards?.length ?? 0) > 0 ? (
            detail.awards?.map((item, idx) => (
              <div key={idx} className="applicant-instructor-detail-modal__resume-row">
                <span className="applicant-instructor-detail-modal__resume-row-left">{item.year ?? NO_DATA}</span>
                <span className="applicant-instructor-detail-modal__resume-row-right applicant-instructor-detail-modal__resume-row-right--black">
                  {item.name ? <span className="applicant-instructor-detail-modal__resume-emphasis">{item.name}</span> : NO_DATA}
                </span>
              </div>
            ))
          ) : (
            <p className="applicant-instructor-detail-modal__resume-empty">{NO_DATA}</p>
          )}
        </div>
      </section>

      {/* 자유 작성 1~4 */}
      {[
        { title: '1. 자기소개 및 지원동기', content: detail.freeWriting1 },
        { title: '2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.', content: detail.freeWriting2 },
        { title: '3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.', content: detail.freeWriting3 },
        { title: '4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.', content: detail.freeWriting4 },
      ].map((item, idx) => (
        <section key={idx} className="applicant-instructor-detail-modal__resume-section applicant-instructor-detail-modal__resume-section--free-writing">
          <h3 className="applicant-instructor-detail-modal__resume-section-title applicant-instructor-detail-modal__resume-section-title--free-writing">
            {item.title}
          </h3>
          <div className="applicant-instructor-detail-modal__resume-free-writing-card">
            <p className="applicant-instructor-detail-modal__resume-free-writing-text">
              {item.content != null && String(item.content).trim() !== '' ? item.content : NO_DATA}
            </p>
          </div>
        </section>
      ))}
    </div>
  )
}
