import { useState } from 'react'
import { Tabs, Space, Table, Empty } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-schools'
import type {
  ApplicantInstructorRow,
  ApplicantInstructorCareerDetail,
  ApplicantInstructorEducationItem,
} from '@/data/mock/applicant-instructors'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import './applicants-detail-contents.css'

const NO_DATA = '데이터 없음'

/** 학력사항 배지: schoolType 또는 educationLevel → "대학교 4년제" 등 */
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

/** 학력 한 건 기간: "YYYY.MM ~ YYYY.MM" */
function formatEducationPeriod(item: ApplicantInstructorEducationItem): string {
  const start = item.enrollmentYear
  const end = item.graduationYear
  if (!start) return '-'
  if (!end) return start
  return `${start} ~ ${end}`
}

/** 경력 한 건 기간: "YYYY.MM ~ 재직중" 또는 "YYYY.MM ~ YYYY.MM(N년)" */
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

function getMonthsBetween(from: string, to: string): number {
  const [y1, m1] = from.split('.').map(Number)
  const [y2, m2] = to.split('.').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

/** 경력 상세 배열에서 총 경력 연수 (재직중은 오늘까지) */
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

export type ApplicantType = 'participants' | 'instructors' | 'volunteers'

interface ApplicantsDetailContentsProps {
  type: ApplicantType
  data: ApplicantSchoolRow | ApplicantInstructorRow
  onBack: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  /** 신청 기관/강사 승인 완료 시 승인 취소 클릭 시 호출 */
  onCancelApproval?: (id: string) => void
  /** 신청 강사 반려 시 반려 취소 클릭 시 호출 (대기로 복원) */
  onCancelReject?: (id: string) => void
}

export function ApplicantsDetailContents({
  type,
  data,
  onBack,
  onApprove,
  onReject,
  onCancelApproval,
  onCancelReject,
}: ApplicantsDetailContentsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'extra'>('info')

  const isSchool = type === 'participants'
  const isInstructor = type === 'instructors'

  const schoolData = isSchool ? (data as ApplicantSchoolRow) : null
  const instructorData = isInstructor ? (data as ApplicantInstructorRow) : null

  /** 신청 기관(참여자) 승인 완료: [승인 취소], [정보 수정], [정보상세 보기] */
  const isApprovedSchool = isSchool && schoolData?.approvalStatus === 'approved'

  /** 신청 강사 승인 완료: [승인 취소] [정보상세 보기] */
  const isApprovedInstructor = isInstructor && instructorData?.approvalStatus === 'approved'

  /** 신청 강사 반려: [반려 취소] [정보상세 보기] */
  const isRejectedInstructor = isInstructor && instructorData?.approvalStatus === 'rejected'

  const renderSchoolInfo = () => {
    if (!schoolData) return null
    return <div className="applicant-info-section">{/* 학교 기본정보 */}</div>
  }

  const renderInstructorInfo = () => {
    if (!instructorData) return null
    const d = instructorData
    const totalCareerYears = getTotalCareerYears(d.careerDetails)
    const educationBadge =
      d.educations?.[0]?.schoolType != null
        ? getEducationLevelBadge(undefined, d.educations[0].schoolType)
        : getEducationLevelBadge(d.educationLevel)
    const hasEducation =
      (d.educations?.length ?? 0) > 0 || (d.educationLevel ?? d.educationSchoolName)

    return (
      <div className="applicant-info-section applicant-info-section--instructor">
        {/* 기본 정보 (학력사항 위) */}
        <ApplicantInstructorBasicInfo
          instructor={d}
          maskSensitive={d.approvalStatus !== 'approved'}
        />
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
                const majorPart = item.major ? ` | ${item.major}` : ''
                return (
                  <div key={idx} className="instructor-resume-row instructor-resume-row--career">
                    <span className="instructor-resume-row-left">{period || NO_DATA}</span>
                    <span className="instructor-resume-row-right instructor-resume-row-right--with-divider">
                      <span className="instructor-resume-emphasis">{schoolLabel}</span>
                      {majorPart ? (
                        <span className="instructor-resume-role">{majorPart}</span>
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
                    {[d.educationLevel, d.educationSchoolName].filter(Boolean).join(' | ') ||
                      NO_DATA}
                  </span>
                </span>
              </div>
            ) : (
              <p className="instructor-resume-empty">{NO_DATA}</p>
            )}
          </div>
        </section>

        {/* 2. 경력사항 */}
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
                          {item.companyName && item.role ? ' | ' : ''}
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

        {/* 3. 자격 및 면허 */}
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

        {/* 4. 수상 및 수료 내역 */}
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

        {/* 5. 자기소개 및 질문 답변 */}
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
                {item.content != null && String(item.content).trim() !== ''
                  ? item.content
                  : NO_DATA}
              </p>
            </div>
          </section>
        ))}
      </div>
    )
  }

  const renderExtraTab = () => {
    if (isSchool) {
      const columns = [
        { title: 'No.', dataIndex: 'no', key: 'no', width: 60 },
        { title: '이름', dataIndex: 'name', key: 'name' },
        { title: '학년/반', dataIndex: 'gradeClass', key: 'gradeClass' },
        { title: '연락처', dataIndex: 'contact', key: 'contact' },
        { title: '비고', dataIndex: 'notes', key: 'notes' },
      ]
      return (
        <div className="extra-tab-content">
          <div className="section-header">
            <h3 className="section-title">학생 명단</h3>
          </div>
          <Table
            columns={columns}
            dataSource={[]}
            locale={{ emptyText: <Empty description="등록된 학생이 없습니다." /> }}
            pagination={{ pageSize: 10 }}
          />
        </div>
      )
    }

    return (
      <div className="extra-tab-content">
        <div className="section-header">
          <h3 className="section-title">강사 이력서</h3>
        </div>
        <div className="resume-placeholder">
          <Empty description="강사 이력서 내용이 없습니다." />
        </div>
      </div>
    )
  }

  const renderHeaderButtons = () => {
    if (isApprovedSchool) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton
            variant="danger"
            onClick={() => onCancelApproval?.(data.id)}
            disabled={!onCancelApproval}
          >
            승인 취소
          </AppButton>
          <AppButton variant="primary" disabled>
            정보 수정
          </AppButton>
          <AppButton variant="primary" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isApprovedInstructor) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton
            variant="danger"
            onClick={() => onCancelApproval?.(data.id)}
            disabled={!onCancelApproval}
          >
            승인 취소
          </AppButton>
          <AppButton variant="primary" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isRejectedInstructor) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton
            variant="danger"
            onClick={() => onCancelReject?.(data.id)}
            disabled={!onCancelReject}
          >
            반려 취소
          </AppButton>
          <AppButton variant="primary" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isSchool) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton variant="danger" onClick={() => onReject(data.id)}>
            신청 반려
          </AppButton>
          <AppButton variant="primary" onClick={() => onApprove(data.id)}>
            선택 승인
          </AppButton>
          <AppButton variant="primary" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isInstructor) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton variant="danger" onClick={() => onReject(data.id)}>
            참여 반려
          </AppButton>
          <AppButton variant="cancel" onClick={() => onApprove(data.id)}>
            참여 승인
          </AppButton>
          <AppButton variant="primary" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    return null
  }

  return (
    <div className="applicant-contents">
      <div className="applicant-contents__tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as any)}
          className="applicant-contents__tabs"
          tabBarExtraContent={renderHeaderButtons()}
          items={[
            {
              key: 'info',
              label: '기본 정보',
              children: isSchool ? renderSchoolInfo() : renderInstructorInfo(),
            },
            {
              key: 'extra',
              label: isSchool ? '학생 명단' : '강사 이력서',
              children: renderExtraTab(),
            },
          ]}
        />
      </div>
    </div>
  )
}
