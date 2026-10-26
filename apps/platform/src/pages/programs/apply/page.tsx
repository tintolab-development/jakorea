import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { readEducationScheduleLinesForApplicationForm } from '@jakorea/form-schema/program-application'
import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import type { FormUpdateParagraph } from '@jakorea/form-template-runtime'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import {
  buildApplyFormSeedDraft,
  getProgramIdFromPath,
  parsePortalProgramId,
  ProgramBackButton,
  programDetailPath,
  readPortalRecruitmentFocus,
  resolveProgramApplyFormCase,
  shouldShowIndividualTeamInfoParagraph,
  isVolunteerApplyFormCase,
  isUjatInstitutionApplyFormCase,
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
import {
  readApplicationApiErrorEnvelope,
  summarizePortalApplicationSubmit,
} from '@/features/program/lib/summarize-portal-application-submit'
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
  hasEducationFormatSystemField,
  isEducationFormatErrorField,
  readPreferredEducationFormChoice,
  shouldShowPreferredEducationForm,
} from '@/features/program/lib/application-education-format-policy'
import {
  isApplicationBasicInfoParagraphId,
  isApplicationGuidanceParagraphId,
  isApplicationPreferredScheduleParagraphId,
  isGeminiInstitutionContactPersonParagraphId,
  isGeminiInstitutionTrainingInfoParagraphId,
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
  isUjatInstitutionBasicInfoParagraphId,
  isUjatInstitutionClassTimeParagraphId,
  isUjatInstitutionGradeInfoParagraphId,
  isUjatInstitutionPreferredScheduleParagraphId,
  isUjatSubmitConfirmationParagraphId,
  isUjatVolunteerBasicInfoParagraphId,
  isUjatVolunteerFreeTextItemsParagraphId,
  isUjatVolunteerPreviousTermParagraphId,
  resolveUjatVolunteerHiddenParagraphIds,
  shouldLockTeacherMobileEmailOnBasicInfo,
  shouldShowEducationPlaceOnBasicInfo,
} from '@/features/program/lib/apply-form-paragraph-ids'
import {
  ApplyGeminiInstitutionContact,
  ApplyGeminiInstitutionTrainingInfo,
  emptyGeminiInstitutionContact,
  emptyGeminiInstitutionTrainingInfo,
  findIncompleteGeminiInstitutionContactMessage,
  findIncompleteGeminiInstitutionTrainingInfoMessage,
  geminiInstitutionContactAnswerFromValues,
  geminiInstitutionContactValuesFromDraftAnswer,
  geminiInstitutionTrainingInfoAnswerFromValues,
  geminiInstitutionTrainingInfoValuesFromDraftAnswer,
  type ApplyGeminiInstitutionContactValues,
  type ApplyGeminiInstitutionTrainingInfoValues,
} from '@/features/program/ui/apply-gemini-institution-info/apply-gemini-institution-info'
import { applyProgramLinkedApplicationDraftPatches } from '@/features/program/lib/application-form-program-link'
import { readApplyScheduleMetaFromProgram } from '@/features/program/lib/apply-form-schedule-meta'
import { resolvePortalApplicationHiddenParagraphIds } from '@/features/program/lib/portal-application-hidden-paragraph-ids'
import {
  resolveInstructorPortalAvailableScheduleEnabledForHidden,
  resolveVolunteerPortalActivityScheduleEnabledForHidden,
  resolveVolunteerPortalInterviewEnabledForHidden,
} from '@/features/program/lib/portal-volunteer-interview-visibility'
import {
  pruneSelectedSlotIdsToCurrentOptions,
  usesConfirmedOsaAvailableSchedule,
} from '@/features/program/lib/portal-confirmed-osa-schedule'
import {
  isApplyScheduleChoiceParagraphId,
  isInstitutionApplyScheduleChoiceParagraphId,
  readApplyScheduleInputMode,
  buildEnabledDatesFromEducationScheduleLines,
  mergeApplyScheduleVisibilityFields,
  findMissingRequiredBottomConsentId,
  hasPreferredScheduleDateOutsideRuntime,
  isRuntimeScheduleNotConfigured,
  isTrainedTeachersOrganizationPeriodDateRequests,
  readInstitutionAllowedSchedulePeriods,
  readInstitutionApplyScheduleDateBounds,
  readInstitutionFixedScheduleChoiceItems,
  readRuntimeFixedScheduleChoiceItems,
  resolveRuntimeScheduleDateBounds,
  resolveRuntimeScheduleEnabledDates,
  resolveInstitutionAllowedScheduleEnabledDates,
  readApplicationScheduleRecruitmentLimitsFromRuntime,
  normalizeInstitutionFixedScheduleAnswerTokens,
  isApplyScheduleParagraphForcedHidden,
  isApplyScheduleChoiceHiddenInSet,
  pickApplyScheduleChoiceParagraph,
  readApplyFixedScheduleChoiceIds,
  resolveApplyScheduleChoiceAnswerKey,
  resolveHiddenScheduleAutoSubmitIds,
  buildApplyPreferredSessionSelectOptions,
  createEmptyApplyPreferredScheduleBlocks,
  resolveApplyPreferredMaxSessionsPerDay,
  resolveApplyPreferredScheduleInitialBlockCount,
  resolveApplyPreferredScheduleMaxBlocks,
  shouldShowApplyPreferredSchedule,
  shouldShowApplyPreferredScheduleSessionSelect,
  shouldShowApplySchedulePeriodDateOnlyPreferred,
} from '@/features/program/lib/apply-form-schedule'
import {
  capFixedScheduleSelectedIds,
  preferredScheduleBlocksFromDraftAnswers,
  selectedFixedScheduleIdsFromDraftAnswer,
  toPortalPreferredScheduleBlocks,
  toPreferredScheduleAnswerValue,
  findIncompletePreferredScheduleMessage,
} from '@/features/program/lib/preferred-schedule-blocks'
import {
  ApplyPreferredSchedule,
  ApplyPreferredScheduleAddButton,
  type ApplyPreferredScheduleBlock,
} from '@/features/program/ui/apply-preferred-schedule/apply-preferred-schedule'
import {
  ApplyTrainedTeachersBasicInfo,
  basicInfoAnswerFromValues,
  basicInfoValuesFromDraftAnswer,
  emptyTrainedTeachersBasicInfo,
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
  ApplyInstitutionSexOffenseUjatWrite,
  findIncompleteUjatSexOffenseWriteMessage,
  emptyInstitutionSexOffense,
  findIncompleteSexOffenseMessage,
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  omitSexOffenseInquiryAnswersIfNotRequested,
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
  emptyInstructorAvailableSchedule,
  findIncompleteInstructorAvailableScheduleMessage,
  findIncompleteInterviewScheduleMessage,
  findIncompleteVolunteerActivityScheduleMessage,
  INDIVIDUAL_INTERVIEW_SCHEDULE_COPY,
  VOLUNTEER_ACTIVITY_SCHEDULE_COPY,
  instructorAvailableScheduleOptionValues,
  instructorAvailableScheduleValuesFromDraftAnswer,
  readPortalApplicationBindingOptionSlots,
  readRuntimeInstructorScheduleSlots,
  resolveApplyAvailableScheduleSlots,
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
import {
  ApplyUjatInstitutionBasicInfo,
  emptyUjatInstitutionBasicInfo,
  fillUjatInstitutionBasicInfoFromProfile,
  ujatInstitutionBasicInfoAnswerFromValues,
  ujatInstitutionBasicInfoValuesFromDraftAnswer,
  type ApplyUjatInstitutionBasicInfoValues,
} from '@/features/program/ui/apply-ujat-institution-basic-info/apply-ujat-institution-basic-info'
import {
  ApplyUjatInstitutionGradeInfo,
  appendUjatInstitutionGradeBlock,
  emptyUjatInstitutionGradeBlocks,
  ujatInstitutionGradeAnswerFromValues,
  ujatInstitutionGradeValuesFromDraftAnswer,
  type ApplyUjatGradeBlock,
} from '@/features/program/ui/apply-ujat-institution-grade-info/apply-ujat-institution-grade-info'
import {
  ApplyUjatInstitutionClassTime,
  appendUjatInstitutionClassTimeBlock,
  emptyUjatInstitutionClassTimeBlocks,
  ujatInstitutionClassTimeAnswerFromValues,
  ujatInstitutionClassTimeValuesFromDraftAnswer,
  type ApplyUjatClassTimeBlock,
} from '@/features/program/ui/apply-ujat-institution-class-time/apply-ujat-institution-class-time'
import {
  ApplyUjatInstitutionPreferredSchedule,
  ujatInstitutionPreferredScheduleAnswerFromValues,
  ujatInstitutionPreferredScheduleValuesFromDraftAnswer,
} from '@/features/program/ui/apply-ujat-institution-preferred-schedule/apply-ujat-institution-preferred-schedule'
import {
  focusIncompleteApplicationField,
  resolveGeneralBasicInfoApplyIncomplete,
  type ApplicationIncompleteField,
} from '@/features/program/lib/application-apply-incomplete'
import { resolveUjatInstitutionApplyIncomplete } from '@/features/program/lib/ujat-institution-apply-incomplete'
import {
  ApplyUjatInstitutionSubmitConfirmation,
  isUjatSubmitConfirmationChecked,
  readUjatSubmitConfirmationItem,
} from '@/features/program/ui/apply-ujat-institution-submit-confirmation/apply-ujat-institution-submit-confirmation'
import { preparePortalUjatApplicationDraft } from '@/features/program/lib/ujat-application-fill-placeholders'
import { readUjatPreferredEducationScheduleOptions } from '@/features/program/lib/ujat-preferred-education-schedule-options'
import { FormTemplateHost, FormTemplateRenderer } from '@/features/form-template'
import { getAccessToken } from '@/shared/lib/auth-token'
import { getDevAuthLoggedIn, isRemoteApiConfigured, resolveLoginRequiredPath } from '@/shared/lib'
import { normalizeScheduleDisplayLabel } from '@/shared/lib/format-display-date'
import {
  PFAlertModal,
  PFButton,
  PFCheckbox,
  PFText,
  PFTextarea,
  PFTextInput,
} from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'
import { useLocation, useNavigate } from 'react-router-dom'

function createEmptyPreferredBlock(): ApplyPreferredScheduleBlock {
  return { date: '', classPeriod: '', startTime: '', endTime: '' }
}

function ScheduleChoiceLabel({ label }: { label: string }) {
  const display = normalizeScheduleDisplayLabel(label)
  const parts = display.split(/\s*\|\s*/).filter(part => part.length > 0)
  if (parts.length < 2) return display

  return (
    <span className={styles.scheduleChoiceLabel}>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className={styles.scheduleChoiceSegment}>
          {part}
        </span>
      ))}
    </span>
  )
}

function TrainedTeacherScheduleChoiceLabel({ label }: { label: string }) {
  const display = normalizeScheduleDisplayLabel(label)
  const separatorIndex = display.indexOf('|')
  return separatorIndex >= 0 ? display.slice(0, separatorIndex).trim() : display
}

function findDraftParagraph(
  draft: WritingFormDraft | null,
  match: (id: string) => boolean
): WritingFormParagraph | undefined {
  return draft?.paragraphs.find(paragraph => match(paragraph.id))
}

function draftAnswerForParagraph(
  answers: Record<string, unknown> | null | undefined,
  paragraph: WritingFormParagraph | undefined
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

function resolveApplicationErrorParagraphId(
  field: unknown,
  draft: WritingFormDraft | null
): string | null {
  if (typeof field !== 'string') return null
  const fieldKey = field.trim()
  if (!fieldKey) return null

  const matchedParagraph = draft?.paragraphs.find(
    paragraph => paragraph.id === fieldKey || resolveApplicationAnswerKey(paragraph) === fieldKey
  )
  if (matchedParagraph) return matchedParagraph.id

  if (fieldKey === 'preferredScheduleBlocks') {
    return (
      draft?.paragraphs.find(paragraph => isApplicationPreferredScheduleParagraphId(paragraph.id))
        ?.id ?? null
    )
  }

  return null
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
    {
      recruitmentId: focus?.recruitmentIds?.[0],
      recruitmentIds: focus?.recruitmentIds,
      applicationTypes: focus?.applicationTypes,
      programType: program?.programType,
    }
  )
  const submitMutation = useSubmitProgramApplication(numericProgramId)
  const profileQuery = usePortalProfileQuery({ enabled: remoteApplyEnabled })
  const applicationSelection = {
    recruitmentId: focus?.recruitmentIds?.[0],
    recruitmentIds: focus?.recruitmentIds,
    applicationTypes: focus?.applicationTypes,
    programType: program?.programType,
  }
  const { gateModal, setGateModal, closeGateModal, readGateModalForOptions } = useProgramApplyGate(
    programId,
    applicationSelection
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
      applicationFormQuery.blockedReason
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
  const [geminiTrainingInfo, setGeminiTrainingInfo] =
    useState<ApplyGeminiInstitutionTrainingInfoValues>(emptyGeminiInstitutionTrainingInfo)
  const [geminiContact, setGeminiContact] = useState<ApplyGeminiInstitutionContactValues>(
    emptyGeminiInstitutionContact,
  )
  const [trainedTeachersFixedSelectedIds, setTrainedTeachersFixedSelectedIds] = useState<string[]>(
    []
  )
  const [basicInfo, setBasicInfo] = useState<ApplyTrainedTeachersBasicInfoValues>(
    emptyTrainedTeachersBasicInfo
  )
  const [teamInfo, setTeamInfo] = useState<ApplyIndividualTeamInfoValues>(emptyIndividualTeamInfo)
  const [guidanceAnswers, setGuidanceAnswers] = useState<ApplyInstitutionGuidanceAnswers>(
    emptyInstitutionGuidanceAnswers
  )
  const [sexOffense, setSexOffense] = useState<ApplyInstitutionSexOffenseValues>(
    emptyInstitutionSexOffense
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
  const [volunteerFreeText, setVolunteerFreeText] = useState<ApplyVolunteerFreeTextItemsValues>(
    emptyVolunteerFreeTextItems
  )
  const [volunteerActivitySchedule, setVolunteerActivitySchedule] =
    useState<ApplyInstructorAvailableScheduleValues>(emptyInstructorAvailableSchedule)
  const [ujatVolunteerBasicInfo, setUjatVolunteerBasicInfo] =
    useState<ApplyUjatVolunteerBasicInfoValues>(emptyUjatVolunteerBasicInfo)
  const [ujatVolunteerPreviousTerm, setUjatVolunteerPreviousTerm] =
    useState<ApplyUjatVolunteerPreviousTermValues>(emptyUjatVolunteerPreviousTerm)
  const [ujatInstitutionBasicInfo, setUjatInstitutionBasicInfo] =
    useState<ApplyUjatInstitutionBasicInfoValues>(emptyUjatInstitutionBasicInfo)
  const [ujatInstitutionGradeBlocks, setUjatInstitutionGradeBlocks] = useState<
    ApplyUjatGradeBlock[]
  >(emptyUjatInstitutionGradeBlocks)
  const [ujatInstitutionClassTimeBlocks, setUjatInstitutionClassTimeBlocks] = useState<
    ApplyUjatClassTimeBlock[]
  >(emptyUjatInstitutionClassTimeBlocks)
  const [ujatPreferredScheduleIds, setUjatPreferredScheduleIds] = useState<string[]>([])
  const [submitAlert, setSubmitAlert] = useState<{
    description: string
    promptSettingsGrade?: boolean
  } | null>(null)
  const [submitErrorField, setSubmitErrorField] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const pendingApplyIncompleteRef = useRef<ApplicationIncompleteField | null>(null)
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
  const showGeminiInstitutionApply = applyCase === 'institution-gemini'
  const profileDefaults = useMemo(
    () => trainedTeachersProfileDefaults(profileQuery.data),
    [profileQuery.data]
  )
  const profileSchool = profileDefaults.schoolName
  const profileRegionLabel = profileDefaults.regionLabel
  const profileTeacherName = profileDefaults.teacherName
  const profileTeacherMobile = profileDefaults.teacherMobile
  const profileTeacherEmail = profileDefaults.teacherEmail
  const remoteForm = applicationFormQuery.bundle?.form
  const applicationFormDocument = useMemo(
    () => coerceApplicationFormDocument(remoteForm),
    [remoteForm]
  )
  const applicationFormRuntimeContext = applicationFormDocument?.runtimeContext
  const ujatPreferredScheduleOptions = useMemo(
    () =>
      readUjatPreferredEducationScheduleOptions({
        runtimeContext: applicationFormRuntimeContext,
      }),
    [applicationFormRuntimeContext],
  )
  const serverPreferredEducationFormChoice = readPreferredEducationFormChoice(
    applicationFormRuntimeContext,
  )
  const hasEducationFormatField = hasEducationFormatSystemField(applicationFormDocument)
  const showPreferredEducationForm = shouldShowPreferredEducationForm({
    formDocument: applicationFormDocument,
    runtimeContext: applicationFormRuntimeContext,
    legacyEducationForm: program?.educationForm,
  })

  useEffect(() => {
    if (serverPreferredEducationFormChoice === true && !hasEducationFormatField) {
      console.warn(
        '[portal-application-form] runtimeContext.showEducationFormChoice=true but educationFormat metadata is missing',
      )
    }
  }, [hasEducationFormatField, serverPreferredEducationFormChoice])
  const educationScheduleLinesForApply = useMemo(
    () =>
      readEducationScheduleLinesForApplicationForm(
        applicationFormDocument?.runtimeContext,
        program?.educationScheduleLines
      ) ??
      program?.educationScheduleLines ??
      [],
    [applicationFormDocument, program?.educationScheduleLines]
  )
  const applicationScheduleVisibility = useMemo(
    () =>
      mergeApplyScheduleVisibilityFields(
        applicationFormDocument?.runtimeContext,
        program ?? undefined
      ),
    [applicationFormDocument?.runtimeContext, program]
  )
  const applyScheduleChoiceMeta = useMemo(
    () => (program ? readApplyScheduleMetaFromProgram(program) : undefined),
    [program]
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
            String((paragraph as { id?: unknown }).id ?? '')
          )
      ) ?? null
    )
  }, [applicationFormDocument])
  const trainedTeachersScheduleParagraph = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    return (
      paragraphs.find(
        paragraph =>
          paragraph != null &&
          typeof paragraph === 'object' &&
          String((paragraph as { id?: unknown }).id ?? '') ===
            PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
      ) ?? null
    )
  }, [applicationFormDocument])
  const institutionScheduleInputMode = useMemo(
    () =>
      readApplyScheduleInputMode(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph
      ),
    [applicationFormDocument, institutionScheduleParagraph]
  )
  const trainedTeachersScheduleInputMode = useMemo(
    () =>
      readApplyScheduleInputMode(
        applicationFormDocument?.runtimeContext,
        trainedTeachersScheduleParagraph
      ),
    [applicationFormDocument, trainedTeachersScheduleParagraph]
  )
  const useTrainedTeachersOperatingPeriod =
    showTrainedTeachersApply &&
    trainedTeachersScheduleInputMode === 'date_time_requests' &&
    (isTrainedTeachersOrganizationPeriodDateRequests(
      applicationFormDocument?.runtimeContext,
      trainedTeachersScheduleParagraph
    ) ||
      // 구 runtime에 programType/flavor가 없을 때: 기간형 + 기관 신청만 동일 경로
      (applicationScheduleVisibility.educationScheduleMode === 'period' &&
        (focusedApplicationType === 'ORGANIZATION' || applyCase === 'trained-teachers')))
  const trainedTeachersRuntimeFixedScheduleChoices = useMemo(
    () =>
      readRuntimeFixedScheduleChoiceItems(
        applicationFormDocument?.runtimeContext,
        trainedTeachersScheduleParagraph
      ),
    [applicationFormDocument, trainedTeachersScheduleParagraph]
  )
  const institutionRuntimeFixedScheduleChoices = useMemo(
    () =>
      readRuntimeFixedScheduleChoiceItems(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph
      ),
    [applicationFormDocument, institutionScheduleParagraph]
  )
  const institutionScheduleDateBounds = useMemo(
    () =>
      readInstitutionApplyScheduleDateBounds(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph
      ),
    [applicationFormDocument, institutionScheduleParagraph]
  )
  const institutionAllowedSchedulePeriods = useMemo(
    () =>
      readInstitutionAllowedSchedulePeriods(
        applicationFormDocument?.runtimeContext,
        institutionScheduleParagraph
      ),
    [applicationFormDocument, institutionScheduleParagraph]
  )
  const institutionScheduleRequiresRuntimePeriods =
    applyCase === 'institution-general' && institutionScheduleInputMode === 'date_time_requests'
  const institutionScheduleEnabledDates = useMemo(() => {
    return resolveInstitutionAllowedScheduleEnabledDates(
      institutionAllowedSchedulePeriods,
      institutionScheduleRequiresRuntimePeriods
    )
  }, [institutionAllowedSchedulePeriods, institutionScheduleRequiresRuntimePeriods])
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
  const trainedTeachersScheduleVisibility = useMemo(
    () => ({
      educationStructure:
        applicationScheduleVisibility.educationStructure ?? program?.educationStructure,
      sessionRound: applicationScheduleVisibility.sessionRound ?? program?.sessionRound,
      educationScheduleMode:
        applicationScheduleVisibility.educationScheduleMode ?? program?.educationScheduleMode,
      educationScheduleLines: educationScheduleLinesForApply,
    }),
    [applicationScheduleVisibility, educationScheduleLinesForApply, program]
  )
  const trainedTeachersScheduleParagraphForcedHidden =
    trainedTeachersScheduleVisibility.educationStructure === 'schedule' &&
    trainedTeachersScheduleVisibility.sessionRound === 'multi'
  const isTrainedTeachersFixedScheduleOptions =
    showTrainedTeachersApply &&
    program != null &&
    trainedTeachersScheduleInputMode === 'fixed_schedule_options' &&
    !trainedTeachersScheduleParagraphForcedHidden
  const showTrainedTeachersPreferredSchedule =
    showTrainedTeachersApply &&
    program != null &&
    !isTrainedTeachersFixedScheduleOptions &&
    (trainedTeachersScheduleInputMode === 'date_time_requests' ||
      trainedTeachersScheduleInputMode == null) &&
    shouldShowApplyPreferredSchedule(trainedTeachersScheduleVisibility)
  const showPreferredScheduleInput =
    showTrainedTeachersPreferredSchedule ||
    showGeneralPreferredSchedule ||
    showEconomyPreferredSchedule ||
    showGeminiInstitutionApply
  const institutionPreferredSessionSelect = useMemo(() => {
    if (!program || (!showGeneralPreferredSchedule && !showGeminiInstitutionApply)) {
      return { show: false, options: [] as { value: string; label: string }[] }
    }
    const show =
      showGeminiInstitutionApply || shouldShowApplyPreferredScheduleSessionSelect(program)
    const maxSessionsPerDay = resolveApplyPreferredMaxSessionsPerDay(
      program,
      applicationFormRuntimeContext
    )
    return {
      show,
      options: show ? buildApplyPreferredSessionSelectOptions(maxSessionsPerDay) : [],
    }
  }, [
    applicationFormRuntimeContext,
    program,
    showGeminiInstitutionApply,
    showGeneralPreferredSchedule,
  ])
  const institutionDateOnlyPreferred = useMemo(() => {
    if (!program || !showGeneralPreferredSchedule) return false
    return shouldShowApplySchedulePeriodDateOnlyPreferred(program)
  }, [program, showGeneralPreferredSchedule])
  const trainedTeachersDateOnlyPreferred = useMemo(
    () =>
      showTrainedTeachersPreferredSchedule &&
      shouldShowApplySchedulePeriodDateOnlyPreferred(trainedTeachersScheduleVisibility),
    [showTrainedTeachersPreferredSchedule, trainedTeachersScheduleVisibility]
  )
  const preferredScheduleMaxBlocks = useMemo(() => {
    if (!program) return 1
    if (showGeminiInstitutionApply) return 3
    return resolveApplyPreferredScheduleMaxBlocks(program, applicationFormRuntimeContext)
  }, [applicationFormRuntimeContext, program, showGeminiInstitutionApply])
  const preferredScheduleMapOptions = useMemo(
    () =>
      institutionDateOnlyPreferred || trainedTeachersDateOnlyPreferred
        ? { dateOnly: true }
        : undefined,
    [institutionDateOnlyPreferred, trainedTeachersDateOnlyPreferred]
  )
  const trainedTeachersEnabledDates = useMemo(() => {
    if (
      !showTrainedTeachersPreferredSchedule ||
      applicationScheduleVisibility.educationScheduleMode === 'period'
    ) {
      return null
    }
    return buildEnabledDatesFromEducationScheduleLines(educationScheduleLinesForApply)
  }, [
    applicationScheduleVisibility.educationScheduleMode,
    educationScheduleLinesForApply,
    showTrainedTeachersPreferredSchedule,
  ])
  const trainedTeachersScheduleDateBounds = useMemo(() => {
    if (!useTrainedTeachersOperatingPeriod) {
      return { minScheduleDate: null, maxScheduleDate: null }
    }
    return resolveRuntimeScheduleDateBounds(
      applicationFormRuntimeContext,
      trainedTeachersScheduleParagraph
    )
  }, [
    applicationFormRuntimeContext,
    trainedTeachersScheduleParagraph,
    useTrainedTeachersOperatingPeriod,
  ])
  const trainedTeachersScheduleEnabledDates = useMemo(() => {
    if (!useTrainedTeachersOperatingPeriod) return null
    return resolveRuntimeScheduleEnabledDates(
      applicationFormRuntimeContext,
      true,
      trainedTeachersScheduleParagraph
    )
  }, [
    applicationFormRuntimeContext,
    trainedTeachersScheduleParagraph,
    useTrainedTeachersOperatingPeriod,
  ])
  const trainedTeachersScheduleNotConfigured = useMemo(
    () =>
      useTrainedTeachersOperatingPeriod &&
      isRuntimeScheduleNotConfigured(
        applicationFormRuntimeContext,
        trainedTeachersScheduleParagraph
      ),
    [
      applicationFormRuntimeContext,
      trainedTeachersScheduleParagraph,
      useTrainedTeachersOperatingPeriod,
    ]
  )
  const trainedTeachersFixedScheduleChoiceItems = trainedTeachersRuntimeFixedScheduleChoices ?? []
  const applicationRecruitmentLimits = useMemo(
    () => readApplicationScheduleRecruitmentLimitsFromRuntime(applicationFormRuntimeContext),
    [applicationFormRuntimeContext]
  )
  const usesOsaAvailableSchedule = usesConfirmedOsaAvailableSchedule({
    program,
    applyCase,
  })
  const runtimeInstructorScheduleSlots = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    const scheduleParagraph = paragraphs.find(
      paragraph =>
        paragraph != null &&
        typeof paragraph === 'object' &&
        isInstructorAvailableScheduleParagraphId(String((paragraph as { id?: unknown }).id ?? ''))
    )
    return readRuntimeInstructorScheduleSlots(scheduleParagraph)
  }, [applicationFormDocument])
  const instructorScheduleSlots = useMemo(
    () =>
      resolveApplyAvailableScheduleSlots({
        runtimeSlots: runtimeInstructorScheduleSlots,
        allowProgramDisplayFallback: !remoteApplyEnabled && !usesOsaAvailableSchedule,
        program,
      }),
    [
      program,
      remoteApplyEnabled,
      runtimeInstructorScheduleSlots,
      usesOsaAvailableSchedule,
    ]
  )
  const interviewBindingParagraph = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    const found = paragraphs.find(
      isVolunteerApplyFormCase(applyCase)
        ? isDynamicVolunteerInterviewParagraph
        : isDynamicIndividualInterviewParagraph
    )
    return found ? (found as { id: string }) : null
  }, [applyCase, applicationFormDocument])
  const interviewSlots = useMemo(
    () => readPortalApplicationBindingOptionSlots(interviewBindingParagraph),
    [interviewBindingParagraph]
  )
  const volunteerActivityBindingParagraph = useMemo(() => {
    const paragraphs = applicationFormDocument?.paragraphs
    if (!Array.isArray(paragraphs)) return null
    return (
      paragraphs.find(
        paragraph =>
          paragraph != null &&
          typeof paragraph === 'object' &&
          isDynamicVolunteerActivityScheduleParagraph(paragraph)
      ) ?? null
    )
  }, [applicationFormDocument])
  const volunteerActivitySlots = useMemo(() => {
    const runtimeVolunteer = readRuntimeInstructorScheduleSlots(volunteerActivityBindingParagraph)
    return resolveApplyAvailableScheduleSlots({
      runtimeSlots: runtimeVolunteer,
      allowProgramDisplayFallback: !remoteApplyEnabled && !usesOsaAvailableSchedule,
      program,
    })
  }, [program, remoteApplyEnabled, usesOsaAvailableSchedule, volunteerActivityBindingParagraph])
  useEffect(() => {
    const currentIds = instructorScheduleSlots.map(slot => slot.id)
    setInstructorSchedule(prev => {
      const nextIds = pruneSelectedSlotIdsToCurrentOptions(prev.selectedSlotIds, currentIds)
      if (nextIds.length === prev.selectedSlotIds.length) return prev
      return { selectedSlotIds: nextIds }
    })
  }, [instructorScheduleSlots])
  useEffect(() => {
    const currentIds = volunteerActivitySlots.map(slot => slot.id)
    setVolunteerActivitySchedule(prev => {
      const nextIds = pruneSelectedSlotIdsToCurrentOptions(prev.selectedSlotIds, currentIds)
      if (nextIds.length === prev.selectedSlotIds.length) return prev
      return { selectedSlotIds: nextIds }
    })
  }, [volunteerActivitySlots])
  const runtimeHiddenAnswerKeys = useMemo(
    () => collectRuntimeHiddenAnswerKeys(remoteForm),
    [remoteForm]
  )
  const trainedTeachersScheduleRuntimeHidden = useMemo(() => {
    const answerKey = trainedTeachersScheduleParagraph
      ? resolveApplicationAnswerKey(trainedTeachersScheduleParagraph)
      : ''
    return (
      trainedTeachersScheduleParagraph != null &&
      (runtimeHiddenAnswerKeys.has(trainedTeachersScheduleParagraph.id) ||
        (answerKey.length > 0 && runtimeHiddenAnswerKeys.has(answerKey)))
    )
  }, [runtimeHiddenAnswerKeys, trainedTeachersScheduleParagraph])
  const runtimeConditionalQuestions = useMemo(
    () => collectRuntimeConditionalQuestions(remoteForm),
    [remoteForm]
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
        const remoteDraft = writingFormDraftFromApplicationForm(remoteForm, remoteForm.draftAnswers)
        if (remoteDraft) {
          hydratedFormKeyRef.current = remoteFormKey
          const applyCaseForDraft = resolveProgramApplyFormCase({
            ...program,
            applicationType: focusedApplicationType,
          })
          const programLinkedDraft = applyProgramLinkedApplicationDraftPatches(
            preparePortalUjatApplicationDraft(
              remoteDraft,
              new Date(),
              coerceApplicationFormDocument(remoteForm)?.runtimeContext,
            ),
            {
              applyCase: applyCaseForDraft,
              program,
              runtimeContext: coerceApplicationFormDocument(remoteForm)?.runtimeContext,
            }
          )
          const bindingMergedDraft =
            isVolunteerApplyFormCase(applyCaseForDraft) || applyCaseForDraft === 'instructor'
              ? mergeApplicationBindingRuntimeParagraphs(programLinkedDraft, remoteForm)
              : programLinkedDraft
          setDraft(
            applyCaseForDraft === 'individual-general' || applyCaseForDraft === 'individual-team'
              ? prepareIndividualApplicationDraft(bindingMergedDraft, {
                  keepParagraphIds: interviewBindingParagraph
                    ? new Set([interviewBindingParagraph.id])
                    : undefined,
                })
              : bindingMergedDraft
          )
          const draftAnswers = remoteForm.draftAnswers
          const interviewParagraph = findDraftParagraph(
            remoteDraft,
            id =>
              isIndividualInterviewScheduleParagraphId(id) ||
              isVolunteerInterviewScheduleParagraphId(id)
          )
          setInterviewSchedule(
            instructorAvailableScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, interviewParagraph)
            ) ?? emptyInstructorAvailableSchedule()
          )
          const preferredParagraph = findDraftParagraph(
            remoteDraft,
            id =>
              isApplicationPreferredScheduleParagraphId(id) || isApplyScheduleChoiceParagraphId(id)
          )
          const fromPreferred = preferredScheduleBlocksFromDraftAnswers(
            draftAnswers,
            preferredParagraph?.id ??
              PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
          )
          setPreferredBlocks(
            fromPreferred ??
              (applyCaseForDraft === 'institution-general'
                ? createEmptyApplyPreferredScheduleBlocks(
                    resolveApplyPreferredScheduleInitialBlockCount(program)
                  )
                : applyCaseForDraft === 'institution-gemini'
                  ? createEmptyApplyPreferredScheduleBlocks(3)
                : [createEmptyPreferredBlock()])
          )
          setTrainedTeachersFixedSelectedIds(
            selectedFixedScheduleIdsFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                preferredParagraph ??
                  findDraftParagraph(
                    remoteDraft,
                    id => id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
                  )
              )
            )
          )
          const basicParagraph = findDraftParagraph(
            programLinkedDraft,
            isApplicationBasicInfoParagraphId
          )
          const fromBasic = basicInfoValuesFromDraftAnswer(
            draftAnswerForParagraph(draftAnswers, basicParagraph)
          )
          setBasicInfo(
            fillTrainedTeachersBasicInfoFromProfile(
              fromBasic ?? emptyTrainedTeachersBasicInfo(),
              profileDefaults
            )
          )
          const geminiTrainingInfoParagraph = findDraftParagraph(
            programLinkedDraft,
            isGeminiInstitutionTrainingInfoParagraphId,
          )
          setGeminiTrainingInfo(
            geminiInstitutionTrainingInfoValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, geminiTrainingInfoParagraph),
            ) ?? emptyGeminiInstitutionTrainingInfo(),
          )
          const geminiContactParagraph = findDraftParagraph(
            programLinkedDraft,
            isGeminiInstitutionContactPersonParagraphId,
          )
          setGeminiContact(
            geminiInstitutionContactValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, geminiContactParagraph),
            ) ?? emptyGeminiInstitutionContact(),
          )
          const teamParagraph = findDraftParagraph(remoteDraft, isApplicationTeamInfoParagraphId)
          setTeamInfo(
            teamInfoValuesFromDraftAnswer(draftAnswerForParagraph(draftAnswers, teamParagraph)) ??
              emptyIndividualTeamInfo()
          )
          const guidanceParagraph = findDraftParagraph(
            remoteDraft,
            isApplicationGuidanceParagraphId
          )
          setGuidanceAnswers(
            guidanceValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, guidanceParagraph)
            ) ?? emptyInstitutionGuidanceAnswers()
          )
          const submissionParagraph = findDraftParagraph(
            remoteDraft,
            isApplicationSexOffenseSubmissionParagraphId
          )
          const inquiryParagraph = findDraftParagraph(
            remoteDraft,
            isApplicationSexOffenseInquiryParagraphId
          )
          setSexOffense(
            sexOffenseValuesFromDraftAnswers(
              draftAnswerForParagraph(draftAnswers, submissionParagraph),
              draftAnswerForParagraph(draftAnswers, inquiryParagraph)
            ) ?? emptyInstitutionSexOffense()
          )
          const crimeParagraph = findDraftParagraph(remoteDraft, isInstructorCrimeRecordParagraphId)
          setInstructorCrimeRecord(
            instructorCrimeRecordValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, crimeParagraph)
            ) ?? emptyInstructorCrimeRecord()
          )
          const instructorScheduleParagraph = findDraftParagraph(
            remoteDraft,
            isInstructorAvailableScheduleParagraphId
          )
          setInstructorSchedule(
            instructorAvailableScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(draftAnswers, instructorScheduleParagraph)
            ) ?? emptyInstructorAvailableSchedule()
          )
          setVolunteerEvidenceFiles(readDraftEvidenceFiles(remoteForm.draftAttachments))
          setVolunteerPreviousJa(
            volunteerPreviousJaProgramValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isVolunteerPreviousJaProgramParagraphId)
              )
            ) ?? emptyVolunteerPreviousJaProgram()
          )
          setVolunteerFreeText(
            volunteerFreeTextItemsValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isAnyVolunteerFreeTextItemsParagraphId)
              )
            ) ?? emptyVolunteerFreeTextItems()
          )
          setVolunteerActivitySchedule(
            instructorAvailableScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isVolunteerActivityScheduleParagraphId)
              )
            ) ?? emptyInstructorAvailableSchedule()
          )
          setUjatVolunteerBasicInfo(
            ujatVolunteerBasicInfoValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatVolunteerBasicInfoParagraphId)
              )
            ) ?? emptyUjatVolunteerBasicInfo()
          )
          setUjatVolunteerPreviousTerm(
            ujatVolunteerPreviousTermValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatVolunteerPreviousTermParagraphId)
              )
            ) ?? emptyUjatVolunteerPreviousTerm()
          )
          setUjatInstitutionBasicInfo(
            fillUjatInstitutionBasicInfoFromProfile(
              ujatInstitutionBasicInfoValuesFromDraftAnswer(
                draftAnswerForParagraph(
                  draftAnswers,
                  findDraftParagraph(remoteDraft, isUjatInstitutionBasicInfoParagraphId)
                )
              ) ?? emptyUjatInstitutionBasicInfo(),
              profileDefaults
            )
          )
          setUjatInstitutionGradeBlocks(
            ujatInstitutionGradeValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatInstitutionGradeInfoParagraphId)
              )
            ) ?? emptyUjatInstitutionGradeBlocks()
          )
          setUjatInstitutionClassTimeBlocks(
            ujatInstitutionClassTimeValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatInstitutionClassTimeParagraphId)
              )
            ) ?? emptyUjatInstitutionClassTimeBlocks()
          )
          setUjatPreferredScheduleIds(
            ujatInstitutionPreferredScheduleValuesFromDraftAnswer(
              draftAnswerForParagraph(
                draftAnswers,
                findDraftParagraph(remoteDraft, isUjatInstitutionPreferredScheduleParagraphId)
              )
            ) ?? []
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
      if (applicationFormQuery.status === 'loading' || applicationFormQuery.status === 'idle') {
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
      setPreferredBlocks(
        applyCase === 'institution-gemini'
          ? createEmptyApplyPreferredScheduleBlocks(3)
          : [createEmptyPreferredBlock()],
      )
      setGeminiTrainingInfo(emptyGeminiInstitutionTrainingInfo())
      setGeminiContact(emptyGeminiInstitutionContact())
      setBasicInfo(
        fillTrainedTeachersBasicInfoFromProfile(emptyTrainedTeachersBasicInfo(), profileDefaults)
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
      setUjatInstitutionBasicInfo(
        fillUjatInstitutionBasicInfoFromProfile(emptyUjatInstitutionBasicInfo(), profileDefaults)
      )
      setUjatInstitutionGradeBlocks(emptyUjatInstitutionGradeBlocks())
      setUjatInstitutionClassTimeBlocks(emptyUjatInstitutionClassTimeBlocks())
      setUjatPreferredScheduleIds([])
      return
    }

    const mockKey = `mock:${program.id}:${focusedApplicationType ?? ''}`
    if (hydratedFormKeyRef.current === mockKey) return
    hydratedFormKeyRef.current = mockKey
    setDraft(
      preparePortalUjatApplicationDraft(
        buildApplyFormSeedDraft({
          ...program,
          applicationType: focusedApplicationType,
        })
      )
    )
    setPreferredBlocks(
      applyCase === 'institution-gemini'
        ? createEmptyApplyPreferredScheduleBlocks(3)
        : [createEmptyPreferredBlock()],
    )
    setGeminiTrainingInfo(emptyGeminiInstitutionTrainingInfo())
    setGeminiContact(emptyGeminiInstitutionContact())
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
    setUjatInstitutionBasicInfo(emptyUjatInstitutionBasicInfo())
    setUjatInstitutionGradeBlocks(emptyUjatInstitutionGradeBlocks())
    setUjatInstitutionClassTimeBlocks(emptyUjatInstitutionClassTimeBlocks())
    setUjatPreferredScheduleIds([])
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
    setUjatInstitutionBasicInfo(prev =>
      fillUjatInstitutionBasicInfoFromProfile(prev, profileDefaults)
    )
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
      applicationFormQuery.blockedReason
    )
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

      if (isGeminiInstitutionTrainingInfoParagraphId(paragraph.id)) {
        return (
          <ApplyGeminiInstitutionTrainingInfo
            value={geminiTrainingInfo}
            onChange={setGeminiTrainingInfo}
          />
        )
      }

      if (isGeminiInstitutionContactPersonParagraphId(paragraph.id)) {
        return <ApplyGeminiInstitutionContact value={geminiContact} onChange={setGeminiContact} />
      }

      if (isApplicationBasicInfoParagraphId(paragraph.id)) {
        return (
          <ApplyTrainedTeachersBasicInfo
            value={basicInfo}
            onChange={setBasicInfo}
            schoolNameLocked={profileSchoolLocked}
            teacherMobileEmailLocked={shouldLockTeacherMobileEmailOnBasicInfo(paragraph.id)}
            answerKeyPlaceholders
            showPreferredEducationForm={showPreferredEducationForm}
            educationFormatError={isEducationFormatErrorField(submitErrorField)}
            maxClassCount={applicationRecruitmentLimits.maxClassCount}
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
          <ApplyInstitutionGuidance
            value={guidanceAnswers}
            onChange={setGuidanceAnswers}
            variant={isUjatInstitutionApplyFormCase(applyCase) ? 'ujat' : 'general'}
          />
        )
      }

      if (isApplicationSexOffenseSubmissionParagraphId(paragraph.id)) {
        if (isUjatInstitutionApplyFormCase(applyCase)) {
          return (
            <ApplyInstitutionSexOffenseUjatWrite value={sexOffense} onChange={setSexOffense} />
          )
        }
        return <ApplyInstitutionSexOffenseSubmission value={sexOffense} onChange={setSexOffense} />
      }

      if (isApplicationSexOffenseInquiryParagraphId(paragraph.id)) {
        if (isUjatInstitutionApplyFormCase(applyCase)) return <></>
        return <ApplyInstitutionSexOffenseInquiry value={sexOffense} onChange={setSexOffense} />
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
        return (
          <ApplyVolunteerFreeTextItems value={volunteerFreeText} onChange={setVolunteerFreeText} />
        )
      }

      if (isUjatInstitutionBasicInfoParagraphId(paragraph.id)) {
        return (
          <ApplyUjatInstitutionBasicInfo
            value={ujatInstitutionBasicInfo}
            onChange={setUjatInstitutionBasicInfo}
            schoolNameLocked={profileSchoolLocked}
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

      if (isUjatInstitutionGradeInfoParagraphId(paragraph.id)) {
        return (
          <ApplyUjatInstitutionGradeInfo
            value={ujatInstitutionGradeBlocks}
            onChange={setUjatInstitutionGradeBlocks}
          />
        )
      }

      if (isUjatInstitutionClassTimeParagraphId(paragraph.id)) {
        return (
          <ApplyUjatInstitutionClassTime
            value={ujatInstitutionClassTimeBlocks}
            onChange={setUjatInstitutionClassTimeBlocks}
            gradeBlocks={ujatInstitutionGradeBlocks}
          />
        )
      }

      if (isUjatInstitutionPreferredScheduleParagraphId(paragraph.id)) {
        return (
          <ApplyUjatInstitutionPreferredSchedule
            options={ujatPreferredScheduleOptions}
            selectedIds={ujatPreferredScheduleIds}
            onChange={setUjatPreferredScheduleIds}
          />
        )
      }

      if (isUjatSubmitConfirmationParagraphId(paragraph.id)) {
        const item = readUjatSubmitConfirmationItem(paragraph)
        if (!item) return undefined
        return (
          <ApplyUjatInstitutionSubmitConfirmation
            label={item.label}
            checked={isUjatSubmitConfirmationChecked(paragraph)}
            onCheckedChange={checked => {
              updateParagraph(paragraph.id, current => {
                if (current.kind !== 'single_item' || current.variant !== 'multiple_choice') {
                  return current
                }
                return {
                  ...current,
                  selectedPreviewSingleId: checked ? item.id : null,
                }
              })
            }}
          />
        )
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

      if (paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text') {
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
        (showTrainedTeachersPreferredSchedule &&
          paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)

      if (
        isTrainedTeachersFixedScheduleOptions &&
        paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
      ) {
        const choiceItems = trainedTeachersFixedScheduleChoiceItems
        if (choiceItems.length === 0) {
          return (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-600">
              선택 가능한 교육 일정이 없습니다.
            </PFText>
          )
        }
        const maxCount = applicationRecruitmentLimits.maxScheduleCount
        return (
          <div className={styles.scheduleChoiceBlock}>
            <PFText
              as="p"
              typo="bd-md-rg"
              color="neutral-cool-500"
              className={styles.scheduleChoiceDescription}
            >
              진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.
            </PFText>
            <div className={styles.multipleChoice}>
              {choiceItems.map(item => {
                const checked = trainedTeachersFixedSelectedIds.includes(item.id)
                const atCap =
                  maxCount != null &&
                  maxCount >= 1 &&
                  trainedTeachersFixedSelectedIds.length >= maxCount &&
                  !checked
                return (
                  <PFCheckbox
                    key={item.id}
                    className={styles.multipleChoiceItem}
                    size="large"
                    checked={checked}
                    disabled={atCap}
                    onCheckedChange={nextChecked => {
                      setTrainedTeachersFixedSelectedIds(prev => {
                        const next = nextChecked
                          ? capFixedScheduleSelectedIds([...prev, item.id], maxCount)
                          : prev.filter(id => id !== item.id)
                        return next
                      })
                    }}
                  >
                    <TrainedTeacherScheduleChoiceLabel label={item.label} />
                  </PFCheckbox>
                )
              })}
            </div>
          </div>
        )
      }

      if (isPreferredScheduleSlot && showPreferredScheduleInput) {
        const useInstitutionScheduleBounds =
          showGeneralPreferredSchedule && isInstitutionApplyScheduleChoiceParagraphId(paragraph.id)
        return (
          <ApplyPreferredSchedule
            maxBlocks={preferredScheduleMaxBlocks}
            value={preferredBlocks}
            onChange={setPreferredBlocks}
            minDate={
              useInstitutionScheduleBounds
                ? institutionScheduleDateBounds.minScheduleDate
                : useTrainedTeachersOperatingPeriod
                  ? trainedTeachersScheduleDateBounds.minScheduleDate
                  : null
            }
            maxDate={
              useInstitutionScheduleBounds
                ? institutionScheduleDateBounds.maxScheduleDate
                : useTrainedTeachersOperatingPeriod
                  ? trainedTeachersScheduleDateBounds.maxScheduleDate
                  : null
            }
            enabledDates={
              useInstitutionScheduleBounds
                ? institutionScheduleEnabledDates
                : useTrainedTeachersOperatingPeriod
                  ? trainedTeachersScheduleEnabledDates
                : showTrainedTeachersApply
                  ? trainedTeachersEnabledDates
                  : null
            }
            disabled={trainedTeachersScheduleNotConfigured}
            showSessionSelect={
              (showGeneralPreferredSchedule || showGeminiInstitutionApply) &&
              institutionPreferredSessionSelect.show
            }
            sessionOptions={
              showGeneralPreferredSchedule || showGeminiInstitutionApply
                ? institutionPreferredSessionSelect.options
                : []
            }
            dateOnlyPreferred={
              useInstitutionScheduleBounds
                ? institutionDateOnlyPreferred
                : trainedTeachersDateOnlyPreferred
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
        const runtimeFixedChoiceItems =
          isApplyScheduleChoiceParagraphId(paragraph.id) &&
          institutionScheduleInputMode === 'fixed_schedule_options'
            ? (institutionRuntimeFixedScheduleChoices?.map(item => ({
                id: item.id,
                label: item.label,
              })) ?? [])
            : null
        const choiceItems =
          runtimeFixedChoiceItems != null
            ? runtimeFixedChoiceItems
            : isApplyScheduleChoiceParagraphId(paragraph.id)
              ? paragraph.items.length > 0
                ? paragraph.items
                : (readInstitutionFixedScheduleChoiceItems(
                    applicationFormDocument?.runtimeContext,
                    institutionScheduleParagraph ?? paragraph,
                    {
                      educationScheduleLines: educationScheduleLinesForApply,
                      educationStructure: program.educationStructure,
                      sessionRound: program.sessionRound,
                      educationScheduleMode: program.educationScheduleMode,
                      educationRoundCount: applyScheduleChoiceMeta?.educationRoundCount,
                      sessionsPerRound: applyScheduleChoiceMeta?.sessionsPerRound,
                      curriculumChartSessionCount:
                        applyScheduleChoiceMeta?.curriculumChartSessionCount,
                      curriculumSessions: applyScheduleChoiceMeta?.curriculumSessions,
                    }
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
                {isApplyScheduleChoiceParagraphId(paragraph.id) ? (
                  <ScheduleChoiceLabel label={item.label} />
                ) : (
                  item.label
                )}
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
      geminiContact,
      geminiTrainingInfo,
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
      ujatInstitutionBasicInfo,
      ujatInstitutionGradeBlocks,
      ujatInstitutionClassTimeBlocks,
      ujatPreferredScheduleIds,
      ujatPreferredScheduleOptions,
      applyCase,
      showTrainedTeachersApply,
      useTrainedTeachersOperatingPeriod,
      showTrainedTeachersPreferredSchedule,
      showGeneralPreferredSchedule,
      showGeminiInstitutionApply,
      showPreferredScheduleInput,
      institutionPreferredSessionSelect,
      showPreferredEducationForm,
      institutionScheduleDateBounds.minScheduleDate,
      institutionScheduleDateBounds.maxScheduleDate,
      institutionScheduleEnabledDates,
      trainedTeachersEnabledDates,
      trainedTeachersScheduleEnabledDates,
      trainedTeachersScheduleNotConfigured,
      trainedTeachersDateOnlyPreferred,
      isTrainedTeachersFixedScheduleOptions,
      trainedTeachersFixedScheduleChoiceItems,
      trainedTeachersFixedSelectedIds,
      applicationRecruitmentLimits,
      applicationFormDocument,
      institutionRuntimeFixedScheduleChoices,
      institutionScheduleInputMode,
      profileSchoolLocked,
      profileSchool,
      profileRegionLabel,
      profileTeacherName,
      profileTeacherMobile,
      profileTeacherEmail,
      updateParagraph,
      preferredScheduleMaxBlocks,
    ]
  )

  const renderParagraphTitleTrailing = useCallback(
    (paragraph: WritingFormParagraph) => {
      const isPreferredScheduleSlot =
        isApplicationPreferredScheduleParagraphId(paragraph.id) ||
        (showGeneralPreferredSchedule && isApplyScheduleChoiceParagraphId(paragraph.id)) ||
        (showTrainedTeachersPreferredSchedule &&
          paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)

      if (isUjatInstitutionGradeInfoParagraphId(paragraph.id)) {
        return (
          <ApplyPreferredScheduleAddButton
            onClick={() => setUjatInstitutionGradeBlocks(appendUjatInstitutionGradeBlock)}
          >
            신청 학년 추가
          </ApplyPreferredScheduleAddButton>
        )
      }

      if (isUjatInstitutionClassTimeParagraphId(paragraph.id)) {
        return (
          <ApplyPreferredScheduleAddButton
            onClick={() => setUjatInstitutionClassTimeBlocks(appendUjatInstitutionClassTimeBlock)}
          >
            수업 진행 시간 추가
          </ApplyPreferredScheduleAddButton>
        )
      }

      if (!isPreferredScheduleSlot || !showPreferredScheduleInput) return null

      const atPreferredScheduleMax = preferredBlocks.length >= preferredScheduleMaxBlocks
      const scheduleInputDisabled =
        showTrainedTeachersPreferredSchedule && trainedTeachersScheduleNotConfigured

      return (
        <ApplyPreferredScheduleAddButton
          disabled={atPreferredScheduleMax || scheduleInputDisabled}
          onClick={() => {
            setPreferredBlocks(prev => {
              if (prev.length >= preferredScheduleMaxBlocks) return prev
              return [...prev, createEmptyPreferredBlock()]
            })
          }}
        />
      )
    },
    [
      showGeneralPreferredSchedule,
      showTrainedTeachersApply,
      showPreferredScheduleInput,
      preferredBlocks.length,
      preferredScheduleMaxBlocks,
      trainedTeachersScheduleNotConfigured,
      showTrainedTeachersPreferredSchedule,
    ]
  )

  const formLoading =
    remoteApplyEnabled &&
    (applicationFormQuery.status === 'loading' || applicationFormQuery.status === 'idle')

  /** remote 모드에서는 CMS form-bindings 응답만 쓴다. 시드 폴백 금지. */
  const displayDraft = draft

  useEffect(() => {
    const paragraphId = resolveApplicationErrorParagraphId(submitErrorField, displayDraft)
    if (!paragraphId || !formRef.current) return

    const target = Array.from(
      formRef.current.querySelectorAll<HTMLElement>('[data-paragraph-id]')
    ).find(element => element.dataset.paragraphId === paragraphId)
    if (!target) return

    target.dataset.applicationError = 'true'
    const fieldTarget = target.querySelector<HTMLElement>('[data-field]')
    const scrollTarget = fieldTarget ?? target
    scrollTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const focusable = scrollTarget.querySelector<HTMLElement>(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    focusable?.focus({ preventScroll: true })

    return () => {
      delete target.dataset.applicationError
    }
  }, [displayDraft, submitErrorField])

  const hiddenParagraphIds = useMemo(() => {
    const hidden = new Set(
      resolvePortalApplicationHiddenParagraphIds({
        applyCase,
        program: program ?? null,
        runtimeContext: applicationFormDocument?.runtimeContext,
        paragraphs: displayDraft?.paragraphs ?? [],
        showSexOffenseConsentInquiryParagraph: shouldShowSexOffenseInquiry(sexOffense),
        volunteerInterviewEnabled:
          isVolunteerApplyFormCase(applyCase)
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
        instructorAvailableScheduleEnabled:
          applyCase === 'instructor'
            ? resolveInstructorPortalAvailableScheduleEnabledForHidden({
                formBinding: remoteForm,
              })
            : undefined,
      })
    )
    if (isTrainedTeachersFixedScheduleOptions && !trainedTeachersScheduleRuntimeHidden) {
      hidden.delete(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)
    }
    if (usesOsaAvailableSchedule) {
      if (applyCase === 'instructor' && instructorScheduleSlots.length === 0) {
        hidden.add(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule)
      }
      if (applyCase === 'individual-volunteer' && volunteerActivitySlots.length === 0) {
        hidden.add(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule)
      }
    }
    if (displayDraft && isUjatInstitutionApplyFormCase(applyCase)) {
      for (const paragraph of displayDraft.paragraphs) {
        if (isApplicationSexOffenseInquiryParagraphId(paragraph.id)) {
          hidden.add(paragraph.id)
        }
      }
    }
    if (displayDraft) {
      const ujatHiddenParagraphIds = resolveUjatVolunteerHiddenParagraphIds(
        ujatVolunteerBasicInfo.applicationType,
      )
      for (const paragraph of displayDraft.paragraphs) {
        if (ujatHiddenParagraphIds.has(paragraph.id)) hidden.add(paragraph.id)
      }
    }
    if (
      displayDraft &&
      (runtimeHiddenAnswerKeys.size > 0 || runtimeConditionalQuestions.length > 0)
    ) {
      const conditionallyHidden = collectConditionallyHiddenAnswerKeys(
        runtimeConditionalQuestions,
        buildApplicationAnswersFromDraft(displayDraft)
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
    applicationScheduleVisibility,
    applicationFormDocument,
    displayDraft,
    instructorScheduleSlots.length,
    program,
    remoteForm,
    runtimeConditionalQuestions,
    runtimeHiddenAnswerKeys,
    sexOffense,
    isTrainedTeachersFixedScheduleOptions,
    trainedTeachersScheduleRuntimeHidden,
    ujatVolunteerBasicInfo.applicationType,
    usesOsaAvailableSchedule,
    volunteerActivitySlots.length,
  ])

  const evidenceFilesForSubmit = volunteerEvidenceFiles.filter(
    file =>
      !displayDraft?.paragraphs.some(
        paragraph =>
          hiddenParagraphIds.has(paragraph.id) &&
          (paragraph.id === file.questionKey ||
            resolveApplicationAnswerKey(paragraph) === file.questionKey)
      )
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

  const dismissSubmitAlert = () => {
    const incomplete = pendingApplyIncompleteRef.current
    pendingApplyIncompleteRef.current = null
    setSubmitAlert(null)
    if (incomplete) {
      focusIncompleteApplicationField(formRef.current, incomplete)
    }
  }

  const handleSubmit = async () => {
    pendingApplyIncompleteRef.current = null
    setSubmitAlert(null)
    setSubmitErrorField(null)
    if (displayDraft == null) {
      const gateKind = readGateModalForOptions(
        applicationFormQuery.bundle?.option.canApply,
        applicationFormQuery.blockedReason,
      )
      if (gateKind) {
        setGateModal(gateKind)
        return
      }
      setSubmitAlert({
        description:
          blockedMessage ?? '신청 양식을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
      })
      return
    }
    if (blockedMessage && !canSubmitRemote) {
      const gateKind = readGateModalForOptions(
        applicationFormQuery.bundle?.option.canApply,
        applicationFormQuery.blockedReason,
      )
      if (gateKind) {
        setGateModal(gateKind)
        return
      }
      setSubmitAlert({ description: blockedMessage })
      return
    }
    // 「제공받는 곳」은 CMS 양식 작성 칸이다. 포털 신청 화면에 입력 UI가 없어 필수로 보지 않는다.
    if (showTrainedTeachersApply) {
      const missingConsentId = findMissingRequiredBottomConsentId(displayDraft)
      if (missingConsentId) {
        setSubmitErrorField(missingConsentId)
        setSubmitAlert({ description: '필수 동의 항목을 확인해 주세요.' })
        return
      }
    }
    const bundle = applicationFormQuery.bundle
    if (
      canSubmitRemote &&
      bundle?.option.recruitmentId != null &&
      bundle.option.formBindingId != null &&
      bundle.option.applicationType
    ) {
      const trainedTeachersScheduleParagraphForSubmit = findDraftParagraph(
        displayDraft,
        id => id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
      )
      const trainedTeachersScheduleAnswerKey = trainedTeachersScheduleParagraphForSubmit
        ? resolveApplicationAnswerKey(trainedTeachersScheduleParagraphForSubmit)
        : ''
      const trainedTeachersScheduleRuntimeHidden =
        trainedTeachersScheduleParagraphForSubmit != null &&
        (runtimeHiddenAnswerKeys.has(trainedTeachersScheduleParagraphForSubmit.id) ||
          (trainedTeachersScheduleAnswerKey.length > 0 &&
            runtimeHiddenAnswerKeys.has(trainedTeachersScheduleAnswerKey)))
      const isTrainedTeachersFixedScheduleTarget =
        applyCase === 'trained-teachers' &&
        program?.programType?.trim().toUpperCase() === 'TRAINED_TEACHER' &&
        bundle.option.applicationType.trim().toUpperCase() === 'ORGANIZATION' &&
        applicationScheduleVisibility.educationScheduleMode === 'date' &&
        trainedTeachersScheduleInputMode === 'fixed_schedule_options' &&
        !(
          applicationScheduleVisibility.educationStructure === 'schedule' &&
          applicationScheduleVisibility.sessionRound === 'multi'
        )

      if (
        isTrainedTeachersFixedScheduleTarget &&
        trainedTeachersScheduleParagraphForSubmit == null
      ) {
        setSubmitAlert({
          description: '신청 일정 문항을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
        return
      }
      if (
        isTrainedTeachersFixedScheduleTarget &&
        trainedTeachersRuntimeFixedScheduleChoices == null
      ) {
        setSubmitAlert({
          description: '신청 가능한 교육 일정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
        return
      }
      const allowedTrainedTeachersFixedIds = new Set(
        trainedTeachersFixedScheduleChoiceItems.map(choice => choice.id)
      )
      const trainedTeachersFixedScheduleAnswer =
        isTrainedTeachersFixedScheduleTarget &&
        !trainedTeachersScheduleRuntimeHidden &&
        trainedTeachersScheduleAnswerKey
          ? capFixedScheduleSelectedIds(
              trainedTeachersFixedSelectedIds.filter(id => allowedTrainedTeachersFixedIds.has(id)),
              applicationRecruitmentLimits.maxScheduleCount
            )
          : null
      if (
        isTrainedTeachersFixedScheduleTarget &&
        !trainedTeachersScheduleRuntimeHidden &&
        trainedTeachersFixedScheduleChoiceItems.length === 0
      ) {
        setSubmitAlert({
          description: '선택 가능한 교육 일정이 없습니다.',
        })
        return
      }
      if (
        isTrainedTeachersFixedScheduleTarget &&
        !trainedTeachersScheduleRuntimeHidden &&
        (trainedTeachersFixedScheduleAnswer == null ||
          trainedTeachersFixedScheduleAnswer.length === 0)
      ) {
        setSubmitAlert({ description: '신청 가능한 교육 일정을 선택해 주세요.' })
        return
      }
      const applyScheduleChoiceParagraph = pickApplyScheduleChoiceParagraph(
        displayDraft.paragraphs,
        Array.isArray(applicationFormDocument?.paragraphs)
          ? applicationFormDocument.paragraphs
          : undefined,
      )
      const applyScheduleChoiceHidden = isApplyScheduleChoiceHiddenInSet(
        hiddenParagraphIds,
        applyScheduleChoiceParagraph,
      )
      const applyScheduleChoiceIdsRaw = readApplyFixedScheduleChoiceIds({
        runtime: applicationFormDocument?.runtimeContext,
        paragraph: applyScheduleChoiceParagraph ?? institutionScheduleParagraph,
        runtimeChoices: readRuntimeFixedScheduleChoiceItems(
          applicationFormDocument?.runtimeContext,
          applyScheduleChoiceParagraph ?? institutionScheduleParagraph,
        ),
        program: applicationScheduleVisibility,
        educationScheduleLines: educationScheduleLinesForApply,
      })
      const applyScheduleChoiceIds =
        applyCase === 'institution-general'
          ? normalizeInstitutionFixedScheduleAnswerTokens(
              applyScheduleChoiceIdsRaw,
              applicationFormDocument?.runtimeContext,
              applyScheduleChoiceParagraph ?? institutionScheduleParagraph,
            )
          : applyScheduleChoiceIdsRaw
      const hiddenScheduleAutoSubmitIds = resolveHiddenScheduleAutoSubmitIds({
        hidden: applyScheduleChoiceHidden,
        forcedHidden: isApplyScheduleParagraphForcedHidden(applicationScheduleVisibility),
        choiceIds: applyScheduleChoiceIds,
      })
      const applyScheduleChoiceAnswerKey = resolveApplyScheduleChoiceAnswerKey(
        applyCase,
        applyScheduleChoiceParagraph,
      )
      const trainedScheduleHidden =
        trainedTeachersScheduleParagraphForSubmit != null &&
        hiddenParagraphIds.has(trainedTeachersScheduleParagraphForSubmit.id)
      const trainedHiddenScheduleAutoSubmitIds = resolveHiddenScheduleAutoSubmitIds({
        hidden: trainedScheduleHidden,
        forcedHidden: isApplyScheduleParagraphForcedHidden(applicationScheduleVisibility),
        choiceIds: readApplyFixedScheduleChoiceIds({
          runtime: applicationFormDocument?.runtimeContext,
          paragraph: trainedTeachersScheduleParagraphForSubmit,
          runtimeChoices: trainedTeachersRuntimeFixedScheduleChoices,
        }),
      })
      const skipPreferredScheduleInput =
        applyScheduleChoiceHidden || Boolean(hiddenScheduleAutoSubmitIds)

      const preferredScheduleBlocks = isUjatInstitutionApplyFormCase(applyCase)
        ? toPortalPreferredScheduleBlocks(
            ujatPreferredScheduleOptions
              .filter(option => ujatPreferredScheduleIds.includes(option.id))
              .map(option => ({
                date: option.date,
                classPeriod: '',
                startTime: '',
                endTime: '',
              })),
            { dateFieldsOnly: true }
          )
        : showPreferredScheduleInput &&
            !isTrainedTeachersFixedScheduleTarget &&
            !skipPreferredScheduleInput
          ? toPortalPreferredScheduleBlocks(preferredBlocks, preferredScheduleMapOptions)
          : undefined
      if (showPreferredScheduleInput && !skipPreferredScheduleInput) {
        if (trainedTeachersScheduleNotConfigured) {
          setSubmitErrorField(trainedTeachersScheduleParagraph?.id ?? null)
          setSubmitAlert({
            description: '신청 가능한 교육 일정이 설정되지 않았습니다. 관리자에게 확인해 주세요.',
          })
          return
        }
        if (preferredBlocks.length > preferredScheduleMaxBlocks) {
          setSubmitAlert({
            description: '모집 가능한 희망 일정 수를 초과했습니다. 초과한 일정을 삭제해 주세요.',
          })
          return
        }
        if (!isTrainedTeachersFixedScheduleTarget) {
          if (
            useTrainedTeachersOperatingPeriod &&
            hasPreferredScheduleDateOutsideRuntime(
              preferredBlocks,
              applicationFormRuntimeContext,
              trainedTeachersScheduleParagraph
            )
          ) {
            setSubmitErrorField(trainedTeachersScheduleParagraph?.id ?? null)
            setSubmitAlert({
              description: '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
            })
            return
          }
          const preferredError = findIncompletePreferredScheduleMessage(
            preferredBlocks,
            preferredScheduleMapOptions
          )
          if (preferredError) {
            if (useTrainedTeachersOperatingPeriod) {
              setSubmitErrorField(trainedTeachersScheduleParagraph?.id ?? null)
            }
            setSubmitAlert({ description: preferredError })
            return
          }
        }
      }
      const preferredAnswer = isTrainedTeachersFixedScheduleTarget
        ? trainedTeachersFixedScheduleAnswer
        : showPreferredScheduleInput && !skipPreferredScheduleInput
          ? toPreferredScheduleAnswerValue(preferredBlocks, preferredScheduleMapOptions)
          : null
      const applyScheduleChoiceParagraphId =
        applyScheduleChoiceParagraph &&
        typeof applyScheduleChoiceParagraph === 'object' &&
        'id' in applyScheduleChoiceParagraph
          ? String((applyScheduleChoiceParagraph as { id?: unknown }).id ?? '').trim()
          : ''
      const preferredScheduleParagraphId =
        trainedTeachersScheduleParagraph?.id ??
        (applyScheduleChoiceParagraphId ||
          institutionScheduleParagraph?.id ||
          'preferredScheduleBlocks')
      const preferredScheduleVisible =
        showPreferredScheduleInput &&
        !skipPreferredScheduleInput &&
        !isTrainedTeachersFixedScheduleTarget &&
        (preferredScheduleParagraphId === 'preferredScheduleBlocks' ||
          !hiddenParagraphIds.has(preferredScheduleParagraphId))
      if (preferredScheduleVisible && !preferredAnswer) {
        setSubmitErrorField(preferredScheduleParagraphId)
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
            !hiddenParagraphIds.has(paragraph.id)
        )
        if (
          scheduleParagraph &&
          isRequiredParagraph(scheduleParagraph) &&
          scheduleParagraph.kind === 'single_item' &&
          scheduleParagraph.variant === 'multiple_choice'
        ) {
          const selectableCount = Math.max(
            scheduleParagraph.items.length,
            institutionRuntimeFixedScheduleChoices?.length ?? 0
          )
          const selected = normalizeInstitutionFixedScheduleAnswerTokens(
            scheduleParagraph.selectedPreviewMultipleIds ?? [],
            applicationFormDocument?.runtimeContext,
            institutionScheduleParagraph
          )
          if (selectableCount > 0 && selected.length === 0) {
            setSubmitErrorField(scheduleParagraph.id)
            setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
            return
          }
        }
      }
      const basicParagraph = findDraftParagraph(displayDraft, isApplicationBasicInfoParagraphId)
      const existingBasicAnswer = basicParagraph
        ? draftAnswerForParagraph(remoteForm?.draftAnswers, basicParagraph)
        : undefined
      const basicInfoForSubmit = fillTrainedTeachersBasicInfoFromProfile(
        basicInfo,
        profileDefaults,
      )
      const basicAnswer = basicParagraph
        ? basicInfoAnswerFromValues(basicInfoForSubmit, {
            includePreferredEducationFields: showPreferredEducationForm,
            existingAnswer: existingBasicAnswer,
          })
        : null
      if (basicParagraph) {
        const basicIncomplete = resolveGeneralBasicInfoApplyIncomplete(
          basicInfoForSubmit,
          basicParagraph.id,
        )
        if (basicIncomplete) {
          pendingApplyIncompleteRef.current = basicIncomplete
          setSubmitErrorField(basicIncomplete.paragraphId)
          setSubmitAlert({ description: basicIncomplete.message })
          return
        }
        const requestedClassCount = Number.parseInt(basicInfoForSubmit.classCount, 10)
        const maxClassCount = applicationRecruitmentLimits.maxClassCount
        if (
          Number.isFinite(requestedClassCount) &&
          maxClassCount != null &&
          requestedClassCount > maxClassCount
        ) {
          setSubmitAlert({
            description: '신청 가능 최대 학급 수를 초과했습니다. 학급 수를 조정해 주세요.',
          })
          return
        }
        if (!basicAnswer) {
          setSubmitErrorField(basicParagraph.id)
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const geminiTrainingInfoParagraph = findDraftParagraph(
        displayDraft,
        isGeminiInstitutionTrainingInfoParagraphId,
      )
      const geminiTrainingInfoVisible =
        geminiTrainingInfoParagraph != null &&
        !hiddenParagraphIds.has(geminiTrainingInfoParagraph.id)
      if (geminiTrainingInfoVisible && isRequiredParagraph(geminiTrainingInfoParagraph)) {
        const trainingInfoError = findIncompleteGeminiInstitutionTrainingInfoMessage(
          geminiTrainingInfo,
        )
        if (trainingInfoError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const geminiContactParagraph = findDraftParagraph(
        displayDraft,
        isGeminiInstitutionContactPersonParagraphId,
      )
      const geminiContactVisible =
        geminiContactParagraph != null && !hiddenParagraphIds.has(geminiContactParagraph.id)
      if (geminiContactVisible && isRequiredParagraph(geminiContactParagraph)) {
        const contactError = findIncompleteGeminiInstitutionContactMessage(geminiContact)
        if (contactError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const teamParagraph = findDraftParagraph(displayDraft, isApplicationTeamInfoParagraphId)
      const showTeamInfo = applyCase != null && shouldShowIndividualTeamInfoParagraph(applyCase)
      const teamInfoVisible =
        showTeamInfo && teamParagraph != null && !hiddenParagraphIds.has(teamParagraph.id)
      if (teamInfoVisible) {
        const teamError = findIncompleteIndividualTeamInfoMessage(teamInfo)
        if (teamError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const sexOffenseParagraph = findDraftParagraph(
        displayDraft,
        isApplicationSexOffenseSubmissionParagraphId
      )
      if (sexOffenseParagraph) {
        const sexOffenseError = isUjatInstitutionApplyFormCase(applyCase)
          ? findIncompleteUjatSexOffenseWriteMessage({
              ...sexOffense,
              submissionRequest: sexOffense.submissionRequest || 'request',
            })
          : findIncompleteSexOffenseMessage(sexOffense)
        if (sexOffenseError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const crimeParagraphCandidate = findDraftParagraph(
        displayDraft,
        isInstructorCrimeRecordParagraphId
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
        isInstructorAvailableScheduleParagraphId
      )
      const instructorScheduleParagraph =
        scheduleParagraphCandidate && !hiddenParagraphIds.has(scheduleParagraphCandidate.id)
          ? scheduleParagraphCandidate
          : null
      if (
        instructorScheduleParagraph &&
        !(usesOsaAvailableSchedule && instructorScheduleSlots.length === 0)
      ) {
        const scheduleError = findIncompleteInstructorAvailableScheduleMessage(
          instructorSchedule,
          instructorScheduleSlots
        )
        if (scheduleError) {
          setSubmitAlert({ description: scheduleError })
          return
        }
      }
      const interviewSubmitVisible =
        interviewBindingParagraph != null && !hiddenParagraphIds.has(interviewBindingParagraph.id)
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
          interviewSlots
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
        isVolunteerPreviousJaProgramParagraphId
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
      const volunteerFreeTextParagraph = visibleDraftParagraph(
        isAnyVolunteerFreeTextItemsParagraphId
      )
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
      if (
        volunteerActivityParagraph &&
        isRequiredParagraph(volunteerActivityParagraph) &&
        !(usesOsaAvailableSchedule && volunteerActivitySlots.length === 0)
      ) {
        const activityError = findIncompleteVolunteerActivityScheduleMessage(
          volunteerActivitySchedule,
          volunteerActivitySlots
        )
        if (activityError) {
          setSubmitAlert({ description: activityError })
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
        isUjatVolunteerPreviousTermParagraphId
      )
      if (ujatPreviousTermParagraph && isRequiredParagraph(ujatPreviousTermParagraph)) {
        const previousTermError =
          findIncompleteUjatVolunteerPreviousTermMessage(ujatVolunteerPreviousTerm)
        if (previousTermError) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }
      const ujatInstitutionBasicParagraph = visibleDraftParagraph(
        isUjatInstitutionBasicInfoParagraphId
      )
      const ujatGradeParagraph = visibleDraftParagraph(isUjatInstitutionGradeInfoParagraphId)
      const ujatClassTimeParagraph = visibleDraftParagraph(isUjatInstitutionClassTimeParagraphId)
      const ujatPreferredParagraph = visibleDraftParagraph(
        isUjatInstitutionPreferredScheduleParagraphId
      )
      if (
        (ujatInstitutionBasicParagraph && isRequiredParagraph(ujatInstitutionBasicParagraph)) ||
        (ujatGradeParagraph && isRequiredParagraph(ujatGradeParagraph)) ||
        (ujatClassTimeParagraph && isRequiredParagraph(ujatClassTimeParagraph)) ||
        (ujatPreferredParagraph && isRequiredParagraph(ujatPreferredParagraph))
      ) {
        const incomplete = resolveUjatInstitutionApplyIncomplete({
          basicInfo: ujatInstitutionBasicInfo,
          gradeBlocks: ujatInstitutionGradeBlocks,
          classTimeBlocks: ujatInstitutionClassTimeBlocks,
          preferredIds: ujatPreferredScheduleIds,
          preferredOptions: ujatPreferredScheduleOptions,
        })
        if (incomplete) {
          pendingApplyIncompleteRef.current = incomplete
          setSubmitAlert({ description: incomplete.message })
          return
        }
      }
      const ujatConfirmParagraph = visibleDraftParagraph(isUjatSubmitConfirmationParagraphId)
      if (ujatConfirmParagraph && isRequiredParagraph(ujatConfirmParagraph)) {
        if (!isUjatSubmitConfirmationChecked(ujatConfirmParagraph)) {
          setSubmitAlert({ description: PROGRAM_APPLY_REQUIRED_INCOMPLETE_ALERT_MESSAGE })
          return
        }
      }

      if (
        applyCase === 'institution-general' &&
        institutionScheduleInputMode === 'fixed_schedule_options' &&
        !applyScheduleChoiceHidden &&
        institutionRuntimeFixedScheduleChoices == null
      ) {
        setSubmitAlert({
          description: '신청 가능한 교육 일정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        })
        return
      }
      const overrides: Record<string, unknown> = {}
      if (preferredAnswer != null && hiddenScheduleAutoSubmitIds == null) {
        const scheduleParagraph = displayDraft.paragraphs.find(
          paragraph =>
            isApplicationPreferredScheduleParagraphId(paragraph.id) ||
            isApplyScheduleChoiceParagraphId(paragraph.id)
        )
        const scheduleKey = scheduleParagraph ? resolveApplicationAnswerKey(scheduleParagraph) : ''
        if (scheduleKey) overrides[scheduleKey] = preferredAnswer
      }
      if (
        applyCase === 'institution-general' &&
        !showGeneralPreferredSchedule &&
        institutionScheduleParagraph &&
        institutionScheduleInputMode === 'fixed_schedule_options' &&
        hiddenScheduleAutoSubmitIds == null
      ) {
        const scheduleParagraph = displayDraft.paragraphs.find(
          paragraph =>
            isInstitutionApplyScheduleChoiceParagraphId(paragraph.id) &&
            !hiddenParagraphIds.has(paragraph.id)
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
            institutionScheduleParagraph
          )
          if (normalized.length > 0) {
            overrides[scheduleKey] = normalized
          }
        }
      }
      if (basicAnswer != null && basicParagraph) {
        overrides[resolveApplicationAnswerKey(basicParagraph)] = basicAnswer
      }
      if (geminiTrainingInfoVisible && geminiTrainingInfoParagraph) {
        const trainingInfoAnswer = geminiInstitutionTrainingInfoAnswerFromValues(geminiTrainingInfo)
        if (trainingInfoAnswer) {
          overrides[resolveApplicationAnswerKey(geminiTrainingInfoParagraph)] = trainingInfoAnswer
        }
      }
      if (geminiContactVisible && geminiContactParagraph) {
        const contactAnswer = geminiInstitutionContactAnswerFromValues(geminiContact)
        if (contactAnswer) {
          overrides[resolveApplicationAnswerKey(geminiContactParagraph)] = contactAnswer
        }
      }
      if (hiddenScheduleAutoSubmitIds && applyScheduleChoiceAnswerKey) {
        overrides[applyScheduleChoiceAnswerKey] = hiddenScheduleAutoSubmitIds
      }
      if (trainedTeachersFixedScheduleAnswer && trainedTeachersScheduleAnswerKey) {
        overrides[trainedTeachersScheduleAnswerKey] = trainedTeachersFixedScheduleAnswer
      } else if (trainedHiddenScheduleAutoSubmitIds && trainedTeachersScheduleAnswerKey) {
        overrides[trainedTeachersScheduleAnswerKey] = trainedHiddenScheduleAutoSubmitIds
      }
      if (teamInfoVisible) {
        overrides[resolveApplicationAnswerKey(teamParagraph)] = teamInfoAnswerFromValues(teamInfo)
      }
      const guidanceParagraph = findDraftParagraph(displayDraft, isApplicationGuidanceParagraphId)
      if (
        guidanceParagraph &&
        !hiddenParagraphIds.has(guidanceParagraph.id) &&
        !runtimeHiddenAnswerKeys.has(guidanceParagraph.id) &&
        !runtimeHiddenAnswerKeys.has(resolveApplicationAnswerKey(guidanceParagraph))
      ) {
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
      if (instructorScheduleParagraph && instructorScheduleSlots.length > 0) {
        overrides[resolveApplicationAnswerKey(instructorScheduleParagraph)] =
          instructorAvailableScheduleOptionValues(instructorSchedule, instructorScheduleSlots)
      }
      if (interviewSubmitVisible && interviewBindingParagraph) {
        const interviewAnswerKey = resolveApplicationAnswerKey(
          (interviewDraftParagraph ?? interviewBindingParagraph) as object
        )
        overrides[interviewAnswerKey] = instructorAvailableScheduleOptionValues(
          interviewSchedule,
          interviewSlots
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
      if (volunteerActivityParagraph && volunteerActivitySlots.length > 0) {
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
      if (ujatInstitutionBasicParagraph) {
        overrides[resolveApplicationAnswerKey(ujatInstitutionBasicParagraph)] =
          ujatInstitutionBasicInfoAnswerFromValues(ujatInstitutionBasicInfo)
      }
      if (ujatGradeParagraph) {
        overrides[resolveApplicationAnswerKey(ujatGradeParagraph)] =
          ujatInstitutionGradeAnswerFromValues(ujatInstitutionGradeBlocks)
      }
      if (ujatClassTimeParagraph) {
        overrides[resolveApplicationAnswerKey(ujatClassTimeParagraph)] =
          ujatInstitutionClassTimeAnswerFromValues(
            ujatInstitutionClassTimeBlocks,
            ujatInstitutionGradeBlocks
          )
      }
      if (ujatPreferredParagraph) {
        overrides[resolveApplicationAnswerKey(ujatPreferredParagraph)] =
          ujatInstitutionPreferredScheduleAnswerFromValues(
            ujatPreferredScheduleIds,
            ujatPreferredScheduleOptions
          )
      }
      const inquiryParagraph = findDraftParagraph(
        displayDraft,
        isApplicationSexOffenseInquiryParagraphId
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
        if (
          runtimeHiddenAnswerKeys.has(paragraph.id) ||
          (key && runtimeHiddenAnswerKeys.has(key))
        ) {
          omitParagraphIds.add(paragraph.id)
          if (key) omitParagraphIds.add(key)
        }
      }
      for (const paragraph of displayDraft.paragraphs) {
        if (
          isApplyScheduleChoiceParagraphId(paragraph.id) &&
          hiddenParagraphIds.has(paragraph.id) &&
          hiddenScheduleAutoSubmitIds == null
        ) {
          omitParagraphIds.add(paragraph.id)
          omitParagraphIds.add(resolveApplicationAnswerKey(paragraph))
        }
        if (
          paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule &&
          hiddenParagraphIds.has(paragraph.id) &&
          trainedHiddenScheduleAutoSubmitIds == null &&
          !(
            trainedTeachersFixedScheduleAnswer &&
            trainedTeachersFixedScheduleAnswer.length > 0
          )
        ) {
          omitParagraphIds.add(paragraph.id)
          omitParagraphIds.add(resolveApplicationAnswerKey(paragraph))
        }
        if (
          hiddenParagraphIds.has(paragraph.id) &&
          isApplicationGuidanceParagraphId(paragraph.id)
        ) {
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
        if (
          hiddenParagraphIds.has(paragraph.id) &&
          (isInstructorAvailableScheduleParagraphId(paragraph.id) ||
            isVolunteerActivityScheduleParagraphId(paragraph.id) ||
            isVolunteerInterviewScheduleParagraphId(paragraph.id))
        ) {
          omitParagraphIds.add(paragraph.id)
          omitParagraphIds.add(resolveApplicationAnswerKey(paragraph))
        }
      }

      const answers = omitSexOffenseInquiryAnswersIfNotRequested(
        omitRuntimeHiddenAnswers(
          buildApplicationAnswersFromDraft(displayDraft, {
            overrides: Object.keys(overrides).length > 0 ? overrides : undefined,
            omitParagraphIds: omitParagraphIds.size > 0 ? omitParagraphIds : undefined,
          }),
          runtimeHiddenAnswerKeys,
          runtimeConditionalQuestions
        )
      )

      const classCount = isUjatInstitutionApplyFormCase(applyCase)
        ? ujatInstitutionGradeBlocks.reduce(
            (sum, block) => sum + (Number.parseInt(block.classCountInput, 10) || 0),
            0
          )
        : Number.parseInt(basicInfo.classCount, 10)
      const studentCount = isUjatInstitutionApplyFormCase(applyCase)
        ? ujatInstitutionGradeBlocks.reduce((sum, block) => {
            return (
              sum +
              Object.values(block.studentCountByIndex).reduce(
                (inner, raw) => inner + (Number.parseInt(raw, 10) || 0),
                0
              )
            )
          }, 0)
        : Number.parseInt(basicInfo.studentCount, 10)

      const submitBody = {
        recruitmentId: bundle.option.recruitmentId,
        applicationType: bundle.option.applicationType,
        formBindingId: bundle.option.formBindingId,
        answers,
        preferredScheduleBlocks,
      }
      const submitDebug = summarizePortalApplicationSubmit({
        programId: numericProgramId,
        templateVersionId: remoteForm?.templateVersionId ?? null,
        body: submitBody,
      })
      console.info('[portal-application-submit]', submitDebug)

      try {
        await submitMutation.mutateAsync({
          ...submitBody,
          ...(Number.isFinite(classCount) && classCount > 0
            ? { requestedClassCount: classCount }
            : {}),
          ...(Number.isFinite(studentCount) && studentCount > 0
            ? { requestedStudentCount: studentCount }
            : {}),
          ...(() => {
            const questionKeys = [volunteerPreviousJaParagraph, ujatPreviousTermParagraph].flatMap(
              paragraph => (paragraph ? [paragraph.id, resolveApplicationAnswerKey(paragraph)] : [])
            )
            const fileObjectIdsByQuestion = evidenceFileObjectIdsByQuestion(
              evidenceFilesForSubmit,
              questionKeys
            )
            return fileObjectIdsByQuestion ? { fileObjectIdsByQuestion } : {}
          })(),
        })
        submittedSuccessfullyProgramIdRef.current = programId
        setSubmitErrorField(null)
        setGateModal(null)
        setCompleteModalOpen(true)
      } catch (error) {
        const message = getProgramApplicationApiErrorMessage(error)
        const promptSettingsGrade = isIndividualApplicationEnrolledGradeRequiredError(error)
        const errorCode = getApplicationApiErrorCode(error)
        const validationFailed = errorCode === 'VALIDATION_FAILED'
        const invalidValue = errorCode === 'INVALID_VALUE'
        const errorEnvelope = readApplicationApiErrorEnvelope(error)
        setSubmitErrorField(typeof errorEnvelope.field === 'string' ? errorEnvelope.field : null)
        console.info('[portal-application-submit-error]', {
          ...submitDebug,
          error: errorEnvelope,
        })
        if (getQueryRetryHttpStatus(error) !== 400) {
          const gateKind = readGateModalForOptions(undefined, errorCode)
          if (gateKind) {
            setGateModal(gateKind)
            return
          }
          setSubmitAlert({
            description: message,
            promptSettingsGrade,
          })
          return
        }
        // 런타임 선택지(면접·OSA 일정 등)가 렌더 이후 바뀌면 400. 최신 선택지로 다시 불러온다.
        // INVALID_VALUE 는 문항을 단정하지 않고 POST 를 반복하지 않는다.
        if (!promptSettingsGrade && !validationFailed && !invalidValue) {
          const option = applicationFormQuery.bundle?.option
          if (
            numericProgramId != null &&
            option?.formBindingId != null &&
            option.recruitmentId != null
          ) {
            void queryClient.invalidateQueries({
              queryKey: platformQueryKeys.program.applicationForm({
                programId: String(numericProgramId),
                bindingId: option.formBindingId,
                recruitmentId: option.recruitmentId,
                applicationType: String(option.applicationType ?? ''),
              }),
            })
          }
          applicationFormQuery.refetch()
        }
        setSubmitAlert({
          description: message,
          promptSettingsGrade,
        })
      }
      return
    }
    if (remoteApplyEnabled) {
      const gateKind = readGateModalForOptions(
        applicationFormQuery.bundle?.option.canApply,
        applicationFormQuery.blockedReason,
      )
      if (gateKind) {
        setGateModal(gateKind)
        return
      }
      setSubmitAlert({
        description:
          blockedMessage ?? '신청을 제출할 수 없습니다. 모집 기간과 회원 자격을 확인해 주세요.',
      })
      return
    }
    setCompleteModalOpen(true)
  }

  const visibleInstructorCrimeParagraph = displayDraft
    ? findDraftParagraph(
        displayDraft,
        id => isInstructorCrimeRecordParagraphId(id) && !hiddenParagraphIds.has(id)
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

        <div ref={formRef} className={styles.form}>
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
                renderParagraphTitleTrailing={renderParagraphTitleTrailing}
              />
            </FormTemplateHost>
          ) : null}

          <div className={styles.actions}>
            <PFButton
              size="xlarge"
              width={240}
              type="button"
              disabled={
                submitMutation.isPending ||
                !displayDraft ||
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
        onConfirm={dismissSubmitAlert}
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
