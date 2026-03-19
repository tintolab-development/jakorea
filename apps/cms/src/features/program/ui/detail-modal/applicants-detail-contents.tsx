import { useState } from 'react'
import { Tabs, Space, Table, Empty } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import './applicants-detail-contents.css'

export type ApplicantType = 'institutions' | 'instructors' | 'volunteers'

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

  const isInstitution = type === 'institutions'
  const isInstructor = type === 'instructors'

  const institutionData = isInstitution ? (data as ApplicantSchoolRow) : null
  const instructorData = isInstructor ? (data as ApplicantInstructorRow) : null

  /** 신청 기관(참여자) 승인 완료: [승인 취소], [정보 수정], [정보상세 보기] */
  const isApprovedInstitution = isInstitution && institutionData?.approvalStatus === 'approved'

  /** 신청 강사 승인 완료: [승인 취소] [정보상세 보기] */
  const isApprovedInstructor = isInstructor && instructorData?.approvalStatus === 'approved'

  /** 신청 기관 반려: [반려 취소] [정보상세 보기] */
  const isRejectedInstitution = isInstitution && institutionData?.approvalStatus === 'rejected'

  /** 신청 강사 반려: [반려 취소] [정보상세 보기] */
  const isRejectedInstructor = isInstructor && instructorData?.approvalStatus === 'rejected'

  const renderInstitutionInfo = () => {
    if (!institutionData) return null
    return <ApplicantInstitutionBasicInfo institution={institutionData} />
  }

  const renderInstructorInfo = () => {
    if (!instructorData) return null
    const d = instructorData
    return (
      <div className="applicant-info-section applicant-info-section--instructor">
        <ApplicantInstructorBasicInfo
          instructor={d}
          maskSensitive={d.approvalStatus !== 'approved'}
        />
        <ApplicantInstructorResume instructor={d} />
      </div>
    )
  }

  const renderExtraTab = () => {
    if (isInstitution) {
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
    if (isApprovedInstitution) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton
            variant="danger"
            onClick={() => onCancelApproval?.(data.id)}
            disabled={!onCancelApproval}
            size="filter"
          >
            승인 취소
          </AppButton>
          <AppButton variant="primary" size="filter" disabled>
            정보 수정
          </AppButton>
          <AppButton variant="primary" size="filter" onClick={onBack}>
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
            size="filter"
          >
            승인 취소
          </AppButton>
          <AppButton variant="primary" size="filter" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isRejectedInstructor || isRejectedInstitution) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton
            variant="danger"
            onClick={() => onCancelReject?.(data.id)}
            disabled={!onCancelReject}
            size="filter"
          >
            반려 취소
          </AppButton>
          <AppButton variant="primary" size="filter" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isInstitution) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton variant="danger" size="filter" onClick={() => onReject(data.id)}>
            참여 반려
          </AppButton>
          <AppButton variant="cancel" size="filter" onClick={() => onApprove(data.id)}>
            참여 승인
          </AppButton>
          <AppButton variant="primary" size="filter" onClick={onBack}>
            정보상세 보기
          </AppButton>
        </Space>
      )
    }
    if (isInstructor) {
      return (
        <Space size="middle" className="applicant-contents__header-actions">
          <AppButton variant="danger" size="filter" onClick={() => onReject(data.id)}>
            참여 반려
          </AppButton>
          <AppButton variant="cancel" size="filter" onClick={() => onApprove(data.id)}>
            참여 승인
          </AppButton>
          <AppButton variant="primary" size="filter" onClick={onBack}>
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
              children: isInstitution ? renderInstitutionInfo() : renderInstructorInfo(),
            },
            {
              key: 'extra',
              label: isInstitution ? '학생 명단' : '강사 이력서',
              children: renderExtraTab(),
              disabled: isInstitution,
            },
          ]}
        />
      </div>
    </div>
  )
}
