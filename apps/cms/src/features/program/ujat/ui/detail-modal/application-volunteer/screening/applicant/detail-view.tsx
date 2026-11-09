import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  UjatVolunteerApplicantRow,
  UjatVolunteerInterviewEvaluationPayload,
} from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatManagerEvaluation } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import { CmsButton } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { useUjatCanWrite } from '@/features/program/ujat/lib/use-can-write'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { resolveSessionProgramRole } from '@/entities/program/lib/program-privacy-access'
import { sanitizeProgramPrivacyOverlay } from '@/features/program/shared/lib/program-my-assignment'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { unmaskVolunteerApplicationPrivacyRemote } from '@/features/program/general/api/applications-api-client'
import {
  applyUjatVolunteerApplicationDetail,
  useUjatVolunteerApplicationDetailEnrichment,
} from '@/features/program/ujat/lib/ujat-volunteer-application-detail'
import { ApplicantBasicInfo } from './basic-info'
import { ManagerEvaluationSection } from './manager-evaluation-section'
import { InterviewAvailabilitySection } from './interview-availability'
import { EssaySections } from './essay-sections'
import { PreviousTermSection } from './previous-term-section'
import {
  InterviewEvaluationSection,
  type InterviewEvaluationSectionHandle,
} from './interview-evaluation-section'
import {
  getUjatInterview2NextStatusTransitionDelayMs,
  resolveUjatEffectiveSecondInterviewStatus,
} from '../interview2/display'
import { useInterview2EffectiveStatusTick } from '@/features/program/shared/hooks/use-interview2-effective-status-tick'
import {
  canReassignVolunteerInterviewAssignment,
  VOLUNTEER_INTERVIEW_REASSIGN_BLOCKED_ALERT,
} from '@/features/program/shared/lib/volunteer-interview-reassign'
import { guardUjatVolunteerInterview2Evaluation } from './guard-actions'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './detail.css'

export type ApplicantDetailVariant = 'doc_screening' | 'doc_passed' | 'interview2'

type DocScreeningDetailProps = {
  variant?: 'doc_screening'
  applicant: UjatVolunteerApplicantRow
  onDocumentReject: () => void
  onDocumentApprove: () => void
  openManagerDropdown: { rowId: string; manager: 'A' | 'B' } | null
  setOpenManagerDropdown: (value: { rowId: string; manager: 'A' | 'B' } | null) => void
  onManagerAEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
  onManagerBEvaluationChange: (id: string, evaluation: UjatManagerEvaluation) => void
}

type DocPassedDetailProps = {
  variant: 'doc_passed'
  applicant: UjatVolunteerApplicantRow
  onAssignInterview?: () => void
  onWithdrawActivity?: () => void
}

type Interview2DetailProps = {
  variant: 'interview2'
  applicant: UjatVolunteerApplicantRow
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  /** 인라인 면접 평가 저장. 편집 중 「면접 평가」 재클릭 시 호출 */
  onSaveInterviewEvaluation?: (payload: UjatVolunteerInterviewEvaluationPayload) => Promise<boolean>
}

export type ApplicantDetailViewProps =
  | DocScreeningDetailProps
  | DocPassedDetailProps
  | Interview2DetailProps

function isDocPassedProps(props: ApplicantDetailViewProps): props is DocPassedDetailProps {
  return props.variant === 'doc_passed'
}

function isInterview2Props(props: ApplicantDetailViewProps): props is Interview2DetailProps {
  return props.variant === 'interview2'
}

function Interview2ApplicantDetail({
  applicant,
  personalInfoRevealed,
  programPrivacyPending,
  openPersonalInfoRevealConfirm,
  personalInfoRevealModal,
  onWithdrawActivity,
  onInterviewFail,
  onInterviewPass,
  onSaveInterviewEvaluation,
}: {
  applicant: UjatVolunteerApplicantRow
  personalInfoRevealed: boolean
  programPrivacyPending: boolean
  openPersonalInfoRevealConfirm: () => void
  personalInfoRevealModal: ReactNode
  onWithdrawActivity?: () => void
  onInterviewFail?: () => void
  onInterviewPass?: () => void
  onSaveInterviewEvaluation?: (payload: UjatVolunteerInterviewEvaluationPayload) => Promise<boolean>
}) {
  const canWrite = useUjatCanWrite()
  const evaluationSectionRef = useRef<InterviewEvaluationSectionHandle>(null)
  const [isEvaluationEditing, setIsEvaluationEditing] = useState(false)
  const [isEvaluationSaving, setIsEvaluationSaving] = useState(false)
  const evaluationSavingRef = useRef(false)
  // 상세를 연 채 면접 종료 시각이 지나면 상태·버튼이 바로 바뀌도록 재렌더
  const statusTickRows = useMemo(() => [applicant], [applicant])
  useInterview2EffectiveStatusTick(statusTickRows, getUjatInterview2NextStatusTransitionDelayMs)
  const interviewNotEnded = resolveUjatEffectiveSecondInterviewStatus(applicant) === 'waiting'

  useEffect(() => {
    setIsEvaluationEditing(false)
  }, [applicant.id])

  const handleInterviewEvaluationEnter = useCallback(() => {
    if (!guardUjatVolunteerInterview2Evaluation(applicant)) return
    setIsEvaluationEditing(true)
  }, [applicant])

  /** 입력값은 InterviewEvaluationSection이 isEditing 변경 시 저장값으로 되돌린다 */
  const handleInterviewEvaluationCancel = useCallback(() => {
    if (evaluationSavingRef.current) return
    setIsEvaluationEditing(false)
  }, [])

  const handleInterviewEvaluationComplete = useCallback(async () => {
    if (evaluationSavingRef.current) return
    evaluationSavingRef.current = true
    setIsEvaluationSaving(true)
    try {
      const saved = await evaluationSectionRef.current?.submit()
      if (saved) setIsEvaluationEditing(false)
    } finally {
      evaluationSavingRef.current = false
      setIsEvaluationSaving(false)
    }
  }, [])

  const isEvaluationMode = canWrite && isEvaluationEditing

  const evaluationActions = (
    <ProgramEditInfoActions
      canWrite={canWrite}
      idleVariant="primary"
      editLabel="면접 평가"
      saveLabel="평가 완료"
      isEditing={isEvaluationMode}
      saving={isEvaluationSaving}
      disabled={!isEvaluationMode && interviewNotEnded}
      onEdit={handleInterviewEvaluationEnter}
      onCancel={handleInterviewEvaluationCancel}
      onSave={() => {
        void handleInterviewEvaluationComplete()
      }}
    />
  )

  // 평가 중: 「취소」「평가 완료」만 노출 (정보 수정 취소/저장 공통 UI)
  const headerActions = isEvaluationMode ? (
    evaluationActions
  ) : (
    <>
      {canWrite ? (
        <>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            onClick={onWithdrawActivity} >
            활동 포기
          </CmsButton>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            disabled={interviewNotEnded}
            onClick={onInterviewFail} >
            면접 불합격
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            disabled={interviewNotEnded}
            onClick={onInterviewPass} >
            면접 합격
          </CmsButton>
        </>
      ) : null}
      {evaluationActions}
      <PersonalInfoRevealButton
        disabled={programPrivacyPending}
        labelMode="stickyReveal"
        revealed={personalInfoRevealed}
        cmsVariant="primary"
        cmsSize="large"
        onClick={openPersonalInfoRevealConfirm} />
    </>
  )

  return (
    <div className="applicant-detail">
      <div className="applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          {headerActions}
        </div>
      </div>

      <div className="applicant-detail__body applicant-info-section">
        <ApplicantBasicInfo
          applicant={applicant}
          maskSensitive={!personalInfoRevealed}
          statusRow="second_interview"
        />
        <InterviewEvaluationSection
          ref={evaluationSectionRef}
          applicant={applicant}
          isEditing={isEvaluationMode}
          onSave={async payload => (await onSaveInterviewEvaluation?.(payload)) ?? false}
        />
        <PreviousTermSection applicant={applicant} />
        <EssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}

export function ApplicantDetailView(props: ApplicantDetailViewProps) {
  const applicantEnriched = useUjatVolunteerApplicationDetailEnrichment(props.applicant)
  const [unmaskedOverlay, setUnmaskedOverlay] = useState<UjatVolunteerApplicantRow | null>(null)

  useEffect(() => {
    setUnmaskedOverlay(null)
  }, [props.applicant.id])

  const applicant = unmaskedOverlay ?? applicantEnriched

  const resolveAccessItem = useCallback(
    () => `${applicant.name} 봉사자 신청 정보`,
    [applicant.name]
  )

  const revealVolunteerPersonalInfo = useCallback(
    async (reason: string) => {
      const programId = Number(applicant.programId)
      const response = await unmaskVolunteerApplicationPrivacyRemote(
        applicant.id,
        reason,
        Number.isSafeInteger(programId) ? programId : undefined
      )
      return applyUjatVolunteerApplicationDetail(applicant, response.application, response.profile)
    },
    [applicant]
  )

  const {
    personalInfoRevealed,
    openPersonalInfoRevealConfirm,
    confirmModal: personalInfoRevealModal,
    programPrivacyPending,
  } = usePersonalInfoReveal({
    privacyScope: 'program',
    programId: applicant.programId,
    resolveProgramRole: () => resolveSessionProgramRole(applicant.programId),
    resolveAccessItem,
    revealPersonalInfo: revealVolunteerPersonalInfo,
    onPrivacyUnmasked: payload => {
      setUnmaskedOverlay(
        sanitizeProgramPrivacyOverlay(applicant.programId, payload as UjatVolunteerApplicantRow)
      )
    },
    resetDeps: [applicant.id],
    controlMode: 'headerStickyNoop',
  })

  useEffect(() => {
    if (!personalInfoRevealed) setUnmaskedOverlay(null)
  }, [personalInfoRevealed])

  const assignInterviewLabel = useMemo(() => {
    if (applicant.interviewAssignmentStatus === 'assigned') return '면접일 재배정'
    return '면접일 배정'
  }, [applicant.interviewAssignmentStatus])

  /** 버튼은 항상 활성 — 배정·재배정이 안 되는 상태면 누를 때 이유를 안내한다(서버 VOLUNTEER_INTERVIEW_CONFLICT와 같은 기준) */
  const { showAlert } = useCmsAlert()
  const assignInterviewBlockedAlert = useMemo(() => {
    if (applicant.interviewAssignmentStatus === 'withdrawn') {
      return { title: '면접일 배정 안내', content: '활동 포기한 신청은 면접일을 배정할 수 없습니다.' }
    }
    if (
      applicant.interviewAssignmentStatus === 'assigned' &&
      !canReassignVolunteerInterviewAssignment(applicant)
    ) {
      return VOLUNTEER_INTERVIEW_REASSIGN_BLOCKED_ALERT
    }
    return null
  }, [applicant])

  if (isInterview2Props(props)) {
    return (
      <Interview2ApplicantDetail
        applicant={applicant}
        personalInfoRevealed={personalInfoRevealed}
        programPrivacyPending={programPrivacyPending}
        openPersonalInfoRevealConfirm={openPersonalInfoRevealConfirm}
        personalInfoRevealModal={personalInfoRevealModal}
        onWithdrawActivity={props.onWithdrawActivity}
        onInterviewFail={props.onInterviewFail}
        onInterviewPass={props.onInterviewPass}
        onSaveInterviewEvaluation={props.onSaveInterviewEvaluation}
      />
    )
  }

  if (isDocPassedProps(props)) {
    const { onAssignInterview, onWithdrawActivity } = props

    return (
      <div className="applicant-detail">
        <div className="applicant-detail__header">
          <div className="program-detail-fullpage-modal__header-actions">
            <>
            <CmsButton
              type="button"
              variant="delete"
              size="large"
              onClick={onWithdrawActivity} >
              활동 포기
            </CmsButton>
            <CmsButton
              type="button"
              variant="secondary"
              size="large"
              onClick={() => {
                if (assignInterviewBlockedAlert) {
                  showAlert({ ...assignInterviewBlockedAlert })
                  return
                }
                onAssignInterview?.()
              }}
            >
              {assignInterviewLabel}
            </CmsButton>
              </>
            <PersonalInfoRevealButton
              disabled={programPrivacyPending}
              labelMode="stickyReveal"
              revealed={personalInfoRevealed}
              cmsVariant="primary"
              cmsSize="large"
              onClick={openPersonalInfoRevealConfirm} />
          </div>
        </div>

        <div className="applicant-detail__body applicant-info-section">
          <ApplicantBasicInfo
            applicant={applicant}
            maskSensitive={!personalInfoRevealed}
            statusRow="interview_assignment"
          />
          <InterviewAvailabilitySection applicant={applicant} />
          <PreviousTermSection applicant={applicant} />
          <EssaySections applicant={applicant} />
        </div>

        {personalInfoRevealModal}
      </div>
    )
  }

  const {
    onDocumentReject,
    onDocumentApprove,
    openManagerDropdown,
    setOpenManagerDropdown,
    onManagerAEvaluationChange,
    onManagerBEvaluationChange,
  } = props

  return (
    <div className="applicant-detail">
      <div className="applicant-detail__header">
        <div className="program-detail-fullpage-modal__header-actions">
          <>
          <CmsButton
            type="button"
            variant="delete"
            size="large"
            onClick={onDocumentReject}
          >
            서류 반려
          </CmsButton>
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            onClick={onDocumentApprove}
          >
            서류 승인
          </CmsButton>
            </>
          <PersonalInfoRevealButton
            disabled={programPrivacyPending}
            labelMode="stickyReveal"
            revealed={personalInfoRevealed}
            cmsVariant="primary"
            cmsSize="large"
            onClick={openPersonalInfoRevealConfirm}
          />
        </div>
      </div>

      <div className="applicant-detail__body applicant-info-section">
        <ApplicantBasicInfo applicant={applicant} maskSensitive={!personalInfoRevealed} />
        <ManagerEvaluationSection
          applicant={applicant}
          openManagerDropdown={openManagerDropdown}
          setOpenManagerDropdown={setOpenManagerDropdown}
          onManagerAEvaluationChange={onManagerAEvaluationChange}
          onManagerBEvaluationChange={onManagerBEvaluationChange}
        />
        <InterviewAvailabilitySection applicant={applicant} />
        <PreviousTermSection applicant={applicant} />
        <EssaySections applicant={applicant} />
      </div>

      {personalInfoRevealModal}
    </div>
  )
}
