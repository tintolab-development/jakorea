/** 교육받은 교사 — 기관 신청 목록 상세 (신청 정보) */

import type { ReactNode } from 'react'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import type { useApplicantInstitutionDetailEdit } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import { TrainedTeachersApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents.css'

type InstitutionDetailEdit = ReturnType<typeof useApplicantInstitutionDetailEdit>

export interface TrainedTeachersApplicantInstitutionDetailContentsProps {
  institution: ApplicantSchoolRow
  program: Program | null
  personalInfoRevealed: boolean
  headerExtraContent: ReactNode
  personalInfoRevealModal: ReactNode
  institutionDetailEdit: InstitutionDetailEdit
  onResendNotification?: () => void
  isAdminCommentEditing: boolean
  adminCommentDraft: string
  onAdminCommentDraftChange: (value: string) => void
  adminCommentError?: string
}

export function TrainedTeachersApplicantInstitutionDetailContents({
  institution,
  program,
  personalInfoRevealed,
  headerExtraContent,
  personalInfoRevealModal,
  institutionDetailEdit,
  onResendNotification,
  isAdminCommentEditing,
  adminCommentDraft,
  onAdminCommentDraftChange,
  adminCommentError,
}: TrainedTeachersApplicantInstitutionDetailContentsProps) {
  const applicationPanel = (
    <TrainedTeachersApplicantInstitutionBasicInfo
      institution={institution}
      detail={institution.detail}
      program={program}
      maskSensitive={!personalInfoRevealed && institution.approvalStatus !== 'approved'}
      mode={institutionDetailEdit.isEditing ? 'edit' : 'view'}
      draft={institutionDetailEdit.draft ?? undefined}
      onDraftChange={institutionDetailEdit.updateDraft}
      classCountOptions={institutionDetailEdit.classCountOptions}
      teacherOptions={institutionDetailEdit.teacherOptions}
      isTeacherOptionsLoading={institutionDetailEdit.isTeacherOptionsLoading}
      textbookOptions={institutionDetailEdit.textbookOptions}
      textbookDisplayLabel={institutionDetailEdit.textbookDisplayLabel}
      isTextbookCatalogLoading={institutionDetailEdit.isTextbookCatalogLoading}
      showEducationFormatField={institutionDetailEdit.showEducationFormatField}
      validationErrors={institutionDetailEdit.validationErrors}
      onResendNotificationClick={onResendNotification}
      isAdminCommentEditing={isAdminCommentEditing}
      adminCommentDraft={adminCommentDraft}
      onAdminCommentDraftChange={onAdminCommentDraftChange}
      adminCommentError={adminCommentError}
    />
  )

  return (
    <div className="applicant-contents applicant-contents--institution-application-detail">
      <div className="applicant-contents__header-only-actions">{headerExtraContent}</div>
      <div className="applicant-contents__panel">{applicationPanel}</div>
      <div className="applicant-contents__page-bottom-spacer" aria-hidden />
      {personalInfoRevealModal}
    </div>
  )
}
