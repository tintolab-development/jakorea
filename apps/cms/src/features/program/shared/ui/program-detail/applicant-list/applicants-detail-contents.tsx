import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Space, Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { CmsButton, type CmsButtonVariant } from '@/shared/ui'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import {
  PersonalInfoRevealButton,
  PERSONAL_INFO_REVEAL_BUTTON_LABEL,
} from '@/features/user/detail/ui/personal-info-reveal-button'
import { SchoolDetailStudentListSection } from '@/features/program/general/ui/school-detail-student-list-section'
import { ApplicantInstitutionInstructorAssignTab } from './applicant-institution-instructor-assign-tab'
import './applicants-detail-contents.css'

export type ApplicantType = 'institutions' | 'instructors' | 'volunteers'

const DETAIL_TAB_PARAM = 'detailTab'

/** 신청 강사 상세 — 탭 라벨·쿼리 키 */
const INSTRUCTOR_DETAIL_TAB_LABELS = {
  application: '신청 정보',
  institutionAssignment: '기관 배정 현황',
} as const

function parseDetailTabFromSearch(searchParams: URLSearchParams, type: ApplicantType): string {
  const t = searchParams.get(DETAIL_TAB_PARAM)
  if (type === 'institutions') {
    /** 학생 명단·강사 배정 현황 탭 비활성화 중 — 선택 가능한 탭은 기본 정보 뿐 */
    return 'info'
  }
  if (type === 'instructors') {
    /** 정산·게시글 탭 제거, 기관 배정은 비활성(선택 불가) — URL로 들어와도 신청 정보로 정규화 */
    if (t === 'application') {
      return 'application'
    }
    /** 이전 URL: detailTab=info | extra → 신청 정보 */
    return 'application'
  }
  return 'info'
}

type ApplicantHeaderActionItem = {
  key: string
  variant: CmsButtonVariant
  label: string
  disabled?: boolean
  onClick?: () => void
  /** 기본 `filter` — 개인정보 상세보기 등은 `filter-wide` */
  size?: 'filter' | 'filter-wide'
}

function ApplicantHeaderActionsExtra({
  items,
  personalInfoRevealed,
}: {
  items: ApplicantHeaderActionItem[]
  personalInfoRevealed: boolean
}) {
  return (
    <Space size="small" className="applicant-contents__header-actions">
      {items.map(a =>
        a.key === 'privacy' ? (
          <PersonalInfoRevealButton
            key={a.key}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant={a.variant}
            cmsSize="large"
            width={a.size === "filter-wide" ? 180 : 160}
            disabled={a.disabled}
            onClick={a.onClick ?? (() => {})}
          />
        ) : (
          <CmsButton
            key={a.key}
            variant={a.variant}
            size="large"
            width={a.size === "filter-wide" ? 180 : 160}
            disabled={a.disabled}
            onClick={a.onClick}
          >
            {a.label}
          </CmsButton>
        )
      )}
    </Space>
  )
}

/** 클릭 시 준비 중 안내(브라우저 alert) */
function headerBtnPrivacy(onRevealPersonalInfo: () => void): ApplicantHeaderActionItem {
  return {
    key: 'privacy',
    variant: 'primary',
    label: PERSONAL_INFO_REVEAL_BUTTON_LABEL.reveal,
    size: 'filter-wide',
    onClick: onRevealPersonalInfo,
  }
}

function headerBtnCancelApproval(
  applicantId: string,
  onCancelApproval?: (id: string) => void
): ApplicantHeaderActionItem {
  return {
    key: 'cancel-approval',
    variant: 'delete',
    label: '승인 취소',
    disabled: !onCancelApproval,
    onClick: () => onCancelApproval?.(applicantId),
  }
}

function headerBtnEditInfoDisabled(): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: 'primary',
    label: '정보 수정',
    disabled: true,
  }
}

/** 승인 완료 강사 — 정보 수정(기능 미구현, 클릭 시 안내) */
function headerBtnEditInfoPreparing(): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: 'primary',
    label: '정보 수정',
    onClick: () => window.alert('준비중'),
  }
}

function headerBtnCancelReject(
  applicantId: string,
  onCancelReject?: (id: string) => void
): ApplicantHeaderActionItem {
  return {
    key: 'cancel-reject',
    variant: 'delete',
    label: '반려 취소',
    disabled: !onCancelReject,
    onClick: () => onCancelReject?.(applicantId),
  }
}

function headerBtnsPendingParticipation(
  applicantId: string,
  onApprove: (id: string) => void,
  onReject: (id: string) => void,
  onRevealPersonalInfo: () => void
): ApplicantHeaderActionItem[] {
  return [
    {
      key: 'reject',
      variant: 'delete',
      label: '참여 반려',
      onClick: () => onReject(applicantId),
    },
    {
      key: 'approve',
      variant: 'secondary',
      label: '참여 승인',
      onClick: () => onApprove(applicantId),
    },
    headerBtnPrivacy(onRevealPersonalInfo),
  ]
}

function resolveApplicantHeaderItems(params: {
  applicantId: string
  isApprovedInstitution: boolean
  isApprovedInstructor: boolean
  isRejectedInstitution: boolean
  isRejectedInstructor: boolean
  isInstitution: boolean
  isInstructor: boolean
  onRevealPersonalInfo: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onCancelApproval?: (id: string) => void
  onCancelReject?: (id: string) => void
}): ApplicantHeaderActionItem[] | null {
  const {
    applicantId,
    isApprovedInstitution,
    isApprovedInstructor,
    isRejectedInstitution,
    isRejectedInstructor,
    isInstitution,
    isInstructor,
    onRevealPersonalInfo,
    onApprove,
    onReject,
    onCancelApproval,
    onCancelReject,
  } = params

  if (isApprovedInstitution) {
    return [
      headerBtnCancelApproval(applicantId, onCancelApproval),
      headerBtnEditInfoDisabled(),
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }
  if (isApprovedInstructor) {
    return [
      headerBtnCancelApproval(applicantId, onCancelApproval),
      headerBtnEditInfoPreparing(),
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }
  if (isRejectedInstructor || isRejectedInstitution) {
    return [
      headerBtnCancelReject(applicantId, onCancelReject),
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }
  if (isInstitution || isInstructor) {
    return headerBtnsPendingParticipation(applicantId, onApprove, onReject, onRevealPersonalInfo)
  }
  return null
}

interface ApplicantsDetailContentsProps {
  type: ApplicantType
  data: ApplicantSchoolRow | ApplicantInstructorRow
  /** 상위에서 전달 유지(향후 탭 복원 등). 신청 강사 상세에서는 미사용 */
  program?: Program | null
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
  onBack: _onBack,
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
      const defaultInstructor = type === 'instructors' && key === 'application'
      const defaultInstitution = type === 'institutions' && key === 'info'
      if (defaultInstructor || defaultInstitution) {
        next.delete(DETAIL_TAB_PARAM)
      } else {
        next.set(DETAIL_TAB_PARAM, key)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, type]
  )

  const isInstitution = type === 'institutions'
  const isInstructor = type === 'instructors'
  const isVolunteer = type === 'volunteers'

  const institutionData = isInstitution ? (data as ApplicantSchoolRow) : null
  const instructorData = isInstructor ? (data as ApplicantInstructorRow) : null

  /** 신청 기관(참여자) 승인 완료: [승인 취소], [정보 수정], [개인정보 상세보기] */
  const isApprovedInstitution = isInstitution && institutionData?.approvalStatus === 'approved'

  /** 신청 강사 승인 완료: [승인 취소] [정보 수정] [개인정보 상세보기] */
  const isApprovedInstructor = isInstructor && instructorData?.approvalStatus === 'approved'

  /** 신청 기관 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstitution = isInstitution && institutionData?.approvalStatus === 'rejected'

  /** 신청 강사 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstructor = isInstructor && instructorData?.approvalStatus === 'rejected'

  const applicantId = data.id

  const resolveApplicantPersonalInfoAccessItem = useCallback(() => {
    return isInstitution
      ? institutionData?.schoolName ?? '신청 기관 정보'
      : instructorData?.instructorName ?? '신청 강사 정보'
  }, [isInstitution, institutionData?.schoolName, instructorData?.instructorName])

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm: onRevealPersonalInfo,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolveApplicantPersonalInfoAccessItem,
    resetDeps: [applicantId],
    controlMode: 'headerStickyNoop',
  })

  const headerExtraContent = useMemo(() => {
    const items = resolveApplicantHeaderItems({
      applicantId,
      isApprovedInstitution,
      isApprovedInstructor,
      isRejectedInstitution,
      isRejectedInstructor,
      isInstitution,
      isInstructor,
      onRevealPersonalInfo,
      onApprove,
      onReject,
      onCancelApproval,
      onCancelReject,
    })
    if (!items) return null
    return <ApplicantHeaderActionsExtra items={items} personalInfoRevealed={personalInfoRevealed} />
  }, [
    applicantId,
    isApprovedInstitution,
    isApprovedInstructor,
    isRejectedInstitution,
    isRejectedInstructor,
    isInstitution,
    isInstructor,
    onRevealPersonalInfo,
    onApprove,
    onReject,
    onCancelApproval,
    onCancelReject,
    personalInfoRevealed,
  ])

  const tabBarExtraContent = useMemo(() => {
    if (isInstructor) {
      if (activeTab === 'application') return headerExtraContent
      return null
    }
    return headerExtraContent
  }, [isInstructor, activeTab, headerExtraContent])

  const institutionTabItems = useMemo(() => {
    if (!institutionData) return []
    const d = institutionData
    return [
      {
        key: 'info',
        label: '기본 정보',
        children: (
          <ApplicantInstitutionBasicInfo
            institution={d}
            detail={d.detail}
            maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
          />
        ),
      },
      {
        key: 'students',
        label: '학생 명단',
        children: (
          <div className="extra-tab-content applicant-contents__student-list-tab">
            <SchoolDetailStudentListSection
              schoolId={d.id}
              studentCount={d.studentCount}
              readOnly={false}
              onViewDetail={() => {}}
              onSaveEdit={() => {}}
            />
          </div>
        ),
        disabled: true,
      },
      {
        key: 'assign',
        label: '강사 배정 현황',
        children: <ApplicantInstitutionInstructorAssignTab schoolName={d.schoolName} />,
        disabled: true,
      },
    ]
  }, [institutionData, personalInfoRevealed])

  const instructorTabItems = useMemo(() => {
    if (!instructorData) return []
    const d = instructorData
    const assignedSchoolDisplay =
      d.assignedSchoolName || d.preferredSchools?.[0]?.schoolName || d.schoolName || '-'
    const assignmentColumns: ColumnsType<{
      key: string
      schoolName: string
      lectureRound: string
    }> = [
      { title: '배정 기관', dataIndex: 'schoolName', key: 'schoolName' },
      {
        title: '교육 예정 현황',
        dataIndex: 'lectureRound',
        key: 'lectureRound',
        width: 140,
      },
    ]
    const assignmentData = [
      {
        key: '1',
        schoolName: assignedSchoolDisplay,
        lectureRound: '-',
      },
    ]
    return [
      {
        key: 'application',
        label: INSTRUCTOR_DETAIL_TAB_LABELS.application,
        children: (
          <div className="applicant-info-section applicant-info-section--instructor">
            <ApplicantInstructorBasicInfo
              instructor={d}
              maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
            />
            <ApplicantInstructorResume instructor={d} />
          </div>
        ),
      },
      {
        key: 'institutionAssignment',
        label: INSTRUCTOR_DETAIL_TAB_LABELS.institutionAssignment,
        children: (
          <div className="extra-tab-content applicant-contents__instructor-assignment-tab">
            <Table
              className="cms-data-table cms-data-table--skip-auto-no-col"
              columns={assignmentColumns}
              dataSource={assignmentData}
              pagination={false}
              rowKey="key"
              size="middle"
            />
          </div>
        ),
        disabled: true,
      },
    ]
  }, [instructorData, personalInfoRevealed])

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

  return (
    <div className="applicant-contents">
      <div className="applicant-contents__tabs-wrap">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="applicant-contents__tabs"
          tabBarExtraContent={tabBarExtraContent}
          items={isInstitution ? institutionTabItems : instructorTabItems}
        />
      </div>
      {personalInfoRevealModal}
    </div>
  )
}
