/**
 * 교육받은 교사 — 프로그램 진행 현황 참여 기관 상세 (신청 정보 | 교육 일지 2탭)
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsButton } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { CmsTextTabs } from '@/shared/ui/cms-text-tabs'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE } from '@/shared/constants/messages'
import {
  getProgramProgressDisplayStatus,
  resolveProgramEnrollmentDisplayStatusFromLabel,
} from '@/shared/constants/status'
import { ProgramEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import { TextbookStatusBadge } from '@/shared/components/textbook-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME,
} from '@/shared/components'
import { TEXTBOOK_STATUS_OPTION_KEYS } from '@/data/mock/participating-schools'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import { useParticipatingInstitutionDetailEdit } from '@/features/program/general/hooks/use-participating-institution-detail-edit'
import {
  getParticipatingInstitutionActivityWithdrawScheduleOptions,
  resolveParticipatingInstitutionActivityWithdrawPatch,
} from '@/features/program/general/lib/participating-institution-activity-withdraw'
import {
  InstitutionAddressDetailEdit,
  InstitutionEducationFormatRadios,
  InstitutionMultilineEdit,
  InstitutionTeacherEdit,
} from '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-application-edit-fields'
import {
  withProgramDetailTdDivider,
  ProgramDetailTdSegmentWrap,
} from '@/features/program/shared/ui/program-detail-td-divider'
import {
  ActivityWithdrawScheduleModal,
  type ActivityWithdrawScheduleModalPayload,
} from '@/features/program/shared/ui/activity-withdraw-schedule-modal'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { MemberAdminCommentModal } from '@/features/user/detail/ui/modal/member-admin-comment-modal'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  maskEmailLocalAfterTwoChars,
  maskMobilePhoneMiddleStars,
} from '@/features/program/general/lib/teacher-contact-display-mask'
import {
  TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS,
  TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS,
  normalizeTrainedTeachersInstitutionDetailTab,
  type TrainedTeachersInstitutionDetailTabKey,
} from '@/features/program/trained-teachers/lib/institution-detail-tabs'
import { TrainedTeachersParticipatingInstitutionApplicationInfo } from './participating-institution-application-info'
import { TrainedTeachersEducationJournalSection } from './education-journal-section'
import type { SchoolDetailFullpageViewProps } from '@/features/program/general/ui/detail-modal/program-status/school-detail-fullpage-view'
import '@/features/program/general/ui/detail-modal/program-status/school-detail-fullpage-view.css'
import '@/features/program/general/ui/detail-modal/program-status/participating-institutions-section.css'
import '@/features/program/general/ui/detail-modal/applications/applicant-detail/institution-basic-info.css'

export function TrainedTeachersParticipatingInstitutionDetailView({
  program,
  detail,
  row,
  participatingSchoolList = [],
  activeTab: activeTabFromUrl,
  onTabChange,
  onSaveBasicInfo,
  savedBasicPatches = {},
  onTextbookStatusChange,
}: SchoolDetailFullpageViewProps) {
  const currentUser = useAuthStore(state => state.user)
  const showAdminCommentSection = isCmsAdminUser(currentUser)
  const { showAlert } = useCmsAlert()
  const [internalTab, setInternalTab] =
    useState<TrainedTeachersInstitutionDetailTabKey>('application')
  const activeTab = normalizeTrainedTeachersInstitutionDetailTab(
    activeTabFromUrl !== undefined && activeTabFromUrl !== null ? activeTabFromUrl : internalTab
  )
  const setActiveTab = (key: TrainedTeachersInstitutionDetailTabKey) => {
    if (onTabChange) onTabChange(key)
    else setInternalTab(key)
  }

  const [textbookStatusDropdownOpen, setTextbookStatusDropdownOpen] = useState(false)
  const [activityWithdrawModalOpen, setActivityWithdrawModalOpen] = useState(false)
  const [adminCommentModalOpen, setAdminCommentModalOpen] = useState(false)
  const [adminCommentDraft, setAdminCommentDraft] = useState('')
  const [adminCommentError, setAdminCommentError] = useState<string | undefined>()

  useEffect(() => {
    setTextbookStatusDropdownOpen(false)
  }, [detail.id])

  useEffect(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentDraft('')
    setAdminCommentError(undefined)
    setActivityWithdrawModalOpen(false)
  }, [detail.id, detail.adminComment, savedBasicPatches[detail.id]?.adminComment])

  const mergedDetail = { ...detail, ...savedBasicPatches[detail.id] }
  const sessions = row.sessions ?? []
  const isActivityWithdrawn = mergedDetail.activityWithdrawn === true

  const activityWithdrawScheduleOptions = useMemo(
    () => getParticipatingInstitutionActivityWithdrawScheduleOptions(program, sessions),
    [program, sessions]
  )

  const applicationInfoEdit = useParticipatingInstitutionDetailEdit({
    detail: mergedDetail,
    row,
    program,
    participatingSchoolList,
    onSaveBasicInfo,
  })

  const {
    isEditing: isApplicationInfoEditing,
    draft: applicationInfoDraft,
    validationErrors: applicationInfoValidationErrors,
    textbookOptions,
    textbookDisplay,
    usesTextbook,
    canEditTextbook,
    enterEdit: enterApplicationInfoEdit,
    saveEdit: saveApplicationInfoEdit,
    updateDraft: updateApplicationInfoDraft,
  } = applicationInfoEdit

  const programProgressStatus =
    mergedDetail.programProgressStatus ??
    resolveProgramEnrollmentDisplayStatusFromLabel(mergedDetail.programProgressLabel) ??
    getProgramProgressDisplayStatus(program)

  const resolvePersonalInfoAccessItem = useCallback(
    () => mergedDetail.schoolName ?? row.schoolName ?? '학교 상세 정보',
    [mergedDetail.schoolName, row.schoolName]
  )

  const {
    personalInfoRevealed,
    onPrivacyControlClick: handlePrivacyToggleClick,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resetDeps: [detail.id],
    controlMode: 'toggleRemask',
  })

  const privacyMasked = !personalInfoRevealed

  const handleAdminCommentEditEnter = useCallback(() => {
    if (isApplicationInfoEditing) return
    setAdminCommentDraft(mergedDetail.adminComment ?? '')
    setAdminCommentError(undefined)
    setAdminCommentModalOpen(true)
  }, [isApplicationInfoEditing, mergedDetail.adminComment])

  const handleAdminCommentSave = useCallback(() => {
    const trimmed = adminCommentDraft.trim()
    onSaveBasicInfo?.({ id: detail.id, adminComment: trimmed || undefined })
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [adminCommentDraft, detail.id, onSaveBasicInfo])

  const handleAdminCommentModalCancel = useCallback(() => {
    setAdminCommentModalOpen(false)
    setAdminCommentError(undefined)
  }, [])

  const handleAdminCommentDraftChange = useCallback((value: string) => {
    setAdminCommentDraft(value)
    setAdminCommentError(undefined)
  }, [])

  const handleRequestActivityWithdraw = useCallback(() => {
    if (isActivityWithdrawn) {
      showAlert({
        title: '활동 포기 안내',
        content: PARTICIPATING_INSTITUTION_ALREADY_ACTIVITY_WITHDRAWN_ALERT_MESSAGE,
      })
      return
    }
    if (isApplicationInfoEditing) return
    setActivityWithdrawModalOpen(true)
  }, [isActivityWithdrawn, isApplicationInfoEditing, showAlert])

  const handleConfirmActivityWithdraw = useCallback(
    (payload: ActivityWithdrawScheduleModalPayload) => {
      const patch = resolveParticipatingInstitutionActivityWithdrawPatch(
        program,
        sessions,
        payload.stopSessionKey
      )
      if (!patch) return
      onSaveBasicInfo?.({ id: detail.id, ...patch })
      setActivityWithdrawModalOpen(false)
    },
    [detail.id, onSaveBasicInfo, program, sessions]
  )

  const teacherDisplaySegments = [
    mergedDetail.teacherName &&
      `담당 교사 : ${
        privacyMasked ? MASKING_POLICY.name(mergedDetail.teacherName) : mergedDetail.teacherName
      }`,
    mergedDetail.teacherPhone &&
      `Tel : ${
        privacyMasked ? MASKING_POLICY.phone(mergedDetail.teacherPhone) : mergedDetail.teacherPhone
      }`,
    mergedDetail.teacherMobile &&
      `M : ${
        privacyMasked
          ? maskMobilePhoneMiddleStars(mergedDetail.teacherMobile)
          : mergedDetail.teacherMobile
      }`,
    mergedDetail.teacherEmail &&
      `E-mail : ${
        privacyMasked
          ? maskEmailLocalAfterTwoChars(mergedDetail.teacherEmail)
          : mergedDetail.teacherEmail
      }`,
  ].filter((v): v is string => Boolean(v))

  const textbookStatusCell =
    onTextbookStatusChange != null ? (
      <span className={STATUS_DROPDOWN_CELL_INLINE_TAG100_CLASSNAME}>
        <StatusDropdownCell<TextbookStatusKey>
          status={mergedDetail.textbookStatus}
          statusOptions={TEXTBOOK_STATUS_OPTION_KEYS}
          renderBadge={s => <TextbookStatusBadge status={s} />}
          isItemDisabled={(cur, opt) => cur === opt}
          onChange={newStatus => onTextbookStatusChange(detail.id, newStatus)}
          isOpen={textbookStatusDropdownOpen}
          onOpenChange={setTextbookStatusDropdownOpen}
          tagLayout="tag100"
        />
      </span>
    ) : (
      <TextbookStatusBadge status={mergedDetail.textbookStatus} />
    )

  const hasSelectedTextbook =
    (mergedDetail.textbookId?.trim() ?? '') !== '' || (mergedDetail.textbookName?.trim() ?? '') !== ''
  const textbookNameView =
    !hasSelectedTextbook ? '미정' : textbookDisplay.textbookName
  const kitsAndQty =
    hasSelectedTextbook && textbookDisplay.textbookKits > 0
      ? `${textbookDisplay.textbookKits}키트 (${textbookDisplay.textbookQuantity}권)`
      : '-'

  const textbookCell =
    isApplicationInfoEditing && applicationInfoDraft && canEditTextbook ? (
      <div className="institution-basic-info__field-stack school-detail-fullpage-view__textbook-select-only">
        <CmsSelect
          className="institution-basic-info__full-width-control"
          inputSize="large"
          placeholder="교재명 선택"
          value={applicationInfoDraft.textbookId || undefined}
          options={textbookOptions.map(option => ({
            label: option.label,
            value: option.value,
          }))}
          onChange={value => {
            const selected = textbookOptions.find(option => option.value === value)
            updateApplicationInfoDraft({
              textbookId: selected?.value ?? String(value ?? ''),
              textbookName: selected?.textbookName ?? '',
            })
          }}
        />
        {applicationInfoValidationErrors?.textbookId ||
        applicationInfoValidationErrors?.textbookName ? (
          <span className="institution-basic-info__field-error">
            {applicationInfoValidationErrors.textbookId ??
              applicationInfoValidationErrors.textbookName}
          </span>
        ) : null}
      </div>
    ) : (
      <div className="participating-institution-application-info__textbook-value">
        <ProgramDetailTdSegmentWrap>
          {withProgramDetailTdDivider([textbookNameView, kitsAndQty, textbookStatusCell])}
        </ProgramDetailTdSegmentWrap>
      </div>
    )

  const isApplicationDetailEditing =
    isApplicationInfoEditing && applicationInfoDraft != null

  const classAndCountDisplay = withProgramDetailTdDivider([
    `${mergedDetail.classCount}개 학급`,
    `총 ${mergedDetail.studentCount}명`,
  ])

  return (
    <div className="school-detail-fullpage-view">
      <CmsTextTabs
        className="school-detail-fullpage-view__tabs-row"
        activeKey={activeTab}
        onChange={key => setActiveTab(key as TrainedTeachersInstitutionDetailTabKey)}
        items={TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_KEYS.map(key => ({
          key,
          label: TRAINED_TEACHERS_INSTITUTION_DETAIL_TAB_LABELS[key],
        }))}
        trailing={
          activeTab === 'application' ? (
            <>
              <CmsButton
                variant="delete"
                size="large"
                width={140}
                disabled={isActivityWithdrawn || isApplicationInfoEditing}
                onClick={handleRequestActivityWithdraw}
              >
                활동 포기
              </CmsButton>
              <CmsButton
                {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
                onClick={resolveProgramEditInfoClick(isApplicationInfoEditing, {
                  onEnterEdit: enterApplicationInfoEdit,
                  onSaveEdit: () => saveApplicationInfoEdit(),
                })}
              >
                {PROGRAM_EDIT_INFO_BUTTON_LABEL}
              </CmsButton>
              {showAdminCommentSection ? (
                <CmsButton
                  variant="primary"
                  size="large"
                  width={140}
                  disabled={isApplicationInfoEditing}
                  onClick={handleAdminCommentEditEnter}
                >
                  코멘트 작성
                </CmsButton>
              ) : null}
              <PersonalInfoRevealButton
                labelMode="toggle"
                revealed={personalInfoRevealed}
                style={{ minWidth: 180 }}
                onClick={handlePrivacyToggleClick}
              />
            </>
          ) : null
        }
      />

      <div className="program-detail-fullpage-modal__content school-detail-fullpage-view__content">
        {activeTab === 'application' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__application-tab">
            <TrainedTeachersParticipatingInstitutionApplicationInfo
              formError={applicationInfoValidationErrors?.form}
              showAdminComment={showAdminCommentSection}
              adminComment={mergedDetail.adminComment}
              isAdminCommentEditing={false}
              adminCommentError={adminCommentError}
              programProgressCell={
                <ProgramEnrollmentStatusText status={programProgressStatus} />
              }
              textbookCell={textbookCell}
              usesTextbook={usesTextbook}
              textbookEditFullWidth={isApplicationInfoEditing && canEditTextbook}
              institutionId={row.id}
              schoolName={mergedDetail.schoolName}
              educationGrade={mergedDetail.educationGrade}
              region={mergedDetail.region}
              addressDetail={
                isApplicationDetailEditing ? (
                  <InstitutionAddressDetailEdit
                    value={applicationInfoDraft.addressDetail}
                    onChange={value => updateApplicationInfoDraft({ addressDetail: value })}
                    error={applicationInfoValidationErrors?.addressDetail}
                  />
                ) : (
                  mergedDetail.addressDetail ?? '-'
                )
              }
              classAndCount={classAndCountDisplay}
              educationFormat={
                isApplicationDetailEditing ? (
                  <InstitutionEducationFormatRadios
                    value={applicationInfoDraft.educationFormat}
                    onChange={value => updateApplicationInfoDraft({ educationFormat: value })}
                    error={applicationInfoValidationErrors?.educationFormat}
                  />
                ) : (
                  mergedDetail.educationFormat ?? '-'
                )
              }
              teacherInfo={
                isApplicationDetailEditing ? (
                  <InstitutionTeacherEdit
                    name={applicationInfoDraft.teacherName}
                    phone={applicationInfoDraft.teacherPhone}
                    mobile={applicationInfoDraft.teacherMobile}
                    email={applicationInfoDraft.teacherEmail}
                    onChange={patch => updateApplicationInfoDraft(patch)}
                    errors={applicationInfoValidationErrors}
                  />
                ) : teacherDisplaySegments.length > 0 ? (
                  withProgramDetailTdDivider(teacherDisplaySegments)
                ) : (
                  '-'
                )
              }
              applicationReason={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.applicationReason}
                    onChange={value => updateApplicationInfoDraft({ applicationReason: value })}
                    placeholder="신청 사유를 입력해 주세요."
                    error={applicationInfoValidationErrors?.applicationReason}
                  />
                ) : (
                  mergedDetail.applicationReason ?? '-'
                )
              }
              otherRequests={
                isApplicationDetailEditing ? (
                  <InstitutionMultilineEdit
                    value={applicationInfoDraft.otherRequests}
                    onChange={value => updateApplicationInfoDraft({ otherRequests: value })}
                    placeholder="기타 요청사항을 입력해 주세요."
                    error={applicationInfoValidationErrors?.otherRequests}
                  />
                ) : (
                  mergedDetail.otherRequests ?? '-'
                )
              }
            />
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="program-detail-fullpage-modal__info-tab school-detail-fullpage-view__journal-tab">
            <TrainedTeachersEducationJournalSection
              variant="progress"
              institutionId={row.id}
              institutionName={mergedDetail.schoolName ?? row.schoolName}
              programId={program?.id ?? row.programId}
            />
          </div>
        )}
      </div>

      {personalInfoRevealModal}

      <ActivityWithdrawScheduleModal
        open={activityWithdrawModalOpen}
        scheduleOptions={activityWithdrawScheduleOptions}
        onCancel={() => setActivityWithdrawModalOpen(false)}
        onConfirm={handleConfirmActivityWithdraw}
      />
      <MemberAdminCommentModal
        open={adminCommentModalOpen}
        value={adminCommentDraft}
        onChange={handleAdminCommentDraftChange}
        onCancel={handleAdminCommentModalCancel}
        onConfirm={handleAdminCommentSave}
      />
    </div>
  )
}
