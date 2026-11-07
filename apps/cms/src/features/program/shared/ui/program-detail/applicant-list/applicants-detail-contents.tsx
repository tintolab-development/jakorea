import { useMemo, useCallback, useState, useEffect } from 'react'
import axios from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { cacheProjectedProgramPrivacy } from '@/features/program/shared/lib/program-my-assignment'
import { useSearchParams } from 'react-router-dom'
import { Space, Empty } from 'antd'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { Program } from '@/types/domain'
import { CmsButton, useCmsAlert, type CmsButtonVariant } from '@/shared/ui'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { MESSAGES } from '@/shared/constants/messages'
import { type ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import { useApplicantInstitutionDetailEdit } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { useOrganizationMergeGroups } from '@/features/program/general/hooks/use-organization-merge-groups'
import { saveOrganizationCombinedClassRemote } from '@/features/program/general/api/organization-merge-groups-service'
import { shouldUseOrganizationMergeGroupsRemoteApi } from '@/features/program/general/api/organization-merge-groups-remote-capabilities'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { applyCombinedClassMergeToApplicantDetail } from '@/features/program/general/lib/apply-combined-class-merge-state'
import {
  isCombinedClassNonLeadMember,
  resolveCombinedClassMergeViewState,
} from '@/features/program/general/lib/organization-merge-groups-mapper'
import { resolveOrganizationMergeErrorMessage } from '@/features/program/general/lib/organization-merge-error-message'
import { isGeneralOrganizationProgram } from '@/features/program/general/lib/organization-merge-program-type'
import { buildCombinedClassLeadTeacherCandidatesFromApplicants } from '@/features/program/general/lib/combined-class-lead-teacher'
import { COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT } from '@/features/program/general/lib/combined-class-copy'
import { useCombinedClassProcess } from '@/features/program/general/hooks/use-combined-class-process'
import {
  buildProgramApiUnavailableSaveContent,
  notifyProgramApiUnavailable,
  PROGRAM_API_UNAVAILABLE_TITLE,
} from '@/features/program/shared/lib/program-api-unavailable'
import {
  APPLICATION_ACTION_CANCEL_FINAL_FAIL,
  APPLICATION_ACTION_CANCEL_FINAL_PASS,
  canPerformApplicationAction,
  canRestoreRejectedApplication,
  hasExplicitApplicationAction,
  isApprovalCancelledApplicationStatus,
} from '@/features/program/shared/lib/application-available-actions'
import { resolveVolunteerInterview2CancelPassButtonLabel } from '@/features/program/general/lib/volunteer-interview2-cancel-pass'
import type { GeneralSecondInterviewScreeningStatus } from '@/features/program/general/lib/volunteer-screening-constants'
import {
  shouldUseGeneralApplicationsRemoteApi,
  shouldUseOrganizationApplicationRemoteApi,
} from '@/features/program/general/api/applications-remote-capabilities'
import { upsertAdminCommentByTargetRemote } from '@/features/program/general/api/admin-comments-api-client'
import { saveIndividualApplicationAdminCommentRemote } from '@/features/program/general/api/individual-application-update-helpers'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { useApplicantIndividualDetailEdit } from '@/features/program/general/hooks/use-applicant-individual-detail-edit'
import { useApplicantInstructorDetailEdit } from '@/features/program/general/hooks/use-applicant-instructor-detail-edit'
import {
  useInstructorApplicationDetailEnrichment,
  useOrganizationApplicationDetailEnrichment,
} from '@/features/program/general/hooks/use-application-form-detail-enrichment'
import {
  unmaskInstructorApplicationPrivacyRemote,
  unmaskOrganizationApplicationPrivacyRemote,
} from '@/features/program/general/api/applications-api-client'
import {
  mapInstructorApplicationDetailToApplicantRow,
  mapOrganizationApplicationDetailToApplicantSchoolRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  readInstructorApplicationSettlementFields,
  retainMaskedInstructorApplicationSettlement,
} from '@/features/program/general/lib/instructor-application-basic-info-supplement'
import { resolveApplicantCancelApprovalState } from '@/features/program/general/lib/applicant-cancel-approval-policy'
import { type ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import {
  patchGeneralIndividualApplicantManagerEvaluation,
  type GeneralIndividualApplicantDetailSavePayload,
  type GeneralIndividualApplicantRow,
} from '@/features/program/general/model/individual-applicant'
import {
  individualApplicationDecisionButtonLabels,
  isIndividualInterviewDocumentDecisionStage,
  shouldBlockIndividualFinalApproveForInterview,
  type IndividualApplicantScreeningStage,
} from '@/features/program/general/lib/individual-application-visibility'
import type { GeneralManagerEvaluation } from '@/features/program/general/lib/volunteer-screening-constants'
import { ApplicantInstructorBasicInfo } from './applicant-instructor-basic-info'
import {
  ApplicantInstructorApplicationInfo,
  type ApplicantInstructorApplicationInfoData,
} from './applicant-instructor-application-info'
import { ApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { ApplicantGeneralInstitutionBasicInfo } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info'
import { ApplicantGeneralIndividualBasicInfo } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/individual-basic-info'
import type { InstructorApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationDetailResponse'
import { ApplicantGeneralInstructorBasicInfo } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/applicant-general-instructor-basic-info'
import { ApplicantInstructorResume } from './applicant-instructor-resume'
import type { ApplicantInstructorResumeLayout } from './applicant-instructor-resume'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import {
  PersonalInfoRevealButton,
  PERSONAL_INFO_REVEAL_BUTTON_LABEL,
} from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import './applicants-detail-contents.css'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  PROGRAM_EDIT_INFO_CANCEL_LABEL,
  PROGRAM_EDIT_INFO_SAVE_LABEL,
} from '@/features/program/shared/lib/program-edit-info-button'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { TrainedTeachersApplicantInstitutionDetailContents } from '@/features/program/trained-teachers/ui/institution-detail/applicant-institution-detail-contents'

export type ApplicantType =
  | 'institutions'
  | 'instructors'
  | 'volunteers'
  | 'individual-applications'

export type ApplicantDetailVariant = 'legacy' | 'general'

const APPLICATION_INFO_EDIT_UNMASK_REASON = '신청 정보 수정'

const APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT =
  "정보 수정 시 개인정보 마스킹이 해제되며,\n개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다.\n해당 참여자의 개인정보 열람 및 정보를 수정하시겠습니까?"

const APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX = 1100

const DETAIL_TAB_PARAM = 'detailTab'

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
  loading?: boolean
  title?: string
  onClick?: () => void
  /** 기본 `filter` — 개인정보 상세보기 등은 `filter-wide` */
  size?: 'filter' | 'filter-wide'
}

function ApplicantHeaderActionsExtra({
  items,
  personalInfoRevealed,
  programPrivacyPending = false,
}: {
  items: ApplicantHeaderActionItem[]
  personalInfoRevealed: boolean
  programPrivacyPending?: boolean
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
            disabled={a.disabled || programPrivacyPending}
            onClick={a.onClick ?? (() => {})}
          />
        ) : a.key === 'edit-info' ? (
          <CmsButton
            key={a.key}
            {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
            disabled={a.disabled}
            title={a.title}
            onClick={a.onClick}
          >
            {a.label}
          </CmsButton>
        ) : (
          <CmsButton
            key={a.key}
            variant={a.variant}
            size="large"
            disabled={a.disabled}
            loading={a.loading}
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

function headerBtnEditInfo(onEnterEdit: () => void, disabled = false): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: PROGRAM_EDIT_INFO_BUTTON_PROPS.variant,
    label: PROGRAM_EDIT_INFO_BUTTON_LABEL,
    disabled,
    onClick: disabled ? undefined : onEnterEdit,
  }
}

function headerBtnCancelEdit(onCancel: () => void, saving = false): ApplicantHeaderActionItem {
  return {
    key: 'cancel-edit',
    variant: 'secondary',
    label: PROGRAM_EDIT_INFO_CANCEL_LABEL,
    disabled: saving,
    onClick: saving ? undefined : onCancel,
  }
}

function headerBtnSaveEdit(onSave: () => void, saving = false): ApplicantHeaderActionItem {
  return {
    key: 'save-edit',
    variant: 'primary',
    label: PROGRAM_EDIT_INFO_SAVE_LABEL,
    loading: saving,
    disabled: saving,
    onClick: saving ? undefined : onSave,
  }
}

function headerEditModeActions(
  onCancel: () => void,
  onSave: () => void,
  saving = false
): ApplicantHeaderActionItem[] {
  return [headerBtnCancelEdit(onCancel, saving), headerBtnSaveEdit(onSave, saving)]
}

function headerBtnEditInfoDisabled(): ApplicantHeaderActionItem {
  return {
    key: 'edit-info',
    variant: PROGRAM_EDIT_INFO_BUTTON_PROPS.variant,
    label: PROGRAM_EDIT_INFO_BUTTON_LABEL,
    disabled: true,
  }
}

function headerBtnWriteComment(onClick: () => void, disabled = false): ApplicantHeaderActionItem {
  return {
    key: 'write-comment',
    variant: 'primary',
    label: '코멘트 작성',
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
    disabled: !onCancelReject,
    onClick: () => onCancelReject?.(applicantId),
  }
}

function headerBtnCancelFinalPass(
  applicantId: string,
  onCancelFinalPass?: (id: string) => void,
  label = '합격 취소'
): ApplicantHeaderActionItem {
  return {
    key: 'cancel-final-pass',
    variant: 'delete',
    label,
    disabled: !onCancelFinalPass,
    onClick: () => onCancelFinalPass?.(applicantId),
  }
}

function headerBtnCancelFinalFail(
  applicantId: string,
  onCancelFinalFail?: (id: string) => void
): ApplicantHeaderActionItem {
  return {
    key: 'cancel-final-fail',
    variant: 'delete',
    label: '불합격 취소',
    disabled: !onCancelFinalFail,
    onClick: () => onCancelFinalFail?.(applicantId),
  }
}

function headerBtnsPendingParticipation(
  applicantId: string,
  onApprove: (id: string) => void,
  onReject: (id: string) => void,
  onRevealPersonalInfo: () => void,
  availableActions?: string[],
  labels: { reject: string; approve: string } = individualApplicationDecisionButtonLabels(false),
  approveGate?: { disabled: boolean; title?: string },
  applicationStatus?: string | null,
  hideReject = false
): ApplicantHeaderActionItem[] {
  if (isApprovalCancelledApplicationStatus(applicationStatus)) {
    return [headerBtnPrivacy(onRevealPersonalInfo)]
  }
  const items: ApplicantHeaderActionItem[] = []
  if (!hideReject && canPerformApplicationAction(availableActions, 'REJECT')) {
    items.push({
      key: 'reject',
      variant: 'delete',
      label: labels.reject,
      onClick: () => onReject(applicantId),
    })
  }
  if (canPerformApplicationAction(availableActions, 'APPROVE')) {
    const approveDisabled = approveGate?.disabled === true
    items.push({
      key: 'approve',
      variant: 'secondary',
      label: labels.approve,
      disabled: approveDisabled,
      title: approveDisabled ? approveGate?.title : undefined,
      onClick: approveDisabled ? undefined : () => onApprove(applicantId),
    })
  }
  items.push(headerBtnPrivacy(onRevealPersonalInfo))
  return items
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
  onCancelFinalPass?: (id: string) => void
  onCancelFinalFail?: (id: string) => void
  cancelApprovalState: { disabled: boolean; reason: string | null }
  isGeneralInstitutionEditEnabled?: boolean
  isEditingInstitutionDetail?: boolean
  isSavingInstitutionDetail?: boolean
  onEnterInstitutionEdit?: () => void
  onSaveInstitutionEdit?: () => void
  onCancelInstitutionEdit?: () => void
  isGeneralIndividualEditEnabled?: boolean
  isEditingIndividualDetail?: boolean
  isSavingIndividualDetail?: boolean
  onEnterIndividualEdit?: () => void
  onSaveIndividualEdit?: () => void
  onCancelIndividualEdit?: () => void
  isGeneralInstructorEditEnabled?: boolean
  isEditingInstructorDetail?: boolean
  isSavingInstructorDetail?: boolean
  onEnterInstructorEdit?: () => void
  onSaveInstructorEdit?: () => void
  onCancelInstructorEdit?: () => void
  isAdminCommentWriteEnabled?: boolean
  onEnterAdminCommentEdit?: () => void
  individualAvailableActions?: string[]
  individualSecondInterviewScreeningStatus?: GeneralSecondInterviewScreeningStatus
  individualInterviewResultStatus?: string | null
  institutionAvailableActions?: string[]
  instructorAvailableActions?: string[]
  institutionApplicationStatus?: string | null
  instructorApplicationStatus?: string | null
  individualApplicationStatus?: string | null
  allowCancelRejection?: boolean
  hidePendingRejectAction?: boolean
  isCancelledInstitution?: boolean
  isCancelledInstructor?: boolean
  program?: Program | null
  individualScreeningStage?: IndividualApplicantScreeningStage
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
    onCancelFinalPass,
    onCancelFinalFail,
    cancelApprovalState,
    isGeneralInstitutionEditEnabled = false,
    isEditingInstitutionDetail = false,
    isSavingInstitutionDetail = false,
    onEnterInstitutionEdit,
    onSaveInstitutionEdit,
    onCancelInstitutionEdit,
    isGeneralIndividualEditEnabled = false,
    isEditingIndividualDetail = false,
    isSavingIndividualDetail = false,
    onEnterIndividualEdit,
    onSaveIndividualEdit,
    onCancelIndividualEdit,
    isGeneralInstructorEditEnabled = false,
    isEditingInstructorDetail = false,
    onEnterInstructorEdit,
    onSaveInstructorEdit,
    onCancelInstructorEdit,
    isAdminCommentWriteEnabled = false,
    onEnterAdminCommentEdit,
    individualAvailableActions,
    individualSecondInterviewScreeningStatus,
    individualInterviewResultStatus,
    institutionAvailableActions,
    instructorAvailableActions,
    institutionApplicationStatus,
    instructorApplicationStatus,
    individualApplicationStatus,
    allowCancelRejection = true,
    hidePendingRejectAction = false,
    isCancelledInstitution = false,
    isCancelledInstructor = false,
    program = null,
    individualScreeningStage = 'main',
  } = params

  if (isCancelledInstitution || isCancelledInstructor) {
    return [headerBtnPrivacy(onRevealPersonalInfo)]
  }

  if (isApprovedInstitution) {
    if (isEditingInstitutionDetail && onCancelInstitutionEdit && onSaveInstitutionEdit) {
      return headerEditModeActions(
        onCancelInstitutionEdit,
        onSaveInstitutionEdit,
        isSavingInstitutionDetail
      )
    }

    const editButton =
      isGeneralInstitutionEditEnabled && onEnterInstitutionEdit
        ? headerBtnEditInfo(onEnterInstitutionEdit)
        : headerBtnEditInfoDisabled()

    const items: ApplicantHeaderActionItem[] = []

    if (
      onCancelApproval &&
      canPerformApplicationAction(institutionAvailableActions, 'CANCEL_APPROVAL')
    ) {
      items.push(headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState))
    }
    items.push(editButton)

    if (isAdminCommentWriteEnabled && onEnterAdminCommentEdit) {
      items.push(headerBtnWriteComment(onEnterAdminCommentEdit, isEditingInstitutionDetail))
    }

    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }

  if (isApprovedIndividual) {
    if (isEditingIndividualDetail && onCancelIndividualEdit && onSaveIndividualEdit) {
      return headerEditModeActions(
        onCancelIndividualEdit,
        onSaveIndividualEdit,
        isSavingIndividualDetail
      )
    }

    const items: ApplicantHeaderActionItem[] = []

    if (onCancelApproval && individualAvailableActions?.includes('CANCEL_APPROVAL')) {
      items.push(headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState))
    }
    if (
      onCancelFinalPass &&
      hasExplicitApplicationAction(individualAvailableActions, APPLICATION_ACTION_CANCEL_FINAL_PASS)
    ) {
      items.push(
        headerBtnCancelFinalPass(
          applicantId,
          onCancelFinalPass,
          resolveVolunteerInterview2CancelPassButtonLabel(individualSecondInterviewScreeningStatus)
        )
      )
    }

    if (isGeneralIndividualEditEnabled && onEnterIndividualEdit) {
      items.push(headerBtnEditInfo(onEnterIndividualEdit))
    }

    if (isAdminCommentWriteEnabled && onEnterAdminCommentEdit) {
      items.push(headerBtnWriteComment(onEnterAdminCommentEdit, isEditingIndividualDetail))
    }

    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }
  if (isApprovedInstructor) {
    if (isEditingInstructorDetail && onCancelInstructorEdit && onSaveInstructorEdit) {
      return headerEditModeActions(onCancelInstructorEdit, onSaveInstructorEdit)
    }

    const items: ApplicantHeaderActionItem[] = []

    if (
      onCancelApproval &&
      canPerformApplicationAction(instructorAvailableActions, 'CANCEL_APPROVAL')
    ) {
      items.push(headerBtnCancelApproval(applicantId, onCancelApproval, cancelApprovalState))
    }
    if (isGeneralInstructorEditEnabled && onEnterInstructorEdit) {
      items.push(headerBtnEditInfo(onEnterInstructorEdit))
    }

    if (isAdminCommentWriteEnabled && onEnterAdminCommentEdit) {
      items.push(headerBtnWriteComment(onEnterAdminCommentEdit, isEditingInstructorDetail))
    }

    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }
  if (isRejectedInstructor || isRejectedInstitution) {
    const availableActions = isRejectedInstructor
      ? instructorAvailableActions
      : institutionAvailableActions
    const applicationStatus = isRejectedInstructor
      ? instructorApplicationStatus
      : institutionApplicationStatus
    const items: ApplicantHeaderActionItem[] = []
    if (
      allowCancelRejection &&
      onCancelReject &&
      canRestoreRejectedApplication({ availableActions, applicationStatus })
    ) {
      items.push(headerBtnCancelReject(applicantId, onCancelReject))
    }
    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }
  if (isRejectedIndividual) {
    const items: ApplicantHeaderActionItem[] = []
    if (
      onCancelFinalFail &&
      hasExplicitApplicationAction(individualAvailableActions, APPLICATION_ACTION_CANCEL_FINAL_FAIL)
    ) {
      items.push(headerBtnCancelFinalFail(applicantId, onCancelFinalFail))
    }
    if (
      allowCancelRejection &&
      onCancelReject &&
      canRestoreRejectedApplication({
        availableActions: individualAvailableActions,
        applicationStatus: individualApplicationStatus,
      })
    ) {
      items.push(headerBtnCancelReject(applicantId, onCancelReject))
    }
    items.push(headerBtnPrivacy(onRevealPersonalInfo))
    return items
  }
  if (isInstitution || isInstructor || isIndividual) {
    const useDocumentDecisionLabels =
      isIndividual && isIndividualInterviewDocumentDecisionStage(program, individualScreeningStage)
    const availableActions = isInstructor
      ? instructorAvailableActions
      : isInstitution
        ? institutionAvailableActions
        : isIndividual && !useDocumentDecisionLabels
          ? undefined
          : individualAvailableActions
    const blockFinalApprove =
      isIndividual &&
      shouldBlockIndividualFinalApproveForInterview({
        program,
        screeningStage: individualScreeningStage,
        interviewResultStatus: individualInterviewResultStatus,
        secondInterviewScreeningStatus: individualSecondInterviewScreeningStatus,
      })
    return headerBtnsPendingParticipation(
      applicantId,
      onApprove,
      onReject,
      onRevealPersonalInfo,
      availableActions,
      isIndividual
        ? individualApplicationDecisionButtonLabels(useDocumentDecisionLabels)
        : undefined,
      blockFinalApprove ? { disabled: true, title: '면접 합격 후 최종 승인' } : undefined,
      isInstructor
        ? instructorApplicationStatus
        : isInstitution
          ? institutionApplicationStatus
          : individualApplicationStatus,
      hidePendingRejectAction
    )
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
  /** 일반 프로그램 개인 신청 관리자 코멘트 원격 저장. 미지정 시 내장 PATCH individual-applications */
  onSaveIndividualAdminComment?: (
    managerComment: string
  ) => Promise<GeneralIndividualApplicantRow | null>
  individualAdminCommentSaving?: boolean
  canUpdateIndividualAdminComment?: boolean
  /** 일반 개인 신청 전용 개인정보 원문 조회. 미지정 시 기존 회원/mock 흐름 유지 */
  onRevealIndividualPersonalInfo?: (reason: string) => Promise<GeneralIndividualApplicantRow>
  onIndividualPrivacyUnmasked?: (row: GeneralIndividualApplicantRow) => void
  showIndividualPrivacyReveal?: boolean
  /** 일반 개인 신청 전용 담당자 평가 저장. 미지정 시 기존 mock 저장 */
  onIndividualManagerEvaluationChange?: (
    managerSlot: 'A' | 'B',
    evaluation: GeneralManagerEvaluation
  ) => void | Promise<void>
  onIndividualTeamRoleChange?: (
    teamRole: NonNullable<NonNullable<GeneralIndividualApplicantRow['detail']>['teamRole']>
  ) => void | Promise<void>
  /** 일반 프로그램 강사 상세 수정 — 목록 동기화용 */
  onInstructorDetailSaved?: (row: ApplicantInstructorRow) => void
  /** Gemini 찾아가는 연수 강사 신청 상세의 신청 정보 테이블 */
  instructorApplicationInfo?: ApplicantInstructorApplicationInfoData
  /** 신청 상세 시안은 학력·경력만 표시 */
  instructorResumeLayout?: ApplicantInstructorResumeLayout
  onBack: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  /** 신청 기관/강사 승인 완료 시 승인 취소 클릭 시 호출 */
  onCancelApproval?: (id: string) => void
  /** 신청 강사 반려 시 반려 취소 클릭 시 호출 (대기로 복원) */
  onCancelReject?: (id: string) => void
  /** 최종 합격·예비 취소 — `final-result` FAIL overwrite */
  onCancelFinalPass?: (id: string) => void
  /** 최종 불합격 취소 — `cancel-rejection` (서류 PASS 유지) */
  onCancelFinalFail?: (id: string) => void
  /** 승인·반려 상태에서 알림 재발송 클릭 시 호출 */
  onResendNotification?: () => void
  /** Gemini 승인 연수 강사 상세 시안처럼 대기 상태의 반려 CTA를 숨긴다. */
  hidePendingRejectAction?: boolean
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
  instructorApplicationInfo,
  instructorResumeLayout,
  onBack: _onBack,
  onApprove,
  onReject,
  onCancelApproval,
  onCancelReject,
  onCancelFinalPass,
  onCancelFinalFail,
  onResendNotification,
  hidePendingRejectAction = false,
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

  const institutionRow = isInstitution ? (data as ApplicantSchoolRow) : null
  const instructorRow = isInstructor ? (data as ApplicantInstructorRow) : null
  const isTrainedTeachers = isTrainedTeachersDetailProgram(program ?? null)
  const { row: institutionData, isError: institutionDetailError } =
    useOrganizationApplicationDetailEnrichment(institutionRow, {
      enabled: isGeneralDetail,
      detailSource: isTrainedTeachers ? 'trained-teacher' : 'general',
    })
  const instructorData = useInstructorApplicationDetailEnrichment(instructorRow, {
    enabled: isGeneralDetail,
  })
  const individualData = isIndividual ? (data as GeneralIndividualApplicantRow) : null

  /** 신청 기관(참여자) 승인 완료: [승인 취소], [정보 수정], [개인정보 상세보기] */
  const isApprovedInstitution = isInstitution && institutionData?.approvalStatus === 'approved'

  /** 신청 강사 승인 완료: [승인 취소] [정보 수정] [코멘트 작성] [개인정보 상세보기] */
  const isApprovedInstructor = isInstructor && instructorData?.approvalStatus === 'approved'

  /** 신청 기관 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstitution = isInstitution && institutionData?.approvalStatus === 'rejected'

  /** 신청 강사 반려: [반려 취소] [개인정보 상세보기] */
  const isRejectedInstructor = isInstructor && instructorData?.approvalStatus === 'rejected'

  const isCancelledInstitution = isInstitution && institutionData?.approvalStatus === 'cancelled'
  const isCancelledInstructor = isInstructor && instructorData?.approvalStatus === 'cancelled'

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
  /** 합반 GET/POST/DELETE는 programType === GENERAL_ORGANIZATION 일 때만 */
  const mergeGroupsAllowed = isGeneralOrganizationProgram(program)
  const mergeGroupsEnabled =
    mergeGroupsAllowed &&
    isGeneralDetail &&
    isInstitution &&
    shouldUseOrganizationMergeGroupsRemoteApi()
  const mergeGroupsQuery = useOrganizationMergeGroups(
    programId,
    program?.backendProgramType,
    mergeGroupsEnabled
  )
  const institutionMergeView = useMemo(() => {
    if (!institutionData || !mergeGroupsQuery.data?.length) return null
    return resolveCombinedClassMergeViewState(
      mergeGroupsQuery.data,
      institutionData,
      institutionList
    )
  }, [institutionData, institutionList, mergeGroupsQuery.data])

  const institutionWithMerge = useMemo(() => {
    if (!institutionData) return null
    return {
      ...institutionData,
      detail: applyCombinedClassMergeToApplicantDetail(
        institutionData.detail,
        mergeGroupsQuery.data,
        institutionData,
        institutionList
      ),
    }
  }, [institutionData, institutionList, mergeGroupsQuery.data])

  const institutionDetailEdit = useApplicantInstitutionDetailEdit({
    institution: isGeneralDetail && isInstitution ? institutionWithMerge : null,
    program,
    institutionList,
    onSaved: rows => {
      onInstitutionDetailSaved?.(rows)
    },
    combinedClassReadOnly: isCombinedClassNonLeadMember(institutionMergeView),
  })

  const combinedClassProcess = useCombinedClassProcess({
    active:
      isGeneralDetail &&
      isInstitution &&
      institutionDetailEdit.isEditing &&
      institutionDetailEdit.isCombinedClassProgramEligible &&
      !institutionDetailEdit.combinedClassReadOnly,
    resetKey: institutionData?.id ?? '',
    schoolName: institutionData?.schoolName ?? '',
    leadGrade: institutionData?.educationGrade ?? '',
    committedApplication:
      institutionMergeView?.combinedClassApplication === '신청' ? '신청' : '미신청',
    committedPartnerIds: institutionMergeView?.combinedClassPartnerIds ?? [],
    partnerOptions: institutionDetailEdit.sameSchoolGradeOptions,
    applySelection: next => {
      institutionDetailEdit.updateDraft({
        combinedClassApplication: next.application,
        combinedClassPartnerApplicantIds: next.partnerIds,
      })
    },
    buildCandidates: partnerIds => {
      if (!institutionData) return []
      return buildCombinedClassLeadTeacherCandidatesFromApplicants(
        institutionData,
        institutionList.filter(row => partnerIds.includes(row.id))
      )
    },
    onProcess: async ({ partnerIds, leadTeacherMemberId }) => {
      if (!programId || !institutionData || !mergeGroupsAllowed) return false
      if (!shouldUseOrganizationMergeGroupsRemoteApi()) {
        notifyProgramApiUnavailable('general-org-merge-groups', '일반 프로그램 · 기관 합반 신청')
        return false
      }
      try {
        const saved = await saveOrganizationCombinedClassRemote({
          programId,
          programType: program?.backendProgramType,
          leadRow: institutionData,
          allRows: institutionList,
          combinedClassApplication: '신청',
          partnerRowIds: partnerIds,
          existingMergeGroups: mergeGroupsQuery.data,
          leadTeacherMemberId,
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.mergeGroups(programId),
        })
        return saved?.id ?? true
      } catch (error) {
        const responseData = axios.isAxiosError(error) ? error.response?.data : undefined
        const httpStatus = axios.isAxiosError(error) ? error.response?.status : undefined
        void showAlert({
          title: '처리 실패',
          content: axios.isAxiosError(error)
            ? resolveOrganizationMergeErrorMessage(responseData, {
                httpStatus,
                fallback: '합반 담당 교사를 지정하지 못했습니다. 다시 시도해 주세요.',
              })
            : error instanceof Error && error.message.trim()
              ? error.message
              : '합반 담당 교사를 지정하지 못했습니다. 다시 시도해 주세요.',
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.mergeGroups(programId),
        })
        await queryClient.invalidateQueries({
          queryKey: [...generalApplicationsQueryKeys.all, 'organization', programId],
        })
        institutionDetailEdit.updateDraft({
          combinedClassApplication: '신청',
          combinedClassPartnerApplicantIds: partnerIds,
        })
        return false
      }
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

  const handleAdminCommentSave = useCallback(async () => {
    if (!institutionData) return
    const comment = adminCommentDraft.trim()
    if (shouldUseOrganizationApplicationRemoteApi()) {
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

  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)

  /* eslint-disable react-hooks/set-state-in-effect -- 개인 신청자 변경 시 코멘트·평가 UI 초기화 */
  useEffect(() => {
    setIsIndividualAdminCommentModalOpen(false)
    setIndividualAdminCommentDraft('')
    setOpenManagerDropdown(null)
    setEditUnmaskConfirmOpen(false)
    setEditUnmaskConfirmLoading(false)
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
    if (!shouldUseGeneralApplicationsRemoteApi()) {
      void showAlert({
        title: PROGRAM_API_UNAVAILABLE_TITLE,
        content: buildProgramApiUnavailableSaveContent('개인 신청 관리자 코멘트'),
      })
      return
    }
    try {
      const updated = await saveIndividualApplicationAdminCommentRemote(
        individualData,
        individualAdminCommentDraft
      )
      onIndividualDetailSaved?.(updated)
      setIsIndividualAdminCommentModalOpen(false)
    } catch (error) {
      void showAlert({
        title: '안내',
        content: getGeneralProgramApiErrorMessage(error, MESSAGES.error.save),
      })
    }
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

  const handleInstructorAdminCommentSave = useCallback(async () => {
    if (!instructorData) return
    const comment = instructorAdminCommentDraft.trim()
    if (!shouldUseOrganizationApplicationRemoteApi()) {
      void showAlert({
        title: PROGRAM_API_UNAVAILABLE_TITLE,
        content: buildProgramApiUnavailableSaveContent('강사 신청 관리자 코멘트'),
      })
      return
    }

    const targetId = Number(instructorData.id)
    if (!Number.isFinite(targetId)) {
      void showAlert({
        title: '안내',
        content: MESSAGES.error.save,
      })
      return
    }

    try {
      const result = await upsertAdminCommentByTargetRemote({
        targetType: 'INSTRUCTOR_APPLICATION',
        targetId,
        screenCode: 'INSTRUCTOR_APPLICATION',
        comment,
      })
      onInstructorDetailSaved?.({
        ...instructorData,
        managerComment: result.commentText,
      })
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.instructorDetail(instructorData.id),
      })
      await queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.commentsByTarget(
          'INSTRUCTOR_APPLICATION',
          String(targetId)
        ),
      })
      setIsInstructorAdminCommentModalOpen(false)
    } catch {
      void showAlert({
        title: '안내',
        content: MESSAGES.error.save,
      })
    }
  }, [instructorAdminCommentDraft, instructorData, onInstructorDetailSaved, queryClient, showAlert])

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
        (instructorData?.approvalStatus === 'unknown'
          ? 'pending'
          : instructorData?.approvalStatus) ??
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

    // 일반 프로그램 — 강사 신청 상세: 승인 완료 시 승인 취소 가능 (POST …/cancel-approval)
    if (
      isGeneralDetail &&
      isInstructor &&
      instructorData?.approvalStatus === 'approved' &&
      onCancelApproval
    ) {
      return { disabled: false, reason: null }
    }

    // 일반 프로그램 — 개인 참여자: CANCEL_APPROVAL 노출. 교육 진행 이력은 BE 409.
    if (
      isGeneralDetail &&
      isIndividual &&
      individualData?.approvalStatus === 'approved' &&
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
    isInstructor,
    isIndividual,
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

  const [institutionTeacherPrivacy, setInstitutionTeacherPrivacy] = useState<{
    teacherName?: string
    teacherTel?: string
    teacherPhone?: string
    teacherEmail?: string
  } | null>(null)

  const [instructorPrivacy, setInstructorPrivacy] = useState<{
    instructorName?: string
    contact?: string
    email?: string
    address?: string
    bankName?: string
    accountNumber?: string
    accountHolder?: string
  } | null>(null)

  useEffect(() => {
    setInstitutionTeacherPrivacy(null)
    setInstructorPrivacy(null)
  }, [applicantId])

  const revealInstitutionTeacherPersonalInfo = useCallback(
    async (reason: string) => {
      const applicationId = institutionData?.id
      if (!applicationId?.trim()) {
        throw new Error('기관 신청 ID가 없습니다.')
      }
      const programIdNumber = program?.id != null ? Number(program.id) : NaN
      const detail = await unmaskOrganizationApplicationPrivacyRemote(
        applicationId,
        reason,
        Number.isFinite(programIdNumber) ? programIdNumber : undefined
      )
      const safeDetail = cacheProjectedProgramPrivacy(
        queryClient,
        generalApplicationsQueryKeys.organizationDetail(applicationId),
        program?.id ?? '',
        detail
      )
      return {
        name: safeDetail.teacherName?.trim() || undefined,
        teacherTel: safeDetail.teacherTel,
        teacherPhone: safeDetail.teacherPhone,
        email: safeDetail.teacherEmail?.trim() || undefined,
        detail: safeDetail,
      }
    },
    [institutionData?.id, program?.id, queryClient]
  )

  const applyInstitutionTeacherPersonalInfo = useCallback((payload: unknown) => {
    if (payload == null || typeof payload !== 'object') return
    const privacy = payload as {
      name?: unknown
      teacherTel?: unknown
      teacherPhone?: unknown
      phone?: unknown
      email?: unknown
    }
    const teacherTel = typeof privacy.teacherTel === 'string' ? privacy.teacherTel : undefined
    const teacherPhone =
      typeof privacy.teacherPhone === 'string'
        ? privacy.teacherPhone
        : typeof privacy.phone === 'string'
          ? privacy.phone
          : undefined
    setInstitutionTeacherPrivacy({
      ...(typeof privacy.name === 'string' ? { teacherName: privacy.name } : {}),
      ...(teacherTel != null ? { teacherTel } : {}),
      ...(teacherPhone != null ? { teacherPhone } : {}),
      ...(typeof privacy.email === 'string' ? { teacherEmail: privacy.email } : {}),
    })
  }, [])

  const revealInstructorPersonalInfo = useCallback(
    async (reason: string) => {
      const applicationId = instructorData?.id
      if (!applicationId?.trim()) {
        throw new Error('강사 신청 ID가 없습니다.')
      }
      const programIdNumber = program?.id != null ? Number(program.id) : NaN
      const detail = await unmaskInstructorApplicationPrivacyRemote(
        applicationId,
        reason,
        Number.isFinite(programIdNumber) ? programIdNumber : undefined
      )
      const detailKey = generalApplicationsQueryKeys.instructorDetail(applicationId)
      const previousDetail =
        queryClient.getQueryData<InstructorApplicationDetailResponse>(detailKey)
      const settlementFields = readInstructorApplicationSettlementFields(detail)
      const safeDetail = retainMaskedInstructorApplicationSettlement(
        cacheProjectedProgramPrivacy(queryClient, detailKey, program?.id ?? '', detail),
        previousDetail
      )
      queryClient.setQueryData(detailKey, safeDetail)
      if (instructorData) {
        const mapped = mapInstructorApplicationDetailToApplicantRow(safeDetail, instructorData)
        onInstructorDetailSaved?.(mapped)
      }
      return {
        name: safeDetail.instructorName?.trim() || undefined,
        phone: safeDetail.contact?.trim() || undefined,
        email: safeDetail.email?.trim() || undefined,
        address:
          [safeDetail.homeAddress, safeDetail.homeAddressDetail]
            .map(part => part?.trim())
            .filter(Boolean)
            .join(' ') || undefined,
        bankName: settlementFields.bankName,
        accountNumber: settlementFields.accountNumber,
        accountHolder: settlementFields.accountHolder,
      }
    },
    [instructorData, onInstructorDetailSaved, program?.id, queryClient]
  )

  const applyInstructorPersonalInfo = useCallback((payload: unknown) => {
    if (payload == null || typeof payload !== 'object') return
    const privacy = payload as {
      name?: unknown
      phone?: unknown
      email?: unknown
      address?: unknown
      bankName?: unknown
      accountNumber?: unknown
      accountHolder?: unknown
    }
    setInstructorPrivacy({
      ...(typeof privacy.name === 'string' ? { instructorName: privacy.name } : {}),
      ...(typeof privacy.phone === 'string' ? { contact: privacy.phone } : {}),
      ...(typeof privacy.email === 'string' ? { email: privacy.email } : {}),
      ...(typeof privacy.address === 'string' ? { address: privacy.address } : {}),
      ...(typeof privacy.bankName === 'string' ? { bankName: privacy.bankName } : {}),
      ...(typeof privacy.accountNumber === 'string'
        ? { accountNumber: privacy.accountNumber }
        : {}),
      ...(typeof privacy.accountHolder === 'string'
        ? { accountHolder: privacy.accountHolder }
        : {}),
    })
  }, [])

  const displayedInstitutionData = useMemo(() => {
    if (!institutionData) return null
    if (!institutionTeacherPrivacy) return institutionData
    return {
      ...institutionData,
      teacherName: institutionTeacherPrivacy.teacherName ?? institutionData.teacherName,
      /** 휴대전화만. Tel은 detail.teacherTel — 한 번호로 합치지 않음 */
      contact: institutionTeacherPrivacy.teacherPhone ?? institutionData.contact,
      detail: {
        ...institutionData.detail,
        teacherInfo: undefined,
        ...(institutionTeacherPrivacy.teacherTel != null
          ? { teacherTel: institutionTeacherPrivacy.teacherTel }
          : {}),
        ...(institutionTeacherPrivacy.teacherPhone != null
          ? { teacherPhone: institutionTeacherPrivacy.teacherPhone }
          : {}),
        ...(institutionTeacherPrivacy.teacherEmail
          ? { teacherEmail: institutionTeacherPrivacy.teacherEmail }
          : {}),
      },
    }
  }, [institutionData, institutionTeacherPrivacy])

  const displayedInstructorData = useMemo(() => {
    if (!instructorData) return null
    if (!instructorPrivacy) return instructorData
    return {
      ...instructorData,
      instructorName: instructorPrivacy.instructorName ?? instructorData.instructorName,
      contact: instructorPrivacy.contact ?? instructorData.contact,
      email: instructorPrivacy.email ?? instructorData.email,
      address: instructorPrivacy.address ?? instructorData.address,
      bankName: instructorPrivacy.bankName ?? instructorData.bankName,
      accountNumber: instructorPrivacy.accountNumber ?? instructorData.accountNumber,
      accountHolder: instructorPrivacy.accountHolder ?? instructorData.accountHolder,
    }
  }, [instructorData, instructorPrivacy])

  const {
    personalInfoRevealed,
    revealWithReason,
    openPersonalInfoRevealConfirm: onRevealPersonalInfo,
    confirmModal: personalInfoRevealModal,
    programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: programId,
    resolveProgramRole: () => resolveSessionProgramRole(programId),
    resolveAccessItem: resolveApplicantPersonalInfoAccessItem,
    resolveMemberId: () => {
      if (isIndividual) return individualData?.memberId
      if (isInstructor && instructorData?.instructorMemberId != null) {
        return String(instructorData.instructorMemberId)
      }
      if (isInstitution && institutionData?.teacherMemberId != null) {
        return String(institutionData.teacherMemberId)
      }
      return undefined
    },
    resolveMemberRole: () => {
      if (isIndividual) return 'INDIVIDUAL'
      if (isInstructor) return 'INSTRUCTOR'
      if (isInstitution) return 'SCHOOL'
      return undefined
    },
    revealPersonalInfo: isIndividual
      ? onRevealIndividualPersonalInfo
      : isInstitution
        ? revealInstitutionTeacherPersonalInfo
        : isInstructor
          ? revealInstructorPersonalInfo
          : undefined,
    onPrivacyUnmasked: payload => {
      if (isIndividual && onRevealIndividualPersonalInfo) {
        onIndividualPrivacyUnmasked?.(payload as GeneralIndividualApplicantRow)
        return
      }
      if (isInstitution) {
        applyInstitutionTeacherPersonalInfo(payload)
        return
      }
      if (isInstructor) {
        applyInstructorPersonalInfo(payload)
      }
    },
    resetDeps: [applicantId],
    controlMode: 'headerStickyNoop',
  })

  const requestStartIndividualEdit = useCallback(() => {
    if (personalInfoRevealed) {
      individualDetailEdit.enterEdit()
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [individualDetailEdit.enterEdit, personalInfoRevealed])

  const requestStartInstitutionEdit = useCallback(() => {
    if (personalInfoRevealed && institutionWithMerge) {
      institutionDetailEdit.enterEdit(institutionWithMerge)
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [institutionDetailEdit, institutionWithMerge, personalInfoRevealed])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(APPLICATION_INFO_EDIT_UNMASK_REASON)
      .then(result => {
        if (!result.ok) return
        setEditUnmaskConfirmOpen(false)
        if (isInstitution && institutionWithMerge && result.payload != null) {
          const payload = result.payload as { detail?: unknown }
          const dto =
            payload.detail != null && typeof payload.detail === 'object'
              ? payload.detail
              : result.payload
          const seeded = mapOrganizationApplicationDetailToApplicantSchoolRow(
            dto as Parameters<typeof mapOrganizationApplicationDetailToApplicantSchoolRow>[0],
            institutionWithMerge
          )
          institutionDetailEdit.enterEdit(seeded)
          return
        }
        if (isIndividual) {
          individualDetailEdit.enterEdit()
        }
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [
    editUnmaskConfirmLoading,
    individualDetailEdit,
    institutionDetailEdit,
    institutionWithMerge,
    isIndividual,
    isInstitution,
    revealWithReason,
  ])

  const headerExtraContent = useMemo(() => {
    const items = resolveApplicantHeaderItems({
      applicantId,
      isApprovedInstitution,
      isApprovedInstructor,
      isApprovedIndividual,
      isRejectedInstitution,
      isRejectedInstructor,
      isRejectedIndividual,
      isCancelledInstitution,
      isCancelledInstructor,
      isInstitution,
      isInstructor,
      isIndividual,
      onRevealPersonalInfo,
      onApprove,
      onReject,
      onCancelApproval,
      onCancelReject,
      onCancelFinalPass,
      onCancelFinalFail,
      cancelApprovalState,
      isGeneralInstitutionEditEnabled,
      isEditingInstitutionDetail: institutionDetailEdit.isEditing,
      isSavingInstitutionDetail: institutionDetailEdit.isSaving,
      onEnterInstitutionEdit: requestStartInstitutionEdit,
      onCancelInstitutionEdit: institutionDetailEdit.cancelEdit,
      onSaveInstitutionEdit: () => {
        void institutionDetailEdit.saveEdit().then(result => {
          if (result === COMBINED_CLASS_GRADE_REQUIRED_SAVE_RESULT) {
            combinedClassProcess.openGradeRequiredAlert()
          }
        })
      },
      isGeneralIndividualEditEnabled,
      isEditingIndividualDetail: individualDetailEdit.isEditing,
      isSavingIndividualDetail: individualDetailEdit.isSaving,
      onEnterIndividualEdit: requestStartIndividualEdit,
      onCancelIndividualEdit: individualDetailEdit.cancelEdit,
      onSaveIndividualEdit: () => {
        individualDetailEdit.saveEdit()
      },
      isGeneralInstructorEditEnabled,
      isEditingInstructorDetail: instructorDetailEdit.isEditing,
      onEnterInstructorEdit: instructorDetailEdit.enterEdit,
      onCancelInstructorEdit: instructorDetailEdit.cancelEdit,
      onSaveInstructorEdit: () => {
        instructorDetailEdit.saveEdit()
      },
      isAdminCommentWriteEnabled:
        isGeneralInstitutionEditEnabled ||
        (isGeneralIndividualEditEnabled && (canUpdateIndividualAdminComment ?? true)) ||
        isGeneralInstructorEditEnabled,
      onEnterAdminCommentEdit: isApprovedIndividual
        ? handleIndividualAdminCommentEditEnter
        : isApprovedInstructor
          ? handleInstructorAdminCommentEditEnter
          : handleAdminCommentEditEnter,
      individualAvailableActions: individualData?.availableActions,
      individualSecondInterviewScreeningStatus: individualData?.secondInterviewScreeningStatus,
      individualInterviewResultStatus: individualData?.interviewResultStatus,
      institutionAvailableActions: institutionData?.availableActions,
      instructorAvailableActions: instructorData?.availableActions,
      institutionApplicationStatus: institutionData?.applicationStatus,
      instructorApplicationStatus: instructorData?.applicationStatus,
      individualApplicationStatus: individualData?.applicationStatus,
      allowCancelRejection: !isTrainedTeachers,
      hidePendingRejectAction,
      program,
      individualScreeningStage,
    })
    if (!items) return null
    const hideIndividualPrivacy =
      isIndividual &&
      showIndividualPrivacyReveal === false &&
      isIndividualInterviewDocumentDecisionStage(program, individualScreeningStage)
    const visibleItems = hideIndividualPrivacy
      ? items.filter(item => item.key !== 'privacy')
      : items
    return (
      <ApplicantHeaderActionsExtra
        items={visibleItems}
        personalInfoRevealed={personalInfoRevealed}
        programPrivacyPending={programPrivacyPending}
      />
    )
  }, [
    applicantId,
    isApprovedInstitution,
    requestStartInstitutionEdit,
    institutionDetailEdit.cancelEdit,
    institutionDetailEdit.isEditing,
    institutionDetailEdit.isSaving,
    institutionDetailEdit.saveEdit,
    combinedClassProcess.openGradeRequiredAlert,
    individualDetailEdit.isEditing,
    individualDetailEdit.isSaving,
    individualDetailEdit.cancelEdit,
    individualDetailEdit.saveEdit,
    requestStartIndividualEdit,
    instructorDetailEdit.enterEdit,
    instructorDetailEdit.cancelEdit,
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
    isCancelledInstitution,
    isCancelledInstructor,
    isInstitution,
    isInstructor,
    isIndividual,
    onRevealPersonalInfo,
    onApprove,
    onReject,
    onCancelApproval,
    onCancelReject,
    onCancelFinalPass,
    onCancelFinalFail,
    hidePendingRejectAction,
    personalInfoRevealed,
    programPrivacyPending,
    individualData,
    institutionData,
    instructorData,
    showIndividualPrivacyReveal,
    program,
    individualScreeningStage,
    handleAdminCommentEditEnter,
    handleIndividualAdminCommentEditEnter,
    handleInstructorAdminCommentEditEnter,
    isTrainedTeachers,
  ])

  const tabBarExtraContent = headerExtraContent

  const institutionInfoPanel = useMemo(() => {
    if (!isInstitution || !displayedInstitutionData) return null
    const d = displayedInstitutionData
    const isCombinedClassHidden = !isGeneralOrganizationProgram(program)
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
          onDraftChange={partial => {
            const keys = Object.keys(partial)
            const isCombinedClassOnly = keys.every(
              key =>
                key === 'combinedClassApplication' || key === 'combinedClassPartnerApplicantIds'
            )
            if (
              isCombinedClassOnly &&
              partial.combinedClassApplication != null &&
              partial.combinedClassPartnerApplicantIds != null
            ) {
              combinedClassProcess.onApplicationChange(
                partial.combinedClassApplication,
                partial.combinedClassPartnerApplicantIds
              )
              return
            }
            if (
              isCombinedClassOnly &&
              keys.length === 1 &&
              partial.combinedClassPartnerApplicantIds != null
            ) {
              combinedClassProcess.onPartnerIdsChange(
                partial.combinedClassPartnerApplicantIds,
                institutionDetailEdit.draft?.combinedClassApplication ?? '미신청'
              )
              return
            }
            institutionDetailEdit.updateDraft(partial)
          }}
          sameSchoolGradeOptions={institutionDetailEdit.sameSchoolGradeOptions}
          classCountOptions={institutionDetailEdit.classCountOptions}
          teacherOptions={institutionDetailEdit.teacherOptions}
          isTeacherOptionsLoading={institutionDetailEdit.isTeacherOptionsLoading}
          showEducationFormatField={institutionDetailEdit.showEducationFormatField}
          isCombinedClassProgramEligible={institutionDetailEdit.isCombinedClassProgramEligible}
          isCombinedClassApplyRadioDisabled={
            institutionDetailEdit.isCombinedClassApplyRadioDisabled
          }
          combinedClassReadOnly={institutionDetailEdit.combinedClassReadOnly}
          hideCombinedClass={isCombinedClassHidden}
          textbookOptions={institutionDetailEdit.textbookOptions}
          textbookDisplayLabel={institutionDetailEdit.textbookDisplayLabel}
          isTextbookCatalogLoading={institutionDetailEdit.isTextbookCatalogLoading}
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
    displayedInstitutionData,
    isGeneralDetail,
    personalInfoRevealed,
    program,
    institutionDetailEdit.isEditing,
    institutionDetailEdit.draft,
    institutionDetailEdit.updateDraft,
    institutionDetailEdit.draft?.combinedClassApplication,
    combinedClassProcess.onApplicationChange,
    combinedClassProcess.onPartnerIdsChange,
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
    if (!isInstructor || !displayedInstructorData) return null
    const d = displayedInstructorData
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
            persistAffiliationEmploymentRemote
            onAffiliationEmploymentStatusSaved={status => {
              onInstructorDetailSaved?.({
                ...d,
                affiliationEmploymentStatus: status,
              })
            }}
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
        {instructorApplicationInfo ? (
          <ApplicantInstructorApplicationInfo data={instructorApplicationInfo} />
        ) : null}
        <ApplicantInstructorResume instructor={d} layout={instructorResumeLayout} />
      </div>
    )
  }, [
    isInstructor,
    displayedInstructorData,
    isGeneralDetail,
    personalInfoRevealed,
    instructorDetailEdit.isEditing,
    instructorDetailEdit.draft,
    instructorDetailEdit.updateDraft,
    instructorDetailEdit.validationErrors,
    onResendNotification,
    onInstructorDetailSaved,
    instructorApplicationInfo,
    instructorResumeLayout,
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

  if (isInstitution && isGeneralDetail && institutionDetailError) {
    return (
      <div className="applicant-contents">
        <div className="applicant-contents__panel">
          <Empty description="기관 신청 상세 정보를 불러오지 못했습니다." />
        </div>
        {personalInfoRevealModal}
        {adminCommentModals}
        {combinedClassProcess.modals}
      </div>
    )
  }

  if (
    isInstitution &&
    isGeneralDetail &&
    isTrainedTeachersDetailProgram(program ?? null) &&
    displayedInstitutionData
  ) {
    return (
      <>
        <TrainedTeachersApplicantInstitutionDetailContents
          institution={displayedInstitutionData}
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
        {combinedClassProcess.modals}
        <ConfirmModal
          open={editUnmaskConfirmOpen}
          title="정보 수정 안내"
          content={APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT}
          confirmText="정보 수정"
          cancelText="취소"
          onConfirm={confirmEditUnmaskAndStartEdit}
          onCancel={closeEditUnmaskConfirm}
          confirmLoading={editUnmaskConfirmLoading}
          zIndex={APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX}
        />
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
        {/* 1사1교 기관 신청 상세 — 시안 하단 52px (교육받은교사 기관 신청 상세와 같은 스페이서) */}
        {isInstitution && isGeneralDetail && isCompanySchoolProgram(program ?? null) ? (
          <div className="applicant-contents__page-bottom-spacer" aria-hidden />
        ) : null}
        {personalInfoRevealModal}
        {isIndividual || isInstitution ? (
          <ConfirmModal
            open={editUnmaskConfirmOpen}
            title="정보 수정 안내"
            content={APPLICATION_INFO_EDIT_UNMASK_CONFIRM_CONTENT}
            confirmText="정보 수정"
            cancelText="취소"
            onConfirm={confirmEditUnmaskAndStartEdit}
            onCancel={closeEditUnmaskConfirm}
            confirmLoading={editUnmaskConfirmLoading}
            zIndex={APPLICATION_INFO_EDIT_UNMASK_MODAL_Z_INDEX}
          />
        ) : null}
        {adminCommentModals}
        {combinedClassProcess.modals}
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
