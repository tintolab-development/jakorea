import { useState } from 'react'
import { Tabs, Descriptions, Tag, Radio, Space, Table, Empty } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import { ApprovalStatusBadge } from '@/shared/components/approval-status-badge'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-schools'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import './applicants-detail-contents.css'

export type ApplicantType = 'participants' | 'instructors' | 'volunteers'

interface ApplicantsDetailContentsProps {
  type: ApplicantType
  data: ApplicantSchoolRow | ApplicantInstructorRow
  onBack: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function ApplicantsDetailContents({
  type,
  data,
  onBack,
  onApprove,
  onReject,
}: ApplicantsDetailContentsProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'extra'>('info')
  const [selectedPreferredSchool, setSelectedPreferredSchool] = useState<string | null>(null)

  const isSchool = type === 'participants'
  const isInstructor = type === 'instructors'

  const schoolData = isSchool ? (data as ApplicantSchoolRow) : null
  const instructorData = isInstructor ? (data as ApplicantInstructorRow) : null

  // Title and subtitle
  const title = isSchool ? schoolData?.schoolName : instructorData?.instructorName
  const subtitle = isSchool ? '학교 상세 정보' : '강사 상세 정보'

  const renderSchoolInfo = () => {
    if (!schoolData) return null
    return (
      <div className="applicant-info-section">
        <div className="section-header">
          <h3 className="section-title">학교 기본 정보</h3>
          <AppButton variant="primary" size="small">수정</AppButton>
        </div>
        <Descriptions bordered column={2} size="middle" className="info-descriptions">
          <Descriptions.Item label="참여 학교명">{schoolData.schoolName}</Descriptions.Item>
          <Descriptions.Item label="지역">{schoolData.region}</Descriptions.Item>
          <Descriptions.Item label="대상 학년">{schoolData.educationGrade}</Descriptions.Item>
          <Descriptions.Item label="학급 수 및 전체 인원">
            {schoolData.classCount}개 학급 | 총 {schoolData.studentCount}명
          </Descriptions.Item>
          <Descriptions.Item label="담당 교사" span={2}>
            문의처 : {schoolData.teacherName} | Tel: {schoolData.contact || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="희망 교육 기간" span={2}>
            {schoolData.desiredEducationPeriod}
          </Descriptions.Item>
        </Descriptions>

        <div className="section-header" style={{ marginTop: '24px' }}>
          <h3 className="section-title">강의 및 교재 정보</h3>
        </div>
        <Descriptions bordered column={2} size="middle" className="info-descriptions">
          <Descriptions.Item label="강의 진행 회차">진행 전</Descriptions.Item>
          <Descriptions.Item label="교재명">프로그램 교재</Descriptions.Item>
          <Descriptions.Item label="교재 현황">
            <Tag color="default">준비 중</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="교재 준비 수량">{schoolData.studentCount}권</Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  const renderInstructorInfo = () => {
    if (!instructorData) return null
    return (
      <div className="applicant-info-section">
        <div className="instructor-info-layout">
          <div className="instructor-profile">
            <div className="profile-placeholder">
              {instructorData.profileImageUrl ? (
                <img src={instructorData.profileImageUrl} alt="프로필" />
              ) : (
                <span>No Image</span>
              )}
            </div>
          </div>
          <div className="instructor-table">
            <div className="section-header">
              <h3 className="section-title">강사 기본 정보</h3>
              <AppButton variant="primary" size="small">수정</AppButton>
            </div>
            <table className="native-info-table">
              <tbody>
                <tr>
                  <th rowSpan={2}>성명(한글/영문)</th>
                  <td>
                    <Space>
                      {instructorData.instructorName}
                      {instructorData.scheduleChangeCancelCount && instructorData.scheduleChangeCancelCount > 0 && (
                        <Tag color="success">일정 변경&취소 이력 {instructorData.scheduleChangeCancelCount}회</Tag>
                      )}
                    </Space>
                  </td>
                  <th>생년월일</th>
                  <td>{instructorData.birthDate} | 만 {instructorData.age}세</td>
                </tr>
                <tr>
                  <td>{instructorData.nameEnglish || '-'}</td>
                  <th>성별 및 병역사항</th>
                  <td>{instructorData.gender} | {instructorData.militaryStatus}</td>
                </tr>
                <tr>
                  <th>연락처</th>
                  <td>{instructorData.contact}</td>
                  <th>이메일</th>
                  <td>{instructorData.email}</td>
                </tr>
                <tr>
                  <th>주소</th>
                  <td>{instructorData.address}</td>
                  <th>정산 계좌 정보</th>
                  <td>
                    {instructorData.approvalStatus === 'approved' 
                      ? `${instructorData.bankName} ${instructorData.accountNumber} | ${instructorData.accountHolder}`
                      : `${instructorData.bankName} *********** | ${instructorData.instructorName?.charAt(0)}**`
                    }
                  </td>
                </tr>
                <tr>
                  <th>최종 학력</th>
                  <td>{instructorData.educationLevel} | {instructorData.educationSchoolName}</td>
                  <th>강사 경력</th>
                  <td>{instructorData.lectureExperienceYears}년</td>
                </tr>
                <tr>
                  <th>한 줄 소개</th>
                  <td colSpan={3}>{instructorData.oneLineIntro || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div className="section-header" style={{ marginTop: '24px' }}>
              <h3 className="section-title">희망 배정 학교</h3>
            </div>
            <div className="preferred-schools-grid">
              <Radio.Group 
                value={selectedPreferredSchool} 
                onChange={(e) => setSelectedPreferredSchool(e.target.value)}
                style={{ width: '100%' }}
              >
                <div className="radio-grid">
                  {instructorData.preferredSchools?.map((school) => (
                    <div key={school.schoolId} className="radio-item">
                      <Radio value={school.schoolId} disabled={!school.assignable}>
                        {school.rank}순위: {school.schoolName} ({school.assignable ? '배정 가능' : '배정 불가'})
                      </Radio>
                    </div>
                  ))}
                </div>
              </Radio.Group>
            </div>
          </div>
        </div>
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

  return (
    <div className="applicant-contents">
      <div className="applicant-contents__header">
        <div className="header-left">
          <div className="title-wrapper">
            <span className="subtitle">{subtitle}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 className="title">{title}</h2>
              <ApprovalStatusBadge status={data.approvalStatus} />
            </div>
          </div>
        </div>
        <div className="header-actions">
          <Space>
            <AppButton 
              variant="danger" 
              onClick={() => onReject(data.id)}
              disabled={isInstructor && !selectedPreferredSchool}
            >
              신청 반려
            </AppButton>
            <AppButton 
              variant="cancel" 
              onClick={onBack}
            >
              정보상세 보기
            </AppButton>
            <AppButton 
              variant="primary" 
              onClick={() => onApprove(data.id)}
              disabled={isInstructor && !selectedPreferredSchool}
            >
              선택 승인
            </AppButton>
          </Space>
        </div>
      </div>

      <div className="applicant-contents__tabs">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as any)}
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
