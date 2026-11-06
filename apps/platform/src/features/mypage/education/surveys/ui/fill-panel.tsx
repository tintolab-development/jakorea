import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import {
  getApplicationApiErrorCode,
  getProgramApplicationApiErrorMessage,
} from '@/features/program/lib/application-api-error'
import { parsePortalProgramId } from '@/features/program/api/mappers'
import { EducationSurveyPanelSkeleton } from '@/features/mypage/shared/ui'
import { useMypageMember } from '@/features/mypage/hooks/use-mypage-member'
import { getMypageProfileLabel } from '@/features/mypage/lib/member-profile'
import { useSettingsView } from '@/features/mypage/settings/hooks/use-settings-view'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import {
  clearEducationSurveyPreviewAnswers,
  createEducationSurveySeedDraft,
  EDUCATION_SURVEY_SEED_CREATED_AT,
  type EducationSatisfactionAudience,
  type EducationSurveySeedKind,
} from '../lib/seed-survey-draft'
import {
  useAvailableProgramFormsQuery,
  useApplicationFormsQuery,
  useApplicationSurveyFormQuery,
  useSubmitEducationSurveyMutation,
} from '../../applications/api/activity-hooks'
import {
  isPortalBoundFormVersionUsable,
  isPortalSatisfactionFormType,
  isPortalSurveyFormType,
  isVolunteerFacingSatisfactionForm,
  PORTAL_SATISFACTION_FORM_TYPE_QUERIES,
  PORTAL_SURVEY_FORM_TYPE_QUERIES,
} from '../../applications/lib/portal-form-list'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationSurveyListEntry } from '../lib/survey-list-types'
import { resolveEducationSurveyFillNotice } from '../lib/fill-notice'
import {
  portalFormSubmissionPeriodBlockMessage,
  resolvePortalFormSubmissionPeriodBlockForEntry,
  type PortalFormSubmissionPeriodBlockReason,
} from '../lib/portal-form-submission-period'
import { EducationSurveyEmptyPanel } from './empty-panel'
import { EducationSurveySubmittedPanel } from './submitted-panel'
import {
  formatEducationPeriodLabel,
  resolveSurveyUserInfoValues,
  type SurveyUserInfoProgramContext,
} from '../lib/resolve-user-info-values'
import {
  applyEducationSurveyAnswersToDraft,
  buildEducationSurveyAnswers,
  validateEducationSurveyFill,
} from '../lib/survey-answers'
import { EMPTY_SURVEY_SIDECAR, type SurveySidecarState } from '../lib/survey-sidecar'
import { EducationSurveyFormBody } from './survey-form-body'
import { EducationSurveyHeader } from './survey-header'
import { EducationSurveyList } from './survey-list'
import { EducationSurveyPeriodEndedPanel } from './period-ended-panel'
import { EducationSurveySubmitConfirm } from './submit-confirm'
import { isPortalFormTargetRoleMismatch } from '../lib/portal-form-target-role'
import styles from './fill-panel.module.css'

export type EducationSurveyFillPanelProps = {
  programTitle: string
  kind: EducationSurveySeedKind
  /** satisfaction 전용 — education/volunteer: student, lecture: teacher */
  satisfactionAudience?: EducationSatisfactionAudience
  /** 교육 진행 일정 등 프로그램 컨텍스트 (설문자 정보 자동 채움) */
  educationScheduleLines?: readonly string[]
  educationTargetLabel?: string
  educationGradeLabel?: string
  institutionName?: string
  institutionRegion?: string
  applicationType?: ProgramApplicationType | null
  applicationId?: string | null
  programId?: string | null
  /** 상세 `participation.participantId` — submit `contextType=PARTICIPANT` */
  participantId?: number | null
  pendingSurveyCount?: number
}

function surveyRenderLoadFallback(kind: EducationSurveySeedKind): string {
  return kind === 'satisfaction'
    ? '만족도조사를 불러오지 못했습니다.'
    : '설문조사를 불러오지 못했습니다.'
}

/** render GET 실패 문구. POST 409 `FORM_SUBMISSION_CLOSED` 기간 카피와 분리한다. */
function surveyRenderLoadErrorMessage(kind: EducationSurveySeedKind, error: unknown): string {
  const code = getApplicationApiErrorCode(error)
  if (code === 'FORM_SUBMISSION_CLOSED' || code === 'FORM_SUBMISSION_NOT_STARTED') {
    return surveyRenderLoadFallback(kind)
  }
  return getProgramApplicationApiErrorMessage(error, surveyRenderLoadFallback(kind))
}

function resolveFillDraft(options: {
  kind: EducationSurveySeedKind
  satisfactionAudience?: EducationSatisfactionAudience
  selectedEntry?: EducationSurveyListEntry
  remoteForm?: unknown
  remoteAnswers?: Record<string, unknown> | null
}): WritingFormDraft {
  const remoteDraft = writingFormDraftFromApplicationForm(options.remoteForm)
  const seeded =
    remoteDraft ??
    createEducationSurveySeedDraft(options.kind, {
      satisfactionAudience: options.satisfactionAudience,
      listEntry: options.selectedEntry,
    })
  const remoteAnswers =
    options.remoteAnswers ?? options.selectedEntry?.answers ?? options.selectedEntry?.draftAnswers
  const hasAnswers = Boolean(remoteAnswers && Object.keys(remoteAnswers).length > 0)
  const submitted = options.selectedEntry?.status === 'submitted'
  const forFill = submitted || hasAnswers ? seeded : clearEducationSurveyPreviewAnswers(seeded)
  return applyEducationSurveyAnswersToDraft(forFill, remoteAnswers)
}

export function EducationSurveyFillPanel({
  programTitle,
  kind,
  satisfactionAudience,
  educationScheduleLines,
  educationTargetLabel,
  educationGradeLabel,
  institutionName,
  institutionRegion,
  applicationType,
  applicationId,
  programId,
  participantId,
  pendingSurveyCount,
}: EducationSurveyFillPanelProps) {
  const hasApplicationContext = Boolean(applicationType && applicationId)
  const applicationForms = useApplicationFormsQuery(
    applicationType,
    applicationId,
    kind === 'satisfaction' ? 'SATISFACTION' : 'SURVEY',
  )
  const availableForms = useAvailableProgramFormsQuery(
    hasApplicationContext ? null : programId,
    kind === 'satisfaction'
      ? PORTAL_SATISFACTION_FORM_TYPE_QUERIES
      : PORTAL_SURVEY_FORM_TYPE_QUERIES,
  )
  const remoteForms = hasApplicationContext ? applicationForms : availableForms
  const surveyList = useMemo(() => {
    const items = remoteForms.enabled ? remoteForms.items : []
    return items.filter(entry => {
      if (isPortalFormTargetRoleMismatch(entry.targetRole, applicationType)) return false
      if (kind === 'satisfaction') {
        if (!isPortalSatisfactionFormType(entry.formType)) return false
        if (
          satisfactionAudience === 'teacher' &&
          isVolunteerFacingSatisfactionForm(entry)
        ) {
          return false
        }
        return true
      }
      return isPortalSurveyFormType(entry.formType)
    })
  }, [applicationType, kind, remoteForms.enabled, remoteForms.items, satisfactionAudience])
  const showList = surveyList.length >= 2
  const [selectedId, setSelectedId] = useState(() => surveyList[0]?.id ?? '')
  const [rewriteEntryId, setRewriteEntryId] = useState<string | null>(null)

  useEffect(() => {
    if (surveyList.length === 0) return
    if (surveyList.some(entry => entry.id === selectedId)) return
    setSelectedId(surveyList[0]?.id ?? '')
  }, [surveyList, selectedId])

  const selectedEntry = useMemo(
    () => surveyList.find(entry => entry.id === selectedId) ?? surveyList[0],
    [surveyList, selectedId],
  )
  const selectedEntryId = selectedEntry?.id ?? ''
  const rewriteRequested = rewriteEntryId === selectedEntryId
  const listHasForm = selectedEntry?.form != null
  const canFetchRemoteForm =
    remoteForms.enabled &&
    surveyList.length > 0 &&
    !listHasForm &&
    Boolean(programId) &&
    Boolean(selectedEntryId)

  const remoteFormQuery = useApplicationSurveyFormQuery(
    canFetchRemoteForm ? programId : null,
    canFetchRemoteForm ? selectedEntryId : null,
    selectedEntry?.templateVersionId,
  )
  const submitMutation = useSubmitEducationSurveyMutation(programId, applicationType, applicationId)

  const remoteFormDocument = listHasForm
    ? {
        form: selectedEntry?.form,
        answers: selectedEntry?.answers,
        draftAnswers: selectedEntry?.draftAnswers,
        templateVersionId: selectedEntry?.templateVersionId,
        versionStatus: undefined,
      }
    : remoteFormQuery.document

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    resolveFillDraft({
      kind,
      satisfactionAudience,
      selectedEntry,
    }),
  )
  const [sidecar, setSidecar] = useState<SurveySidecarState>(EMPTY_SURVEY_SIDECAR)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertTitle, setAlertTitle] = useState('안내')
  const [alertDescription, setAlertDescription] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deferSubmittedView, setDeferSubmittedView] = useState(false)

  useEffect(() => {
    if (selectedEntry == null) return
    setDraft(
      resolveFillDraft({
        kind,
        satisfactionAudience,
        selectedEntry,
        remoteForm: remoteFormDocument?.form ?? selectedEntry.form ?? remoteFormDocument,
        remoteAnswers:
          remoteFormDocument?.answers ??
          remoteFormDocument?.draftAnswers ??
          selectedEntry.answers ??
          selectedEntry.draftAnswers,
      }),
    )
    setSidecar(EMPTY_SURVEY_SIDECAR)
  }, [
    kind,
    satisfactionAudience,
    selectedEntryId,
    remoteFormDocument?.form,
    remoteFormDocument?.answers,
    remoteFormDocument?.draftAnswers,
  ])

  const member = useMypageMember()
  const settings = useSettingsView()

  const programContext = useMemo<SurveyUserInfoProgramContext>(
    () => ({
      programTitle,
      educationPeriodLabel: formatEducationPeriodLabel(educationScheduleLines),
      applicantTypeLabel: getMypageProfileLabel(member.profile),
      educationTarget: educationTargetLabel,
      educationGrade: educationGradeLabel,
      institutionName,
      institutionRegion,
    }),
    [
      programTitle,
      educationScheduleLines,
      member.profile,
      educationTargetLabel,
      educationGradeLabel,
      institutionName,
      institutionRegion,
    ],
  )

  const userInfoFieldKeys = useMemo(() => {
    const keys: string[] = []
    for (const paragraph of draft.paragraphs) {
      if (!isUserInfoParagraph(paragraph)) continue
      for (const entry of getUserInfoSelectedEntries(paragraph)) {
        keys.push(entry.key)
      }
    }
    return keys
  }, [draft.paragraphs])

  const userInfoValues = useMemo(
    () =>
      resolveSurveyUserInfoValues(userInfoFieldKeys, {
        profile: settings.profile,
        program: programContext,
      }),
    [userInfoFieldKeys, settings.profile, programContext],
  )

  useEffect(() => {
    setDraft(prev => {
      let changed = false
      const paragraphs = prev.paragraphs.map(paragraph => {
        if (!isUserInfoParagraph(paragraph)) return paragraph
        const entries = getUserInfoSelectedEntries(paragraph)
        if (entries.length === 0) return paragraph

        const nextAnswers = { ...paragraph.fieldAnswers }
        let paragraphChanged = false
        for (const entry of entries) {
          const next = userInfoValues[entry.key] ?? ''
          if (nextAnswers[entry.key] !== next) {
            nextAnswers[entry.key] = next
            paragraphChanged = true
          }
        }
        if (!paragraphChanged) return paragraph
        changed = true
        return { ...paragraph, fieldAnswers: nextAnswers }
      })
      return changed ? { ...prev, paragraphs } : prev
    })
  }, [userInfoValues])

  const titleParagraph = useMemo(
    () =>
      draft.paragraphs.find(
        (paragraph): paragraph is Extract<
          WritingFormParagraph,
          { kind: 'description'; variant: 'survey_title_with_period' }
        > =>
          paragraph.kind === 'description' && paragraph.variant === 'survey_title_with_period',
      ),
    [draft.paragraphs],
  )

  const surveyCreatedAt =
    selectedEntry?.createdAt ?? selectedEntry?.startAt ?? EDUCATION_SURVEY_SEED_CREATED_AT

  const selectedEntryWithRenderPeriod = useMemo(() => {
    if (!selectedEntry) return selectedEntry
    const render = remoteFormDocument?.form
    if (!render || typeof render !== 'object') return selectedEntry
    const periodFields = render as { submissionStartAt?: unknown; submissionEndAt?: unknown }
    const renderStart =
      typeof periodFields.submissionStartAt === 'string' ? periodFields.submissionStartAt : undefined
    const renderEnd =
      typeof periodFields.submissionEndAt === 'string' ? periodFields.submissionEndAt : undefined
    return {
      ...selectedEntry,
      submissionStartAt: selectedEntry.submissionStartAt ?? renderStart,
      submissionEndAt: selectedEntry.submissionEndAt ?? renderEnd,
    }
  }, [
    selectedEntry,
    remoteFormDocument?.form,
  ])

  const periodBlockReason = useMemo(
    () =>
      resolvePortalFormSubmissionPeriodBlockForEntry(selectedEntryWithRenderPeriod, titleParagraph),
    [selectedEntryWithRenderPeriod, titleParagraph],
  )

  const canWrite =
    selectedEntry?.canSubmit === true || selectedEntry?.canResubmit === true

  const readOnly = !canWrite

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(paragraph => (paragraph.id === id ? updater(paragraph) : paragraph)),
    }))
  }, [])

  const showSubmitSuccessAlert = () => {
    setConfirmOpen(false)
    setDeferSubmittedView(true)
    setAlertTitle('안내')
    setAlertDescription(
      kind === 'satisfaction' ? '만족도조사가 제출되었습니다.' : '설문이 제출되었습니다.',
    )
    setAlertOpen(true)
  }

  const requestSubmit = () => {
    if (!canWrite || submitMutation.isPending) return
    const validation = validateEducationSurveyFill(draft, sidecar)
    if (!validation.ok) {
      setAlertTitle('입력 확인')
      setAlertDescription(validation.message)
      setAlertOpen(true)
      return
    }
    setConfirmOpen(true)
  }

  const performSubmit = () => {
    if (!canWrite || submitMutation.isPending) return
    if (isPortalFormTargetRoleMismatch(selectedEntry?.targetRole, applicationType)) {
      setConfirmOpen(false)
      setAlertTitle('제출 실패')
      setAlertDescription('현재 참여 역할에 해당하지 않는 설문입니다.')
      setAlertOpen(true)
      return
    }
    const answers = buildEducationSurveyAnswers(draft, sidecar)
    const bindingId = parsePortalProgramId(selectedEntryId)
    const templateVersionId =
      remoteFormDocument?.templateVersionId ?? selectedEntry?.templateVersionId

    if (
      remoteForms.enabled &&
      bindingId != null &&
      programId &&
      templateVersionId != null
    ) {
      submitMutation.mutate(
        {
          bindingId,
          answers,
          templateVersionId,
          ...(typeof participantId === 'number' && participantId > 0
            ? { contextType: 'PARTICIPANT', contextId: participantId }
            : {}),
        },
        {
          onSuccess: showSubmitSuccessAlert,
          onError: error => {
            setConfirmOpen(false)
            setAlertTitle('제출 실패')
            const closed = getApplicationApiErrorCode(error) === 'FORM_SUBMISSION_CLOSED'
            const alreadySubmitted = selectedEntry?.status === 'submitted'
            setAlertDescription(
              closed && alreadySubmitted
                ? '더 이상 제출할 수 없습니다.'
                : getProgramApplicationApiErrorMessage(
                    error,
                    kind === 'satisfaction'
                      ? '만족도조사 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.'
                      : '설문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.',
                  ),
            )
            setAlertOpen(true)
          },
        },
      )
      return
    }

    showSubmitSuccessAlert()
  }

  const holdFillSurface =
    confirmOpen || alertOpen || deferSubmittedView || submitMutation.isPending

  if (
    !holdFillSurface &&
    (remoteForms.isLoading || (remoteFormQuery.enabled && remoteFormQuery.isLoading))
  ) {
    return (
      <EducationSurveyPanelSkeleton
        statusMessage={
          kind === 'satisfaction' ? '만족도조사를 불러오는 중입니다.' : '설문조사를 불러오는 중입니다.'
        }
      />
    )
  }
  if (!holdFillSurface && remoteForms.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        {kind === 'satisfaction' ? '만족도조사를 불러오지 못했습니다.' : '설문조사를 불러오지 못했습니다.'}
      </PFText>
    )
  }
  const renderPeriodNotice = (reason: PortalFormSubmissionPeriodBlockReason) => {
    if (showList) {
      return (
        <div className={styles.periodNoticeLayout}>
          <EducationSurveyList
            items={surveyList}
            selectedId={selectedEntry?.id ?? selectedId}
            onSelect={setSelectedId}
          />
          <EducationSurveyPeriodEndedPanel reason={reason} kind={kind} layout="inline" />
        </div>
      )
    }

    return <EducationSurveyPeriodEndedPanel reason={reason} kind={kind} />
  }

  const renderSubmittedNotice = () => {
    const submittedBody = (
      <div className={styles.body}>
        <EducationSurveySubmittedPanel
          kind={kind}
          titleParagraph={titleParagraph}
          surveyCreatedAt={surveyCreatedAt}
          canRewrite={canWrite}
          onRewrite={() => {
            if (!canWrite) return
            setRewriteEntryId(selectedEntryId)
          }}
        />
      </div>
    )

    return (
      <div className={styles.shell}>
        <div className={showList ? styles.layoutWithList : styles.inner}>
          {showList ? (
            <>
              <EducationSurveyList
                items={surveyList}
                selectedId={selectedEntry?.id ?? selectedId}
                onSelect={setSelectedId}
              />
              {submittedBody}
            </>
          ) : (
            submittedBody
          )}
        </div>
      </div>
    )
  }

  if (!holdFillSurface && !remoteForms.enabled) {
    return <EducationSurveyEmptyPanel kind={kind} />
  }

  if (!holdFillSurface && remoteForms.enabled && surveyList.length === 0) {
    if (kind === 'survey' && pendingSurveyCount != null && pendingSurveyCount > 0) {
      return <EducationSurveyEmptyPanel kind={kind} pendingMismatchHint />
    }
    return <EducationSurveyEmptyPanel kind={kind} />
  }

  const effectivePeriodBlockReason = periodBlockReason

  const canShowFormBody =
    !remoteFormQuery.isError && isPortalBoundFormVersionUsable(remoteFormDocument?.versionStatus)

  const fillNotice = resolveEducationSurveyFillNotice({
    kind,
    status: selectedEntry?.status,
    periodBlockReason: effectivePeriodBlockReason,
    canShowFormBody,
    canWrite,
    rewriteRequested,
  })

  if (fillNotice.type === 'submitted' && !holdFillSurface) {
    return renderSubmittedNotice()
  }

  if (!holdFillSurface && fillNotice.type === 'period') {
    return renderPeriodNotice(fillNotice.reason)
  }

  // 실패 시 seed 양식이 대신 보이면 CMS 양식과 다른 설문을 제출하게 된다.
  if (!holdFillSurface && remoteFormQuery.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        {surveyRenderLoadErrorMessage(kind, remoteFormQuery.error)}
      </PFText>
    )
  }

  if (!holdFillSurface && !isPortalBoundFormVersionUsable(remoteFormDocument?.versionStatus)) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        {kind === 'satisfaction'
          ? '만족도조사 양식이 아직 준비되지 않았습니다.'
          : '설문조사 양식이 아직 준비되지 않았습니다.'}
      </PFText>
    )
  }

  const body = (
    <div className={styles.body}>
      {titleParagraph ? (
        <EducationSurveyHeader paragraph={titleParagraph} surveyCreatedAt={surveyCreatedAt} />
      ) : null}

      {readOnly && effectivePeriodBlockReason === 'closed' ? (
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600" className={styles.periodInlineNotice}>
          {portalFormSubmissionPeriodBlockMessage('closed', kind)}
        </PFText>
      ) : null}

      <EducationSurveyFormBody
        draft={draft}
        programTitle={programTitle}
        onUpdateParagraph={updateParagraph}
        sidecar={sidecar}
        onSidecarChange={setSidecar}
        userInfoValues={userInfoValues}
        readOnly={readOnly}
      />

      {readOnly ? null : (
        <div className={styles.actions}>
          <PFButton
            size="xlarge"
            width={240}
            type="button"
            disabled={submitMutation.isPending}
            onClick={requestSubmit}
          >
            제출하기
          </PFButton>
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className={styles.shell}>
        <div className={showList ? styles.layoutWithList : styles.inner}>
          {showList ? (
            <>
              <EducationSurveyList
                items={surveyList}
                selectedId={selectedEntry?.id ?? selectedId}
                onSelect={setSelectedId}
              />
              {body}
            </>
          ) : (
            body
          )}
        </div>
      </div>

      <EducationSurveySubmitConfirm
        open={confirmOpen}
        kind={kind}
        pending={submitMutation.isPending}
        onCancel={() => {
          if (submitMutation.isPending) return
          setConfirmOpen(false)
        }}
        onConfirm={performSubmit}
      />
      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
        description={alertDescription}
        onConfirm={() => {
          setAlertOpen(false)
          setDeferSubmittedView(false)
        }}
      />
    </>
  )
}
