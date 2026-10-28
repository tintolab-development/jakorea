import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getUserInfoSelectedEntries,
  isUserInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { writingFormDraftFromApplicationForm } from '@/features/program/lib/application-form-draft'
import { getProgramApplicationApiErrorMessage } from '@/features/program/lib/application-api-error'
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
  useApplicationFormsQuery,
  useApplicationSurveyFormQuery,
  useSubmitEducationSurveyMutation,
} from '../../applications/api/activity-hooks'
import type { ProgramApplicationType } from '../../applications/api/types'
import type { EducationSurveyListEntry } from '../lib/survey-list-types'
import {
  isPortalFormSubmissionPeriodOpen,
  mergePortalFormSubmissionPeriodFields,
  resolvePortalFormSubmissionPeriodBlockForEntry,
  resolvePortalFormSubmissionPeriodBlockFromApiError,
  type PortalFormSubmissionPeriodBlockReason,
} from '../lib/portal-form-submission-period'
import { EducationSurveyEmptyPanel } from './empty-panel'
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
  pendingSurveyCount?: number
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
  pendingSurveyCount,
}: EducationSurveyFillPanelProps) {
  const remoteForms = useApplicationFormsQuery(
    applicationType,
    applicationId,
    kind === 'satisfaction' ? 'SATISFACTION' : 'SURVEY',
  )
  const surveyList = useMemo(
    () => (remoteForms.enabled ? remoteForms.items : []),
    [kind, remoteForms.enabled, remoteForms.items],
  )
  const showList = surveyList.length >= 2
  const [selectedId, setSelectedId] = useState(() => surveyList[0]?.id ?? '')

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
  )
  const submitMutation = useSubmitEducationSurveyMutation(programId, applicationType, applicationId)

  const remoteFormDocument = listHasForm
    ? {
        form: selectedEntry?.form,
        answers: selectedEntry?.answers,
        draftAnswers: selectedEntry?.draftAnswers,
        templateVersionId: selectedEntry?.templateVersionId,
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

  const periodBlockReason = useMemo(
    () => resolvePortalFormSubmissionPeriodBlockForEntry(selectedEntry, titleParagraph),
    [selectedEntry, titleParagraph],
  )

  const mergedPeriodFields = useMemo(
    () =>
      selectedEntry
        ? mergePortalFormSubmissionPeriodFields(selectedEntry, titleParagraph)
        : undefined,
    [selectedEntry, titleParagraph],
  )

  const readOnly =
    selectedEntry?.status === 'submitted' ||
    (mergedPeriodFields != null && !isPortalFormSubmissionPeriodOpen(mergedPeriodFields))

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(paragraph => (paragraph.id === id ? updater(paragraph) : paragraph)),
    }))
  }, [])

  const handleSubmit = () => {
    if (readOnly) return
    const validation = validateEducationSurveyFill(draft, sidecar)
    if (!validation.ok) {
      setAlertTitle('입력 확인')
      setAlertDescription(validation.message)
      setAlertOpen(true)
      return
    }

    const answers = buildEducationSurveyAnswers(draft, sidecar)
    const bindingId = parsePortalProgramId(selectedEntryId)
    const templateVersionId =
      remoteFormDocument?.templateVersionId ?? selectedEntry?.templateVersionId

    if (remoteForms.enabled && bindingId != null && programId) {
      submitMutation.mutate(
        { bindingId, answers, templateVersionId },
        {
          onSuccess: () => {
            setAlertTitle('안내')
            setAlertDescription(
              kind === 'satisfaction' ? '만족도조사가 제출되었습니다.' : '설문이 제출되었습니다.',
            )
            setAlertOpen(true)
          },
          onError: error => {
            setAlertTitle('제출 실패')
            setAlertDescription(
              getProgramApplicationApiErrorMessage(
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

    setAlertTitle('안내')
    setAlertDescription(
      kind === 'satisfaction' ? '만족도조사가 제출되었습니다.' : '설문이 제출되었습니다.',
    )
    setAlertOpen(true)
  }

  if (remoteForms.isLoading || (remoteFormQuery.enabled && remoteFormQuery.isLoading)) {
    return (
      <EducationSurveyPanelSkeleton
        statusMessage={
          kind === 'satisfaction' ? '만족도조사를 불러오는 중입니다.' : '설문조사를 불러오는 중입니다.'
        }
      />
    )
  }
  if (remoteForms.isError) {
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
          <EducationSurveyPeriodEndedPanel reason={reason} layout="inline" />
        </div>
      )
    }

    return <EducationSurveyPeriodEndedPanel reason={reason} />
  }

  if (!remoteForms.enabled) {
    return <EducationSurveyEmptyPanel kind={kind} />
  }

  if (remoteForms.enabled && surveyList.length === 0) {
    if (kind === 'survey' && pendingSurveyCount != null && pendingSurveyCount > 0) {
      return <EducationSurveyEmptyPanel kind={kind} pendingMismatchHint />
    }
    return <EducationSurveyEmptyPanel kind={kind} />
  }

  const formFetchPeriodBlock =
    selectedEntry?.status === 'submitted'
      ? null
      : resolvePortalFormSubmissionPeriodBlockFromApiError(remoteFormQuery.error)

  const effectivePeriodBlockReason = periodBlockReason ?? formFetchPeriodBlock

  if (kind === 'survey' && effectivePeriodBlockReason) {
    return renderPeriodNotice(effectivePeriodBlockReason)
  }

  if (
    kind === 'survey' &&
    selectedEntry?.status !== 'submitted' &&
    mergedPeriodFields != null &&
    !isPortalFormSubmissionPeriodOpen(mergedPeriodFields)
  ) {
    return renderPeriodNotice('closed')
  }

  // 실패 시 seed 양식이 대신 보이면 CMS 양식과 다른 설문을 제출하게 된다.
  if (remoteFormQuery.isError) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        {getProgramApplicationApiErrorMessage(
          remoteFormQuery.error,
          kind === 'satisfaction' ? '만족도조사를 불러오지 못했습니다.' : '설문조사를 불러오지 못했습니다.',
        )}
      </PFText>
    )
  }

  const body = (
    <div className={styles.body}>
      {titleParagraph ? (
        <EducationSurveyHeader paragraph={titleParagraph} surveyCreatedAt={surveyCreatedAt} />
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
            onClick={handleSubmit}
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

      <PFAlertModal
        open={alertOpen}
        title={alertTitle}
        description={alertDescription}
        onConfirm={() => setAlertOpen(false)}
      />
    </>
  )
}
