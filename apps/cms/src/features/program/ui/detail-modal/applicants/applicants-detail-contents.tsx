import { useMemo, useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Space, Empty, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { AppButton, type AppButtonSize, type AppButtonVariant } from '@/shared/ui/app-button'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import { SchoolDetailStudentListSection } from '../../school-detail-student-list-section'
import { ApplicantInstitutionInstructorAssignTab } from './applicant-institution-instructor-assign-tab'
import { EnrollmentProgramDetailPostsTab } from '@/features/user/ui/enrollment-program-detail-posts-tab'
import './applicants-detail-contents.css'

export type ApplicantType = 'institutions' | 'instructors' | 'volunteers'

const DETAIL_TAB_PARAM = 'detailTab'

/** 신청 강사 상세 — 참여 강사 풀페이지와 동일 라벨·쿼리 키 */
const INSTRUCTOR_DETAIL_TAB_LABELS = {
  application: '신청 정보',
  institutionAssignment: '기관 배정 현황',
  settlement: '정산 현황',
  posts: '게시글',
} as const

function parseDetailTabFromSearch(searchParams: URLSearchParams, type: ApplicantType): string {
  const t = searchParams.get(DETAIL_TAB_PARAM)
  if (type === 'institutions') {
    /** 학생 명단·강사 배정 현황 탭 비활성화 중 — 선택 가능한 탭은 기본 정보 뿐 */
    return 'info'
  }
  if (type === 'instructors') {
    if (
      t === 'application' ||
      t === 'institutionAssignment' ||
      t === 'settlement' ||
      t === 'posts'
    ) {
      return t
    }
    /** 이전 URL: detailTab=info | extra → 신청 정보 */
    return 'application'
  }
  return 'info'
}

type ApplicantHeaderActionItem = {
  key: string
  variant: AppButtonVariant
  label: string
  disabled?: boolean
  onClick?: () => void
  /** 기본 `filter` — 개인정보 상세보기 등은 `filter-wide` */
  size?: AppButtonSize
}

function ApplicantHeaderActionsExtra({ items }: { items: ApplicantHeaderActionItem[] }) {
  return (
    <Space size="small" className="applicant-contents__header-actions">
      {items.map(a => (
        <AppButton
          key={a.key}
          variant={a.variant}
          size={a.size ?? 'filter'}
          disabled={a.disabled}
          onClick={a.onClick}
        >
          {a.label}
        </AppButton>
      ))}
    </Space>
  )
}

/** 클릭 시 신청자 상세 화면에서 마스킹된 개인정보를 원문 그대로 표시 */
function headerBtnPrivacy(onRevealPersonalInfo: () => void): ApplicantHeaderActionItem {
  return {
    key: 'privacy',
    variant: 'primary',
    label: '개인정보 상세보기',
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
    variant: 'danger',
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

function headerBtnCancelReject(
  applicantId: string,
  onCancelReject?: (id: string) => void
): ApplicantHeaderActionItem {
  return {
    key: 'cancel-reject',
    variant: 'danger',
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
      variant: 'danger',
      label: '참여 반려',
      onClick: () => onReject(applicantId),
    },
    {
      key: 'approve',
      variant: 'cancel',
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
  /** 신청 강사 게시글 탭용 (없으면 안내 문구만 표시) */
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
  program = null,
  onBack: _onBack,
  onApprove,
  onReject,
  onCancelApproval,
  onCancelReject,
}: ApplicantsDetailContentsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [instructorPostWriteOpen, setInstructorPostWriteOpen] = useState(false)

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

  /** 신청 강사 승인 완료: [승인 취소] [개인정보 상세보기] */
  const isApprovedInstructor = isInstructor && instructorData?.approvalStatus === 'approved'

  /** 신청 기관 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstitution = isInstitution && institutionData?.approvalStatus === 'rejected'

  /** 신청 강사 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstructor = isInstructor && instructorData?.approvalStatus === 'rejected'

  const applicantId = data.id

  const [personalInfoRevealed, setPersonalInfoRevealed] = useState(false)

  useEffect(() => {
    setPersonalInfoRevealed(false)
    setInstructorPostWriteOpen(false)
  }, [applicantId])

  const onRevealPersonalInfo = useCallback(() => {
    setPersonalInfoRevealed(true)
  }, [])

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
    return <ApplicantHeaderActionsExtra items={items} />
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
  ])

  const tabBarExtraContent = useMemo(() => {
    if (isInstructor) {
      if (activeTab === 'application') return headerExtraContent
      if (activeTab === 'posts' && program) {
        return (
          <AppButton
            variant="primary"
            size="filter"
            onClick={() => setInstructorPostWriteOpen(true)}
          >
            게시글 등록
          </AppButton>
        )
      }
      return null
    }
    return headerExtraContent
  }, [isInstructor, activeTab, headerExtraContent, program])

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
              columns={assignmentColumns}
              dataSource={assignmentData}
              pagination={false}
              rowKey="key"
              size="middle"
            />
          </div>
        ),
      },
      {
        key: 'settlement',
        label: INSTRUCTOR_DETAIL_TAB_LABELS.settlement,
        children: (
          <div className="extra-tab-content applicant-contents__instructor-payment-tab">
            <p className="applicant-contents__tab-placeholder">
              정산 현황은 승인·배정 이후 연동됩니다.
            </p>
            <p className="applicant-contents__tab-placeholder">
              상세 정산 내역 화면은 준비 중입니다.
            </p>
          </div>
        ),
      },
      {
        key: 'posts',
        label: INSTRUCTOR_DETAIL_TAB_LABELS.posts,
        children: (
          <div className="extra-tab-content applicant-contents__instructor-posts-tab">
            {program ? (
              <EnrollmentProgramDetailPostsTab
                program={program}
                showWriteButtonInSection={false}
                writeModalOpen={instructorPostWriteOpen}
                onWriteModalOpenChange={setInstructorPostWriteOpen}
              />
            ) : (
              <Empty description="프로그램 정보가 없어 게시글을 불러올 수 없습니다." />
            )}
          </div>
        ),
      },
    ]
  }, [instructorData, personalInfoRevealed, program, instructorPostWriteOpen])

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
    </div>
  )
}
