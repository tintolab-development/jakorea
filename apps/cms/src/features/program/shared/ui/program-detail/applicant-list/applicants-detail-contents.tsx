import { useMemo, useCallback, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Space, Empty } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { Program } from '@/types/domain'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH, useCmsAlert, type CmsButtonVariant } from '@/shared/ui'
import { MESSAGES } from '@/shared/constants/messages'
import {
  patchApplicantInstitutionAdminComment,
  type ApplicantSchoolRow,
} from '@/data/mock/applicant-institutions'
import { useApplicantInstitutionDetailEdit } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import { useApplicantInstructorDetailEdit } from '@/features/program/general/hooks/use-applicant-instructor-detail-edit'
import { resolveApplicantCancelApprovalState } from '@/features/program/general/lib/applicant-cancel-approval-policy'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  patchGeneralIndividualApplicantDetail,
  patchGeneralIndividualApplicantManagerEvaluation,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import type { IndividualApplicantScreeningStage } from '@/features/program/general/lib/individual-application-visibility'
import type { GeneralManagerEvaluation } from '@/features/program/general/lib/volunteer-screening-constants'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantGeneralInstitutionBasicInfo } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info'
import { ApplicantGeneralIndividualBasicInfo } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/individual-basic-info'
import { ApplicantGeneralInstructorBasicInfo } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import {
  PersonalInfoRevealButton,
  PERSONAL_INFO_REVEAL_BUTTON_LABEL,
} from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import './applicants-detail-contents.css'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { TrainedTeachersApplicantInstitutionDetailContents } from '@/features/program/trained-teachers/ui/institution-detail/applicant-institution-detail-contents'

export type ApplicantType =
  | 'institutions'
  | 'instructors'
  | 'volunteers'
  | 'individual-applications'

export type ApplicantDetailVariant = 'legacy' | 'general'

const DETAIL_TAB_PARAM = 'detailTab'

function isCompanySchoolProgram(program: Program | null | undefined): boolean {
  return (
    program?.id.startsWith('economy-prog-') === true ||
    program?.id.startsWith('company-school-prog-') === true ||
    program?.id.startsWith('company-school-local-') === true ||
    program?.mainTitle?.includes('1사1교') === true ||
    program?.title?.includes('1사1교') === true
  )
}

function parseDetailTabFromSearch(
  searchParams: URLSearchParams,
  type: ApplicantType,
  _detailVariant: ApplicantDetailVariant
): string {
  const t = searchParams.get(DETAIL_TAB_PARAM)
  if (type === 'institutions') {
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
  width?: number
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
            width={a.width ?? (a.size === 'filter-wide' ? 180 : CMS_ACTION_BUTTON_WIDTH)}
            disabled={a.disabled}
            onClick={a.onClick ?? (() => {})}
          />
        ) : (
          <CmsButton
            key={a.key}
            variant={a.variant}
            size="large"
            className="cms-button--action"
            width={a.width ?? (a.size === 'filter-wide' ? 180 : CMS_ACTION_BUTTON_WIDTH)}
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
    width: CMS_ACTION_BUTTON_WIDTH,
    disabled: cancelApprovalState.disabled,
    title: cancelApprovalState.reason ?? undefined,
    onClick: cancelApprovalState.disabled ? undefined : () => onCancelApproval?.(applicantId),
  }
}

function headerBtnEditInfo(
  onEnterEdit: () => void,
  onSaveEdit: () => void,
  isEditing: boolean,
  disabled = false
): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: PROGRAM_EDIT_INFO_BUTTON_PROPS.variant,
    label: PROGRAM_EDIT_INFO_BUTTON_LABEL,
    width: PROGRAM_EDIT_INFO_BUTTON_PROPS.width,
    disabled,
    onClick: disabled
      ? undefined
      : resolveProgramEditInfoClick(isEditing, {
          onEnterEdit: onEnterEdit,
          onSaveEdit: onSaveEdit,
        }),
  }
}

function headerBtnEditInfoDisabled(): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: PROGRAM_EDIT_INFO_BUTTON_PROPS.variant,
    label: PROGRAM_EDIT_INFO_BUTTON_LABEL,
    width: PROGRAM_EDIT_INFO_BUTTON_PROPS.width,
    disabled: true,
  }
}

function headerBtnEditInfoPreparing(): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: PROGRAM_EDIT_INFO_BUTTON_PROPS.variant,
    label: PROGRAM_EDIT_INFO_BUTTON_LABEL,
    width: PROGRAM_EDIT_INFO_BUTTON_PROPS.width,
    onClick: () => window.alert('준비중'),
  }
}

function headerBtnWriteComment(onClick: () => void, disabled = false): ApplicantHeaderActionItem {
  return {
    key: 'write-comment',
    variant: 'primary',
    label: '코멘트 작성',
    width: CMS_ACTION_BUTTON_WIDTH,
    disabled,
    onClick: disabled ? undefined : onClick,
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
    width: CMS_ACTION_BUTTON_WIDTH,
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
      width: CMS_ACTION_BUTTON_WIDTH,
      onClick: () => onReject(applicantId),
    },
    {
      key: 'approve',
      variant: 'secondary',
      label: '참여 승인',
      width: CMS_ACTION_BUTTON_WIDTH,
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
  isAdminCommentWriteEnabled?: boolean
  onEnterAdminCommentEdit?: () => void
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
    isAdminCommentWriteEnabled = false,
    onEnterAdminCommentEdit,
  } = params

  if (isApprovedInstitution) {
    const editButton =
      isGeneralInstitutionEditEnabled && onEnterInstitutionEdit && onSaveInstitutionEdit
        ? headerBtnEditInfo(
            onEnterInstitutionEdit,
            onSaveInstitutionEdit,
            isEditingInstitutionDetail
          )
        : headerBtnEditInfoDisabled()

    const items: ApplicantHeaderActionItem[] = [
      headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState),
      editButton,
    ]

    if (isAdminCommentWriteEnabled && onEnterAdminCommentEdit) {
      items.push(
        headerBtnWriteComment(onEnterAdminCommentEdit, isEditingInstitutionDetail)
      )
    }

    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }

  if (isApprovedIndividual) {
    const editButton =
      isGeneralIndividualEditEnabled && onEnterIndividualEdit && onSaveIndividualEdit
        ? headerBtnEditInfo(
            onEnterIndividualEdit,
            onSaveIndividualEdit,
            isEditingIndividualDetail
          )
        : headerBtnEditInfoDisabled()

    const items: ApplicantHeaderActionItem[] = [editButton]

    if (isAdminCommentWriteEnabled && onEnterAdminCommentEdit) {
      items.push(
        headerBtnWriteComment(onEnterAdminCommentEdit, isEditingIndividualDetail)
      )
    }

    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }
  if (isApprovedInstructor) {
    const editButton =
      isGeneralInstructorEditEnabled && onEnterInstructorEdit && onSaveInstructorEdit
        ? headerBtnEditInfo(
            onEnterInstructorEdit,
            onSaveInstructorEdit,
            isEditingInstructorDetail
          )
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
  /** 승인·반려 상태에서 알림 재발송 클릭 시 호출 */
  onResendNotification?: () => void
  /** 개인 면접 심사 탭 — 상세 섹션 분기 */
  individualScreeningStage?: IndividualApplicantScreeningStage
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
  onResendNotification,
  individualScreeningStage = 'main',
}: ApplicantsDetailContentsProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [openManagerDropdown, setOpenManagerDropdown] = useState<{
    rowId: string
    manager: 'A' | 'B'
  } | null>(null)
  const [isIndividualAdminCommentModalOpen, setIsIndividualAdminCommentModalOpen] = useState(false)
  const [individualAdminCommentDraft, setIndividualAdminCommentDraft] = useState('')
  const { showAlert } = useCmsAlert()

  const isInstitution = type === 'institutions'
  const isInstructor = type === 'instructors'
  const isVolunteer = type === 'volunteers'
  const isIndividual = type === 'individual-applications'
  const isGeneralDetail = detailVariant === 'general'

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

  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- 기관 변경 시 코멘트 편집 상태 초기화 */
  useEffect(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
  }, [applicantId, institutionData?.adminComment])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleAdminCommentEditEnter = useCallback(() => {
    if (institutionDetailEdit.isEditing) return
    setAdminCommentDraft(institutionData?.adminComment ?? '')
    setAdminCommentModalOpen(true)
  }, [institutionDetailEdit.isEditing, institutionData?.adminComment])

  const handleAdminCommentSave = useCallback(() => {
    if (!institutionData) return
    const updated = patchApplicantInstitutionAdminComment(institutionData.id, adminCommentDraft)
    if (!updated) {
      void showAlert({
        title: '안내',
        content: MESSAGES.error.save,
      })
      return
    }
    onInstitutionDetailSaved?.([updated])
    setAdminCommentModalOpen(false)
  }, [adminCommentDraft, institutionData, onInstitutionDetailSaved, showAlert])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
  }, [])

  const individualDetailEdit = useApplicantIndividualDetailEdit({
    applicant: isGeneralIndividualEditEnabled ? individualData : null,
    program,
    onSaved: row => {
      onIndividualDetailSaved?.(row)
    },
  })

  /* eslint-disable react-hooks/set-state-in-effect -- 개인 신청자 변경 시 코멘트·평가 UI 초기화 */
  useEffect(() => {
    setIsIndividualAdminCommentModalOpen(false)
    setIndividualAdminCommentDraft('')
    setOpenManagerDropdown(null)
  }, [applicantId, individualData?.adminComment])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleIndividualAdminCommentEditEnter = useCallback(() => {
    if (individualDetailEdit.isEditing) return
    setIndividualAdminCommentDraft(individualData?.adminComment ?? '')
    setIsIndividualAdminCommentModalOpen(true)
  }, [individualDetailEdit.isEditing, individualData?.adminComment])

  const handleIndividualAdminCommentSave = useCallback(() => {
    if (!individualData) return
    const updated = patchGeneralIndividualApplicantDetail(individualData.id, {
      adminComment: individualAdminCommentDraft,
    })
    if (!updated) {
      void showAlert({
        title: '안내',
        content: MESSAGES.error.save,
      })
      return
    }
    onIndividualDetailSaved?.(updated)
    setIsIndividualAdminCommentModalOpen(false)
  }, [individualAdminCommentDraft, individualData, onIndividualDetailSaved, showAlert])

  const handleIndividualAdminCommentModalCancel = useCallback(() => {
    setIsIndividualAdminCommentModalOpen(false)
  }, [])

  const handleIndividualAdminCommentDraftChange = useCallback((value: string) => {
    setIndividualAdminCommentDraft(value)
  }, [])

  const handleManagerAEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) => {
      const updated = patchGeneralIndividualApplicantManagerEvaluation(id, 'A', evaluation)
      if (updated) onIndividualDetailSaved?.(updated)
    },
    [onIndividualDetailSaved]
  )

  const handleManagerBEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) => {
      const updated = patchGeneralIndividualApplicantManagerEvaluation(id, 'B', evaluation)
      if (updated) onIndividualDetailSaved?.(updated)
    },
    [onIndividualDetailSaved]
  )

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

  const cancelApprovalState = useMemo(() => {
    const resolved = resolveApplicantCancelApprovalState({
      program,
      approvalStatus:
        institutionData?.approvalStatus ??
        individualData?.approvalStatus ??
        instructorData?.approvalStatus ??
        'pending',
      sessions: cancelApprovalSessions,
      hasCancelHandler: Boolean(onCancelApproval),
    })

    // 일반 프로그램 — 기관 신청 상세: 승인 완료 시 승인 취소 항상 가능 (모달에서 사유·알림 처리)
    if (
      isGeneralDetail &&
      isInstitution &&
      institutionData?.approvalStatus === 'approved' &&
      onCancelApproval
    ) {
      return { disabled: false, reason: null }
    }

    return resolved
  }, [
    program,
    institutionData?.approvalStatus,
    individualData?.approvalStatus,
    instructorData?.approvalStatus,
    cancelApprovalSessions,
    onCancelApproval,
    isGeneralDetail,
    isInstitution,
  ])

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
      isAdminCommentWriteEnabled:
        isGeneralInstitutionEditEnabled || isGeneralIndividualEditEnabled,
      onEnterAdminCommentEdit: isApprovedIndividual
        ? handleIndividualAdminCommentEditEnter
        : handleAdminCommentEditEnter,
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
    handleAdminCommentEditEnter,
    handleIndividualAdminCommentEditEnter,
  ])

  const tabBarExtraContent = headerExtraContent

  const institutionInfoPanel = useMemo(() => {
    if (!isInstitution || !institutionData) return null
    const d = institutionData
    /** 1사1교·교육받은 교사 — 합반 신청 케이스 없음(신청 불가) */
    const isCombinedClassHidden =
      isCompanySchoolProgram(program) || isTrainedTeachersDetailProgram(program ?? null)
    if (isGeneralDetail) {
      return (
        <ApplicantGeneralInstitutionBasicInfo
          institution={d}
          detail={d.detail}
          program={program}
          maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
          mode={institutionDetailEdit.isEditing ? 'edit' : 'view'}
          draft={institutionDetailEdit.draft ?? undefined}
          onDraftChange={institutionDetailEdit.updateDraft}
          textbookOptions={institutionDetailEdit.textbookOptions}
          sameSchoolGradeOptions={institutionDetailEdit.sameSchoolGradeOptions}
          classCountOptions={institutionDetailEdit.classCountOptions}
          teacherOptions={institutionDetailEdit.teacherOptions}
          showEducationFormatField={institutionDetailEdit.showEducationFormatField}
          isCombinedClassProgramEligible={institutionDetailEdit.isCombinedClassProgramEligible}
          isCombinedClassApplyRadioDisabled={institutionDetailEdit.isCombinedClassApplyRadioDisabled}
          hideCombinedClass={isCombinedClassHidden}
          validationErrors={institutionDetailEdit.validationErrors}
          onResendNotificationClick={onResendNotification}
          isAdminCommentEditing={false}
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
  }, [
    isInstitution,
    institutionData,
    isGeneralDetail,
    personalInfoRevealed,
    program,
    institutionDetailEdit.isEditing,
    institutionDetailEdit.draft,
    institutionDetailEdit.updateDraft,
    institutionDetailEdit.textbookOptions,
    institutionDetailEdit.sameSchoolGradeOptions,
    institutionDetailEdit.isCombinedClassProgramEligible,
    institutionDetailEdit.isCombinedClassApplyRadioDisabled,
    institutionDetailEdit.validationErrors,
    onResendNotification,
  ])

  const instructorInfoPanel = useMemo(() => {
    if (!isInstructor || !instructorData) return null
    const d = instructorData
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
            onResendNotificationClick={onResendNotification}
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
          onResendNotificationClick={onResendNotification}
        />
        <ApplicantInstructorResume instructor={d} />
      </div>
    )
  }, [
    isInstructor,
    instructorData,
    isGeneralDetail,
    personalInfoRevealed,
    instructorDetailEdit.isEditing,
    instructorDetailEdit.draft,
    instructorDetailEdit.updateDraft,
    instructorDetailEdit.validationErrors,
    onResendNotification,
  ])

  const tabPanel = useMemo(() => {
    if (isVolunteer) {
      return (
        <div className="extra-tab-content">
          <Empty description="준비 중입니다." />
        </div>
      )
    }
    if (isInstitution) {
      return institutionInfoPanel
    }
    if (isIndividual && individualData) {
      return (
        <ApplicantGeneralIndividualBasicInfo
          applicant={individualData}
          program={program}
          maskSensitive={!personalInfoRevealed && individualData.approvalStatus !== 'approved'}
          mode={individualDetailEdit.isEditing ? 'edit' : 'view'}
          draft={individualDetailEdit.draft ?? undefined}
          onDraftChange={individualDetailEdit.updateDraft}
          validationErrors={individualDetailEdit.validationErrors}
          onResendNotificationClick={onResendNotification}
          screeningStage={individualScreeningStage}
          textbookOptions={individualDetailEdit.textbookOptions}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={handleManagerAEvaluationChange}
          onManagerBEvaluationChange={handleManagerBEvaluationChange}
        />
      )
    }
    if (isInstructor) {
      return instructorInfoPanel
    }
    return null
  }, [
    institutionInfoPanel,
    individualData,
    instructorInfoPanel,
    isInstitution,
    isIndividual,
    isInstructor,
    isVolunteer,
    personalInfoRevealed,
    individualDetailEdit.isEditing,
    individualDetailEdit.draft,
    individualDetailEdit.updateDraft,
    individualDetailEdit.validationErrors,
    individualDetailEdit.textbookOptions,
    onResendNotification,
    program,
    individualScreeningStage,
    openManagerDropdown,
    handleManagerAEvaluationChange,
    handleManagerBEvaluationChange,
  ])

  const tabDefs = isVolunteer ? [{ key: 'info', label: '기본 정보' }] : []

  const adminCommentModals = (
    <>
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
      <MemberAdminCommentModal
        open={isIndividualAdminCommentModalOpen}
        value={individualAdminCommentDraft}
        onChange={handleIndividualAdminCommentDraftChange}
        onCancel={handleIndividualAdminCommentModalCancel}
        onConfirm={handleIndividualAdminCommentSave}
      />
    </>
  )

  if (
    isInstitution &&
    isGeneralDetail &&
    isTrainedTeachersDetailProgram(program ?? null) &&
    institutionData
  ) {
    return (
      <>
        <TrainedTeachersApplicantInstitutionDetailContents
          institution={institutionData}
          program={program}
          personalInfoRevealed={personalInfoRevealed}
          headerExtraContent={headerExtraContent}
          personalInfoRevealModal={personalInfoRevealModal}
          institutionDetailEdit={institutionDetailEdit}
          onResendNotification={onResendNotification}
          isAdminCommentEditing={false}
          adminCommentDraft=""
          onAdminCommentDraftChange={() => {}}
        />
        {adminCommentModals}
      </>
    )
  }

  if (isIndividual || isInstitution || isInstructor) {
    return (
      <div className="applicant-contents">
        {headerExtraContent ? (
          <div className="applicant-contents__header-only-actions">{headerExtraContent}</div>
        ) : null}
        <div className="applicant-contents__panel">{tabPanel}</div>
        {personalInfoRevealModal}
        {adminCommentModals}
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
      {adminCommentModals}
    </div>
  )
}
