import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import {
  getMockApplyFormDraft,
  getProgramIdFromPath,
  parsePortalProgramId,
  ProgramBackButton,
  programApplyCompletePath,
  programDetailPath,
  readPortalRecruitmentFocus,
  resolveProgramApplyFormCase,
  shouldShowIndividualTeamInfoParagraph,
  useProgramApplicationForm,
  useProgramDetail,
  useSubmitProgramApplication,
} from '@/features/program'
import { usePortalProfileQuery } from '@/features/auth/sign-in/hooks/use-portal-profile-query'
import {
  getProgramApplicationApiErrorMessage,
  messageForApplicationBlockedReason,
} from '@/features/program/lib/application-api-error'
import {
  buildApplicationAnswersFromDraft,
  coerceApplicationFormDocument,
  prepareIndividualApplicationDraft,
  writingFormDraftFromApplicationForm,
} from '@/features/program/lib/application-form-draft'
import { resolveApplicationAnswerKey } from '@/features/program/lib/application-answer-key'
import {
  isApplicationBasicInfoParagraphId,
  isApplicationGuidanceParagraphId,
  isApplicationPreferredScheduleParagraphId,
  isApplicationSexOffenseInquiryParagraphId,
  isApplicationSexOffenseSubmissionParagraphId,
  isApplicationTeamInfoParagraphId,
  shouldShowEducationPlaceOnBasicInfo,
} from '@/features/program/lib/apply-form-paragraph-ids'
import {
  applyScheduleVisibilityFieldsFromRuntimeContext,
  isApplyScheduleChoiceParagraphId,
  shouldShowApplyPreferredSchedule,
  shouldShowApplyScheduleParagraph,
} from '@/features/program/lib/apply-form-schedule'
import {
  preferredScheduleBlocksFromDraftAnswers,
  toPortalPreferredScheduleBlocks,
  toPreferredScheduleAnswerValue,
  findIncompletePreferredScheduleMessage,
} from '@/features/program/lib/preferred-schedule-blocks'
import {
  ApplyPreferredSchedule,
  type ApplyPreferredScheduleBlock,
} from '@/features/program/ui/apply-preferred-schedule/apply-preferred-schedule'
import {
  ApplyTrainedTeachersBasicInfo,
  basicInfoAnswerFromValues,
  basicInfoValuesFromDraftAnswer,
  emptyTrainedTeachersBasicInfo,
  findIncompleteTrainedTeachersBasicInfoMessage,
  type ApplyTrainedTeachersBasicInfoValues,
} from '@/features/program/ui/apply-trained-teachers-basic-info/apply-trained-teachers-basic-info'
import {
  fillTrainedTeachersBasicInfoFromProfile,
  trainedTeachersProfileDefaults,
} from '@/features/program/ui/apply-trained-teachers-basic-info/profile-defaults'
import {
  ApplyIndividualTeamInfo,
  emptyIndividualTeamInfo,
  findIncompleteIndividualTeamInfoMessage,
  teamInfoAnswerFromValues,
  teamInfoValuesFromDraftAnswer,
  type ApplyIndividualTeamInfoValues,
} from '@/features/program/ui/apply-individual-team-info/apply-individual-team-info'
import {
  ApplyInstitutionGuidance,
  emptyInstitutionGuidanceAnswers,
  guidanceAnswerFromValues,
  guidanceValuesFromDraftAnswer,
  type ApplyInstitutionGuidanceAnswers,
} from '@/features/program/ui/apply-institution-guidance/apply-institution-guidance'
import {
  ApplyInstitutionSexOffenseInquiry,
  ApplyInstitutionSexOffenseSubmission,
  emptyInstitutionSexOffense,
  findIncompleteSexOffenseMessage,
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
} from '@/features/program/ui/apply-institution-sex-offense/apply-institution-sex-offense'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { getAccessToken } from '@/shared/lib/auth-token'
import { getDevAuthLoggedIn, isRemoteApiConfigured, resolveLoginRequiredPath } from '@/shared/lib'
import { PFButton, PFCheckbox, PFText, PFTextarea, PFTextInput } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useLocation, useNavigate } from 'react-router-dom'

function createEmptyPreferredBlock(): ApplyPreferredScheduleBlock {
  return { date: '', classPeriod: '', startTime: '', endTime: '' }
}

function findDraftParagraph(
  draft: WritingFormDraft | null,
  match: (id: string) => boolean,
): WritingFormParagraph | undefined {
  return draft?.paragraphs.find(paragraph => match(paragraph.id))
}

function draftAnswerForParagraph(
  answers: Record<string, unknown> | null | undefined,
  paragraph: WritingFormParagraph | undefined,
): unknown {
  if (!answers || !paragraph) return undefined
  const key = resolveApplicationAnswerKey(paragraph)
  if (key && key in answers) return answers[key]
  if (paragraph.id in answers) return answers[paragraph.id]
  return undefined
}

export function ProgramApplyPage() {
  const navigate = useNavigate()
  const { search } = useLocation()
  const focus = readPortalRecruitmentFocus(search)
  const fromPath = new URLSearchParams(search).get('from') ?? undefined
  const [isReady, setIsReady] = useState(false)
  const programId = getProgramIdFromPath()
  const { program, isLoading, status } = useProgramDetail(programId, { fresh: true, focus })
  const numericProgramId = parsePortalProgramId(programId)
  const remoteApplyEnabled =
    isRemoteApiConfigured() &&
    numericProgramId != null &&
    Boolean(getAccessToken()) &&
    status === 'ready'
  const applicationFormQuery = useProgramApplicationForm(
    remoteApplyEnabled && !program?.recruitmentSelectionAmbiguous ? programId : null,
    focus
      ? {
          recruitmentId: focus.recruitmentIds?.[0],
          recruitmentIds: focus.recruitmentIds,
          applicationTypes: focus.applicationTypes,
        }
      : null,
  )
  const submitMutation = useSubmitProgramApplication(numericProgramId)
  const profileQuery = usePortalProfileQuery({ enabled: remoteApplyEnabled })

  useEffect(() => {
    if (!programId) {
      return
    }

    if (!getDevAuthLoggedIn()) {
      navigate(resolveLoginRequiredPath(`/programs/${programId}/apply${search}`))
      return
    }

    setIsReady(true)
  }, [navigate, programId, search])

  const [draft, setDraft] = useState<WritingFormDraft | null>(null)
  const [preferredBlocks, setPreferredBlocks] = useState<ApplyPreferredScheduleBlock[]>([
    createEmptyPreferredBlock(),
  ])
  const [basicInfo, setBasicInfo] = useState<ApplyTrainedTeachersBasicInfoValues>(
    emptyTrainedTeachersBasicInfo,
  )
  const [teamInfo, setTeamInfo] = useState<ApplyIndividualTeamInfoValues>(emptyIndividualTeamInfo)
  const [guidanceAnswers, setGuidanceAnswers] = useState<ApplyInstitutionGuidanceAnswers>(
    emptyInstitutionGuidanceAnswers,
  )
  const [sexOffense, setSexOffense] = useState<ApplyInstitutionSexOffenseValues>(
    emptyInstitutionSexOffense,
  )
  const [submitError, setSubmitError] = useState<string | null>(null)
  /** bundle 객체 참조가 바뀌어도 입력 mid-edit 을 덮어쓰지 않도록 수화 키로만 재초기화 */
  const hydratedFormKeyRef = useRef<string | null>(null)

  const focusedApplicationType =
    applicationFormQuery.bundle?.option.applicationType ??
    (focus?.applicationTypes?.length === 1 ? focus.applicationTypes[0] : undefined) ??
    program?.applicationType
  const applyCase = program
    ? resolveProgramApplyFormCase({
        ...program,
        applicationType: focusedApplicationType,
      })
    : null
  const showTrainedTeachersApply =
    applyCase === 'trained-teachers' ||
    program?.registrationKind === 'trainedTeachers' ||
    program?.programType === 'TRAINED_TEACHER'
  /**
   * CMS 개인 신청은 기간 지정 지망 UI가 없다 (institution-schedule 전용).
   * 일반 기관 + 기간 지정일 때만 1·2지망을 덮어쓴다.
   */
  const showGeneralPreferredSchedule =
    applyCase === 'institution-general' &&
    program != null &&
    shouldShowApplyPreferredSchedule(program)
  const showEconomyPreferredSchedule = applyCase === 'institution-economy'
  const showPreferredScheduleInput =
    showTrainedTeachersApply || showGeneralPreferredSchedule || showEconomyPreferredSchedule

  const profileDefaults = useMemo(
    () => trainedTeachersProfileDefaults(profileQuery.data),
    [profileQuery.data],
  )
  const profileSchool = profileDefaults.schoolName
  const profileRegionLabel = profileDefaults.regionLabel
  const profileTeacherName = profileDefaults.teacherName
  const profileTeacherMobile = profileDefaults.teacherMobile
  const profileTeacherEmail = profileDefaults.teacherEmail
  const showPreferredEducationForm = program?.educationForm === 'participant_choice'
  const remoteForm = applicationFormQuery.bundle?.form
  const remoteFormKey =
    remoteApplyEnabled && applicationFormQuery.status === 'ready' && remoteForm
      ? [
          programId,
          applicationFormQuery.bundle?.option.formBindingId,
          remoteForm.templateVersionId,
          remoteForm.draftApplicationId ?? 'none',
          remoteForm.draftFormResponseId ?? 'none',
        ].join(':')
      : null

  useEffect(() => {
    if (!program) {
      hydratedFormKeyRef.current = null
      setDraft(null)
      return
    }

    if (remoteApplyEnabled) {
      if (applicationFormQuery.status === 'ready' && remoteForm && remoteFormKey) {
        if (hydratedFormKeyRef.current === remoteFormKey) return
        const remoteDraft = writingFormDraftFromApplicationForm(
          remoteForm,
          remoteForm.draftAnswers,
        )
        if (remoteDraft) {
          hydratedFormKeyRef.current = remoteFormKey
          const applyCaseForDraft = resolveProgramApplyFormCase({
            ...program,
            applicationType: focusedApplicationType,
          })
          setDraft(
            applyCaseForDraft === 'individual-general' || applyCaseForDraft === 'individual-team'
              ? prepareIndividualApplicationDraft(remoteDraft)
              : remoteDraft,
          )
          const draftAnswers = remoteForm.draftAnswers
          const preferredParagraph = findDraftParagraph(
            remoteDraft,
            id =>
              isApplicationPreferredScheduleParagraphId(id) ||
              isApplyScheduleChoiceParagraphId(id),
          )
          const fromPreferred = preferredScheduleBlocksFromDraftAnswers(
            draftAnswers,
            preferredParagraph?.id ??
              PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
          )
          setPreferredBlocks(fromPreferred ?? [createEmptyPreferredBlock()])
          const basicParagraph = findDraftParagraph(remoteDraft, isApplicationBasicInfoParagraphId)
          const fromBasic = basicInfoValuesFromDraftAnswer(
            draftAnswerForParagraph(draftAnswers, basicParagraph),
          )
          setBasicInfo(
            fillTrainedTeachersBasicInfoFromProfile(
              fromBasic ?? emptyTrainedTeachersBasicInfo(),
              profileDefaults,
            ),
          )
          const teamParagraph = findDraftParagraph(remoteDraft, isApplicationTeamInfoParagraphId)
          setTeamInfo(
            teamInfoValuesFromDraftAnswer(draftAnswerForParagraph(draftAnswers, teamParagraph)) ??
              emptyIndividualTeamInfo(),
          )
          const guidanceParagraph = findDraftParagraph(
            remoteDraft,
            isApplicationGuidanceParagraphId,
          )
          setGuidanceAnswers(
            guidanceValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, guidanceParagraph),
            ) ?? emptyInstitutionGuidanceAnswers(),
          )
          const submissionParagraph = findDraftParagraph(
            remoteDraft,
            isApplicationSexOffenseSubmissionParagraphId,
          )
          const inquiryParagraph = findDraftParagraph(
            remoteDraft,
            isApplicationSexOffenseInquiryParagraphId,
          )
          setSexOffense(
            sexOffenseValuesFromDraftAnswers(
              draftAnswerForParagraph(draftAnswers, submissionParagraph),
              draftAnswerForParagraph(draftAnswers, inquiryParagraph),
            ) ?? emptyInstitutionSexOffense(),
          )
          return
        }
        /** 원격 양식은 왔는데 문서를 못 읽으면 카탈로그 시드로 바꾸지 않는다. */
        if (hydratedFormKeyRef.current !== remoteFormKey) {
          hydratedFormKeyRef.current = remoteFormKey
          setDraft(null)
        }
        return
      }
      if (
        applicationFormQuery.status === 'loading' ||
        applicationFormQuery.status === 'idle'
      ) {
        hydratedFormKeyRef.current = null
        setDraft(null)
        return
      }

      /**
       * form-bindings GET 실패·unavailable 시 카탈로그 시드로 바꾸지 않는다.
       * 모집 전에도 GET 은 200 이어야 하고, 제출 불가만 options.`canApply` / blockedMessage 로 막는다.
       */
      const remoteMissKey = [
        'remote-miss',
        program.id,
        focusedApplicationType ?? '',
        applicationFormQuery.status,
        applicationFormQuery.blockedReason ?? '',
      ].join(':')
      if (hydratedFormKeyRef.current === remoteMissKey) return
      hydratedFormKeyRef.current = remoteMissKey
      setDraft(null)
      setPreferredBlocks([createEmptyPreferredBlock()])
      setBasicInfo(
        fillTrainedTeachersBasicInfoFromProfile(
          emptyTrainedTeachersBasicInfo(),
          profileDefaults,
        ),
      )
      setTeamInfo(emptyIndividualTeamInfo())
      setGuidanceAnswers(emptyInstitutionGuidanceAnswers())
      setSexOffense(emptyInstitutionSexOffense())
      return
    }

    const mockKey = `mock:${program.id}:${focusedApplicationType ?? ''}`
    if (hydratedFormKeyRef.current === mockKey) return
    hydratedFormKeyRef.current = mockKey
    setDraft(
      getMockApplyFormDraft({
        ...program,
        applicationType: focusedApplicationType,
      }),
    )
    setPreferredBlocks([createEmptyPreferredBlock()])
    setBasicInfo(emptyTrainedTeachersBasicInfo())
    setTeamInfo(emptyIndividualTeamInfo())
    setGuidanceAnswers(emptyInstitutionGuidanceAnswers())
    setSexOffense(emptyInstitutionSexOffense())
  }, [
    program,
    programId,
    remoteApplyEnabled,
    applicationFormQuery.status,
    applicationFormQuery.blockedReason,
    remoteForm,
    remoteFormKey,
    profileDefaults,
    focusedApplicationType,
  ])

  useEffect(() => {
    setBasicInfo(prev => fillTrainedTeachersBasicInfoFromProfile(prev, profileDefaults))
  }, [profileDefaults])

  const updateParagraph = useCallback<FormUpdateParagraph>((id, updater) => {
    setDraft(prev => {
      if (prev == null) return prev
      return {
        ...prev,
        paragraphs: prev.paragraphs.map(paragraph =>
          paragraph.id === id ? updater(paragraph) : paragraph
        ),
      }
    })
  }, [])

  const blockedMessage = messageForApplicationBlockedReason(
    applicationFormQuery.blockedReason,
  )
  const canSubmitRemote =
    remoteApplyEnabled &&
    applicationFormQuery.status === 'ready' &&
    applicationFormQuery.bundle != null &&
    applicationFormQuery.blockedReason == null &&
    applicationFormQuery.bundle.option.canApply !== false

  const profileSchoolLocked = Boolean(profileSchool)

  const renderParagraphSlot = useCallback(
    (paragraph: WritingFormParagraph) => {
      if (program == null) return undefined

      if (isApplicationBasicInfoParagraphId(paragraph.id)) {
        return (
          <ApplyTrainedTeachersBasicInfo
            value={basicInfo}
            onChange={setBasicInfo}
            schoolNameLocked={profileSchoolLocked}
            showPreferredEducationForm={showPreferredEducationForm}
            showEducationPlace={shouldShowEducationPlaceOnBasicInfo(paragraph.id)}
            profile={{
              schoolName: profileSchool,
              regionLabel: profileRegionLabel,
              teacherName: profileTeacherName,
              teacherMobile: profileTeacherMobile,
              teacherEmail: profileTeacherEmail,
            }}
          />
        )
      }

      if (isApplicationTeamInfoParagraphId(paragraph.id)) {
        return <ApplyIndividualTeamInfo value={teamInfo} onChange={setTeamInfo} />
      }

      if (isApplicationGuidanceParagraphId(paragraph.id)) {
        return (
          <ApplyInstitutionGuidance value={guidanceAnswers} onChange={setGuidanceAnswers} />
        )
      }

      if (isApplicationSexOffenseSubmissionParagraphId(paragraph.id)) {
        return (
          <ApplyInstitutionSexOffenseSubmission value={sexOffense} onChange={setSexOffense} />
        )
      }

      if (isApplicationSexOffenseInquiryParagraphId(paragraph.id)) {
        return (
          <ApplyInstitutionSexOffenseInquiry value={sexOffense} onChange={setSexOffense} />
        )
      }

      if (
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'agreement_explanation_text'
      ) {
        const body = String(paragraph.bodyText ?? '').trim()
        if (!body) return <></>
        return (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-700">
            {body}
          </PFText>
        )
      }

      const isIndividualScheduleSlot =
        (applyCase === 'individual-general' || applyCase === 'individual-team') &&
        isApplyScheduleChoiceParagraphId(paragraph.id)

      const isPreferredScheduleSlot =
        isApplicationPreferredScheduleParagraphId(paragraph.id) ||
        (showGeneralPreferredSchedule && isApplyScheduleChoiceParagraphId(paragraph.id)) ||
        (showTrainedTeachersApply &&
          paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)

      if (isPreferredScheduleSlot && showPreferredScheduleInput) {
        return (
          <ApplyPreferredSchedule
            maxBlocks={program.maxPreferredScheduleCount}
            value={preferredBlocks}
            onChange={setPreferredBlocks}
          />
        )
      }

      if (
        isIndividualScheduleSlot &&
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'multiple_choice' &&
        paragraph.items.length === 0
      ) {
        return <></>
      }

      if (
        paragraph.kind === 'single_item' &&
        paragraph.variant === 'multiple_choice' &&
        paragraph.allowMultiple
      ) {
        const selectedIds = paragraph.selectedPreviewMultipleIds ?? []
        if (paragraph.items.length === 0) {
          return (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-600">
              선택 가능한 교육 일정이 없습니다.
            </PFText>
          )
        }
        return (
          <div className={styles.multipleChoice}>
            {paragraph.items.map(item => (
              <PFCheckbox
                key={item.id}
                className={styles.multipleChoiceItem}
                size="large"
                checked={selectedIds.includes(item.id)}
                onCheckedChange={checked => {
                  updateParagraph(paragraph.id, current => {
                    if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
                      return current
                    }
                    const prev = current.selectedPreviewMultipleIds ?? []
                    const next = checked
                      ? [...prev.filter(id => id !== item.id), item.id]
                      : prev.filter(id => id !== item.id)
                    return { ...current, selectedPreviewMultipleIds: next }
                  })
                }}
              >
                {item.label}
              </PFCheckbox>
            ))}
          </div>
        )
      }

      if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') {
        return undefined
      }

      const isSingleLine = paragraph.itemInputRows === 1
      const items = paragraph.items ?? []
      const placeholder = paragraph.bodyPlaceholder || '답변을 입력해 주세요'

      const commitBody = (next: string) => {
        updateParagraph(paragraph.id, current =>
          current.kind === 'single_item' && current.variant === 'short_essay'
            ? { ...current, bodyText: next }
            : current
        )
      }

      if (items.length === 0) {
        if (isSingleLine) {
          return (
            <PFTextInput
              variant="formPage"
              value={paragraph.bodyText}
              placeholder={placeholder}
              onValueChange={commitBody}
            />
          )
        }
        return (
          <PFTextarea
            variant="formPage"
            value={paragraph.bodyText}
            placeholder={placeholder}
            onValueChange={commitBody}
          />
        )
      }

      return (
        <div className={styles.shortEssayItems}>
          {items.map(item => {
            const onItemChange = (nextValue: string) => {
              updateParagraph(paragraph.id, current => {
                if (current.kind !== 'single_item' || current.variant !== 'short_essay') {
                  return current
                }
                return {
                  ...current,
                  bodyText: current.items?.[0]?.id === item.id ? nextValue : current.bodyText,
                  items: (current.items ?? []).map(entry =>
                    entry.id === item.id ? { ...entry, bodyText: nextValue } : entry
                  ),
                }
              })
            }

            const control = isSingleLine ? (
              <PFTextInput
                variant="formPage"
                label={paragraph.showItemTitle ? item.label?.trim() || undefined : undefined}
                value={item.bodyText}
                placeholder={item.placeholder || placeholder}
                onValueChange={onItemChange}
              />
            ) : (
              <PFTextarea
                variant="formPage"
                label={paragraph.showItemTitle ? item.label?.trim() || undefined : undefined}
                value={item.bodyText}
                placeholder={item.placeholder || placeholder}
                onValueChange={onItemChange}
              />
            )

            return (
              <div key={item.id} className={styles.shortEssayItem}>
                {control}
              </div>
            )
          })}
        </div>
      )
    },
    [
      program,
      preferredBlocks,
      basicInfo,
      teamInfo,
      guidanceAnswers,
      sexOffense,
      applyCase,
      showTrainedTeachersApply,
      showGeneralPreferredSchedule,
      showPreferredScheduleInput,
      showPreferredEducationForm,
      profileSchoolLocked,
      profileSchool,
      profileRegionLabel,
      profileTeacherName,
      profileTeacherMobile,
      profileTeacherEmail,
      updateParagraph,
    ]
  )

  const formLoading =
    remoteApplyEnabled &&
    (applicationFormQuery.status === 'loading' || applicationFormQuery.status === 'idle')

  /** remote 모드에서는 CMS form-bindings 응답만 쓴다. 시드 폴백 금지. */
  const displayDraft = draft

  const hiddenParagraphIds = useMemo(() => {
    const hidden = new Set<string>()
    const runtimeFields = applyScheduleVisibilityFieldsFromRuntimeContext(
      coerceApplicationFormDocument(remoteForm)?.runtimeContext,
    )
    const scheduleFields = {
      educationStructure: runtimeFields?.educationStructure ?? program?.educationStructure,
      sessionRound: runtimeFields?.sessionRound ?? program?.sessionRound,
      educationScheduleMode: runtimeFields?.educationScheduleMode ?? program?.educationScheduleMode,
      educationScheduleLines: program?.educationScheduleLines,
    }
    if (displayDraft && !shouldShowApplyScheduleParagraph(scheduleFields)) {
      for (const paragraph of displayDraft.paragraphs) {
        if (isApplyScheduleChoiceParagraphId(paragraph.id)) hidden.add(paragraph.id)
      }
    }
    if (applyCase && !shouldShowIndividualTeamInfoParagraph(applyCase) && displayDraft) {
      for (const paragraph of displayDraft.paragraphs) {
        if (isApplicationTeamInfoParagraphId(paragraph.id)) hidden.add(paragraph.id)
      }
    }
    if (!shouldShowSexOffenseInquiry(sexOffense) && displayDraft) {
      for (const paragraph of displayDraft.paragraphs) {
        if (isApplicationSexOffenseInquiryParagraphId(paragraph.id)) {
          hidden.add(paragraph.id)
        }
      }
    }
    return hidden
  }, [applyCase, displayDraft, program, remoteForm, sexOffense])

  const remoteFormUnavailable =
    remoteApplyEnabled &&
    !formLoading &&
    displayDraft == null &&
    (applicationFormQuery.status === 'unavailable' ||
      applicationFormQuery.status === 'error' ||
      applicationFormQuery.status === 'ready')

  if (!isReady || isLoading || formLoading || !program) {
    return null
  }

  if (!displayDraft && !remoteFormUnavailable) {
    return null
  }

  const handleBack = () => {
    navigate(programDetailPath(program.id, fromPath, focus))
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    if (displayDraft == null) {
      setSubmitError(
        blockedMessage ?? '신청 양식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
      return
    }
    if (blockedMessage && !canSubmitRemote) {
      setSubmitError(blockedMessage)
      return
    }
    const bundle = applicationFormQuery.bundle
    if (
      canSubmitRemote &&
      bundle?.option.recruitmentId != null &&
      bundle.option.formBindingId != null &&
      bundle.option.applicationType
    ) {
      const preferredScheduleBlocks = showPreferredScheduleInput
        ? toPortalPreferredScheduleBlocks(preferredBlocks)
        : undefined
      if (showPreferredScheduleInput) {
        const preferredError = findIncompletePreferredScheduleMessage(preferredBlocks)
        if (preferredError) {
          setSubmitError(preferredError)
          return
        }
      }
      const preferredAnswer = showPreferredScheduleInput
        ? toPreferredScheduleAnswerValue(preferredBlocks)
        : null
      if (showPreferredScheduleInput && !preferredAnswer) {
        setSubmitError('진행 희망 교육 일정을 한 개 이상 입력해 주세요.')
        return
      }
      const basicParagraph = findDraftParagraph(displayDraft, isApplicationBasicInfoParagraphId)
      const basicAnswer = basicParagraph ? basicInfoAnswerFromValues(basicInfo) : null
      if (basicParagraph) {
        const basicError = findIncompleteTrainedTeachersBasicInfoMessage(basicInfo)
        if (basicError) {
          setSubmitError(basicError)
          return
        }
        if (!basicAnswer) {
          setSubmitError('기본 정보(신청 기관명)를 입력해 주세요.')
          return
        }
      }
      const teamParagraph = findDraftParagraph(displayDraft, isApplicationTeamInfoParagraphId)
      const showTeamInfo =
        applyCase != null && shouldShowIndividualTeamInfoParagraph(applyCase)
      if (showTeamInfo && teamParagraph) {
        const teamError = findIncompleteIndividualTeamInfoMessage(teamInfo)
        if (teamError) {
          setSubmitError(teamError)
          return
        }
      }
      const sexOffenseParagraph = findDraftParagraph(
        displayDraft,
        isApplicationSexOffenseSubmissionParagraphId,
      )
      if (sexOffenseParagraph) {
        const sexOffenseError = findIncompleteSexOffenseMessage(sexOffense)
        if (sexOffenseError) {
          setSubmitError(sexOffenseError)
          return
        }
      }

      const overrides: Record<string, unknown> = {}
      if (preferredAnswer != null) {
        const scheduleParagraph = displayDraft.paragraphs.find(
          paragraph =>
            isApplicationPreferredScheduleParagraphId(paragraph.id) ||
            isApplyScheduleChoiceParagraphId(paragraph.id),
        )
        const scheduleKey = scheduleParagraph
          ? resolveApplicationAnswerKey(scheduleParagraph)
          : ''
        if (scheduleKey) overrides[scheduleKey] = preferredAnswer
      }
      if (basicAnswer != null && basicParagraph) {
        overrides[resolveApplicationAnswerKey(basicParagraph)] = basicAnswer
      }
      if (showTeamInfo && teamParagraph) {
        overrides[resolveApplicationAnswerKey(teamParagraph)] = teamInfoAnswerFromValues(teamInfo)
      }
      const guidanceParagraph = findDraftParagraph(displayDraft, isApplicationGuidanceParagraphId)
      if (guidanceParagraph) {
        overrides[resolveApplicationAnswerKey(guidanceParagraph)] =
          guidanceAnswerFromValues(guidanceAnswers)
      }
      if (sexOffenseParagraph) {
        overrides[resolveApplicationAnswerKey(sexOffenseParagraph)] =
          sexOffenseSubmissionAnswerFromValues(sexOffense)
      }
      const inquiryParagraph = findDraftParagraph(
        displayDraft,
        isApplicationSexOffenseInquiryParagraphId,
      )
      if (inquiryParagraph && shouldShowSexOffenseInquiry(sexOffense)) {
        overrides[resolveApplicationAnswerKey(inquiryParagraph)] =
          sexOffenseInquiryAnswerFromValues(sexOffense)
      }

      const omitParagraphIds = new Set<string>()
      if (inquiryParagraph && !shouldShowSexOffenseInquiry(sexOffense)) {
        omitParagraphIds.add(inquiryParagraph.id)
        omitParagraphIds.add(resolveApplicationAnswerKey(inquiryParagraph))
      }
      if (!showTeamInfo && teamParagraph) {
        omitParagraphIds.add(teamParagraph.id)
        omitParagraphIds.add(resolveApplicationAnswerKey(teamParagraph))
      }
      for (const paragraph of displayDraft.paragraphs) {
        if (isApplyScheduleChoiceParagraphId(paragraph.id) && hiddenParagraphIds.has(paragraph.id)) {
          omitParagraphIds.add(paragraph.id)
          omitParagraphIds.add(resolveApplicationAnswerKey(paragraph))
        }
      }

      const answers = buildApplicationAnswersFromDraft(displayDraft, {
        overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
        omitParagraphIds: omitParagraphIds.size > 0 ? omitParagraphIds : undefined,
      })

      const classCount = Number.parseInt(basicInfo.classCount, 10)
      const studentCount = Number.parseInt(basicInfo.studentCount, 10)

      try {
        await submitMutation.mutateAsync({
          recruitmentId: bundle.option.recruitmentId,
          applicationType: bundle.option.applicationType,
          formBindingId: bundle.option.formBindingId,
          answers,
          preferredScheduleBlocks,
          ...(Number.isFinite(classCount) && classCount > 0
            ? { requestedClassCount: classCount }
            : {}),
          ...(Number.isFinite(studentCount) && studentCount > 0
            ? { requestedStudentCount: studentCount }
            : {}),
        })
        navigate(programApplyCompletePath(program.id, focus, fromPath))
      } catch (error) {
        setSubmitError(getProgramApplicationApiErrorMessage(error))
      }
      return
    }
    if (remoteApplyEnabled) {
      setSubmitError(
        blockedMessage ?? '신청을 제출할 수 없습니다. 모집 기간과 회원 자격을 확인해 주세요.',
      )
      return
    }
    navigate(programApplyCompletePath(program.id, focus, fromPath))
  }

  return (
    <section className={[shell.page, styles.page].join(' ')}>
      <div className={shell.inner}>
        <div className={styles.back}>
          <ProgramBackButton size="large" label="이전으로" onClick={handleBack} />
        </div>

        <PFText as="h1" typo="hd-lg" color="black" className={styles.pageTitle}>
          프로그램 신청하기
        </PFText>

        <div className={styles.summary}>
          <PFText as="h2" typo="hl-sm" color="black">
            {program.title}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="primary-500">
            {program.applicationPeriodLabel}
          </PFText>
        </div>

        {blockedMessage ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.blockedNotice}>
            {blockedMessage}
          </PFText>
        ) : null}

        {remoteFormUnavailable && !blockedMessage ? (
          <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.blockedNotice}>
            신청 양식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </PFText>
        ) : null}

        <div className={styles.form}>
          {displayDraft ? (
            <FormTemplateHost surface="platformUser">
              <FormTemplateRenderer
                draft={displayDraft}
                interactionMode="user"
                surface="platformUser"
                hiddenParagraphIds={hiddenParagraphIds}
                onUpdateParagraph={updateParagraph}
                fillOptions={{ consentFillReadOnlyBody: true }}
                renderParagraphSlot={renderParagraphSlot}
              />
            </FormTemplateHost>
          ) : null}

          {submitError ? (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.submitError}>
              {submitError}
            </PFText>
          ) : null}

          <div className={styles.actions}>
            <PFButton
              size="xlarge"
              width={240}
              type="button"
              disabled={
                submitMutation.isPending ||
                !displayDraft ||
                Boolean(blockedMessage && remoteApplyEnabled)
              }
              onClick={() => {
                void handleSubmit()
              }}
            >
              신청하기
            </PFButton>
          </div>
        </div>
      </div>
    </section>
  )
}
