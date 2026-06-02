import { useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Space, Empty, Table } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import { CmsButton, type CmsButtonVariant } from '@/shared/ui'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { useApplicantInstitutionDetailEdit } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import { useApplicantInstructorDetailEdit } from '@/features/program/general/hooks/use-applicant-instructor-detail-edit'
import { resolveApplicantCancelApprovalState } from '@/features/program/general/lib/applicant-cancel-approval-policy'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { GeneralIndividualApplicantRow } from '@/data/mock/general-individual-applications-mock'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantGeneralInstitutionBasicInfo } from '@/features/program/general/ui/applicant-detail/applicant-general-institution-basic-info'
import { ApplicantGeneralIndividualBasicInfo } from '@/features/program/general/ui/applicant-detail/applicant-general-individual-basic-info'
import { ApplicantGeneralInstructorBasicInfo } from '@/features/program/general/ui/applicant-detail/applicant-general-instructor-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import {
  PersonalInfoRevealButton,
  PERSONAL_INFO_REVEAL_BUTTON_LABEL,
} from '@/features/user/detail/ui/personal-info-reveal-button'
import { SchoolDetailStudentListSection } from '@/features/program/general/ui/school-detail-student-list-section'
import { ApplicantInstitutionInstructorAssignTab } from './applicant-institution-instructor-assign-tab'
import './applicants-detail-contents.css'

export type ApplicantType = 'institutions' | 'instructors' | 'volunteers' | 'individual-applications'

export type ApplicantDetailVariant = 'legacy' | 'general'

const DETAIL_TAB_PARAM = 'detailTab'

/** 신청 강사 상세 — 탭 라벨·쿼리 키 */
const INSTRUCTOR_DETAIL_TAB_LABELS = {
  application: '신청 정보',
  institutionAssignment: '기관 배정 현황',
} as const

function parseDetailTabFromSearch(
  searchParams: URLSearchParams,
  type: ApplicantType,
  detailVariant: ApplicantDetailVariant
): string {
  const t = searchParams.get(DETAIL_TAB_PARAM)
  if (type === 'institutions') {
    if (detailVariant === 'general') {
      if (t === 'students') return 'students'
      return 'info'
    }
    /** legacy: 학생 명단·강사 배정 현황 탭 비활성화 중 — 선택 가능한 탭은 기본 정보 뿐 */
    return 'info'
  }
  if (type === 'individual-applications') {
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
  title?: string
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
            title={a.title}
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
  onCancelApproval: ((id: string) => void) | undefined,
  cancelApprovalState: { disabled: boolean; reason: string | null }
): ApplicantHeaderActionItem {
  return {
    key: 'cancel-approval',
    variant: 'delete',
    label: '승인 취소',
    disabled: cancelApprovalState.disabled,
    title: cancelApprovalState.reason ?? undefined,
    onClick: cancelApprovalState.disabled ? undefined : () => onCancelApproval?.(applicantId),
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

function headerBtnInstitutionEditInfo(onClick: () => void): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: 'primary',
    label: '정보 수정',
    onClick,
  }
}

function headerBtnInstitutionSaveInfo(onClick: () => void): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: 'primary',
    label: '정보 저장',
    onClick,
  }
}

function headerBtnIndividualEditInfo(onClick: () => void): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: 'primary',
    label: '정보 수정',
    onClick,
  }
}

function headerBtnIndividualSaveInfo(onClick: () => void): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: 'primary',
    label: '정보 저장',
    onClick,
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
  isApprovedIndividual: boolean
  isRejectedInstitution: boolean
  isRejectedInstructor: boolean
  isRejectedIndividual: boolean
  isInstitution: boolean
  isInstructor: boolean
  isIndividual: boolean
  onRevealPersonalInfo: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onCancelApproval?: (id: string) => void
  onCancelReject?: (id: string) => void
  cancelApprovalState: { disabled: boolean; reason: string | null }
  isGeneralInstitutionEditEnabled?: boolean
  isEditingInstitutionDetail?: boolean
  onEnterInstitutionEdit?: () => void
  onSaveInstitutionEdit?: () => void
  isGeneralIndividualEditEnabled?: boolean
  isEditingIndividualDetail?: boolean
  onEnterIndividualEdit?: () => void
  onSaveIndividualEdit?: () => void
  isGeneralInstructorEditEnabled?: boolean
  isEditingInstructorDetail?: boolean
  onEnterInstructorEdit?: () => void
  onSaveInstructorEdit?: () => void
}): ApplicantHeaderActionItem[] | null {
  const {
    applicantId,
    isApprovedInstitution,
    isApprovedInstructor,
    isApprovedIndividual,
    isRejectedInstitution,
    isRejectedInstructor,
    isRejectedIndividual,
    isInstitution,
    isInstructor,
    isIndividual,
    onRevealPersonalInfo,
    onApprove,
    onReject,
    onCancelApproval,
    onCancelReject,
    cancelApprovalState,
    isGeneralInstitutionEditEnabled = false,
    isEditingInstitutionDetail = false,
    onEnterInstitutionEdit,
    onSaveInstitutionEdit,
    isGeneralIndividualEditEnabled = false,
    isEditingIndividualDetail = false,
    onEnterIndividualEdit,
    onSaveIndividualEdit,
    isGeneralInstructorEditEnabled = false,
    isEditingInstructorDetail = false,
    onEnterInstructorEdit,
    onSaveInstructorEdit,
  } = params

  if (isApprovedInstitution) {
    const editButton =
      isGeneralInstitutionEditEnabled && onEnterInstitutionEdit && onSaveInstitutionEdit
        ? isEditingInstitutionDetail
          ? headerBtnInstitutionSaveInfo(onSaveInstitutionEdit)
          : headerBtnInstitutionEditInfo(onEnterInstitutionEdit)
        : headerBtnEditInfoDisabled()

    return [
      headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState),
      editButton,
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }

  if (isApprovedIndividual) {
    const editButton =
      isGeneralIndividualEditEnabled && onEnterIndividualEdit && onSaveIndividualEdit
        ? isEditingIndividualDetail
          ? headerBtnIndividualSaveInfo(onSaveIndividualEdit)
          : headerBtnIndividualEditInfo(onEnterIndividualEdit)
        : headerBtnEditInfoDisabled()

    return [
      headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState),
      editButton,
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }
  if (isApprovedInstructor) {
    const editButton =
      isGeneralInstructorEditEnabled && onEnterInstructorEdit && onSaveInstructorEdit
        ? isEditingInstructorDetail
          ? headerBtnIndividualSaveInfo(onSaveInstructorEdit)
          : headerBtnIndividualEditInfo(onEnterInstructorEdit)
        : headerBtnEditInfoPreparing()

    return [
      headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState),
      editButton,
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }
  if (isRejectedInstructor || isRejectedInstitution || isRejectedIndividual) {
    return [
      headerBtnCancelReject(applicantId, onCancelReject),
      headerBtnPrivacy(onRevealPersonalInfo),
    ]
  }
  if (isInstitution || isInstructor || isIndividual) {
    return headerBtnsPendingParticipation(applicantId, onApprove, onReject, onRevealPersonalInfo)
  }
  return null
}

interface ApplicantsDetailContentsProps {
  type: ApplicantType
  data: ApplicantSchoolRow | ApplicantInstructorRow | GeneralIndividualApplicantRow
  detailVariant?: ApplicantDetailVariant
  /** 상위에서 전달 유지(향후 탭 복원 등). 신청 강사 상세에서는 미사용 */
  program?: Program | null
  /** 일반 프로그램 기관 상세 수정 — 목록 동기화용 */
  institutionList?: ApplicantSchoolRow[]
  onInstitutionDetailSaved?: (rows: ApplicantSchoolRow[]) => void
  /** 일반 프로그램 개인 상세 수정 — 목록 동기화용 */
  onIndividualDetailSaved?: (row: GeneralIndividualApplicantRow) => void
  /** 일반 프로그램 강사 상세 수정 — 목록 동기화용 */
  onInstructorDetailSaved?: (row: ApplicantInstructorRow) => void
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
  detailVariant = 'legacy',
  program = null,
  institutionList = [],
  onInstitutionDetailSaved,
  onIndividualDetailSaved,
  onInstructorDetailSaved,
  onBack: _onBack,
  onApprove,
  onReject,
  onCancelApproval,
  onCancelReject,
}: ApplicantsDetailContentsProps) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(
    () => parseDetailTabFromSearch(searchParams, type, detailVariant),
    [searchParams, type, detailVariant]
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
  const isIndividual = type === 'individual-applications'
  const isGeneralDetail = detailVariant === 'general'

  const institutionData = isInstitution ? (data as ApplicantSchoolRow) : null
  const instructorData = isInstructor ? (data as ApplicantInstructorRow) : null
  const individualData = isIndividual ? (data as GeneralIndividualApplicantRow) : null

  /** 신청 기관(참여자) 승인 완료: [승인 취소], [정보 수정], [개인정보 상세보기] */
  const isApprovedInstitution = isInstitution && institutionData?.approvalStatus === 'approved'

  /** 신청 강사 승인 완료: [승인 취소] [정보 수정] [개인정보 상세보기] */
  const isApprovedInstructor = isInstructor && instructorData?.approvalStatus === 'approved'

  /** 신청 기관 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstitution = isInstitution && institutionData?.approvalStatus === 'rejected'

  /** 신청 강사 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstructor = isInstructor && instructorData?.approvalStatus === 'rejected'

  const isApprovedIndividual = isIndividual && individualData?.approvalStatus === 'approved'
  const isRejectedIndividual = isIndividual && individualData?.approvalStatus === 'rejected'

  const applicantId = data.id

  const isGeneralInstitutionEditEnabled =
    isGeneralDetail && isApprovedInstitution && institutionData != null

  const isGeneralIndividualEditEnabled =
    isGeneralDetail && isApprovedIndividual && individualData != null

  const isGeneralInstructorEditEnabled =
    isGeneralDetail && isApprovedInstructor && instructorData != null

  const institutionDetailEdit = useApplicantInstitutionDetailEdit({
    institution: isGeneralInstitutionEditEnabled ? institutionData : null,
    program,
    institutionList,
    onSaved: rows => {
      onInstitutionDetailSaved?.(rows)
    },
  })

  const individualDetailEdit = useApplicantIndividualDetailEdit({
    applicant: isGeneralIndividualEditEnabled ? individualData : null,
    onSaved: row => {
      onIndividualDetailSaved?.(row)
    },
  })

  const instructorDetailEdit = useApplicantInstructorDetailEdit({
    instructor: isGeneralInstructorEditEnabled ? instructorData : null,
    onSaved: row => {
      onInstructorDetailSaved?.(row)
    },
  })

  const cancelApprovalSessions = useMemo(() => {
    if (institutionData?.sessions) return institutionData.sessions
    if (individualData?.sessions) return individualData.sessions
    return undefined
  }, [institutionData?.sessions, individualData?.sessions])

  const cancelApprovalState = useMemo(
    () =>
      resolveApplicantCancelApprovalState({
        program,
        approvalStatus:
          institutionData?.approvalStatus ??
          individualData?.approvalStatus ??
          instructorData?.approvalStatus ??
          'pending',
        sessions: cancelApprovalSessions,
        hasCancelHandler: Boolean(onCancelApproval),
      }),
    [
      program,
      institutionData?.approvalStatus,
      individualData?.approvalStatus,
      instructorData?.approvalStatus,
      cancelApprovalSessions,
      onCancelApproval,
    ]
  )

  const resolveApplicantPersonalInfoAccessItem = useCallback(() => {
    if (isInstitution) return institutionData?.schoolName ?? '신청 기관 정보'
    if (isIndividual) return individualData?.applicantName ?? '참여자 신청 정보'
    return instructorData?.instructorName ?? '신청 강사 정보'
  }, [
    isInstitution,
    isIndividual,
    institutionData?.schoolName,
    individualData?.applicantName,
    instructorData?.instructorName,
  ])

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
      isApprovedIndividual,
      isRejectedInstitution,
      isRejectedInstructor,
      isRejectedIndividual,
      isInstitution,
      isInstructor,
      isIndividual,
      onRevealPersonalInfo,
      onApprove,
      onReject,
      onCancelApproval,
      onCancelReject,
      cancelApprovalState,
      isGeneralInstitutionEditEnabled,
      isEditingInstitutionDetail: institutionDetailEdit.isEditing,
      onEnterInstitutionEdit: institutionDetailEdit.enterEdit,
      onSaveInstitutionEdit: () => {
        institutionDetailEdit.saveEdit()
      },
      isGeneralIndividualEditEnabled,
      isEditingIndividualDetail: individualDetailEdit.isEditing,
      onEnterIndividualEdit: individualDetailEdit.enterEdit,
      onSaveIndividualEdit: () => {
        individualDetailEdit.saveEdit()
      },
      isGeneralInstructorEditEnabled,
      isEditingInstructorDetail: instructorDetailEdit.isEditing,
      onEnterInstructorEdit: instructorDetailEdit.enterEdit,
      onSaveInstructorEdit: () => {
        instructorDetailEdit.saveEdit()
      },
    })
    if (!items) return null
    return <ApplicantHeaderActionsExtra items={items} personalInfoRevealed={personalInfoRevealed} />
  }, [
    applicantId,
    isApprovedInstitution,
    institutionDetailEdit.enterEdit,
    institutionDetailEdit.isEditing,
    institutionDetailEdit.saveEdit,
    individualDetailEdit.enterEdit,
    individualDetailEdit.isEditing,
    individualDetailEdit.saveEdit,
    instructorDetailEdit.enterEdit,
    instructorDetailEdit.isEditing,
    instructorDetailEdit.saveEdit,
    isGeneralInstitutionEditEnabled,
    isGeneralIndividualEditEnabled,
    isGeneralInstructorEditEnabled,
    cancelApprovalState,
    isApprovedInstructor,
    isApprovedIndividual,
    isRejectedInstitution,
    isRejectedInstructor,
    isRejectedIndividual,
    isInstitution,
    isInstructor,
    isIndividual,
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

  const institutionTabDefs = useMemo(
    () =>
      isGeneralDetail && isInstitution
        ? [
            { key: 'info', label: '신청 정보' },
            { key: 'students', label: '학생 명단', disabled: true },
          ]
        : [
            { key: 'info', label: '기본 정보' },
            { key: 'students', label: '학생 명단', disabled: true },
            { key: 'assign', label: '강사 배정 현황', disabled: true },
          ],
    [isGeneralDetail, isInstitution]
  )

  const instructorTabDefs = useMemo(
    () => [
      { key: 'application', label: INSTRUCTOR_DETAIL_TAB_LABELS.application },
      {
        key: 'institutionAssignment',
        label: INSTRUCTOR_DETAIL_TAB_LABELS.institutionAssignment,
        disabled: true,
      },
    ],
    []
  )

  const tabPanel = useMemo(() => {
    if (isVolunteer) {
      return (
        <div className="extra-tab-content">
          <Empty description="준비 중입니다." />
        </div>
      )
    }
    if (isInstitution && institutionData) {
      const d = institutionData
      if (activeTab === 'info') {
        if (isGeneralDetail) {
          return (
            <ApplicantGeneralInstitutionBasicInfo
              institution={d}
              detail={d.detail}
              maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
              mode={institutionDetailEdit.isEditing ? 'edit' : 'view'}
              draft={institutionDetailEdit.draft ?? undefined}
              onDraftChange={institutionDetailEdit.updateDraft}
              textbookOptions={institutionDetailEdit.textbookOptions}
              sameSchoolGradeOptions={institutionDetailEdit.sameSchoolGradeOptions}
              canApplyCombinedClass={institutionDetailEdit.canApplyCombinedClass}
              validationErrors={institutionDetailEdit.validationErrors}
            />
          )
        }
        return (
          <ApplicantInstitutionBasicInfo
            institution={d}
            detail={d.detail}
            maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
          />
        )
      }
      if (activeTab === 'students') {
        return (
          <div className="extra-tab-content applicant-contents__student-list-tab">
            <SchoolDetailStudentListSection
              schoolId={d.id}
              studentCount={d.studentCount}
              readOnly={false}
              onViewDetail={() => {}}
              onSaveEdit={() => {}}
            />
          </div>
        )
      }
      if (activeTab === 'assign') {
        return <ApplicantInstitutionInstructorAssignTab schoolName={d.schoolName} />
      }
      return null
    }
    if (isIndividual && individualData) {
      return (
        <ApplicantGeneralIndividualBasicInfo
          applicant={individualData}
          maskSensitive={!personalInfoRevealed && individualData.approvalStatus !== 'approved'}
          mode={individualDetailEdit.isEditing ? 'edit' : 'view'}
          draft={individualDetailEdit.draft ?? undefined}
          onDraftChange={individualDetailEdit.updateDraft}
          validationErrors={individualDetailEdit.validationErrors}
        />
      )
    }
    if (isInstructor && instructorData) {
      const d = instructorData
      if (activeTab === 'application') {
        if (isGeneralDetail) {
          return (
            <div className="applicant-info-section applicant-info-section--instructor">
              <ApplicantGeneralInstructorBasicInfo
                instructor={d}
                maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
                mode={instructorDetailEdit.isEditing ? 'edit' : 'view'}
                draft={instructorDetailEdit.draft ?? undefined}
                onDraftChange={instructorDetailEdit.updateDraft}
                validationErrors={instructorDetailEdit.validationErrors}
              />
              <ApplicantInstructorResume instructor={d} />
            </div>
          )
        }
        return (
          <div className="applicant-info-section applicant-info-section--instructor">
            <ApplicantInstructorBasicInfo
              instructor={d}
              maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
            />
            <ApplicantInstructorResume instructor={d} />
          </div>
        )
      }
      if (activeTab === 'institutionAssignment') {
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
        return (
          <div className="extra-tab-content applicant-contents__instructor-assignment-tab">
            <Table
              className="cms-data-table cms-data-table--skip-auto-no-col"
              columns={assignmentColumns}
              dataSource={[
                {
                  key: '1',
                  schoolName: assignedSchoolDisplay,
                  lectureRound: '-',
                },
              ]}
              pagination={false}
              rowKey="key"
              size="middle"
            />
          </div>
        )
      }
      return null
    }
    return null
  }, [
    activeTab,
    institutionData,
    individualData,
    instructorData,
    isInstitution,
    isIndividual,
    isInstructor,
    isVolunteer,
    isGeneralDetail,
    personalInfoRevealed,
    institutionDetailEdit.isEditing,
    institutionDetailEdit.draft,
    institutionDetailEdit.updateDraft,
    institutionDetailEdit.textbookOptions,
    institutionDetailEdit.sameSchoolGradeOptions,
    institutionDetailEdit.canApplyCombinedClass,
    institutionDetailEdit.validationErrors,
    individualDetailEdit.isEditing,
    individualDetailEdit.draft,
    individualDetailEdit.updateDraft,
    individualDetailEdit.validationErrors,
    instructorDetailEdit.isEditing,
    instructorDetailEdit.draft,
    instructorDetailEdit.updateDraft,
    instructorDetailEdit.validationErrors,
  ])

  const tabDefs = isVolunteer
    ? [{ key: 'info', label: '기본 정보' }]
    : isIndividual
      ? []
      : isInstitution
        ? institutionTabDefs
        : instructorTabDefs

  if (isIndividual) {
    return (
      <div className="applicant-contents">
        {headerExtraContent ? (
          <div className="applicant-contents__header-only-actions">{headerExtraContent}</div>
        ) : null}
        <div className="applicant-contents__panel">{tabPanel}</div>
        {personalInfoRevealModal}
      </div>
    )
  }

  return (
    <div className="applicant-contents">
      <div className="applicant-contents__tabs-wrap">
        <CmsTextTabs
          className="applicant-contents__tabs"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabDefs}
          trailing={tabBarExtraContent}
        />
        <div className="applicant-contents__panel">{tabPanel}</div>
      </div>
      {personalInfoRevealModal}
    </div>
  )
}
