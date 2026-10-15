import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { hasIncompleteApplicationFormThirdPartyRecipient } from '@jakorea/form-schema/paragraph-ids/application-form-third-party-recipient'
import { readEducationScheduleLinesForApplicationForm } from '@jakorea/form-schema/program-application'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import {
  buildApplyFormSeedDraft,
  getProgramIdFromPath,
  parsePortalProgramId,
  ProgramBackButton,
  programDetailPath,
  readPortalRecruitmentFocus,
  resolveProgramApplyFormCase,
  shouldShowIndividualTeamInfoParagraph,
  useProgramApplicationForm,
  useProgramDetail,
  useSubmitProgramApplication,
  ProgramApplyLoading,
  ProgramApplyCompleteModal,
  ProgramApplyGateModals,
  programApplyGateApplicationsPathForType,
  programApplyGateMemberSettingsPath,
  shouldHideApplyPageBlockedBanner,
  useProgramApplyGate,
} from '@/features/program'
import { usePortalProfileQuery } from '@/features/auth/sign-in/hooks/use-portal-profile-query'
import { getQueryRetryHttpStatus } from '@/shared/lib/query-retry'
import {
  getApplicationApiErrorCode,
  getProgramApplicationApiErrorMessage,
  isIndividualApplicationEnrolledGradeRequiredError,
} from '@/features/program/lib/application-api-error'
import { PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE } from '@/features/program/lib/program-apply-messages'
import { platformQueryKeys } from '@/shared/api/query-keys'
import {
  buildApplicationAnswersFromDraft,
  coerceApplicationFormDocument,
  mergeApplicationBindingRuntimeParagraphs,
  collectConditionallyHiddenAnswerKeys,
  collectRuntimeConditionalQuestions,
  collectRuntimeHiddenAnswerKeys,
  isRequiredParagraph,
  omitRuntimeHiddenAnswers,
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
  isDynamicIndividualInterviewParagraph,
  isDynamicVolunteerActivityScheduleParagraph,
  isDynamicVolunteerInterviewParagraph,
  isIndividualInterviewScheduleParagraphId,
  isVolunteerInterviewScheduleParagraphId,
  isInstructorAvailableScheduleParagraphId,
  isInstructorCrimeRecordParagraphId,
  isVolunteerActivityScheduleParagraphId,
  isVolunteerFreeTextItemsParagraphId,
  isVolunteerPreviousJaProgramParagraphId,
  isUjatVolunteerBasicInfoParagraphId,
  isUjatVolunteerFreeTextItemsParagraphId,
  isUjatVolunteerPreviousTermParagraphId,
  shouldShowEducationPlaceOnBasicInfo,
} from '@/features/program/lib/apply-form-paragraph-ids'
import { applyProgramLinkedApplicationDraftPatches } from '@/features/program/lib/application-form-program-link'
import { resolvePortalApplicationHiddenParagraphIds } from '@/features/program/lib/portal-application-hidden-paragraph-ids'
import {
  resolveVolunteerPortalActivityScheduleEnabledForHidden,
  resolveVolunteerPortalInterviewEnabledForHidden,
} from '@/features/program/lib/portal-volunteer-interview-visibility'
import {
  isApplyScheduleChoiceParagraphId,
  isInstitutionApplyScheduleChoiceParagraphId,
  readApplyScheduleInputMode,
  buildEnabledDatesFromAllowedSchedulePeriods,
  readInstitutionAllowedSchedulePeriods,
  readInstitutionApplyScheduleDateBounds,
  readInstitutionFixedScheduleChoiceItems,
  normalizeInstitutionFixedScheduleAnswerTokens,
  shouldShowApplyPreferredSchedule,
  shouldUseInstitutionAllowedSchedulePeriodDates,
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
import {
  ApplyInstructorCrimeRecord,
  emptyInstructorCrimeRecord,
  findIncompleteInstructorCrimeRecordMessage,
  instructorCrimeRecordAnswerFromValues,
  instructorCrimeRecordValuesFromDraftAnswer,
  type ApplyInstructorCrimeRecordValues,
} from '@/features/program/ui/apply-instructor-crime-record/apply-instructor-crime-record'
import {
  ApplyInstructorAvailableSchedule,
  buildInstructorApplyScheduleSlots,
  emptyInstructorAvailableSchedule,
  findIncompleteInstructorAvailableScheduleMessage,
  findIncompleteInterviewScheduleMessage,
  findIncompleteVolunteerActivityScheduleMessage,
  INDIVIDUAL_INTERVIEW_SCHEDULE_COPY,
  VOLUNTEER_ACTIVITY_SCHEDULE_COPY,
  instructorAvailableScheduleAnswerFromValues,
  instructorAvailableScheduleOptionValues,
  instructorAvailableScheduleValuesFromDraftAnswer,
  readPortalApplicationBindingOptionSlots,
  readRuntimeInstructorScheduleSlots,
  type ApplyInstructorAvailableScheduleValues,
} from '@/features/program/ui/apply-instructor-available-schedule/apply-instructor-available-schedule'
import {
  ApplyVolunteerPreviousJaProgram,
  emptyVolunteerPreviousJaProgram,
  findIncompleteVolunteerPreviousJaProgramMessage,
  volunteerPreviousJaProgramAnswerFromValues,
  volunteerPreviousJaProgramValuesFromDraftAnswer,
  type ApplyVolunteerPreviousJaProgramValues,
} from '@/features/program/ui/apply-volunteer-previous-ja-program/apply-volunteer-previous-ja-program'
import {
  evidenceFileObjectIdsByQuestion,
  readDraftEvidenceFiles,
  type ApplyVolunteerEvidenceFile,
} from '@/features/program/ui/apply-volunteer-evidence-attach/apply-volunteer-evidence-attach'
import {
  ApplyVolunteerFreeTextItems,
  emptyVolunteerFreeTextItems,
  findIncompleteVolunteerFreeTextItemsMessage,
  volunteerFreeTextItemsAnswerFromValues,
  volunteerFreeTextItemsValuesFromDraftAnswer,
  type ApplyVolunteerFreeTextItemsValues,
} from '@/features/program/ui/apply-volunteer-free-text-items/apply-volunteer-free-text-items'
import {
  ApplyUjatVolunteerBasicInfo,
  emptyUjatVolunteerBasicInfo,
  findIncompleteUjatVolunteerBasicInfoMessage,
  ujatVolunteerBasicInfoAnswerFromValues,
  ujatVolunteerBasicInfoValuesFromDraftAnswer,
  type ApplyUjatVolunteerBasicInfoValues,
} from '@/features/program/ui/apply-ujat-volunteer-basic-info/apply-ujat-volunteer-basic-info'
import {
  ApplyUjatVolunteerPreviousTerm,
  emptyUjatVolunteerPreviousTerm,
  findIncompleteUjatVolunteerPreviousTermMessage,
  ujatVolunteerPreviousTermAnswerFromValues,
  ujatVolunteerPreviousTermValuesFromDraftAnswer,
  type ApplyUjatVolunteerPreviousTermValues,
} from '@/features/program/ui/apply-ujat-volunteer-previous-term/apply-ujat-volunteer-previous-term'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { getAccessToken } from '@/shared/lib/auth-token'
import { getDevAuthLoggedIn, isRemoteApiConfigured, resolveLoginRequiredPath } from '@/shared/lib'
import { PFAlertModal, PFButton, PFCheckbox, PFText, PFTextarea, PFTextInput } from '@/shared/ui'
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

/** 일반·UJAT 봉사자 자유 작성 항목은 문항이 같아 같은 sidecar 를 쓴다 */
function isAnyVolunteerFreeTextItemsParagraphId(id: string): boolean {
  return isVolunteerFreeTextItemsParagraphId(id) || isUjatVolunteerFreeTextItemsParagraphId(id)
}

export function ProgramApplyPage() {
  const queryClient = useQueryClient()
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
  const applicationSelection = focus
    ? {
        recruitmentId: focus.recruitmentIds?.[0],
        recruitmentIds: focus.recruitmentIds,
        applicationTypes: focus.applicationTypes,
      }
    : null
  const { gateModal, setGateModal, closeGateModal, readGateModalForOptions } = useProgramApplyGate(
    programId,
    applicationSelection,
  )
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const applyGatePromptedRef = useRef(false)
  const submittedSuccessfullyProgramIdRef = useRef<string | null>(null)
  const applicationTypeForMyPage =
    applicationFormQuery.bundle?.option.applicationType ??
    (focus?.applicationTypes?.length === 1 ? focus.applicationTypes[0] : undefined) ??
    program?.applicationType

  const handleViewApplications = () => {
    closeGateModal()
    setCompleteModalOpen(false)
    void queryClient
      .invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
      .finally(() => {
        navigate(programApplyGateApplicationsPathForType(applicationTypeForMyPage))
      })
  }

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

  useEffect(() => {
    if (
      applyGatePromptedRef.current ||
      submittedSuccessfullyProgramIdRef.current === programId ||
      !remoteApplyEnabled
    ) {
      return
    }
    if (
      applicationFormQuery.status !== 'ready' &&
      applicationFormQuery.status !== 'unavailable' &&
      applicationFormQuery.status !== 'error'
    ) {
      return
    }
    const modal = readGateModalForOptions(
      applicationFormQuery.bundle?.option.canApply,
      applicationFormQuery.blockedReason,
    )
    if (!modal) return
    applyGatePromptedRef.current = true
    setGateModal(modal)
  }, [
    applicationFormQuery.blockedReason,
    applicationFormQuery.bundle?.option.canApply,
    applicationFormQuery.status,
    readGateModalForOptions,
    remoteApplyEnabled,
    setGateModal,
    programId,
  ])

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
  const [instructorCrimeRecord, setInstructorCrimeRecord] =
    useState<ApplyInstructorCrimeRecordValues>(emptyInstructorCrimeRecord)
  const [instructorSchedule, setInstructorSchedule] =
    useState<ApplyInstructorAvailableScheduleValues>(emptyInstructorAvailableSchedule)
  const [interviewSchedule, setInterviewSchedule] =
    useState<ApplyInstructorAvailableScheduleValues>(emptyInstructorAvailableSchedule)
  const [volunteerPreviousJa, setVolunteerPreviousJa] =
    useState<ApplyVolunteerPreviousJaProgramValues>(emptyVolunteerPreviousJaProgram)
  const [volunteerEvidenceFiles, setVolunteerEvidenceFiles] = useState<
    ApplyVolunteerEvidenceFile[]
  >([])
  const [volunteerEvidenceUploading, setVolunteerEvidenceUploading] = useState(false)
  const [volunteerFreeText, setVolunteerFreeText] =
    useState<ApplyVolunteerFreeTextItemsValues>(emptyVolunteerFreeTextItems)
  const [volunteerActivitySchedule, setVolunteerActivitySchedule] =
    useState<ApplyInstructorAvailableScheduleValues>(emptyInstructorAvailableSchedule)
  const [ujatVolunteerBasicInfo, setUjatVolunteerBasicInfo] =
    useState<ApplyUjatVolunteerBasicInfoValues>(emptyUjatVolunteerBasicInfo)
  const [ujatVolunteerPreviousTerm, setUjatVolunteerPreviousTerm] =
    useState<ApplyUjatVolunteerPreviousTermValues>(emptyUjatVolunteerPreviousTerm)
  const [submitAlert, setSubmitAlert] = useState<{
    description: string
    promptSettingsGrade?: boolean
  } | null>(null)
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
  const applicationFormDocument = useMemo(
    () => coerceApplicationFormDocument(remoteForm),
    [remoteForm],
  )
  const educationScheduleLinesForApply = useMemo(
    () =>
      readEducationScheduleLinesForApplicationForm(
        applicationFormDocument?.runtimeContext,
        program?.educationScheduleLines,
      ) ?? program?.educationScheduleLines ?? [],
    [applicationFormDocument, program?.educationScheduleLines],
  )
  const institutionScheduleParagraph = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    return (
      paragraphs.find(
        paragraph =>
          paragraph != null &&
          typeof paragraph === 'object' &&
          isInstitutionApplyScheduleChoiceParagraphId(
            String((paragraph as { id?: unknown }).id ?? ''),
          ),
      ) ?? null
    )
  }, [applicationFormDocument])
  const institutionScheduleInputMode = useMemo(
    () =>
      readApplyScheduleInputMode(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph,
      ),
    [applicationFormDocument, institutionScheduleParagraph],
  )
  const institutionScheduleDateBounds = useMemo(
    () =>
      readInstitutionApplyScheduleDateBounds(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph,
      ),
    [applicationFormDocument, institutionScheduleParagraph],
  )
  const institutionAllowedSchedulePeriods = useMemo(
    () =>
      readInstitutionAllowedSchedulePeriods(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph,
      ),
    [applicationFormDocument, institutionScheduleParagraph],
  )
  const institutionScheduleEnabledDates = useMemo(() => {
    if (!shouldUseInstitutionAllowedSchedulePeriodDates(institutionAllowedSchedulePeriods)) {
      return null
    }
    return buildEnabledDatesFromAllowedSchedulePeriods(institutionAllowedSchedulePeriods!)
  }, [institutionAllowedSchedulePeriods])
  /**
   * CMS 개인 신청은 기간 지정 지망 UI가 없다 (institution-schedule 전용).
   * 일반 기관 + 기간 지정(또는 render `date_time_requests`)일 때만 1·2지망을 덮어쓴다.
   * `fixed_schedule_options`이면 서버가 내려준 선택지만 쓴다(교육일정 전체 재부착 금지).
   */
  const showGeneralPreferredSchedule =
    applyCase === 'institution-general' &&
    program != null &&
    (institutionScheduleInputMode === 'date_time_requests' ||
      (institutionScheduleInputMode == null && shouldShowApplyPreferredSchedule(program)))
  const showEconomyPreferredSchedule = applyCase === 'institution-economy'
  const showPreferredScheduleInput =
    showTrainedTeachersApply || showGeneralPreferredSchedule || showEconomyPreferredSchedule
  const runtimeInstructorScheduleSlots = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    const scheduleParagraph = paragraphs.find(
      paragraph =>
        paragraph != null &&
        typeof paragraph === 'object' &&
        isInstructorAvailableScheduleParagraphId(String((paragraph as { id?: unknown }).id ?? '')),
    )
    return readRuntimeInstructorScheduleSlots(scheduleParagraph)
  }, [applicationFormDocument])
  const instructorScheduleSlots = useMemo(
    () =>
      runtimeInstructorScheduleSlots ??
      (program
        ? buildInstructorApplyScheduleSlots({
            educationScheduleLines: program.educationScheduleLines,
            educationSchedules: program.educationSchedules,
          })
        : []),
    [program, runtimeInstructorScheduleSlots],
  )
  const interviewBindingParagraph = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    const found = paragraphs.find(
      applyCase === 'individual-volunteer'
        ? isDynamicVolunteerInterviewParagraph
        : isDynamicIndividualInterviewParagraph,
    )
    return found ? (found as { id: string }) : null
  }, [applyCase, applicationFormDocument])
  const interviewSlots = useMemo(
    () => readPortalApplicationBindingOptionSlots(interviewBindingParagraph),
    [interviewBindingParagraph],
  )
  const volunteerActivityBindingParagraph = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    return (
      paragraphs.find(
        paragraph =>
          paragraph != null &&
          typeof paragraph === 'object' &&
          isDynamicVolunteerActivityScheduleParagraph(paragraph),
      ) ?? null
    )
  }, [applicationFormDocument])
  const volunteerActivitySlots = useMemo(
    () => readPortalApplicationBindingOptionSlots(volunteerActivityBindingParagraph),
    [volunteerActivityBindingParagraph],
  )
  const runtimeHiddenAnswerKeys = useMemo(
    () => collectRuntimeHiddenAnswerKeys(remoteForm),
    [remoteForm],
  )
  const runtimeConditionalQuestions = useMemo(
    () => collectRuntimeConditionalQuestions(remoteForm),
    [remoteForm],
  )
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
          const programLinkedDraft = applyProgramLinkedApplicationDraftPatches(remoteDraft, {
            applyCase: applyCaseForDraft,
            program,
            runtimeContext: coerceApplicationFormDocument(remoteForm)?.runtimeContext,
          })
          const bindingMergedDraft =
            applyCaseForDraft === 'individual-volunteer'
              ? mergeApplicationBindingRuntimeParagraphs(programLinkedDraft, remoteForm)
              : programLinkedDraft
          setDraft(
            applyCaseForDraft === 'individual-general' || applyCaseForDraft === 'individual-team'
              ? prepareIndividualApplicationDraft(bindingMergedDraft, {
                  keepParagraphIds: interviewBindingParagraph
                    ? new Set([interviewBindingParagraph.id])
                    : undefined,
                })
              : bindingMergedDraft,
          )
          const draftAnswers = remoteForm.draftAnswers
          const interviewParagraph = findDraftParagraph(
            remoteDraft,
            id =>
              isIndividualInterviewScheduleParagraphId(id) ||
              isVolunteerInterviewScheduleParagraphId(id),
          )
          setInterviewSchedule(
            instructorAvailableScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, interviewParagraph),
            ) ?? emptyInstructorAvailableSchedule(),
          )
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
          const basicParagraph = findDraftParagraph(programLinkedDraft, isApplicationBasicInfoParagraphId)
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
          const crimeParagraph = findDraftParagraph(remoteDraft, isInstructorCrimeRecordParagraphId)
          setInstructorCrimeRecord(
            instructorCrimeRecordValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, crimeParagraph),
            ) ?? emptyInstructorCrimeRecord(),
          )
          const instructorScheduleParagraph = findDraftParagraph(
            remoteDraft,
            isInstructorAvailableScheduleParagraphId,
          )
          setInstructorSchedule(
            instructorAvailableScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, instructorScheduleParagraph),
            ) ?? emptyInstructorAvailableSchedule(),
          )
          setVolunteerEvidenceFiles(readDraftEvidenceFiles(remoteForm.draftAttachments))
          setVolunteerPreviousJa(
            volunteerPreviousJaProgramValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isVolunteerPreviousJaProgramParagraphId),
              ),
            ) ?? emptyVolunteerPreviousJaProgram(),
          )
          setVolunteerFreeText(
            volunteerFreeTextItemsValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isAnyVolunteerFreeTextItemsParagraphId),
              ),
            ) ?? emptyVolunteerFreeTextItems(),
          )
          setVolunteerActivitySchedule(
            instructorAvailableScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isVolunteerActivityScheduleParagraphId),
              ),
            ) ?? emptyInstructorAvailableSchedule(),
          )
          setUjatVolunteerBasicInfo(
            ujatVolunteerBasicInfoValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatVolunteerBasicInfoParagraphId),
              ),
            ) ?? emptyUjatVolunteerBasicInfo(),
          )
          setUjatVolunteerPreviousTerm(
            ujatVolunteerPreviousTermValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatVolunteerPreviousTermParagraphId),
              ),
            ) ?? emptyUjatVolunteerPreviousTerm(),
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
      setInstructorCrimeRecord(emptyInstructorCrimeRecord())
      setInstructorSchedule(emptyInstructorAvailableSchedule())
      setInterviewSchedule(emptyInstructorAvailableSchedule())
      setVolunteerPreviousJa(emptyVolunteerPreviousJaProgram())
      setVolunteerEvidenceFiles([])
      setVolunteerFreeText(emptyVolunteerFreeTextItems())
      setVolunteerActivitySchedule(emptyInstructorAvailableSchedule())
      setUjatVolunteerBasicInfo(emptyUjatVolunteerBasicInfo())
      setUjatVolunteerPreviousTerm(emptyUjatVolunteerPreviousTerm())
      return
    }

    const mockKey = `mock:${program.id}:${focusedApplicationType ?? ''}`
    if (hydratedFormKeyRef.current === mockKey) return
    hydratedFormKeyRef.current = mockKey
    setDraft(
      buildApplyFormSeedDraft({
        ...program,
        applicationType: focusedApplicationType,
      }),
    )
    setPreferredBlocks([createEmptyPreferredBlock()])
    setBasicInfo(emptyTrainedTeachersBasicInfo())
    setTeamInfo(emptyIndividualTeamInfo())
    setGuidanceAnswers(emptyInstitutionGuidanceAnswers())
    setSexOffense(emptyInstitutionSexOffense())
    setInstructorCrimeRecord(emptyInstructorCrimeRecord())
    setInstructorSchedule(emptyInstructorAvailableSchedule())
    setInterviewSchedule(emptyInstructorAvailableSchedule())
    setVolunteerPreviousJa(emptyVolunteerPreviousJaProgram())
    setVolunteerEvidenceFiles([])
    setVolunteerFreeText(emptyVolunteerFreeTextItems())
    setVolunteerActivitySchedule(emptyInstructorAvailableSchedule())
    setUjatVolunteerBasicInfo(emptyUjatVolunteerBasicInfo())
    setUjatVolunteerPreviousTerm(emptyUjatVolunteerPreviousTerm())
  }, [
    program,
    programId,
    remoteApplyEnabled,
    applicationFormQuery.status,
    applicationFormQuery.blockedReason,
    remoteForm,
    remoteFormKey,
    interviewBindingParagraph,
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

  const blockedMessage = applicationFormQuery.blockedMessage
  const showBlockedBanner = Boolean(
    blockedMessage &&
      !shouldHideApplyPageBlockedBanner(
        applicationFormQuery.bundle?.option.canApply,
        applicationFormQuery.blockedReason,
      ),
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
            answerKeyPlaceholders
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

      if (isInstructorCrimeRecordParagraphId(paragraph.id)) {
        return (
          <ApplyInstructorCrimeRecord
            value={instructorCrimeRecord}
            onChange={setInstructorCrimeRecord}
          />
        )
      }

      if (isInstructorAvailableScheduleParagraphId(paragraph.id)) {
        return (
          <ApplyInstructorAvailableSchedule
            slots={instructorScheduleSlots}
            value={instructorSchedule}
            onChange={setInstructorSchedule}
          />
        )
      }

      if (isVolunteerPreviousJaProgramParagraphId(paragraph.id)) {
        return (
          <ApplyVolunteerPreviousJaProgram
            value={volunteerPreviousJa}
            onChange={setVolunteerPreviousJa}
            evidenceFiles={volunteerEvidenceFiles}
            onEvidenceFilesChange={setVolunteerEvidenceFiles}
            onEvidenceUploadingChange={setVolunteerEvidenceUploading}
          />
        )
      }

      if (isAnyVolunteerFreeTextItemsParagraphId(paragraph.id)) {
        return <ApplyVolunteerFreeTextItems value={volunteerFreeText} onChange={setVolunteerFreeText} />
      }

      if (isUjatVolunteerBasicInfoParagraphId(paragraph.id)) {
        return (
          <ApplyUjatVolunteerBasicInfo
            value={ujatVolunteerBasicInfo}
            onChange={setUjatVolunteerBasicInfo}
          />
        )
      }

      if (isUjatVolunteerPreviousTermParagraphId(paragraph.id)) {
        return (
          <ApplyUjatVolunteerPreviousTerm
            value={ujatVolunteerPreviousTerm}
            onChange={setUjatVolunteerPreviousTerm}
            evidenceFiles={volunteerEvidenceFiles}
            onEvidenceFilesChange={setVolunteerEvidenceFiles}
            onEvidenceUploadingChange={setVolunteerEvidenceUploading}
          />
        )
      }

      if (
        volunteerActivityBindingParagraph &&
        paragraph.id === volunteerActivityBindingParagraph.id
      ) {
        return (
          <ApplyInstructorAvailableSchedule
            slots={volunteerActivitySlots}
            value={volunteerActivitySchedule}
            onChange={setVolunteerActivitySchedule}
            copy={VOLUNTEER_ACTIVITY_SCHEDULE_COPY}
          />
        )
      }

      if (interviewBindingParagraph && paragraph.id === interviewBindingParagraph.id) {
        return (
          <ApplyInstructorAvailableSchedule
            slots={interviewSlots}
            value={interviewSchedule}
            onChange={setInterviewSchedule}
            copy={INDIVIDUAL_INTERVIEW_SCHEDULE_COPY}
          />
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
        const useInstitutionScheduleBounds =
          showGeneralPreferredSchedule &&
          isInstitutionApplyScheduleChoiceParagraphId(paragraph.id)
        return (
          <ApplyPreferredSchedule
            maxBlocks={program.maxPreferredScheduleCount}
            value={preferredBlocks}
            onChange={setPreferredBlocks}
            minDate={
              useInstitutionScheduleBounds
                ? institutionScheduleDateBounds.minScheduleDate
                : null
            }
            maxDate={
              useInstitutionScheduleBounds
                ? institutionScheduleDateBounds.maxScheduleDate
                : null
            }
            enabledDates={
              useInstitutionScheduleBounds ? institutionScheduleEnabledDates : null
            }
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
        const choiceItems =
          isInstitutionApplyScheduleChoiceParagraphId(paragraph.id)
            ? paragraph.items.length > 0
              ? paragraph.items
              : (readInstitutionFixedScheduleChoiceItems(
                  applicationFormDocument?.runtimeContext,
                  institutionScheduleParagraph ?? paragraph,
                  { educationScheduleLines: educationScheduleLinesForApply },
                ) ?? paragraph.items)
            : paragraph.items
        if (choiceItems.length === 0) {
          return (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-600">
              선택 가능한 교육 일정이 없습니다.
            </PFText>
          )
        }
        return (
          <div className={styles.multipleChoice}>
            {choiceItems.map(item => (
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
      instructorCrimeRecord,
      instructorSchedule,
      instructorScheduleSlots,
      interviewBindingParagraph,
      volunteerActivityBindingParagraph,
      interviewSlots,
      interviewSchedule,
      volunteerPreviousJa,
      volunteerEvidenceFiles,
      volunteerFreeText,
      volunteerActivitySchedule,
      volunteerActivitySlots,
      ujatVolunteerBasicInfo,
      ujatVolunteerPreviousTerm,
      applyCase,
      showTrainedTeachersApply,
      showGeneralPreferredSchedule,
      showPreferredScheduleInput,
      showPreferredEducationForm,
      institutionScheduleDateBounds.minScheduleDate,
      institutionScheduleDateBounds.maxScheduleDate,
      institutionScheduleEnabledDates,
      applicationFormDocument,
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
    const hidden = new Set(
      resolvePortalApplicationHiddenParagraphIds({
        applyCase,
        program: program ?? null,
        runtimeContext: applicationFormDocument?.runtimeContext,
        paragraphs: displayDraft?.paragraphs ?? [],
        showSexOffenseConsentInquiryParagraph: shouldShowSexOffenseInquiry(sexOffense),
        volunteerInterviewEnabled:
          applyCase === 'individual-volunteer'
            ? resolveVolunteerPortalInterviewEnabledForHidden({
                formBinding: remoteForm,
              })
            : undefined,
        volunteerActivityScheduleEnabled:
          applyCase === 'individual-volunteer'
            ? resolveVolunteerPortalActivityScheduleEnabledForHidden({
                formBinding: remoteForm,
              })
            : undefined,
      }),
    )
    if (displayDraft) {
      const ujatApplicationType = ujatVolunteerBasicInfo.applicationType
      for (const paragraph of displayDraft.paragraphs) {
        if (
          (ujatApplicationType === 'new' && isUjatVolunteerPreviousTermParagraphId(paragraph.id)) ||
          (ujatApplicationType === 'ujat-graduate' &&
            isUjatVolunteerFreeTextItemsParagraphId(paragraph.id))
        ) {
          hidden.add(paragraph.id)
        }
      }
    }
    if (displayDraft && (runtimeHiddenAnswerKeys.size > 0 || runtimeConditionalQuestions.length > 0)) {
      const conditionallyHidden = collectConditionallyHiddenAnswerKeys(
        runtimeConditionalQuestions,
        buildApplicationAnswersFromDraft(displayDraft),
      )
      for (const paragraph of displayDraft.paragraphs) {
        const key = resolveApplicationAnswerKey(paragraph)
        if (
          runtimeHiddenAnswerKeys.has(paragraph.id) ||
          runtimeHiddenAnswerKeys.has(key) ||
          conditionallyHidden.has(paragraph.id) ||
          conditionallyHidden.has(key)
        ) {
          hidden.add(paragraph.id)
        }
      }
    }
    return hidden
  }, [
    applyCase,
    applicationFormDocument,
    displayDraft,
    program,
    remoteForm,
    runtimeConditionalQuestions,
    runtimeHiddenAnswerKeys,
    sexOffense,
    ujatVolunteerBasicInfo.applicationType,
  ])

  const evidenceFilesForSubmit = volunteerEvidenceFiles.filter(
    file =>
      !displayDraft?.paragraphs.some(
        paragraph =>
          hiddenParagraphIds.has(paragraph.id) &&
          (paragraph.id === file.questionKey ||
            resolveApplicationAnswerKey(paragraph) === file.questionKey),
      ),
  )
  if (evidenceFilesForSubmit.length !== volunteerEvidenceFiles.length) {
    setVolunteerEvidenceFiles(evidenceFilesForSubmit)
  }

  const remoteFormUnavailable =
    remoteApplyEnabled &&
    !formLoading &&
    displayDraft == null &&
    (applicationFormQuery.status === 'unavailable' ||
      applicationFormQuery.status === 'error' ||
      applicationFormQuery.status === 'ready')

  if (!isReady || isLoading || formLoading || !program) {
    return <ProgramApplyLoading />
  }

  if (!displayDraft && !remoteFormUnavailable) {
    return null
  }

  const handleBack = () => {
    navigate(programDetailPath(program.id, fromPath, focus))
  }

  const handleSubmit = async () => {
    setSubmitAlert(null)
    if (displayDraft == null) {
      setSubmitAlert({
        description:
          blockedMessage ?? '신청 양식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
      return
    }
    if (blockedMessage && !canSubmitRemote) {
      setSubmitAlert({ description: blockedMessage })
      return
    }
    if (hasIncompleteApplicationFormThirdPartyRecipient(displayDraft)) {
      setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
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
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const preferredAnswer = showPreferredScheduleInput
        ? toPreferredScheduleAnswerValue(preferredBlocks)
        : null
      if (showPreferredScheduleInput && !preferredAnswer) {
        setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
        return
      }
      if (
        applyCase === 'institution-general' &&
        !showGeneralPreferredSchedule &&
        displayDraft &&
        institutionScheduleParagraph &&
        !hiddenParagraphIds.has(institutionScheduleParagraph.id)
      ) {
        const scheduleParagraph = displayDraft.paragraphs.find(
          paragraph =>
            isInstitutionApplyScheduleChoiceParagraphId(paragraph.id) &&
            !hiddenParagraphIds.has(paragraph.id),
        )
        if (
          scheduleParagraph &&
          isRequiredParagraph(scheduleParagraph) &&
          scheduleParagraph.kind === 'single_item' &&
          scheduleParagraph.variant === 'multiple_choice'
        ) {
          const selected = normalizeInstitutionFixedScheduleAnswerTokens(
            scheduleParagraph.selectedPreviewMultipleIds ?? [],
            applicationFormDocument?.runtimeContext,
            institutionScheduleParagraph,
          )
          if (selected.length === 0) {
            setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
            return
          }
        }
      }
      const basicParagraph = findDraftParagraph(displayDraft, isApplicationBasicInfoParagraphId)
      const basicAnswer = basicParagraph
        ? basicInfoAnswerFromValues(basicInfo, {
            includePreferredEducationFields: showPreferredEducationForm,
          })
        : null
      if (basicParagraph) {
        const basicError = findIncompleteTrainedTeachersBasicInfoMessage(basicInfo)
        if (basicError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
        if (!basicAnswer) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const teamParagraph = findDraftParagraph(displayDraft, isApplicationTeamInfoParagraphId)
      const showTeamInfo =
        applyCase != null && shouldShowIndividualTeamInfoParagraph(applyCase)
      const teamInfoVisible =
        showTeamInfo &&
        teamParagraph != null &&
        !hiddenParagraphIds.has(teamParagraph.id)
      if (teamInfoVisible) {
        const teamError = findIncompleteIndividualTeamInfoMessage(teamInfo)
        if (teamError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
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
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const crimeParagraphCandidate = findDraftParagraph(
        displayDraft,
        isInstructorCrimeRecordParagraphId,
      )
      const instructorCrimeParagraph =
        crimeParagraphCandidate && !hiddenParagraphIds.has(crimeParagraphCandidate.id)
          ? crimeParagraphCandidate
          : null
      if (instructorCrimeParagraph && isRequiredParagraph(instructorCrimeParagraph)) {
        const crimeError = findIncompleteInstructorCrimeRecordMessage(instructorCrimeRecord)
        if (crimeError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const scheduleParagraphCandidate = findDraftParagraph(
        displayDraft,
        isInstructorAvailableScheduleParagraphId,
      )
      const instructorScheduleParagraph =
        scheduleParagraphCandidate && !hiddenParagraphIds.has(scheduleParagraphCandidate.id)
          ? scheduleParagraphCandidate
          : null
      if (instructorScheduleParagraph) {
        const scheduleError = findIncompleteInstructorAvailableScheduleMessage(
          instructorSchedule,
          instructorScheduleSlots,
        )
        if (scheduleError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const interviewSubmitVisible =
        interviewBindingParagraph != null &&
        !hiddenParagraphIds.has(interviewBindingParagraph.id)
      const interviewDraftParagraph = interviewSubmitVisible
        ? findDraftParagraph(displayDraft, id => id === interviewBindingParagraph!.id)
        : null
      const interviewRequired =
        interviewSubmitVisible &&
        ((interviewDraftParagraph != null && isRequiredParagraph(interviewDraftParagraph)) ||
          isRequiredParagraph(interviewBindingParagraph as WritingFormParagraph))
      if (interviewRequired) {
        const interviewError = findIncompleteInterviewScheduleMessage(
          interviewSchedule,
          interviewSlots,
        )
        if (interviewError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const visibleDraftParagraph = (match: (id: string) => boolean) => {
        const found = findDraftParagraph(displayDraft, match)
        return found && !hiddenParagraphIds.has(found.id) ? found : null
      }
      const volunteerPreviousJaParagraph = visibleDraftParagraph(
        isVolunteerPreviousJaProgramParagraphId,
      )
      if (volunteerEvidenceUploading) {
        setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
        return
      }
      if (volunteerPreviousJaParagraph && isRequiredParagraph(volunteerPreviousJaParagraph)) {
        const previousJaError = findIncompleteVolunteerPreviousJaProgramMessage(volunteerPreviousJa)
        if (previousJaError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const volunteerFreeTextParagraph = visibleDraftParagraph(isAnyVolunteerFreeTextItemsParagraphId)
      if (volunteerFreeTextParagraph && isRequiredParagraph(volunteerFreeTextParagraph)) {
        const freeTextError = findIncompleteVolunteerFreeTextItemsMessage(volunteerFreeText)
        if (freeTextError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const volunteerActivityParagraph =
        volunteerActivityBindingParagraph &&
        !hiddenParagraphIds.has(volunteerActivityBindingParagraph.id)
          ? visibleDraftParagraph(id => id === volunteerActivityBindingParagraph.id)
          : null
      if (volunteerActivityParagraph && isRequiredParagraph(volunteerActivityParagraph)) {
        const activityError = findIncompleteVolunteerActivityScheduleMessage(
          volunteerActivitySchedule,
          volunteerActivitySlots,
        )
        if (activityError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const ujatBasicInfoParagraph = visibleDraftParagraph(isUjatVolunteerBasicInfoParagraphId)
      if (ujatBasicInfoParagraph && isRequiredParagraph(ujatBasicInfoParagraph)) {
        const ujatBasicError = findIncompleteUjatVolunteerBasicInfoMessage(ujatVolunteerBasicInfo)
        if (ujatBasicError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const ujatPreviousTermParagraph = visibleDraftParagraph(
        isUjatVolunteerPreviousTermParagraphId,
      )
      if (ujatPreviousTermParagraph && isRequiredParagraph(ujatPreviousTermParagraph)) {
        const previousTermError =
          findIncompleteUjatVolunteerPreviousTermMessage(ujatVolunteerPreviousTerm)
        if (previousTermError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
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
      if (
        applyCase === 'institution-general' &&
        !showGeneralPreferredSchedule &&
        institutionScheduleParagraph &&
        institutionScheduleInputMode === 'fixed_schedule_options'
      ) {
        const scheduleParagraph = displayDraft.paragraphs.find(
          paragraph =>
            isInstitutionApplyScheduleChoiceParagraphId(paragraph.id) &&
            !hiddenParagraphIds.has(paragraph.id),
        )
        if (
          scheduleParagraph &&
          scheduleParagraph.kind === 'single_item' &&
          scheduleParagraph.variant === 'multiple_choice'
        ) {
          const scheduleKey = resolveApplicationAnswerKey(scheduleParagraph)
          const normalized = normalizeInstitutionFixedScheduleAnswerTokens(
            scheduleParagraph.selectedPreviewMultipleIds ?? [],
            applicationFormDocument?.runtimeContext,
            institutionScheduleParagraph,
          )
          if (normalized.length > 0) {
            overrides[scheduleKey] = normalized
          }
        }
      }
      if (basicAnswer != null && basicParagraph) {
        overrides[resolveApplicationAnswerKey(basicParagraph)] = basicAnswer
      }
      if (teamInfoVisible) {
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
      if (instructorCrimeParagraph && instructorCrimeRecord.confirmed) {
        overrides[resolveApplicationAnswerKey(instructorCrimeParagraph)] =
          instructorCrimeRecordAnswerFromValues(instructorCrimeRecord)
      }
      if (instructorScheduleParagraph) {
        overrides[resolveApplicationAnswerKey(instructorScheduleParagraph)] =
          runtimeInstructorScheduleSlots != null
            ? instructorAvailableScheduleOptionValues(instructorSchedule, instructorScheduleSlots)
            : instructorAvailableScheduleAnswerFromValues(
                instructorSchedule,
                instructorScheduleSlots,
              )
      }
      if (interviewSubmitVisible && interviewBindingParagraph) {
        const interviewAnswerKey = resolveApplicationAnswerKey(
          (interviewDraftParagraph ?? interviewBindingParagraph) as object,
        )
        overrides[interviewAnswerKey] = instructorAvailableScheduleOptionValues(
          interviewSchedule,
          interviewSlots,
        )
      }
      if (volunteerPreviousJaParagraph) {
        overrides[resolveApplicationAnswerKey(volunteerPreviousJaParagraph)] =
          volunteerPreviousJaProgramAnswerFromValues(volunteerPreviousJa)
      }
      if (volunteerFreeTextParagraph) {
        overrides[resolveApplicationAnswerKey(volunteerFreeTextParagraph)] =
          volunteerFreeTextItemsAnswerFromValues(volunteerFreeText)
      }
      if (volunteerActivityParagraph) {
        overrides[resolveApplicationAnswerKey(volunteerActivityParagraph)] =
          instructorAvailableScheduleOptionValues(volunteerActivitySchedule, volunteerActivitySlots)
      }
      if (ujatBasicInfoParagraph) {
        overrides[resolveApplicationAnswerKey(ujatBasicInfoParagraph)] =
          ujatVolunteerBasicInfoAnswerFromValues(ujatVolunteerBasicInfo)
      }
      if (ujatPreviousTermParagraph) {
        overrides[resolveApplicationAnswerKey(ujatPreviousTermParagraph)] =
          ujatVolunteerPreviousTermAnswerFromValues(ujatVolunteerPreviousTerm)
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
      if (!teamInfoVisible && teamParagraph) {
        omitParagraphIds.add(teamParagraph.id)
        omitParagraphIds.add(resolveApplicationAnswerKey(teamParagraph))
      }
      if (instructorCrimeParagraph && !instructorCrimeRecord.confirmed) {
        omitParagraphIds.add(instructorCrimeParagraph.id)
        omitParagraphIds.add(resolveApplicationAnswerKey(instructorCrimeParagraph))
      }
      for (const paragraph of displayDraft.paragraphs) {
        const key = resolveApplicationAnswerKey(paragraph)
        if (runtimeHiddenAnswerKeys.has(paragraph.id) || (key && runtimeHiddenAnswerKeys.has(key))) {
          omitParagraphIds.add(paragraph.id)
          if (key) omitParagraphIds.add(key)
        }
      }
      for (const paragraph of displayDraft.paragraphs) {
        if (isApplyScheduleChoiceParagraphId(paragraph.id) && hiddenParagraphIds.has(paragraph.id)) {
          omitParagraphIds.add(paragraph.id)
          omitParagraphIds.add(resolveApplicationAnswerKey(paragraph))
        }
        if (
          hiddenParagraphIds.has(paragraph.id) &&
          (isUjatVolunteerPreviousTermParagraphId(paragraph.id) ||
            isUjatVolunteerFreeTextItemsParagraphId(paragraph.id))
        ) {
          omitParagraphIds.add(paragraph.id)
          omitParagraphIds.add(resolveApplicationAnswerKey(paragraph))
        }
      }

      const answers = omitRuntimeHiddenAnswers(
        buildApplicationAnswersFromDraft(displayDraft, {
          overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
          omitParagraphIds: omitParagraphIds.size > 0 ? omitParagraphIds : undefined,
        }),
        runtimeHiddenAnswerKeys,
        runtimeConditionalQuestions,
      )

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
          ...(() => {
            const questionKeys = [
              volunteerPreviousJaParagraph,
              ujatPreviousTermParagraph,
            ].flatMap(paragraph =>
              paragraph ? [paragraph.id, resolveApplicationAnswerKey(paragraph)] : [],
            )
            const fileObjectIdsByQuestion = evidenceFileObjectIdsByQuestion(
              evidenceFilesForSubmit,
              questionKeys,
            )
            return fileObjectIdsByQuestion ? { fileObjectIdsByQuestion } : {}
          })(),
        })
        submittedSuccessfullyProgramIdRef.current = programId
        setGateModal(null)
        setCompleteModalOpen(true)
      } catch (error) {
        const message = getProgramApplicationApiErrorMessage(error)
        const promptSettingsGrade = isIndividualApplicationEnrolledGradeRequiredError(error)
        const errorCode = getApplicationApiErrorCode(error)
        const validationFailed = errorCode === 'VALIDATION_FAILED'
        const resolveDescription = (interviewVisible: boolean) => {
          if (validationFailed) return PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE
          if (interviewVisible) {
            return `${message} 면접 진행 가능 일정이 바뀌었을 수 있어 신청서를 새로 불러왔습니다. 일정을 다시 확인한 뒤 신청해 주세요.`
          }
          return message
        }
        if (getQueryRetryHttpStatus(error) !== 400) {
          setSubmitAlert({
            description: resolveDescription(false),
            promptSettingsGrade,
          })
          return
        }
        // 런타임 선택지(면접 일정 등)가 렌더 이후 바뀌면 400. 최신 선택지로 다시 불러온다.
        if (!promptSettingsGrade && !validationFailed) {
          applicationFormQuery.refetch()
        }
        const interviewVisible =
          applyCase === 'individual-volunteer' &&
          interviewBindingParagraph != null &&
          !hiddenParagraphIds.has(interviewBindingParagraph.id)
        setSubmitAlert({
          description: resolveDescription(interviewVisible),
          promptSettingsGrade,
        })
      }
      return
    }
    if (remoteApplyEnabled) {
      setSubmitAlert({
        description:
          blockedMessage ?? '신청을 제출할 수 없습니다. 모집 기간과 회원 자격을 확인해 주세요.',
      })
      return
    }
    setCompleteModalOpen(true)
  }

  const visibleInstructorScheduleParagraph = displayDraft
    ? findDraftParagraph(
        displayDraft,
        id => isInstructorAvailableScheduleParagraphId(id) && !hiddenParagraphIds.has(id),
      )
    : null
  const instructorScheduleUnavailable =
    visibleInstructorScheduleParagraph != null &&
    runtimeInstructorScheduleSlots != null &&
    runtimeInstructorScheduleSlots.length === 0
  const visibleInstructorCrimeParagraph = displayDraft
    ? findDraftParagraph(
        displayDraft,
        id => isInstructorCrimeRecordParagraphId(id) && !hiddenParagraphIds.has(id),
      )
    : null
  const instructorCrimeRecordUnconfirmed =
    visibleInstructorCrimeParagraph != null &&
    isRequiredParagraph(visibleInstructorCrimeParagraph) &&
    !instructorCrimeRecord.confirmed

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

        {showBlockedBanner ? (
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

          {instructorScheduleUnavailable ? (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-700" className={styles.submitError}>
              선택 가능한 강의 일정이 없어 신청할 수 없습니다. 관리자에게 문의해 주세요.
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
                instructorScheduleUnavailable ||
                instructorCrimeRecordUnconfirmed ||
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

      <ProgramApplyGateModals
        kind={gateModal}
        onClose={closeGateModal}
        onEditMemberInfo={() => {
          closeGateModal()
          navigate(programApplyGateMemberSettingsPath)
        }}
        onViewApplications={handleViewApplications}
      />
      <ProgramApplyCompleteModal
        open={completeModalOpen}
        onClose={() => {
          setCompleteModalOpen(false)
          if (program) {
            navigate(programDetailPath(program.id, fromPath, focus))
          }
        }}
        onViewApplications={handleViewApplications}
      />
      <PFAlertModal
        open={submitAlert != null}
        title="안내"
        description={submitAlert?.description}
        onConfirm={() => setSubmitAlert(null)}
      >
        {submitAlert?.promptSettingsGrade ? (
          <div className={styles.submitAlertFollowUp}>
            <PFButton
              type="button"
              size="large"
              variant="secondary"
              width="100%"
              onClick={() => {
                setSubmitAlert(null)
                navigate('/mypage/settings')
              }}
            >
              회원 정보에서 학년 등록
            </PFButton>
          </div>
        ) : null}
      </PFAlertModal>
    </section>
  )
}
