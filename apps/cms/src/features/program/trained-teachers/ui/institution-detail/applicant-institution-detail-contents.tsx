/**
 * 교육받은 교사 — 기관 신청 목록 상세 (신청 정보 | 교육 일지 2탭)
 */

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { Program } from '@/types/domain'
import type { useApplicantInstitutionDetailEdit } from '@/features/program/general/hooks/use-applicant-institution-detail-edit'
import {
  getTrainedTeachersInstitutionDetailTabKeys,
  TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS,
  normalizeTrainedTeachersInstitutionDetailTab,
  type TrainedTeachersInstitutionDetailTabKey,
} from '@/features/program/trained-teachers/lib/institution-detail-tabs'
import { TrainedTeachersApplicantInstitutionBasicInfo } from './applicant-institution-basic-info'
import { TrainedTeachersEducationJournalSection } from './education-journal-section'
import '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents.css'

const DETAIL_TAB_PARAM = 'detailTab'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(
    () =>
      normalizeTrainedTeachersInstitutionDetailTab(
        searchParams.get(DETAIL_TAB_PARAM),
        program?.generalCommonInfo?.educationJournalEnabled
      ),
    [program?.generalCommonInfo?.educationJournalEnabled, searchParams]
  )

  useEffect(() => {
    const raw = searchParams.get(DETAIL_TAB_PARAM)
    const normalized = normalizeTrainedTeachersInstitutionDetailTab(
      raw,
      program?.generalCommonInfo?.educationJournalEnabled
    )
    if (raw === normalized || (raw == null && normalized === 'application')) return

    const next = new URLSearchParams(searchParams)
    if (normalized === 'application') next.delete(DETAIL_TAB_PARAM)
    else next.set(DETAIL_TAB_PARAM, normalized)
    setSearchParams(next, { replace: true })
  }, [program?.generalCommonInfo?.educationJournalEnabled, searchParams, setSearchParams])

  const setActiveTab = useCallback(
    (key: string) => {
      const next = new URLSearchParams(searchParams)
      if (key === 'application') {
        next.delete(DETAIL_TAB_PARAM)
      } else {
        next.set(DETAIL_TAB_PARAM, key)
      }
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const tabDefs = useMemo(
    () =>
      getTrainedTeachersInstitutionDetailTabKeys(
        program?.generalCommonInfo?.educationJournalEnabled
      ).map(key => ({
        key,
        label: TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS[key],
      })),
    [program?.generalCommonInfo?.educationJournalEnabled]
  )

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
      showEducationFormatField={institutionDetailEdit.showEducationFormatField}
      validationErrors={institutionDetailEdit.validationErrors}
      onResendNotificationClick={onResendNotification}
      isAdminCommentEditing={isAdminCommentEditing}
      adminCommentDraft={adminCommentDraft}
      onAdminCommentDraftChange={onAdminCommentDraftChange}
      adminCommentError={adminCommentError}
    />
  )

  const journalPanel = (
    <TrainedTeachersEducationJournalSection
      institutionId={institution.id}
      institutionName={institution.schoolName}
      programId={program?.id ?? institution.programId}
    />
  )

  const tabPanel =
    (activeTab as TrainedTeachersInstitutionDetailTabKey) === 'journal'
      ? journalPanel
      : applicationPanel

  return (
    <div className="applicant-contents">
      <div className="applicant-contents__tabs-wrap">
        <CmsTextTabs
          className="applicant-contents__tabs"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabDefs}
          trailing={headerExtraContent}
        />
        <div className="applicant-contents__panel">{tabPanel}</div>
      </div>
      {personalInfoRevealModal}
    </div>
  )
}
