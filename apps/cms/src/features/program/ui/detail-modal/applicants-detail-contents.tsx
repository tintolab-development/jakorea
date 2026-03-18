import { useState } from 'react'
import { Tabs, Space, Table, Empty } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
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

  const isSchool = type === 'participants'
  const isInstructor = type === 'instructors'

  const schoolData = isSchool ? (data as ApplicantSchoolRow) : null
  const instructorData = isInstructor ? (data as ApplicantInstructorRow) : null

  const renderSchoolInfo = () => {
    if (!schoolData) return null
    return (
      <div className="applicant-info-section">
        {/* 학교 기본정보 */}
      </div>
    )
  }

  const renderInstructorInfo = () => {
    if (!instructorData) return null
    return (
      <div className="applicant-info-section">
        {/* 강사 기본정보 */}
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
        <div className="header-actions">
          <Space style={{ justifyContent: 'space-between' }}>
            <AppButton 
              variant="danger" 
              onClick={() => onReject(data.id)}
              disabled={isInstructor}
            >
              신청 반려
            </AppButton>
            <AppButton 
              variant="primary" 
              onClick={() => onApprove(data.id)}
              disabled={isInstructor}
            >
              선택 승인
            </AppButton>
            <AppButton 
              variant="cancel" 
              onClick={onBack}
            >
              정보상세 보기
            </AppButton>
          </Space>
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
    </div>
  )
}
