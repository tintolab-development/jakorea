import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Space, Empty } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import { SchoolDetailStudentListSection } from '../../school-detail-student-list-section'
import { ApplicantInstitutionInstructorAssignTab } from './applicant-institution-instructor-assign-tab'
import './applicants-detail-contents.css'

export type ApplicantType = 'institutions' | 'instructors' | 'volunteers'

const DETAIL_TAB_PARAM = 'detailTab'

function parseDetailTabFromSearch(searchParams: URLSearchParams, type: ApplicantType): string {
  const t = searchParams.get(DETAIL_TAB_PARAM)
  if (type === 'institutions') {
    /** 학생 명단·강사 배정 현황 탭 비활성화 중 — 선택 가능한 탭은 기본 정보 뿐 */
    return 'info'
  }
  if (type === 'instructors') {
    if (t === 'extra') return 'extra'
    return 'info'
  }
  return 'info'
}

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
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(
    () => parseDetailTabFromSearch(searchParams, type),
    [searchParams, type]
  )

  const setActiveTab = useCallback(
    (key: string) => {
      const next = new URLSearchParams(searchParams)
      if (key === 'info') {
        next.delete(DETAIL_TAB_PARAM)
      } else {
        next.set(DETAIL_TAB_PARAM, key)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const isInstitution = type === 'institutions'
  const isInstructor = type === 'instructors'
  const isVolunteer = type === 'volunteers'

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

  const renderInstitutionStudentList = () => {
    if (!institutionData) return null
    return (
      <div className="extra-tab-content applicant-contents__student-list-tab">
        <SchoolDetailStudentListSection
          schoolId={institutionData.id}
          studentCount={institutionData.studentCount}
          readOnly={false}
          onViewDetail={() => {}}
          onSaveEdit={() => {}}
        />
      </div>
    )
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

  const renderInstructorResumeTab = () => {
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
        <Space size="small" className="applicant-contents__header-actions">
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
        <Space size="small" className="applicant-contents__header-actions">
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
        <Space size="small" className="applicant-contents__header-actions">
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
        <Space size="small" className="applicant-contents__header-actions">
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
        <Space size="small" className="applicant-contents__header-actions">
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

  if (isVolunteer) {
    return (
      <div className="applicant-contents">
        <div className="applicant-contents__tabs-wrap">
          <Tabs
            activeKey="info"
            items={[
              {
                key: 'info',
                label: '기본 정보',
                children: (
                  <div className="extra-tab-content">
                    <Empty description="준비 중입니다." />
                  </div>
                ),
              },
            ]}
            className="applicant-contents__tabs"
          />
        </div>
      </div>
    )
  }

  const institutionTabItems =
    institutionData != null
      ? [
          {
            key: 'info',
            label: '기본 정보',
            children: renderInstitutionInfo(),
          },
          {
            key: 'students',
            label: '학생 명단',
            children: renderInstitutionStudentList(),
            disabled: true,
          },
          {
            key: 'assign',
            label: '강사 배정 현황',
            children: (
              <ApplicantInstitutionInstructorAssignTab schoolName={institutionData.schoolName} />
            ),
            disabled: true,
          },
        ]
      : []

  const instructorTabItems = [
    {
      key: 'info',
      label: '기본 정보',
      children: renderInstructorInfo(),
    },
    {
      key: 'extra',
      label: '강사 이력서',
      children: renderInstructorResumeTab(),
    },
  ]

  return (
    <div className="applicant-contents">
      <div className="applicant-contents__tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="applicant-contents__tabs"
          tabBarExtraContent={renderHeaderButtons()}
          items={isInstitution ? institutionTabItems : instructorTabItems}
        />
      </div>
    </div>
  )
}
