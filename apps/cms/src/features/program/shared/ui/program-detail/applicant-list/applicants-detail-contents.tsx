import { useMemo, useCallback, useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Space, Empty } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { Program } from '@/types/domain'
import { CmsButton, CMS_ACTION_BUTTON_WIDTH, useCmsAlert, type CmsButtonVariant } from '@/shared/ui'
import { MESSAGES } from '@/shared/constants/messages'
import {
  type ApplicantSchoolRow,
} from '@/features/program/shared/model/applicant-institution'
import { useApplicantInstitutionDetailEdit } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { useOrganizationMergeGroups } from '@/features/program/general/hooks/use-organization-merge-groups'
import { saveOrganizationCombinedClassRemote } from '@/features/program/general/api/organization-merge-groups-service'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { applyCombinedClassMergeToApplicantDetail } from '@/features/program/general/lib/apply-combined-class-merge-state'
import { resolveCombinedClassMergeViewState } from '@/features/program/general/lib/organization-merge-groups-mapper'
import { hasCompletedCombinedClassEducationSessions } from '@/features/program/general/lib/combined-class-edit-policy'
import {
  type CombinedClassLeadTeacherCandidate,
} from '@/features/program/general/lib/combined-class-lead-teacher'
import { InstitutionCombinedClassLeadTeacherModal } from '@/features/program/shared/ui/detail-modal/components/institution-combined-class-lead-teacher-modal'
import { InstitutionCombinedClassCompleteModal } from '@/features/program/shared/ui/detail-modal/components/institution-combined-class-complete-modal'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { upsertAdminCommentByTargetRemote } from '@/features/program/general/api/admin-comments-api-client'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import { useApplicantInstructorDetailEdit } from '@/features/program/general/hooks/use-applicant-instructor-detail-edit'
import { resolveApplicantCancelApprovalState } from '@/features/program/general/lib/applicant-cancel-approval-policy'
import {
  patchApplicantInstructorDetail,
  type ApplicantInstructorRow,
} from '@/features/program/shared/model/applicant-instructor'
import {
  patchGeneralIndividualApplicantDetail,
  patchGeneralIndividualApplicantManagerEvaluation,
  type GeneralIndividualApplicantDetailSavePayload,
  type GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
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
    variant: isEditing ? 'secondary' : 'primary',
    label: PROGRAM_EDIT_INFO_BUTTON_LABEL,
    width: PROGRAM_EDIT_INFO_BUTTON_PROPS.width,
    disabled,
    onClick: disabled
      ? undefined
      : resolveProgramEditInfoClick(isEditing, {
          onEnterEdit,
          onSaveEdit,
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
    const items: ApplicantHeaderActionItem[] = []

    if (isGeneralIndividualEditEnabled && onEnterIndividualEdit && onSaveIndividualEdit) {
      items.push(
        headerBtnEditInfo(
          onEnterIndividualEdit,
          onSaveIndividualEdit,
          isEditingIndividualDetail
        )
      )
    }

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

    const items: ApplicantHeaderActionItem[] = [
      headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState),
      editButton,
    ]

    if (isAdminCommentWriteEnabled && onEnterAdminCommentEdit) {
      items.push(
        headerBtnWriteComment(onEnterAdminCommentEdit, isEditingInstructorDetail)
      )
    }

    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
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
  /** 일반 개인 신청 운영정보 원격 저장. 미지정 시 기존 mock patch */
  onSaveIndividualDetail?: (
    payload: GeneralIndividualApplicantDetailSavePayload
  ) => Promise<GeneralIndividualApplicantRow | null>
  /** 일반 프로그램 개인 신청 관리자 코멘트 원격 저장. 미지정 시 기존 mock 저장 */
  onSaveIndividualAdminComment?: (
    managerComment: string
  ) => Promise<GeneralIndividualApplicantRow | null>
  individualAdminCommentSaving?: boolean
  canUpdateIndividualAdminComment?: boolean
  /** 일반 개인 신청 전용 개인정보 원문 조회. 미지정 시 기존 회원/mock 흐름 유지 */
  onRevealIndividualPersonalInfo?: (
    reason: string
  ) => Promise<GeneralIndividualApplicantRow>
  onIndividualPrivacyUnmasked?: (row: GeneralIndividualApplicantRow) => void
  showIndividualPrivacyReveal?: boolean
  /** 일반 개인 신청 전용 담당자 평가 저장. 미지정 시 기존 mock 저장 */
  onIndividualManagerEvaluationChange?: (
    managerSlot: 'A' | 'B',
    evaluation: GeneralManagerEvaluation
  ) => void | Promise<void>
  onIndividualTeamRoleChange?: (
    teamRole: NonNullable<
      NonNullable<GeneralIndividualApplicantRow['detail']>['teamRole']
    >
  ) => void | Promise<void>
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
  onSaveIndividualDetail,
  onSaveIndividualAdminComment,
  individualAdminCommentSaving = false,
  canUpdateIndividualAdminComment,
  onRevealIndividualPersonalInfo,
  onIndividualPrivacyUnmasked,
  showIndividualPrivacyReveal,
  onIndividualManagerEvaluationChange,
  onIndividualTeamRoleChange,
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

  /** 신청 강사 승인 완료: [승인 취소] [정보 수정] [코멘트 작성] [개인정보 상세보기] */
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
    isGeneralDetail &&
    isApprovedIndividual &&
    individualData != null &&
    (individualData.availableActions == null ||
      individualData.availableActions.includes('UPDATE_APPLICATION'))

  const isGeneralInstructorEditEnabled =
    isGeneralDetail && isApprovedInstructor && instructorData != null

  const queryClient = useQueryClient()
  const programId = program?.id
  const mergeGroupsQuery = useOrganizationMergeGroups(
    programId,
    isGeneralDetail && isInstitution && shouldUseOrganizationMergeGroupsRemoteApi()
  )
  const institutionMergeView = useMemo(() => {
    if (!institutionData || !mergeGroupsQuery.data?.length) return null
    return resolveCombinedClassMergeViewState(
      mergeGroupsQuery.data,
      institutionData,
      institutionList
    )
  }, [institutionData, institutionList, mergeGroupsQuery.data])

  const handleSaveInstitutionCombinedClass = useCallback(
    async (params: {
      combinedClassApplication: '신청' | '미신청'
      combinedClassPartnerApplicantIds: string[]
    }) => {
      if (!programId || !institutionData) return
      await saveOrganizationCombinedClassRemote({
        programId,
        leadRow: institutionData,
        allRows: institutionList,
        combinedClassApplication: params.combinedClassApplication,
        partnerRowIds: params.combinedClassPartnerApplicantIds,
        existingMergeGroups: mergeGroupsQuery.data,
      })
      await queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.mergeGroups(programId),
      })
    },
    [institutionData, institutionList, mergeGroupsQuery.data, programId, queryClient]
  )

  const [combinedClassLeadTeacherModal, setCombinedClassLeadTeacherModal] = useState<{
    memberRowIds: string[]
    candidates: CombinedClassLeadTeacherCandidate[]
  } | null>(null)
  const [combinedClassCompleteLabel, setCombinedClassCompleteLabel] = useState<string | null>(null)

  const institutionDetailEdit = useApplicantInstitutionDetailEdit({
    institution: isGeneralDetail && isInstitution ? institutionData : null,
    program,
    institutionList,
    onSaved: rows => {
      onInstitutionDetailSaved?.(rows)
    },
    onSaveCombinedClass: shouldUseOrganizationMergeGroupsRemoteApi()
      ? handleSaveInstitutionCombinedClass
      : undefined,
    combinedClassReadOnly: institutionMergeView?.isLead === false,
    onCombinedClassApplied: params => {
      setCombinedClassLeadTeacherModal(params)
    },
  })

  const combinedClassModals = (
    <>
      <InstitutionCombinedClassLeadTeacherModal
        open={combinedClassLeadTeacherModal != null}
        candidates={combinedClassLeadTeacherModal?.candidates ?? []}
        onCancel={() => setCombinedClassLeadTeacherModal(null)}
        onConfirm={_candidate => {
          if (!combinedClassLeadTeacherModal) return
          notifyProgramApiUnavailable(
            'general-org-merge-lead-teacher',
            '일반 프로그램 · 합반 담당 교사 지정'
          )
          setCombinedClassLeadTeacherModal(null)
        }}
      />
      <InstitutionCombinedClassCompleteModal
        open={combinedClassCompleteLabel != null}
        teacherLabel={combinedClassCompleteLabel ?? ''}
        onClose={() => setCombinedClassCompleteLabel(null)}
      />
    </>
  )

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

  const handleAdminCommentSave = useCallback(async () => {
    if (!institutionData) return
    const comment = adminCommentDraft.trim()
    if (shouldUseGeneralApplicationsRemoteApi()) {
      const targetId = Number(institutionData.id)
      if (!Number.isFinite(targetId)) {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
      try {
        const result = await upsertAdminCommentByTargetRemote({
          targetType: 'ORGANIZATION_APPLICATION',
          targetId,
          screenCode: 'ORGANIZATION_APPLICATION',
          comment,
        })
        onInstitutionDetailSaved?.([
          {
            ...institutionData,
            adminComment: result.commentText,
          },
        ])
        setAdminCommentModalOpen(false)
        return
      } catch {
        void showAlert({
          title: '안내',
          content: MESSAGES.error.save,
        })
        return
      }
    }
    void showAlert({
      title: PROGRAM_API_UNAVAILABLE_TITLE,
      content: buildProgramApiUnavailableSaveContent('기관 신청 관리자 코멘트'),
    })
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
    saveApplicant: onSaveIndividualDetail,
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

  const handleIndividualAdminCommentSave = useCallback(async () => {
    if (!individualData) return
    if (onSaveIndividualAdminComment) {
      const updated = await onSaveIndividualAdminComment(individualAdminCommentDraft)
      if (!updated) return
      onIndividualDetailSaved?.(updated)
      setIsIndividualAdminCommentModalOpen(false)
      return
    }
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
  }, [
    individualAdminCommentDraft,
    individualData,
    onIndividualDetailSaved,
    onSaveIndividualAdminComment,
    showAlert,
  ])

  const handleIndividualAdminCommentModalCancel = useCallback(() => {
    if (individualAdminCommentSaving) return
    setIsIndividualAdminCommentModalOpen(false)
  }, [individualAdminCommentSaving])

  const handleIndividualAdminCommentDraftChange = useCallback((value: string) => {
    setIndividualAdminCommentDraft(value)
  }, [])

  const handleManagerAEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) => {
      if (onIndividualManagerEvaluationChange) {
        void onIndividualManagerEvaluationChange('A', evaluation)
        return
      }
      const updated = patchGeneralIndividualApplicantManagerEvaluation(id, 'A', evaluation)
      if (updated) onIndividualDetailSaved?.(updated)
    },
    [onIndividualDetailSaved, onIndividualManagerEvaluationChange]
  )

  const handleManagerBEvaluationChange = useCallback(
    (id: string, evaluation: GeneralManagerEvaluation) => {
      if (onIndividualManagerEvaluationChange) {
        void onIndividualManagerEvaluationChange('B', evaluation)
        return
      }
      const updated = patchGeneralIndividualApplicantManagerEvaluation(id, 'B', evaluation)
      if (updated) onIndividualDetailSaved?.(updated)
    },
    [onIndividualDetailSaved, onIndividualManagerEvaluationChange]
  )

  const instructorDetailEdit = useApplicantInstructorDetailEdit({
    instructor: isGeneralInstructorEditEnabled ? instructorData : null,
    onSaved: row => {
      onInstructorDetailSaved?.(row)
    },
  })

  const [isInstructorAdminCommentModalOpen, setIsInstructorAdminCommentModalOpen] = useState(false)
  const [instructorAdminCommentDraft, setInstructorAdminCommentDraft] = useState('')

  /* eslint-disable react-hooks/set-state-in-effect -- 강사 변경 시 코멘트 편집 상태 초기화 */
  useEffect(() => {
    setIsInstructorAdminCommentModalOpen(false)
    setInstructorAdminCommentDraft('')
  }, [applicantId, instructorData?.managerComment])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleInstructorAdminCommentEditEnter = useCallback(() => {
    if (instructorDetailEdit.isEditing) return
    setInstructorAdminCommentDraft(instructorData?.managerComment ?? '')
    setIsInstructorAdminCommentModalOpen(true)
  }, [instructorDetailEdit.isEditing, instructorData?.managerComment])

  const handleInstructorAdminCommentSave = useCallback(() => {
    if (!instructorData) return
    const updated = patchApplicantInstructorDetail(instructorData.id, {
      managerComment: instructorAdminCommentDraft,
    })
    if (!updated) {
      void showAlert({
        title: '안내',
        content: MESSAGES.error.save,
      })
      return
    }
    onInstructorDetailSaved?.(updated)
    setIsInstructorAdminCommentModalOpen(false)
  }, [instructorAdminCommentDraft, instructorData, onInstructorDetailSaved, showAlert])

  const handleInstructorAdminCommentModalCancel = useCallback(() => {
    setIsInstructorAdminCommentModalOpen(false)
  }, [])

  const handleInstructorAdminCommentDraftChange = useCallback((value: string) => {
    setInstructorAdminCommentDraft(value)
  }, [])

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
    resolveMemberId: () => {
      if (isIndividual) return individualData?.memberId
      if (isInstructor && instructorData?.instructorMemberId != null) {
        return String(instructorData.instructorMemberId)
      }
      return undefined
    },
    resolveMemberRole: () => {
      if (isIndividual) return 'INDIVIDUAL'
      if (isInstructor) return 'INSTRUCTOR'
      return undefined
    },
    revealPersonalInfo: onRevealIndividualPersonalInfo,
    onPrivacyUnmasked: payload => {
      if (onRevealIndividualPersonalInfo) {
        onIndividualPrivacyUnmasked?.(payload as GeneralIndividualApplicantRow)
      }
    },
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
        void institutionDetailEdit.saveEdit()
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
        isGeneralInstitutionEditEnabled ||
        (isGeneralIndividualEditEnabled &&
          (canUpdateIndividualAdminComment ?? true)) ||
        isGeneralInstructorEditEnabled,
      onEnterAdminCommentEdit: isApprovedIndividual
        ? handleIndividualAdminCommentEditEnter
        : isApprovedInstructor
          ? handleInstructorAdminCommentEditEnter
          : handleAdminCommentEditEnter,
    })
    if (!items) return null
    const visibleItems =
      isIndividual &&
      showIndividualPrivacyReveal === false
        ? items.filter(item => item.key !== 'privacy')
        : items
    return (
      <ApplicantHeaderActionsExtra
        items={visibleItems}
        personalInfoRevealed={personalInfoRevealed}
      />
    )
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
    canUpdateIndividualAdminComment,
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
    individualData,
    showIndividualPrivacyReveal,
    handleAdminCommentEditEnter,
    handleIndividualAdminCommentEditEnter,
    handleInstructorAdminCommentEditEnter,
  ])

  const tabBarExtraContent = headerExtraContent

  const institutionInfoPanel = useMemo(() => {
    if (!isInstitution || !institutionData) return null
    const d = institutionData
    /** 1사1교·교육받은 교사 — 합반 신청 케이스 없음(신청 불가) */
    const isCombinedClassHidden =
      isCompanySchoolProgram(program) || isTrainedTeachersDetailProgram(program ?? null)
    if (isGeneralDetail) {
      const detailWithMerge = applyCombinedClassMergeToApplicantDetail(
        d.detail,
        mergeGroupsQuery.data,
        d,
        institutionList
      )
      return (
        <ApplicantGeneralInstitutionBasicInfo
          institution={d}
          detail={detailWithMerge}
          program={program}
          maskSensitive={!personalInfoRevealed && d.approvalStatus !== 'approved'}
          mode={institutionDetailEdit.isEditing ? 'edit' : 'view'}
          draft={institutionDetailEdit.draft ?? undefined}
          onDraftChange={institutionDetailEdit.updateDraft}
          textbookOptions={institutionDetailEdit.textbookOptions}
          textbookDisplayLabel={institutionDetailEdit.textbookDisplayLabel}
          isTextbookCatalogLoading={institutionDetailEdit.isTextbookCatalogLoading}
          sameSchoolGradeOptions={institutionDetailEdit.sameSchoolGradeOptions}
          classCountOptions={institutionDetailEdit.classCountOptions}
          teacherOptions={institutionDetailEdit.teacherOptions}
          isTeacherOptionsLoading={institutionDetailEdit.isTeacherOptionsLoading}
          showEducationFormatField={institutionDetailEdit.showEducationFormatField}
          isCombinedClassProgramEligible={institutionDetailEdit.isCombinedClassProgramEligible}
          isCombinedClassApplyRadioDisabled={institutionDetailEdit.isCombinedClassApplyRadioDisabled}
          combinedClassReadOnly={institutionDetailEdit.combinedClassReadOnly}
          showCombinedClassScheduleNotice={hasCompletedCombinedClassEducationSessions(
            d.sessions
          )}
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
    institutionDetailEdit.textbookDisplayLabel,
    institutionDetailEdit.isTextbookCatalogLoading,
    institutionDetailEdit.sameSchoolGradeOptions,
    institutionDetailEdit.isCombinedClassProgramEligible,
    institutionDetailEdit.isCombinedClassApplyRadioDisabled,
    institutionDetailEdit.combinedClassReadOnly,
    institutionDetailEdit.validationErrors,
    institutionList,
    mergeGroupsQuery.data,
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
          maskSensitive={
            individualData.privacyMaskingLevel != null
              ? individualData.privacyMaskingLevel !== 'UNMASKED'
              : !personalInfoRevealed && individualData.approvalStatus !== 'approved'
          }
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
          onTeamRoleChange={onIndividualTeamRoleChange}
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
    onIndividualTeamRoleChange,
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
        loading={individualAdminCommentSaving}
        maxLength={2000}
        allowEmpty={Boolean(individualData?.adminComment)}
        onChange={handleIndividualAdminCommentDraftChange}
        onCancel={handleIndividualAdminCommentModalCancel}
        onConfirm={handleIndividualAdminCommentSave}
      />
      <MemberAdminCommentModal
        open={isInstructorAdminCommentModalOpen}
        value={instructorAdminCommentDraft}
        onChange={handleInstructorAdminCommentDraftChange}
        onCancel={handleInstructorAdminCommentModalCancel}
        onConfirm={handleInstructorAdminCommentSave}
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
        {combinedClassModals}
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
        {combinedClassModals}
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
