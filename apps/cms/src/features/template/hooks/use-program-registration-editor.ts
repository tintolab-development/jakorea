import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import {
  applyGeneralParticipantAudienceSelection,
  shouldResetParticipationScheduleDetailForAudience,
} from '@/features/program/general/lib/participant-audience-selection'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createProgramRegistrationDraft,
  getProgramRegistrationSeedParagraphIds,
  PROGRAM_REGISTRATION_IDS,
  type ProgramRegistrationFormVariant,
} from '@/features/template/model/program-registration-draft'
import {
  normalizeWritingFormDraft,
  type FormTitleNumberingStyle,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import { syncInstitutionApplicationPreferredEducationFormFromOverlay } from '@/features/program/general/lib/institution-application-program-bridge'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  resolveProgramRegistrationCurriculumRegistrationDescription,
  resolveProgramRegistrationScheduleCurriculumEditDescription,
} from '@/features/template/lib/program-registration-curriculum-description'
import { buildProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/registration-form/general/paragraph-config'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import {
  isProgramDateOutsideOpenPeriodError,
  publishProgramOperationDateFocus,
  resolveProgramDateOutsideOpenPeriodAlert,
} from '@/features/program/shared/lib/program-date-outside-open-period-alert'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  buildGeneralProgramListRowFromRegistrationSnapshot,
  registrationPendingSnapshotId,
  persistGeneralProgramRegistration,
} from '@/features/program/general/lib/registration-local-save'
import {
  peekGeneralRegistrationWizardRhf,
  subscribeGeneralRegistrationWizardRhf,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-rhf-api'
import { buildGeneralProgramCreateFromWizardRhf } from '@/features/program/general/lib/overlay-phase1/build-registration-create-from-rhf'
import {
  buildTrainedTeachersCanonicalFromRhf,
  buildTrainedTeachersProgramFromRhf,
  trainedTeachersWizardDraftSettingsJson,
} from '@/features/program/trained-teachers/lib/build-registration-create-from-canonical'
import {
  applyLegacyProgramTitleKoFallback,
  importLegacyOverlayToTrainedTeachersCanonical,
} from '@/features/program/trained-teachers/lib/import-legacy-registration-overlay'
import { TRAINED_TEACHERS_REGISTRATION_SETTINGS_KEY } from '@/features/program/trained-teachers/lib/registration-canonical-types'
import { peekTrainedTeachersRegistrationRhf } from '@/features/program/trained-teachers/lib/registration-rhf-api'
import {
  buildCompanySchoolCanonicalFromRhf,
  buildCompanySchoolProgramFromRhf,
  CompanySchoolOperationRangeRequiredError,
} from '@/features/program/1c-1s/lib/build-registration-create-from-canonical'
import { importLegacyOverlayToCompanySchoolCanonical } from '@/features/program/1c-1s/lib/import-legacy-registration-overlay'
import { COMPANY_SCHOOL_REGISTRATION_SETTINGS_KEY } from '@/features/program/1c-1s/lib/registration-canonical-types'
import { peekCompanySchoolRegistrationRhf } from '@/features/program/1c-1s/lib/registration-rhf-api'
import {
  describeIncompleteCompanySchoolRegistrationRhfRequiredFields,
  hasIncompleteCompanySchoolRegistrationRhfRequiredFields,
  listIncompleteCompanySchoolRegistrationRhfRequiredFields,
} from '@/features/program/1c-1s/lib/registration-rhf-required-fields'
import { serializeCompanySchoolRegistrationForFormVersion } from '@/features/program/1c-1s/lib/serialize-registration-overlay-from-canonical'
import { resolveRegistrationFormVersionOverlay } from '@/features/program/general/lib/resolve-registration-form-version-overlay'
import {
  createNewCompanySchoolRegistrationRhfValues,
  isCompanySchoolRegistrationCanonicalSnapshot,
  omitCompanySchoolCommonInfoOverlayKeys,
  rhfValuesFromCompanySchoolCanonical,
} from '@/features/program/1c-1s/lib/registration-rhf-values'
import {
  emptyCompanySchoolRecruitFormState,
  omitCompanySchoolRecruitmentOverlayKeys,
  serializeCompanySchoolRecruitmentForFormVersion,
} from '@/features/program/1c-1s/lib/registration-rhf-recruitment'
import { emptyCompanySchoolInstructorRecruitFormState } from '@/features/program/1c-1s/lib/registration-rhf-instructor-recruitment'
import {
  emptyCompanySchoolApplicationFormState,
  omitCompanySchoolApplicationOverlayKeys,
  serializeCompanySchoolApplicationForFormVersion,
  withEmptyCompanySchoolApplicationPreferredSchedule,
} from '@/features/program/1c-1s/lib/registration-rhf-application'
import { companySchoolRecruitEditorState } from '@/features/program/1c-1s/lib/recruit-form-state'
import { companySchoolApplicationEditorState } from '@/features/program/1c-1s/lib/application-form-state'
import { importLegacyTrainedTeachersApplicationOverlay } from '@/features/program/trained-teachers/lib/registration-rhf-application'
import {
  createDefaultTrainedTeachersRegistrationRhfValues,
  isTrainedTeachersRegistrationCanonicalSnapshot,
  omitTrainedTeachersCommonInfoOverlayKeys,
  rhfValuesFromTrainedTeachersCanonicalCommon,
} from '@/features/program/trained-teachers/lib/registration-rhf-values'
import {
  hasIncompleteRegistrationWizardRequiredFields,
  hasRegistrationWizardCurriculumScheduleCountMismatch,
  listIncompleteRegistrationWizardRequiredFields,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-required-fields'
import { hydrateRegistrationWizardUiValues } from '@/features/program/general/lib/overlay-phase1/registration-wizard-legacy-hydrate'
import { projectRegistrationWizardUiValuesToOverlay } from '@/features/program/general/lib/overlay-phase1/registration-wizard-overlay-path-map'
import { peekApplicantRecruitInstitutionOverlayRecord } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import { peekGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { peekGeneralApplicationOverlayRecord } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { flushRecruitDetailRichTextIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  createNewRegistrationWizardUiValues,
  REGISTRATION_WIZARD_RHF_SETTINGS_KEY,
  type RegistrationWizardUiValues,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-ui-values'
import {
  applyCurriculumCountTrim,
  applyEducationStructureReset,
  applyScheduleDetailCountTrim,
  applyScheduleGroupCountTrim,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-structure'
import {
  logProgramRegistrationCreatePayload,
  logRegistrationStepTransitionPayload,
} from '@/features/program/shared/lib/log-program-registration-create-payload'
import type { Program } from '@/types/domain'
import {
  applyProgramRegistrationEditorState,
  buildProgramRegistrationEditorState,
  type ProgramRegistrationEditorState,
} from '@/features/template/lib/program-registration-editor-state'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import { forceParagraphTitleRequired } from '@/features/template/lib/paragraph-required-mark'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
  isLocalStorageQuotaExceededError,
} from '@/features/template/lib/writing-form-template-local-save'
import { isWritingFormTemplateStructureLocked } from '@/features/template/lib/form-template-delete-policy'
import { useWritingFormMiddleParagraphActions } from '@/features/template/hooks/use-writing-form-middle-paragraph-actions'
import {
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  patchGeneralRegistrationSponsorSelectionOverlay,
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  readGeneralRegistrationOverlayScheduleLines,
  readGeneralRegistrationOverlaySponsorIds,
  readStoredRegistrationProgramTitleKo,
  patchRegistrationOverlayProgramTitleKo,
  readRegistrationOverlaySponsorContactId,
  readRegistrationOverlaySponsorId,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
  setProgramRegistrationOverlayScope,
  updateProgramRegistrationOverlayKey,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import { useCmsAlert } from '@/shared/ui'
import { beginBlockingOverlay } from '@/shared/ui/blocking-overlay-store'
import { normalizeRegistrationOverlayForApply } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  describeIncompleteGeneralProgramRegistrationRequiredFields,
  hasCurriculumMultiDateScheduleCountMismatch,
  listIncompleteGeneralProgramRegistrationRequiredFields,
} from '@/features/program/general/lib/registration-required-fields'
import {
  describeIncompleteTrainedTeachersProgramRegistrationRequiredFields,
  describeIncompleteTrainedTeachersRegistrationRhfRequiredFields,
  hasTrainedTeachersRegistrationRhfCurriculumScheduleCountMismatch,
  listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons,
  listIncompleteTrainedTeachersRegistrationRhfRequiredFieldReasons,
} from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import {
  describeIncompleteEconomyProgramRegistrationRequiredFields,
  listIncompleteEconomyProgramRegistrationRequiredFields,
} from '@/features/program/general/lib/economy-program-registration-required-fields'
import { applyDevProgramRegistrationAutofill } from '@/features/program/shared/lib/apply-dev-program-registration-autofill'
import type { GeneralRegistrationDevAutofillCaseId } from '@/features/program/general/lib/registration-dev-autofill-cases'
import type { TrainedTeachersRegistrationDevAutofillCaseId } from '@/features/program/trained-teachers/lib/registration-dev-autofill-cases'
import { syncInstitutionApplicationBridgeForRegistrationWizard } from '@/features/program/general/lib/registration-institution-bridge-sync'
import {
  normalizeOverlayPaymentItemsBeforeSubmit,
  PAYMENT_ITEM_RESELECT_ALERT,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

export type ProgramRegistrationParticipantSelection = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

function getDefaultProgramRegistrationParticipant(
  variant: ProgramRegistrationFormVariant
): ProgramRegistrationParticipantSelection {
  if (variant === 'economy') {
    return { individual: false, organization: true, teacherInstructor: true, volunteer: false }
  }
  if (variant === 'trainedTeachers') {
    return { individual: false, organization: true, teacherInstructor: false, volunteer: false }
  }
  return { individual: true, organization: false, teacherInstructor: false, volunteer: false }
}

function getDefaultEducationScheduleMode(
  variant: ProgramRegistrationFormVariant
): ProgramRegistrationEducationScheduleMode {
  return variant === 'economy' ? 'period' : 'date'
}

/** 이전 FE 기본값(상세 수정 안내와 동일) — 임시저장본·템플릿에 남아 있으면 등록 시안 문구로 바꾼다 */
const GENERAL_BASIC_INFO_LOCK_NOTICE =
  PROGRAM_REGISTRATION_GENERAL_SECTION_META.basicInfo.editDescription

const GENERAL_BASIC_INFO_REGISTRATION_DESCRIPTION =
  PROGRAM_REGISTRATION_GENERAL_SECTION_META.basicInfo.registrationDescription

/** 커리큘럼형 카드 설명 — 이전 기본값(마침표 없음) → 등록 시안 문구 */
const GENERAL_CURRICULUM_REGISTRATION_DESCRIPTION_BY_LEGACY: Readonly<Record<string, string>> = {
  [PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescription]:
    PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.registrationDescription,
  [PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescriptionMultiRound]:
    PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.registrationDescriptionMultiRound,
}

const GENERAL_EDUCATION_SCHEDULE_REGISTRATION_DESCRIPTION =
  PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.registrationDescription

const GENERAL_EDUCATION_SCHEDULE_DETAIL_EDIT_NOTICE =
  PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.editDescription

function withRegistrationBasicInfoDescriptionForVariant(
  draft: WritingFormDraft,
  variant: ProgramRegistrationFormVariant,
  registrationWizard: boolean
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.id !== PROGRAM_REGISTRATION_IDS.basicInfo) return paragraph
    const current = paragraph.paragraphDescription.trim()
    if (variant === 'general') {
      // 등록 위저드: 시안 문구(빈 값·이전 기본값 치환). 그 외(상세 수정 등): 기존 기본값 유지
      if (registrationWizard) {
        if (current !== '' && current !== GENERAL_BASIC_INFO_LOCK_NOTICE) return paragraph
        changed = true
        return { ...paragraph, paragraphDescription: GENERAL_BASIC_INFO_REGISTRATION_DESCRIPTION }
      }
      if (current !== '') return paragraph
      changed = true
      return { ...paragraph, paragraphDescription: GENERAL_BASIC_INFO_LOCK_NOTICE }
    }
    if (
      current !== GENERAL_BASIC_INFO_LOCK_NOTICE &&
      current !== GENERAL_BASIC_INFO_REGISTRATION_DESCRIPTION
    ) {
      return paragraph
    }
    changed = true
    return { ...paragraph, paragraphDescription: '' }
  })
  return changed ? { ...draft, paragraphs } : draft
}

function withRegistrationEducationScheduleSettingsDescriptionForVariant(
  draft: WritingFormDraft,
  variant: ProgramRegistrationFormVariant
): WritingFormDraft {
  if (variant !== 'general') return draft
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.id !== PROGRAM_REGISTRATION_IDS.educationScheduleSettings) return paragraph
    const current = paragraph.paragraphDescription.trim()
    if (current === GENERAL_EDUCATION_SCHEDULE_REGISTRATION_DESCRIPTION) return paragraph
    if (current === '' || current === GENERAL_EDUCATION_SCHEDULE_DETAIL_EDIT_NOTICE) {
      changed = true
      return {
        ...paragraph,
        paragraphDescription: GENERAL_EDUCATION_SCHEDULE_REGISTRATION_DESCRIPTION,
      }
    }
    return paragraph
  })
  return changed ? { ...draft, paragraphs } : draft
}

function withRegistrationCurriculumDescriptionForVariant(
  draft: WritingFormDraft,
  variant: ProgramRegistrationFormVariant,
  registrationWizard: boolean
): WritingFormDraft {
  if (variant !== 'general' || !registrationWizard) return draft
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.id !== PROGRAM_REGISTRATION_IDS.educationCurriculum) return paragraph
    const next = GENERAL_CURRICULUM_REGISTRATION_DESCRIPTION_BY_LEGACY[
      paragraph.paragraphDescription.trim()
    ]
    if (next == null) return paragraph
    changed = true
    return { ...paragraph, paragraphDescription: next }
  })
  return changed ? { ...draft, paragraphs } : draft
}

function filterProgramRegistrationDraftForVariant(
  draft: WritingFormDraft,
  variant: ProgramRegistrationFormVariant,
  /** 프로그램 등록 위저드(`registrationWizardProgramType`) — 일반 등록 시안 카드 설명 적용 */
  registrationWizard = false
): WritingFormDraft {
  const filtered =
    variant !== 'trainedTeachers'
      ? draft
      : {
          ...draft,
          paragraphs: draft.paragraphs.filter(
            paragraph => paragraph.id !== PROGRAM_REGISTRATION_IDS.businessKpi
          ),
        }
  const withBasicInfo = withRegistrationBasicInfoDescriptionForVariant(
    filtered,
    variant,
    registrationWizard
  )
  const withSchedule = withRegistrationEducationScheduleSettingsDescriptionForVariant(
    withBasicInfo,
    variant
  )
  return withRegistrationCurriculumDescriptionForVariant(withSchedule, variant, registrationWizard)
}

/** 시드 단락 타이틀 필수(*) — 필드 라벨이 아니라 단락 제목 (`answerRequired`) */
function withForcedProgramRegistrationSeedTitleRequired(
  draft: WritingFormDraft,
  seedParagraphIds: ReadonlySet<string>
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (!seedParagraphIds.has(paragraph.id)) return paragraph
    const next = forceParagraphTitleRequired(paragraph)
    if (next !== paragraph) changed = true
    return next
  })
  return changed ? { ...draft, paragraphs } : draft
}

function createDefaultRegistrationEditorState(
  variant: ProgramRegistrationFormVariant
): ProgramRegistrationEditorState {
  return {
    participant: getDefaultProgramRegistrationParticipant(variant),
    programType: 'curriculum',
    sessionRoundType: 'single',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    curriculumSessionCount: 1,
    curriculumChartSessionCount: variant === 'trainedTeachers' ? 2 : 1,
    scheduleCurriculumDetailCount: 1,
    scheduleCurriculumGroupCount: 1,
    scheduleCurriculumPreEducation: false,
    trainedTeachersTeacherTrainingEnabled: false,
    educationScheduleMode: getDefaultEducationScheduleMode(variant),
    sponsorId: '',
    sponsorContactId: '',
    programTitleKo: '',
    activeParagraphId: null,
  }
}

function patchEducationCurriculumParagraph(
  draft: WritingFormDraft,
  patch: { paragraphTitle?: string; paragraphDescription: string }
): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(p => {
      if (p.id !== PROGRAM_REGISTRATION_IDS.educationCurriculum) return p
      if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return p
      return { ...(p as HorizontalTableParagraph), ...patch }
    }),
  }
}

export type UseProgramRegistrationEditorOptions = {
  /** 템플릿 편집 등: 커리큘럼 차시·회차 추가 버튼 비활성·노출 블록 1개로 고정 */
  restrictCurriculumSessionStructure?: boolean
  /** `economy`: 1사 1교 등록 폼 시드(프로그램 유형 설정 단락 없음) */
  programRegistrationFormVariant?: ProgramRegistrationFormVariant
  /** 일반 프로그램 등록 풀페이지 — 임시 저장 성공 후(목록 갱신·모달 닫기 등) */
  onRegistrationSaved?: (program?: Program) => void
  /** 템플릿 관리 저장 확인 후 (편집 모달 닫기·목록 복귀) */
  onTemplateDraftSaveConfirmed?: () => void
  /** forms-surveys draft API 연동 대상 templateCode (`registration-general` · `registration-economy`) */
  templateCode?: string
  systemTemplate?: boolean
  forceUserEditable?: boolean
  /** true면 임시저장 복원 없이 시드로 시작 (신규 등록) */
  skipDraftRestore?: boolean
  /** 프로그램 등록 임시저장 — localStorage만 (`localOnlyDraftPersistence`). 양식 관리는 remote SSOT. */
  localOnlyDraftPersistence?: boolean
  /** 등록 위저드 임시저장 — programType별 localStorage 격리 키 */
  registrationWizardProgramType?: string
}

export function useProgramRegistrationEditor(
  active: boolean,
  previewHeaderTitle: string,
  editorOptions?: UseProgramRegistrationEditorOptions
) {
  const restrictCurriculumSessionStructure =
    editorOptions?.restrictCurriculumSessionStructure === true
  const programRegistrationFormVariant: ProgramRegistrationFormVariant =
    editorOptions?.programRegistrationFormVariant ?? 'general'
  const onRegistrationSaved = editorOptions?.onRegistrationSaved
  const onTemplateDraftSaveConfirmed = editorOptions?.onTemplateDraftSaveConfirmed
  const templateCode = editorOptions?.templateCode
  const skipDraftRestore = editorOptions?.skipDraftRestore === true
  const localOnlyDraftPersistence = editorOptions?.localOnlyDraftPersistence === true
  const registrationWizardProgramType = editorOptions?.registrationWizardProgramType
  const usesRegistrationWizardDraft =
    registrationWizardProgramType != null && registrationWizardProgramType !== ''
  const isStructureLocked = isWritingFormTemplateStructureLocked({
    templateCode,
    systemTemplate: editorOptions?.systemTemplate,
    forceUserEditable: editorOptions?.forceUserEditable,
  })
  const { showAlert } = useCmsAlert()
  const usesTemplateDraftApi = templateCode != null && templateCode !== ''
  const completionPromiseRef = useRef<Promise<void> | null>(null)

  useEffect(() => {
    if (!active) completionPromiseRef.current = null
  }, [active])
  const seedParagraphIds = useMemo(
    () => getProgramRegistrationSeedParagraphIds(programRegistrationFormVariant),
    [programRegistrationFormVariant]
  )

  const [draft, setDraft] = useState<WritingFormDraft>(() => EMPTY_WRITING_FORM_DRAFT)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(() => active)
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [participant, setParticipant] = useState<ProgramRegistrationParticipantSelection>({
    individual: true,
    organization: false,
    teacherInstructor: false,
    volunteer: false,
  })
  const [programType, setProgramType] = useState<ProgramRegistrationType>('curriculum')
  const [sessionRoundType, setSessionRoundType] =
    useState<ProgramRegistrationSessionRoundType>('single')
  const [educationFormScheduleDetail, setEducationFormScheduleDetail] =
    useState<ProgramRegistrationScheduleDetailKind>('common')
  const [participationScheduleDetail, setParticipationScheduleDetail] =
    useState<ProgramRegistrationScheduleDetailKind>('common')
  const [ipsScheduleDetail, setIpsScheduleDetail] =
    useState<ProgramRegistrationScheduleDetailKind>('common')
  const [curriculumSessionCount, setCurriculumSessionCount] = useState(1)
  const [curriculumChartSessionCount, setCurriculumChartSessionCount] = useState(1)
  const [scheduleCurriculumDetailCount, setScheduleCurriculumDetailCount] = useState(1)
  const [scheduleCurriculumGroupCount, setScheduleCurriculumGroupCount] = useState(1)
  const [scheduleCurriculumPreEducation, setScheduleCurriculumPreEducation] = useState(false)
  const [trainedTeachersTeacherTrainingEnabled, setTrainedTeachersTeacherTrainingEnabled] =
    useState(false)
  const defaultEducationScheduleMode: ProgramRegistrationEducationScheduleMode =
    getDefaultEducationScheduleMode(programRegistrationFormVariant)
  const [educationScheduleMode, setEducationScheduleMode] =
    useState<ProgramRegistrationEducationScheduleMode>(defaultEducationScheduleMode)
  const [sponsorId, setSponsorId] = useState('')
  const [sponsorContactId, setSponsorContactId] = useState('')
  const [programTitleKo, setProgramTitleKo] = useState('')

  const resolveProgramTitleKo = useCallback(
    () => readStoredRegistrationProgramTitleKo(programRegistrationFormVariant, programTitleKo),
    [programTitleKo, programRegistrationFormVariant]
  )

  const generalRequiredFieldContext = useCallback(() => {
    const resolvedSponsorId =
      sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
    const resolvedContactId =
      sponsorContactId.trim() ||
      readRegistrationOverlaySponsorContactId(programRegistrationFormVariant)
    return {
      participant,
      programType,
      sessionRoundType,
      educationFormScheduleDetail,
      participationScheduleDetail,
      ipsScheduleDetail,
      curriculumSessionCount,
      curriculumChartSessionCount,
      scheduleCurriculumDetailCount,
      scheduleCurriculumGroupCount,
      scheduleCurriculumPreEducation,
      educationScheduleMode,
      sponsorId: resolvedSponsorId,
      sponsorContactId: resolvedContactId,
      programTitleKo: resolveProgramTitleKo(),
    }
  }, [
    curriculumChartSessionCount,
    curriculumSessionCount,
    educationFormScheduleDetail,
    educationScheduleMode,
    ipsScheduleDetail,
    participant,
    participationScheduleDetail,
    programRegistrationFormVariant,
    programType,
    resolveProgramTitleKo,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation,
    sessionRoundType,
    sponsorContactId,
    sponsorId,
  ])

  const patchGeneralWizardRhf = useCallback(
    (patch: (values: RegistrationWizardUiValues) => RegistrationWizardUiValues) => {
      if (programRegistrationFormVariant !== 'general') return
      const rhf = peekGeneralRegistrationWizardRhf()
      if (rhf == null) return
      rhf.reset(patch(rhf.getValues()), { keepDefaultValues: true })
    },
    [programRegistrationFormVariant]
  )

  // general: 참여자 칩을 건드리지 않으면 editor 기본값(개인)이 위저드 RHF extras.participant(전부 false)에
  // 반영되지 않아, participant 기준 peek/collect(임시저장)가 개인 신청 키를 버린다.
  // RHF 등록 시점과 participant 변경 시에만 맞춘다(같으면 no-op, dirty 표시 안 함).
  useEffect(() => {
    if (programRegistrationFormVariant !== 'general') return
    let syncedApi: ReturnType<typeof peekGeneralRegistrationWizardRhf> = null
    const sync = () => {
      const rhf = peekGeneralRegistrationWizardRhf()
      if (rhf == null || rhf === syncedApi) return
      syncedApi = rhf
      const current = rhf.getValues().extras.participant
      if (
        current.individual === participant.individual &&
        current.organization === participant.organization &&
        current.teacherInstructor === participant.teacherInstructor &&
        current.volunteer === participant.volunteer
      ) {
        return
      }
      rhf.setPath('extras.participant', { ...participant }, { shouldDirty: false })
    }
    sync()
    return subscribeGeneralRegistrationWizardRhf(sync)
  }, [participant, programRegistrationFormVariant])

  const patchTrainedTeachersWizardRhf = useCallback(
    (
      patch: (
        values: import('@/features/program/trained-teachers/lib/registration-rhf-values').TrainedTeachersRegistrationRhfValues
      ) => import('@/features/program/trained-teachers/lib/registration-rhf-values').TrainedTeachersRegistrationRhfValues
    ) => {
      if (programRegistrationFormVariant !== 'trainedTeachers') return
      const rhf = peekTrainedTeachersRegistrationRhf()
      if (rhf == null) return
      const current = rhf.getValues()
      const next = patch(current)
      if (next === current) return
      rhf.reset(next, { keepDefaultValues: true })
    },
    [programRegistrationFormVariant]
  )

  const buildTrainedTeachersWizardCreateProgram = useCallback(
    (id: string) => {
      const rhf = peekTrainedTeachersRegistrationRhf()
      if (programRegistrationFormVariant !== 'trainedTeachers' || rhf == null) return null
      return buildTrainedTeachersProgramFromRhf({ id, values: rhf.getValues() })
    },
    [programRegistrationFormVariant]
  )

  const buildCompanySchoolWizardCreateProgram = useCallback(
    (id: string, options?: { requireOperationRange?: boolean }) => {
      const rhf = peekCompanySchoolRegistrationRhf()
      if (programRegistrationFormVariant !== 'economy' || rhf == null) return null
      return buildCompanySchoolProgramFromRhf({
        id,
        values: rhf.getValues(),
        requireOperationRange: options?.requireOperationRange,
      })
    },
    [programRegistrationFormVariant]
  )

  useEffect(() => {
    if (programRegistrationFormVariant !== 'trainedTeachers') return
    patchTrainedTeachersWizardRhf(values => {
      const nextCurriculumSessions = programType === 'schedule' ? [] : values.curriculumSessions
      const nextScheduleDetails = programType === 'schedule' ? values.scheduleDetails : []
      if (
        values.educationStructure === programType &&
        values.sessionRound === sessionRoundType &&
        values.educationFormScheduleDetail === educationFormScheduleDetail &&
        values.participationScheduleDetail === participationScheduleDetail &&
        values.ipsScheduleDetail === ipsScheduleDetail &&
        values.curriculumSessionCount === curriculumSessionCount &&
        values.curriculumChartSessionCount === curriculumChartSessionCount &&
        values.scheduleCurriculumDetailCount === scheduleCurriculumDetailCount &&
        values.scheduleCurriculumGroupCount === scheduleCurriculumGroupCount &&
        values.educationScheduleMode === educationScheduleMode &&
        values.teacherTrainingEnabled === trainedTeachersTeacherTrainingEnabled &&
        values.participant === participant &&
        values.curriculumSessions === nextCurriculumSessions &&
        values.scheduleDetails === nextScheduleDetails
      ) {
        return values
      }
      return {
        ...values,
        educationStructure: programType,
        sessionRound: sessionRoundType,
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail,
        curriculumSessionCount,
        curriculumChartSessionCount,
        scheduleCurriculumDetailCount,
        scheduleCurriculumGroupCount,
        educationScheduleMode,
        teacherTrainingEnabled: trainedTeachersTeacherTrainingEnabled,
        participant,
        curriculumSessions: nextCurriculumSessions,
        scheduleDetails: nextScheduleDetails,
      }
    })
  }, [
    curriculumChartSessionCount,
    curriculumSessionCount,
    educationFormScheduleDetail,
    educationScheduleMode,
    ipsScheduleDetail,
    participant,
    participationScheduleDetail,
    patchTrainedTeachersWizardRhf,
    programRegistrationFormVariant,
    programType,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    sessionRoundType,
    trainedTeachersTeacherTrainingEnabled,
  ])

  const buildGeneralWizardCreateProgram = useCallback(
    (id: string) => {
      const rhf = peekGeneralRegistrationWizardRhf()
      if (programRegistrationFormVariant !== 'general' || rhf == null) return null
      flushRecruitDetailRichTextIntoGeneralRecruitOverlay()
      const uiValues = rhf.getValues()
      return buildGeneralProgramCreateFromWizardRhf({
        id,
        uiValues: {
          ...uiValues,
          programTitleKo: resolveProgramTitleKo() || uiValues.programTitleKo,
          sponsorId: sponsorId.trim() || uiValues.sponsorId,
          managerContactId: sponsorContactId.trim() || uiValues.managerContactId,
          extras: {
            ...uiValues.extras,
            programType,
            sessionRoundType,
            educationScheduleMode,
            educationFormScheduleDetail,
            participationScheduleDetail,
            ipsScheduleDetail,
            curriculumSessionCount,
            curriculumChartSessionCount,
            scheduleCurriculumDetailCount,
            scheduleCurriculumGroupCount,
            scheduleCurriculumPreEducation,
            participant,
          },
        },
        editorExtras: {
          programType,
          sessionRoundType,
          educationScheduleMode,
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail,
          curriculumSessionCount,
          curriculumChartSessionCount,
          scheduleCurriculumDetailCount,
          scheduleCurriculumGroupCount,
          scheduleCurriculumPreEducation,
          participantOrganization: participant.organization,
          participantIndividual: participant.individual,
          participantTeacherInstructor: participant.teacherInstructor === true,
          participantVolunteer: participant.volunteer === true,
        },
        overlay: getProgramRegistrationOverlayRecord(),
      }).program
    },
    [
      curriculumChartSessionCount,
      curriculumSessionCount,
      educationFormScheduleDetail,
      educationScheduleMode,
      ipsScheduleDetail,
      participant,
      participationScheduleDetail,
      programRegistrationFormVariant,
      programType,
      resolveProgramTitleKo,
      scheduleCurriculumDetailCount,
      scheduleCurriculumGroupCount,
      scheduleCurriculumPreEducation,
      sessionRoundType,
      sponsorContactId,
      sponsorId,
    ]
  )

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const applyEditorStateSnapshot = useCallback(
    (state: ProgramRegistrationEditorState) => {
      setParticipant(
        programRegistrationFormVariant === 'trainedTeachers'
          ? {
              individual: false,
              organization: true,
              teacherInstructor: false,
              volunteer: false,
            }
          : programRegistrationFormVariant === 'economy'
            ? {
                individual: false,
                organization: true,
                teacherInstructor: true,
                volunteer: false,
              }
            : state.participant
      )
      setProgramType(state.programType)
      setSessionRoundType(state.sessionRoundType)
      setEducationFormScheduleDetail(state.educationFormScheduleDetail)
      setParticipationScheduleDetail(state.participationScheduleDetail)
      setIpsScheduleDetail(state.ipsScheduleDetail)
      setCurriculumSessionCount(state.curriculumSessionCount)
      setCurriculumChartSessionCount(state.curriculumChartSessionCount)
      setScheduleCurriculumDetailCount(state.scheduleCurriculumDetailCount)
      setScheduleCurriculumGroupCount(state.scheduleCurriculumGroupCount)
      setTrainedTeachersTeacherTrainingEnabled(state.trainedTeachersTeacherTrainingEnabled)
      setScheduleCurriculumPreEducation(
        programRegistrationFormVariant === 'trainedTeachers'
          ? state.trainedTeachersTeacherTrainingEnabled
          : state.scheduleCurriculumPreEducation
      )
      setEducationScheduleMode(state.educationScheduleMode)
      // editorState에 없고 overlay에만 남은 후원사(이전 이중 저장·number id 등)를 보강
      const resolvedSponsorId =
        (state.sponsorId ?? '').trim() ||
        readRegistrationOverlaySponsorId(programRegistrationFormVariant)
      const resolvedContactId =
        (state.sponsorContactId ?? '').trim() ||
        readRegistrationOverlaySponsorContactId(programRegistrationFormVariant)
      const resolvedSponsorIds = (() => {
        const fromOverlay = readGeneralRegistrationOverlaySponsorIds()
        if (fromOverlay.length > 0) return fromOverlay
        return resolvedSponsorId ? [resolvedSponsorId] : []
      })()
      setSponsorId(resolvedSponsorId || resolvedSponsorIds[0] || '')
      setSponsorContactId(resolvedContactId)
      if (resolvedSponsorIds.length > 0 || resolvedSponsorId) {
        const primary = resolvedSponsorId || resolvedSponsorIds[0] || ''
        patchProgramRegistrationOverlay({
          [GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY]: primary,
          [GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]:
            resolvedSponsorIds.length > 0 ? resolvedSponsorIds : primary ? [primary] : [],
          [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: resolvedContactId,
        })
      }
      setProgramTitleKo(state.programTitleKo ?? '')
      // 일반 위저드 제목 SSOT는 RHF. 빈 editorState로 overlay/RHF를 지우면
      // 임시저장 settingsJson 복원 전에 국문 대표명이 사라진다.
      // TT 제목 정본은 canonical snapshot — 레거시 programTitleKo로 mainTitle을 덮지 않는다.
      if (
        programRegistrationFormVariant !== 'general' &&
        programRegistrationFormVariant !== 'trainedTeachers'
      ) {
        patchRegistrationOverlayProgramTitleKo(
          programRegistrationFormVariant,
          state.programTitleKo ?? ''
        )
      }
    },
    [programRegistrationFormVariant]
  )

  const resetRegistrationEditorToSeed = useCallback(() => {
    resetProgramRegistrationOverlay()
    const seeded = filterProgramRegistrationDraftForVariant(
      normalizeWritingFormDraft(createProgramRegistrationDraft(programRegistrationFormVariant)),
      programRegistrationFormVariant,
      usesRegistrationWizardDraft
    )
    const next =
      programRegistrationFormVariant === 'economy'
        ? withForcedProgramRegistrationSeedTitleRequired(seeded, seedParagraphIds)
        : seeded
    startTransition(() => {
      setDraft(next)
      setActiveParagraphId(next.paragraphs[0]?.id ?? null)
      setSingleItemListActiveItemId(null)
      applyEditorStateSnapshot(createDefaultRegistrationEditorState(programRegistrationFormVariant))
      if (programRegistrationFormVariant === 'general') {
        peekGeneralRegistrationWizardRhf()?.reset(createNewRegistrationWizardUiValues(), {
          keepDirty: false,
        })
      }
      if (programRegistrationFormVariant === 'trainedTeachers') {
        peekTrainedTeachersRegistrationRhf()?.reset(
          createDefaultTrainedTeachersRegistrationRhfValues(),
          { keepDirty: false }
        )
      }
      // C4: 1사1교 RHF도 seed 초기화 시 기본값으로 reset (이전 draft 값 잔류 방지)
      if (programRegistrationFormVariant === 'economy') {
        peekCompanySchoolRegistrationRhf()?.reset(
          createNewCompanySchoolRegistrationRhfValues(),
          { keepDirty: false }
        )
      }
    })
  }, [
    applyEditorStateSnapshot,
    programRegistrationFormVariant,
    seedParagraphIds,
    usesRegistrationWizardDraft,
  ])

  // hydrate는 active·복원 옵션·유형이 바뀔 때만. 콜백/Set identity 변경으로
  // overlay를 통째로 reset 하면 다른 단락 입력이 사라진다.
  const applyEditorStateSnapshotRef = useRef(applyEditorStateSnapshot)
  applyEditorStateSnapshotRef.current = applyEditorStateSnapshot
  const resetRegistrationEditorToSeedRef = useRef(resetRegistrationEditorToSeed)
  resetRegistrationEditorToSeedRef.current = resetRegistrationEditorToSeed
  const seedParagraphIdsRef = useRef(seedParagraphIds)
  seedParagraphIdsRef.current = seedParagraphIds

  useEffect(() => {
    if (!active) {
      setIsDraftLoading(false)
      return
    }

    setProgramRegistrationOverlayScope(templateCode)
    resetProgramRegistrationOverlay()

    if (skipDraftRestore) {
      setIsDraftLoading(false)
      resetRegistrationEditorToSeedRef.current()
      return
    }

    if (usesTemplateDraftApi && templateCode) {
      let cancelled = false
      setIsDraftLoading(true)
      setDraft(EMPTY_WRITING_FORM_DRAFT)
      setActiveParagraphId(null)
      const defaults = createDefaultRegistrationEditorState(programRegistrationFormVariant)
      const variant = programRegistrationFormVariant

      const loadDraft = usesRegistrationWizardDraft
        ? import('@/features/program/general/lib/registration-wizard-form-draft').then(m =>
            m.loadRegistrationWizardFormDraft({
              programType: registrationWizardProgramType!,
              templateCode,
            })
          )
        : loadWritingFormTemplateDraft(templateCode, {
            localOnly: localOnlyDraftPersistence,
          })

      void loadDraft
        .then(saved => {
          if (cancelled) return
          if (saved?.draft) {
            replaceProgramRegistrationOverlay(saved.overlay ?? {})
            const normalizedBase = filterProgramRegistrationDraftForVariant(
              normalizeWritingFormDraft(saved.draft),
              variant,
              usesRegistrationWizardDraft
            )
            const normalized =
              variant === 'economy'
                ? withForcedProgramRegistrationSeedTitleRequired(
                    normalizedBase,
                    seedParagraphIdsRef.current
                  )
                : normalizedBase
            const restored = applyProgramRegistrationEditorState(saved.editorState, defaults)
            startTransition(() => {
              setDraft(normalized)
              applyEditorStateSnapshotRef.current(restored)
              setActiveParagraphId(
                restored.activeParagraphId ?? normalized.paragraphs[0]?.id ?? null
              )
              setSingleItemListActiveItemId(null)
              if (variant === 'general') {
                peekGeneralRegistrationWizardRhf()?.reset(
                  hydrateRegistrationWizardUiValues({
                    overlay: {
                      ...(saved.overlay ?? {}),
                      ...peekApplicantRecruitInstitutionOverlayRecord(
                        'recruitment-participant-school'
                      ),
                      ...peekGeneralRecruitOverlayRecord('recruitment-participant-individual'),
                      ...peekGeneralRecruitOverlayRecord('recruitment-instructor'),
                      ...peekGeneralRecruitOverlayRecord('recruitment-volunteer'),
                      ...peekGeneralApplicationOverlayRecord('application-participant-school'),
                      ...peekGeneralApplicationOverlayRecord('application-participant-individual'),
                      ...peekGeneralApplicationOverlayRecord('application-instructor'),
                      ...peekGeneralApplicationOverlayRecord('application-volunteer'),
                    },
                    editorState: restored,
                    settingsJson: saved.settingsJson,
                  }),
                  { keepDirty: false }
                )
              }
              if (variant === 'economy') {
                const typed = saved.settingsJson?.[COMPANY_SCHOOL_REGISTRATION_SETTINGS_KEY]
                const rhf = peekCompanySchoolRegistrationRhf()
                if (rhf != null && isCompanySchoolRegistrationCanonicalSnapshot(typed)) {
                  const imported = importLegacyOverlayToCompanySchoolCanonical({
                    overlay: saved.overlay ?? {},
                  })
                  rhf.reset(
                    rhfValuesFromCompanySchoolCanonical(
                      typed.common,
                      typed.sidecar,
                      // C4: 이전 세션의 RHF 값이 새 draft로 새지 않도록 빈 상태로 fallback
                      typed.recruit ?? emptyCompanySchoolRecruitFormState(),
                      withEmptyCompanySchoolApplicationPreferredSchedule(
                        typed.application ??
                          imported.application ??
                          emptyCompanySchoolApplicationFormState()
                      ),
                      typed.instructorRecruit ??
                        imported.instructorRecruit ??
                        emptyCompanySchoolInstructorRecruitFormState()
                    ),
                    { keepDirty: false }
                  )
                } else if (rhf != null) {
                  const imported = importLegacyOverlayToCompanySchoolCanonical({
                    overlay: saved.overlay ?? {},
                  })
                  rhf.reset(
                    rhfValuesFromCompanySchoolCanonical(
                      imported.common,
                      imported.sidecar,
                      imported.recruit ?? emptyCompanySchoolRecruitFormState(),
                      withEmptyCompanySchoolApplicationPreferredSchedule(
                        imported.application ?? emptyCompanySchoolApplicationFormState()
                      ),
                      imported.instructorRecruit ?? emptyCompanySchoolInstructorRecruitFormState()
                    ),
                    { keepDirty: false }
                  )
                }
              }
              if (variant === 'trainedTeachers') {
                const typed = saved.settingsJson?.[TRAINED_TEACHERS_REGISTRATION_SETTINGS_KEY]
                const rhf = peekTrainedTeachersRegistrationRhf()
                if (rhf != null && isTrainedTeachersRegistrationCanonicalSnapshot(typed)) {
                  rhf.reset(
                    rhfValuesFromTrainedTeachersCanonicalCommon(
                      typed.common,
                      typed.editor,
                      typed.sidecar,
                      typed.recruit,
                      typed.application ??
                        importLegacyTrainedTeachersApplicationOverlay(saved.overlay ?? {})
                    ),
                    { keepDirty: false }
                  )
                } else if (rhf != null) {
                  const imported = importLegacyOverlayToTrainedTeachersCanonical({
                    id: registrationPendingSnapshotId('trainedTeachers'),
                    editor: {
                      educationStructure: restored.programType,
                      sessionRound: restored.sessionRoundType,
                      educationFormScheduleDetail: restored.educationFormScheduleDetail,
                      participationScheduleDetail: restored.participationScheduleDetail,
                      ipsScheduleDetail: restored.ipsScheduleDetail,
                      curriculumSessionCount: restored.curriculumSessionCount,
                      curriculumChartSessionCount: restored.curriculumChartSessionCount,
                      scheduleCurriculumDetailCount: restored.scheduleCurriculumDetailCount,
                      scheduleCurriculumGroupCount: restored.scheduleCurriculumGroupCount,
                      educationScheduleMode: restored.educationScheduleMode,
                      teacherTrainingEnabled:
                        restored.trainedTeachersTeacherTrainingEnabled === true,
                      participant: restored.participant,
                    },
                    overlay: saved.overlay ?? {},
                  })
                  rhf.reset(
                    rhfValuesFromTrainedTeachersCanonicalCommon(
                      applyLegacyProgramTitleKoFallback(
                        imported.common,
                        restored.programTitleKo
                      ),
                      imported.editor,
                      undefined,
                      imported.recruit,
                      imported.application
                    ),
                    { keepDirty: false }
                  )
                }
              }
            })
            return
          }
          resetRegistrationEditorToSeedRef.current()
        })
        .finally(() => {
          if (!cancelled) setIsDraftLoading(false)
        })

      return () => {
        cancelled = true
      }
    }

    setIsDraftLoading(false)
    resetRegistrationEditorToSeedRef.current()
  }, [
    active,
    programRegistrationFormVariant,
    skipDraftRestore,
    templateCode,
    usesTemplateDraftApi,
    localOnlyDraftPersistence,
    registrationWizardProgramType,
    usesRegistrationWizardDraft,
  ])

  useEffect(() => {
    if (!active) {
      syncInstitutionApplicationPreferredEducationFormFromOverlay(
        getProgramRegistrationOverlayRecord()
      )
      resetProgramRegistrationOverlay()
      closeWritingUserPreview()
    }
  }, [active, closeWritingUserPreview])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== id) return p
          let next = updater(p)
          if (seedParagraphIds.has(id)) {
            next = { ...next, requiredMark: true, answerRequired: true } as WritingFormParagraph
          }
          return next
        }),
      }))
    },
    [seedParagraphIds]
  )

  const onReorderMiddle = useCallback(
    (dragId: string, overId: string) => {
      if (isStructureLocked) return
      setDraft(prev => ({
        ...prev,
        paragraphs: (() => {
          const from = prev.paragraphs.findIndex(p => p.id === dragId)
          const to = prev.paragraphs.findIndex(p => p.id === overId)
          if (from < 0 || to < 0 || from === to) return prev.paragraphs
          const next = [...prev.paragraphs]
          const [moved] = next.splice(from, 1)
          if (!moved) return prev.paragraphs
          next.splice(to, 0, moved)
          return next
        })(),
      }))
    },
    [isStructureLocked]
  )

  const onTitleNumberingChange = useCallback(
    (style: FormTitleNumberingStyle) => {
      if (isStructureLocked) return
      setDraft(prev => ({
        ...prev,
        formSettings: { ...prev.formSettings, titleNumbering: style },
      }))
    },
    [isStructureLocked]
  )

  const middleParagraphActions = useWritingFormMiddleParagraphActions(
    setDraft,
    setActiveParagraphId
  )

  const {
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
  } = useTableRowSelectionState({
    paragraphs: draft.paragraphs,
    activeParagraphId,
  })

  const handleSelectCard = useCallback((id: string) => {
    setActiveParagraphId(id)
    setSingleItemListActiveItemId(null)
  }, [])

  const onIndividualChange = useCallback(
    (checked: boolean) => {
      if (programRegistrationFormVariant === 'trainedTeachers') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        })
        return
      }
      if (programRegistrationFormVariant === 'economy') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: true,
          volunteer: false,
        })
        return
      }
      const next = applyGeneralParticipantAudienceSelection('individual', checked)
      const nextParticipation = shouldResetParticipationScheduleDetailForAudience(next)
        ? 'common'
        : participationScheduleDetail
      if (shouldResetParticipationScheduleDetailForAudience(next)) {
        setParticipationScheduleDetail('common')
      }
      setParticipant(prev => ({
        ...prev,
        individual: next.individual,
        organization: next.organization,
      }))
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: {
          ...values.extras,
          participant: {
            ...values.extras.participant,
            individual: next.individual,
            organization: next.organization,
          },
          participationScheduleDetail: nextParticipation,
        },
      }))
      if (programRegistrationFormVariant === 'general' && programType === 'schedule') {
        setDraft(prev =>
          patchEducationCurriculumParagraph(prev, {
            paragraphDescription: resolveProgramRegistrationScheduleCurriculumEditDescription({
              sessionRoundType,
              participantOrganization: next.organization,
              educationFormScheduleDetail,
              participationScheduleDetail: nextParticipation,
              ipsScheduleDetail,
            }),
          })
        )
      }
    },
    [
      educationFormScheduleDetail,
      ipsScheduleDetail,
      participationScheduleDetail,
      patchGeneralWizardRhf,
      programRegistrationFormVariant,
      programType,
      sessionRoundType,
    ]
  )

  const onOrganizationChange = useCallback(
    (checked: boolean) => {
      // 교육받은 교사 — 학교/기관 고정 (해제·변경 불가)
      if (programRegistrationFormVariant === 'trainedTeachers') {
        setParticipant(prev => ({
          ...prev,
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        }))
        return
      }
      // 1사1교 — 학교/기관·강사 고정 (해제·변경 불가)
      if (programRegistrationFormVariant === 'economy') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: true,
          volunteer: false,
        })
        return
      }
      const next = applyGeneralParticipantAudienceSelection('organization', checked)
      const nextParticipation = shouldResetParticipationScheduleDetailForAudience(next)
        ? 'common'
        : participationScheduleDetail
      if (shouldResetParticipationScheduleDetailForAudience(next)) {
        setParticipationScheduleDetail('common')
      }
      setParticipant(prev => ({
        ...prev,
        individual: next.individual,
        organization: next.organization,
      }))
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: {
          ...values.extras,
          participant: {
            ...values.extras.participant,
            individual: next.individual,
            organization: next.organization,
          },
          participationScheduleDetail: nextParticipation,
        },
      }))
      if (programRegistrationFormVariant === 'general' && programType === 'schedule') {
        setDraft(prev =>
          patchEducationCurriculumParagraph(prev, {
            paragraphDescription: resolveProgramRegistrationScheduleCurriculumEditDescription({
              sessionRoundType,
              participantOrganization: next.organization,
              educationFormScheduleDetail,
              participationScheduleDetail: nextParticipation,
              ipsScheduleDetail,
            }),
          })
        )
      }
    },
    [
      educationFormScheduleDetail,
      ipsScheduleDetail,
      participationScheduleDetail,
      patchGeneralWizardRhf,
      programRegistrationFormVariant,
      programType,
      sessionRoundType,
    ]
  )

  const onTeacherInstructorChange = useCallback(
    (checked: boolean) => {
      if (programRegistrationFormVariant === 'trainedTeachers') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        })
        return
      }
      if (programRegistrationFormVariant === 'economy') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: true,
          volunteer: false,
        })
        return
      }
      setParticipant(prev => ({ ...prev, teacherInstructor: checked }))
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: {
          ...values.extras,
          participant: { ...values.extras.participant, teacherInstructor: checked },
        },
      }))
    },
    [patchGeneralWizardRhf, programRegistrationFormVariant]
  )

  const onVolunteerChange = useCallback(
    (checked: boolean) => {
      if (programRegistrationFormVariant === 'trainedTeachers') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        })
        return
      }
      if (programRegistrationFormVariant === 'economy') {
        setParticipant({
          individual: false,
          organization: true,
          teacherInstructor: true,
          volunteer: false,
        })
        return
      }
      setParticipant(prev => ({ ...prev, volunteer: checked }))
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: {
          ...values.extras,
          participant: { ...values.extras.participant, volunteer: checked },
        },
      }))
    },
    [patchGeneralWizardRhf, programRegistrationFormVariant]
  )

  const onSessionRoundTypeChange = useCallback(
    (value: ProgramRegistrationSessionRoundType) => {
      setSessionRoundType(value)
      if (value === 'multi') setCurriculumSessionCount(1)
      if (value === 'single') setCurriculumChartSessionCount(1)
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: {
          ...values.extras,
          sessionRoundType: value,
          ...(value === 'multi' ? { curriculumSessionCount: 1 } : {}),
          ...(value === 'single' ? { curriculumChartSessionCount: 1 } : {}),
        },
      }))

      if (programRegistrationFormVariant !== 'general') return
      setDraft(prev =>
        patchEducationCurriculumParagraph(prev, {
          paragraphDescription:
            programType === 'schedule'
              ? resolveProgramRegistrationScheduleCurriculumEditDescription({
                  sessionRoundType: value,
                  participantOrganization: participant.organization,
                  educationFormScheduleDetail,
                  participationScheduleDetail,
                  ipsScheduleDetail,
                })
              : resolveProgramRegistrationCurriculumRegistrationDescription(value),
        })
      )
    },
    [
      educationFormScheduleDetail,
      ipsScheduleDetail,
      participant.organization,
      participationScheduleDetail,
      patchGeneralWizardRhf,
      programRegistrationFormVariant,
      programType,
      restrictCurriculumSessionStructure,
    ]
  )

  const onEducationFormScheduleDetailChange = useCallback(
    (value: ProgramRegistrationScheduleDetailKind) => {
      setEducationFormScheduleDetail(value)
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: { ...values.extras, educationFormScheduleDetail: value },
      }))
    },
    [patchGeneralWizardRhf]
  )

  const onParticipationScheduleDetailChange = useCallback(
    (value: ProgramRegistrationScheduleDetailKind) => {
      setParticipationScheduleDetail(value)
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: { ...values.extras, participationScheduleDetail: value },
      }))
    },
    [patchGeneralWizardRhf]
  )

  const onIpsScheduleDetailChange = useCallback((value: ProgramRegistrationScheduleDetailKind) => {
    setIpsScheduleDetail(value)
    patchGeneralWizardRhf(values => ({
      ...values,
      extras: { ...values.extras, ipsScheduleDetail: value },
    }))
  }, [patchGeneralWizardRhf])

  const onAddCurriculumSession = useCallback(() => {
    if (restrictCurriculumSessionStructure) return
    const next = curriculumSessionCount + 1
    setCurriculumSessionCount(next)
    patchGeneralWizardRhf(values => ({
      ...values,
      extras: { ...values.extras, curriculumSessionCount: next },
    }))
  }, [curriculumSessionCount, patchGeneralWizardRhf, restrictCurriculumSessionStructure])

  const onDeleteCurriculumSession = useCallback(
    (_roundIndex: number) => {
      if (restrictCurriculumSessionStructure) return
      const next = Math.max(1, curriculumSessionCount - 1)
      setCurriculumSessionCount(next)
      patchGeneralWizardRhf(values => applyCurriculumCountTrim(values, next, 'session'))
    },
    [curriculumSessionCount, patchGeneralWizardRhf, restrictCurriculumSessionStructure]
  )

  const onAddCurriculumChartSession = useCallback(() => {
    if (
      restrictCurriculumSessionStructure &&
      programRegistrationFormVariant !== 'trainedTeachers'
    ) {
      return
    }
    const next = Math.min(
      curriculumChartSessionCount + 1,
      GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT
    )
    setCurriculumChartSessionCount(next)
    patchGeneralWizardRhf(values => ({
      ...values,
      extras: { ...values.extras, curriculumChartSessionCount: next },
    }))
  }, [
    curriculumChartSessionCount,
    patchGeneralWizardRhf,
    programRegistrationFormVariant,
    restrictCurriculumSessionStructure,
  ])

  const onDeleteCurriculumChartSession = useCallback(
    (chartIndex: number) => {
      if (
        (restrictCurriculumSessionStructure &&
          programRegistrationFormVariant !== 'trainedTeachers') ||
        chartIndex <= 1
      ) {
        return
      }
      const next = Math.max(1, curriculumChartSessionCount - 1)
      setCurriculumChartSessionCount(next)
      patchGeneralWizardRhf(values => applyCurriculumCountTrim(values, next, 'chart'))
    },
    [
      curriculumChartSessionCount,
      patchGeneralWizardRhf,
      programRegistrationFormVariant,
      restrictCurriculumSessionStructure,
    ]
  )

  const onProgramTypeChange = useCallback(
    (next: ProgramRegistrationType) => {
      if (programRegistrationFormVariant === 'economy' && next !== 'curriculum') return
      setProgramType(next)
      if (programRegistrationFormVariant === 'general' && next === 'schedule') {
        updateProgramRegistrationOverlayKey(
          'generalRegistration.basicInfo.detailedProgramId',
          () => TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        )
      }
      patchGeneralWizardRhf(values => applyEducationStructureReset(values, next))
      setDraft(prev =>
        patchEducationCurriculumParagraph(prev, {
          paragraphTitle: next === 'schedule' ? '교육 진행 (일정형)' : '교육 진행 (커리큘럼)',
          paragraphDescription:
            next === 'schedule'
              ? resolveProgramRegistrationScheduleCurriculumEditDescription({
                  sessionRoundType,
                  participantOrganization: participant.organization,
                  educationFormScheduleDetail,
                  participationScheduleDetail,
                  ipsScheduleDetail,
                })
              : programRegistrationFormVariant === 'general'
                ? resolveProgramRegistrationCurriculumRegistrationDescription(sessionRoundType)
                : '차시 별 정보를 입력해 주세요',
        })
      )
    },
    [
      educationFormScheduleDetail,
      ipsScheduleDetail,
      participant.organization,
      participationScheduleDetail,
      patchGeneralWizardRhf,
      programRegistrationFormVariant,
      sessionRoundType,
    ]
  )

  const onAddScheduleCurriculumDetail = useCallback(() => {
    const next = Math.min(scheduleCurriculumDetailCount + 1, 99)
    setScheduleCurriculumDetailCount(next)
    patchGeneralWizardRhf(values => ({
      ...values,
      extras: { ...values.extras, scheduleCurriculumDetailCount: next },
    }))
  }, [patchGeneralWizardRhf, scheduleCurriculumDetailCount])

  const onDeleteScheduleCurriculumDetail = useCallback((_detailIndex: number) => {
    const next = Math.max(1, scheduleCurriculumDetailCount - 1)
    setScheduleCurriculumDetailCount(next)
    patchGeneralWizardRhf(values => applyScheduleDetailCountTrim(values, next))
  }, [patchGeneralWizardRhf, scheduleCurriculumDetailCount])

  const onAddScheduleCurriculumGroup = useCallback(() => {
    const next = Math.min(
      scheduleCurriculumGroupCount + 1,
      PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
    )
    setScheduleCurriculumGroupCount(next)
    patchGeneralWizardRhf(values => ({
      ...values,
      extras: { ...values.extras, scheduleCurriculumGroupCount: next },
    }))
  }, [patchGeneralWizardRhf, scheduleCurriculumGroupCount])

  const onDeleteScheduleCurriculumGroup = useCallback((_groupIndex: number) => {
    const next = Math.max(1, scheduleCurriculumGroupCount - 1)
    setScheduleCurriculumGroupCount(next)
    patchGeneralWizardRhf(values => applyScheduleGroupCountTrim(values, next))
  }, [patchGeneralWizardRhf, scheduleCurriculumGroupCount])

  const onScheduleCurriculumPreEducationChange = useCallback((checked: boolean) => {
    setScheduleCurriculumPreEducation(checked)
    patchGeneralWizardRhf(values => ({
      ...values,
      extras: { ...values.extras, scheduleCurriculumPreEducation: checked },
    }))
  }, [patchGeneralWizardRhf])

  const onTrainedTeachersTeacherTrainingEnabledChange = useCallback((checked: boolean) => {
    setTrainedTeachersTeacherTrainingEnabled(checked)
    setScheduleCurriculumPreEducation(checked)
  }, [])

  const onEducationScheduleModeChange = useCallback(
    (value: ProgramRegistrationEducationScheduleMode) => {
      setEducationScheduleMode(value)
      patchGeneralWizardRhf(values => ({
        ...values,
        extras: { ...values.extras, educationScheduleMode: value },
      }))
    },
    [patchGeneralWizardRhf]
  )

  const paragraphBodyOptions = useMemo(
    () =>
      buildProgramRegistrationParagraphBodyOptions(
        {
          participant,
          programType,
          onProgramTypeChange,
          onIndividualChange,
          onOrganizationChange,
          onTeacherInstructorChange,
          onVolunteerChange,
          sessionRoundType,
          onSessionRoundTypeChange,
          educationFormScheduleDetail,
          onEducationFormScheduleDetailChange,
          participationScheduleDetail,
          onParticipationScheduleDetailChange,
          ipsScheduleDetail,
          onIpsScheduleDetailChange,
          curriculumSessionCount: restrictCurriculumSessionStructure ? 1 : curriculumSessionCount,
          onAddCurriculumSession,
          onDeleteCurriculumSession,
          curriculumChartSessionCount:
            restrictCurriculumSessionStructure &&
            programRegistrationFormVariant !== 'trainedTeachers'
              ? 1
              : curriculumChartSessionCount,
          onAddCurriculumChartSession,
          onDeleteCurriculumChartSession,
          restrictCurriculumSessionStructure,
          programRegistrationFormVariant,
          scheduleCurriculumDetailCount,
          onAddScheduleCurriculumDetail,
          onDeleteScheduleCurriculumDetail,
          scheduleCurriculumGroupCount,
          onAddScheduleCurriculumGroup,
          onDeleteScheduleCurriculumGroup,
          scheduleCurriculumPreEducation,
          onScheduleCurriculumPreEducationChange,
          trainedTeachersTeacherTrainingEnabled,
          onTrainedTeachersTeacherTrainingEnabledChange,
          educationScheduleMode,
          onEducationScheduleModeChange,
        },
        {
          hiddenParagraphIds:
            programRegistrationFormVariant === 'trainedTeachers'
              ? new Set<string>([
                  PROGRAM_REGISTRATION_IDS.businessKpi,
                  ...(programType === 'schedule' && sessionRoundType === 'multi'
                    ? [PROGRAM_REGISTRATION_IDS.educationScheduleSettings]
                    : []),
                ])
              : programRegistrationFormVariant === 'general' &&
                  programType === 'schedule' &&
                  sessionRoundType === 'multi'
                ? new Set<string>([PROGRAM_REGISTRATION_IDS.educationScheduleSettings])
                : undefined,
        }
      ),
    [
      curriculumChartSessionCount,
      curriculumSessionCount,
      educationFormScheduleDetail,
      ipsScheduleDetail,
      onAddCurriculumChartSession,
      onDeleteCurriculumChartSession,
      onAddCurriculumSession,
      onDeleteCurriculumSession,
      onAddScheduleCurriculumDetail,
      onDeleteScheduleCurriculumDetail,
      onAddScheduleCurriculumGroup,
      onDeleteScheduleCurriculumGroup,
      onScheduleCurriculumPreEducationChange,
      onTrainedTeachersTeacherTrainingEnabledChange,
      onEducationFormScheduleDetailChange,
      onIpsScheduleDetailChange,
      onIndividualChange,
      onOrganizationChange,
      onTeacherInstructorChange,
      onVolunteerChange,
      onParticipationScheduleDetailChange,
      onProgramTypeChange,
      onSessionRoundTypeChange,
      participant,
      participationScheduleDetail,
      programType,
      scheduleCurriculumDetailCount,
      scheduleCurriculumGroupCount,
      scheduleCurriculumPreEducation,
      trainedTeachersTeacherTrainingEnabled,
      sessionRoundType,
      restrictCurriculumSessionStructure,
      programRegistrationFormVariant,
      educationScheduleMode,
      onEducationScheduleModeChange,
    ]
  )

  const { pinnedTop, sortableMiddle, pinnedBottom } = useMemo(() => {
    const { titleNumbering } = draft.formSettings
    const line = (p: WritingFormParagraph) => ({
      id: p.id,
      displayLine: getFormNavDisplayLine(draft.paragraphs, p, titleNumbering),
    })
    return {
      pinnedTop: null as ReturnType<typeof line> | null,
      sortableMiddle: draft.paragraphs.map(line),
      pinnedBottom: null as ReturnType<typeof line> | ReturnType<typeof line>[] | null,
    }
  }, [draft])

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: previewHeaderTitle,
      editorKind: 'horizontal_table' as const,
      paragraphBodyOptions,
    }),
    [draft, paragraphBodyOptions, previewHeaderTitle, updateParagraph]
  )

  useEffect(() => {
    if (!active) return
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [active, isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const persistTemplateDraftIfNeeded = useCallback(async () => {
    if (!usesTemplateDraftApi || !templateCode) return
    const resolvedSponsorId =
      sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
    const resolvedContactId =
      sponsorContactId.trim() ||
      readRegistrationOverlaySponsorContactId(programRegistrationFormVariant)
    const resolvedProgramTitleKo = resolveProgramTitleKo()
    const overlay = (() => {
      const stored =
        programRegistrationFormVariant === 'trainedTeachers'
          ? omitTrainedTeachersCommonInfoOverlayKeys({ ...getProgramRegistrationOverlayRecord() })
          : programRegistrationFormVariant === 'economy'
            ? omitCompanySchoolApplicationOverlayKeys(
                omitCompanySchoolRecruitmentOverlayKeys(
                  omitCompanySchoolCommonInfoOverlayKeys({ ...getProgramRegistrationOverlayRecord() })
                )
              )
            : { ...getProgramRegistrationOverlayRecord() }
      if (programRegistrationFormVariant !== 'general') return stored
      const rhf = peekGeneralRegistrationWizardRhf()
      if (rhf == null) return stored
      return { ...stored, ...projectRegistrationWizardUiValuesToOverlay(rhf.getValues()) }
    })()
    const editorState = buildProgramRegistrationEditorState({
      participant,
      programType,
      sessionRoundType,
      educationFormScheduleDetail,
      participationScheduleDetail,
      ipsScheduleDetail,
      curriculumSessionCount,
      curriculumChartSessionCount,
      scheduleCurriculumDetailCount,
      scheduleCurriculumGroupCount,
      scheduleCurriculumPreEducation,
      trainedTeachersTeacherTrainingEnabled,
      educationScheduleMode,
      sponsorId: resolvedSponsorId,
      sponsorContactId: resolvedContactId,
      programTitleKo: resolvedProgramTitleKo,
      activeParagraphId,
    })
    if (usesRegistrationWizardDraft) {
      const { persistRegistrationWizardFormDraft } =
        await import('@/features/program/general/lib/registration-wizard-form-draft')
      const rhf = peekGeneralRegistrationWizardRhf()
      const rhfValues = rhf?.getValues()
      await persistRegistrationWizardFormDraft({
        programType: registrationWizardProgramType!,
        templateCode,
        draft,
        overlay,
        editorState,
        settingsJson:
          programRegistrationFormVariant === 'general' && rhfValues != null
            ? {
                [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
                  ...rhfValues,
                  programTitleKo: resolvedProgramTitleKo || rhfValues.programTitleKo,
                  sponsorId: resolvedSponsorId || rhfValues.sponsorId,
                  sponsorIds:
                    rhfValues.sponsorIds.length > 0
                      ? rhfValues.sponsorIds
                      : resolvedSponsorId
                        ? [resolvedSponsorId]
                        : rhfValues.sponsorIds,
                  managerContactId: resolvedContactId || rhfValues.managerContactId,
                  managerContactIds:
                    rhfValues.managerContactIds.length > 0
                      ? rhfValues.managerContactIds
                      : resolvedContactId
                        ? [resolvedContactId]
                        : rhfValues.managerContactIds,
                  extras: {
                    ...rhfValues.extras,
                    programType,
                    sessionRoundType,
                    educationScheduleMode,
                    educationFormScheduleDetail,
                    participationScheduleDetail,
                    ipsScheduleDetail,
                    curriculumSessionCount,
                    curriculumChartSessionCount,
                    scheduleCurriculumDetailCount,
                    scheduleCurriculumGroupCount,
                    scheduleCurriculumPreEducation,
                    participant,
                  },
                },
              }
            : programRegistrationFormVariant === 'trainedTeachers'
              ? trainedTeachersWizardDraftSettingsJson(getProgramRegistrationOverlayRecord())
              : programRegistrationFormVariant === 'economy'
                ? (() => {
                    const csRhf = peekCompanySchoolRegistrationRhf()
                    if (csRhf == null) return undefined
                    return {
                      [COMPANY_SCHOOL_REGISTRATION_SETTINGS_KEY]:
                        buildCompanySchoolCanonicalFromRhf({
                          values: csRhf.getValues(),
                        }),
                    }
                  })()
                : undefined,
      })
    } else {
      await persistWritingFormTemplateDraft({
        templateId: templateCode,
        draft,
        overlay,
        editorState,
        localOnly: localOnlyDraftPersistence,
      })
    }
  }, [
    activeParagraphId,
    curriculumChartSessionCount,
    curriculumSessionCount,
    draft,
    educationFormScheduleDetail,
    educationScheduleMode,
    ipsScheduleDetail,
    participant,
    participationScheduleDetail,
    programType,
    resolveProgramTitleKo,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation,
    sessionRoundType,
    sponsorContactId,
    sponsorId,
    templateCode,
    trainedTeachersTeacherTrainingEnabled,
    programRegistrationFormVariant,
    usesTemplateDraftApi,
    localOnlyDraftPersistence,
    registrationWizardProgramType,
    usesRegistrationWizardDraft,
  ])

  /** 중간 저장 — template draft만. 프로그램 POST는 handleCompleteRegistration에서만. */
  const handleSave = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        await persistTemplateDraftIfNeeded()
        if (options?.silent) return
        if (onRegistrationSaved) {
          if (usesTemplateDraftApi) {
            showAlert({
              title: '임시 저장',
              content:
                '작성 내용을 임시 저장하였습니다.\n임시 저장본은 가장 최근에 저장한 1개의 항목만 유지됩니다.',
            })
          }
          return
        }
        if (usesTemplateDraftApi) {
          showAlert({
            title: '저장',
            content: '양식이 저장되었습니다.',
            onConfirm: onTemplateDraftSaveConfirmed,
          })
        }
      } catch (error) {
        console.debug('programRegistrationEditor save failed', error)
        if (options?.silent) throw error
        showAlert({
          title: '임시 저장 실패',
          content: isLocalStorageQuotaExceededError(error)
            ? '임시 저장에 실패했습니다.\n브라우저 저장 공간을 확인한 뒤 다시 시도해 주세요.'
            : '임시 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.',
        })
      }
    },
    [
      onRegistrationSaved,
      onTemplateDraftSaveConfirmed,
      persistTemplateDraftIfNeeded,
      showAlert,
      usesTemplateDraftApi,
    ]
  )

  /** 현재 공통·모집 overlay를 상세와 동일한 Program 스냅샷으로 만든다. */
  const buildCurrentProgramSnapshot = useCallback(
    (id = 'registration-preview'): Program => {
      const variant = programRegistrationFormVariant
      const fromRhf =
        buildGeneralWizardCreateProgram(id) ??
        buildTrainedTeachersWizardCreateProgram(id) ??
        buildCompanySchoolWizardCreateProgram(id)
      if (fromRhf) return fromRhf
      const resolvedSponsorId = sponsorId.trim() || readRegistrationOverlaySponsorId(variant)
      return buildGeneralProgramListRowFromRegistrationSnapshot({
        id,
        participant,
        programType,
        variant,
        sponsorId: resolvedSponsorId || undefined,
        title: resolveProgramTitleKo() || undefined,
        sessionRoundType,
        educationScheduleMode,
        educationScheduleLines:
          programType === 'schedule' && sessionRoundType === 'multi'
            ? []
            : readGeneralRegistrationOverlayScheduleLines(),
        scheduleCurriculumDetailCount: scheduleCurriculumDetailCount,
        editorExtras: {
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail,
          curriculumSessionCount,
          curriculumChartSessionCount,
          scheduleCurriculumPreEducation:
            variant === 'trainedTeachers'
              ? trainedTeachersTeacherTrainingEnabled
              : scheduleCurriculumPreEducation,
          participantOrganization: participant.organization,
          teacherTrainingEnabled:
            variant === 'trainedTeachers' ? trainedTeachersTeacherTrainingEnabled : undefined,
        },
      })
    },
    [
      buildGeneralWizardCreateProgram,
      buildTrainedTeachersWizardCreateProgram,
      buildCompanySchoolWizardCreateProgram,
      curriculumChartSessionCount,
      curriculumSessionCount,
      educationFormScheduleDetail,
      educationScheduleMode,
      ipsScheduleDetail,
      participant,
      participationScheduleDetail,
      programRegistrationFormVariant,
      programType,
      resolveProgramTitleKo,
      scheduleCurriculumDetailCount,
      scheduleCurriculumPreEducation,
      sessionRoundType,
      sponsorId,
      trainedTeachersTeacherTrainingEnabled,
    ]
  )

  /** 단계 전환 — base create payload (formBindings 미포함) */
  const logCurrentRegistrationPayload = useCallback(
    (stepLabel: string): void => {
      const program = buildCurrentProgramSnapshot('debug')
      logRegistrationStepTransitionPayload({
        program,
        variant: programRegistrationFormVariant,
        stepLabel,
      })
    },
    [buildCurrentProgramSnapshot, programRegistrationFormVariant]
  )

  /** 개발용 — 공통정보 overlay·controlled 필드 샘플 채움 (`import.meta.env.DEV`에서만 UI 노출) */
  const applyDevAutofill = useCallback(
    async (
      caseId?: GeneralRegistrationDevAutofillCaseId | TrainedTeachersRegistrationDevAutofillCaseId
    ) => {
      const journalRaw =
        getProgramRegistrationOverlayRecord()[
          'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled'
        ]
      const trainedTeachersEducationJournalEnabled =
        journalRaw === 'yes' || journalRaw === 'no' ? journalRaw : undefined
      const patch = await applyDevProgramRegistrationAutofill(
        programRegistrationFormVariant,
        {
          curriculumSessionCount,
          curriculumChartSessionCount,
          scheduleCurriculumDetailCount,
          scheduleCurriculumGroupCount,
          participantOrganization: participant.organization,
          programType,
          sessionRoundType,
          teacherTrainingEnabled: trainedTeachersTeacherTrainingEnabled,
          participant,
        },
        programRegistrationFormVariant === 'general' && caseId != null
          ? { caseId: caseId as GeneralRegistrationDevAutofillCaseId }
          : programRegistrationFormVariant === 'trainedTeachers'
            ? {
                trainedTeachersCaseId:
                  (caseId as TrainedTeachersRegistrationDevAutofillCaseId | undefined) ?? 1,
                trainedTeachersTeacherTrainingEnabled,
                trainedTeachersEducationJournalEnabled,
              }
            : undefined
      )
      setProgramTitleKo(patch.programTitleKo)
      if (patch.sponsorId) setSponsorId(patch.sponsorId)
      if (patch.sponsorContactId) setSponsorContactId(patch.sponsorContactId)
      if (
        programRegistrationFormVariant === 'general' &&
        (patch.sponsorId || patch.sponsorContactId)
      ) {
        patchGeneralRegistrationSponsorSelectionOverlay({
          sponsorId: patch.sponsorId,
          contactSelectValue: patch.sponsorContactId,
        })
      }

      const nextParticipant = patch.participantFlags ?? participant
      if (patch.participantFlags != null) {
        setParticipant({ ...patch.participantFlags })
      }
      const nextLayout = patch.layout
      if (nextLayout != null && programRegistrationFormVariant !== 'economy') {
        setCurriculumSessionCount(nextLayout.curriculumSessionCount)
        setCurriculumChartSessionCount(nextLayout.curriculumChartSessionCount)
        setScheduleCurriculumDetailCount(nextLayout.scheduleCurriculumDetailCount)
        setScheduleCurriculumGroupCount(nextLayout.scheduleCurriculumGroupCount)
        if (programRegistrationFormVariant === 'trainedTeachers') {
          const nextTeacherTrainingEnabled = nextLayout.teacherTrainingEnabled === true
          setTrainedTeachersTeacherTrainingEnabled(nextTeacherTrainingEnabled)
          setScheduleCurriculumPreEducation(nextTeacherTrainingEnabled)
        }
      }

      const typeSettings = patch.typeSettings
      if (typeSettings == null) return
      const nextProgramType =
        programRegistrationFormVariant === 'economy' ? 'curriculum' : typeSettings.programType
      setProgramType(nextProgramType)
      setSessionRoundType(typeSettings.sessionRoundType)
      setEducationScheduleMode(typeSettings.educationScheduleMode)
      setEducationFormScheduleDetail(typeSettings.educationFormScheduleDetail)
      const nextParticipationScheduleDetail = shouldResetParticipationScheduleDetailForAudience(
        nextParticipant
      )
        ? 'common'
        : typeSettings.participationScheduleDetail
      setParticipationScheduleDetail(nextParticipationScheduleDetail)
      setIpsScheduleDetail(typeSettings.ipsScheduleDetail)
      if (programRegistrationFormVariant === 'general' && nextProgramType === 'schedule') {
        updateProgramRegistrationOverlayKey(
          'generalRegistration.basicInfo.detailedProgramId',
          () => TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        )
      }
      const participantOrganization =
        nextLayout?.participantOrganization ?? nextParticipant.organization
      setDraft(prev =>
        patchEducationCurriculumParagraph(prev, {
          paragraphTitle:
            nextProgramType === 'schedule' ? '교육 진행 (일정형)' : '교육 진행 (커리큘럼)',
          paragraphDescription:
            nextProgramType === 'schedule'
              ? resolveProgramRegistrationScheduleCurriculumEditDescription({
                  sessionRoundType: typeSettings.sessionRoundType,
                  participantOrganization,
                  educationFormScheduleDetail: typeSettings.educationFormScheduleDetail,
                  participationScheduleDetail: nextParticipationScheduleDetail,
                  ipsScheduleDetail: typeSettings.ipsScheduleDetail,
                })
              : programRegistrationFormVariant === 'general'
                ? resolveProgramRegistrationCurriculumRegistrationDescription(typeSettings.sessionRoundType)
                : '차시 별 정보를 입력해 주세요',
        })
      )
      if (programRegistrationFormVariant === 'general') {
        patchGeneralWizardRhf(values => ({
          ...values,
          extras: {
            ...values.extras,
            programType: nextProgramType,
            sessionRoundType: typeSettings.sessionRoundType,
            educationScheduleMode: typeSettings.educationScheduleMode,
            educationFormScheduleDetail: typeSettings.educationFormScheduleDetail,
            participationScheduleDetail: nextParticipationScheduleDetail,
            ipsScheduleDetail: typeSettings.ipsScheduleDetail,
            curriculumSessionCount:
              nextLayout?.curriculumSessionCount ?? values.extras.curriculumSessionCount,
            curriculumChartSessionCount:
              nextLayout?.curriculumChartSessionCount ?? values.extras.curriculumChartSessionCount,
            scheduleCurriculumDetailCount:
              nextLayout?.scheduleCurriculumDetailCount ??
              values.extras.scheduleCurriculumDetailCount,
            scheduleCurriculumGroupCount:
              nextLayout?.scheduleCurriculumGroupCount ??
              values.extras.scheduleCurriculumGroupCount,
            participant: nextParticipant,
          },
        }))
      }
      if (
        programRegistrationFormVariant === 'general' ||
        programRegistrationFormVariant === 'trainedTeachers'
      ) {
        syncInstitutionApplicationBridgeForRegistrationWizard({
          registrationFormVariant: programRegistrationFormVariant,
          programType: nextProgramType,
          sessionRound: typeSettings.sessionRoundType,
          educationScheduleMode: typeSettings.educationScheduleMode,
          recruitTemplateCode:
            programRegistrationFormVariant === 'trainedTeachers'
              ? 'recruitment-trained-teachers'
              : 'recruitment-participant-school',
          curriculumSessionCount: nextLayout?.curriculumSessionCount ?? curriculumSessionCount,
          curriculumChartSessionCount:
            nextLayout?.curriculumChartSessionCount ?? curriculumChartSessionCount,
        })
      }
    },
    [
      curriculumChartSessionCount,
      curriculumSessionCount,
      participant,
      patchGeneralWizardRhf,
      programRegistrationFormVariant,
      programType,
      scheduleCurriculumDetailCount,
      scheduleCurriculumGroupCount,
      sessionRoundType,
      trainedTeachersTeacherTrainingEnabled,
    ]
  )

  /** 등록 완료 — 프로그램 생성 POST 1회 */
  const handleCompleteRegistration = useCallback(
    (
      options?: import('@/features/program/general/lib/prepare-registration-create-form-bindings').CompleteRegistrationBindingOptions
    ): Promise<void> => {
      if (completionPromiseRef.current) return completionPromiseRef.current
      if (!onRegistrationSaved) {
        return Promise.resolve(handleSave())
      }
      const isRemoteCreate =
        (programRegistrationFormVariant === 'general' && shouldUseGeneralProgramsRemoteApi()) ||
        (programRegistrationFormVariant === 'economy' && shouldUseCompanySchoolRemoteApi()) ||
        (programRegistrationFormVariant === 'trainedTeachers' &&
          shouldUseTrainedTeacherProgramsRemoteApi())
      // React state가 비어도 overlay에 남은 선택을 사용 (스텝 전환·draft 복원 불일치 대비)
      const resolvedSponsorId =
        programRegistrationFormVariant === 'trainedTeachers'
          ? sponsorId.trim() ||
            peekTrainedTeachersRegistrationRhf()?.getValues().sponsorManagementIds[0]?.trim() ||
            ''
          : programRegistrationFormVariant === 'economy'
            ? sponsorId.trim() ||
              peekCompanySchoolRegistrationRhf()?.getValues().sponsorId.trim() ||
              ''
            : sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
      if (isRemoteCreate && !resolvedSponsorId) {
        showAlert({
          title: '등록 실패',
          content: '후원사를 선택한 뒤 다시 등록해 주세요.',
        })
        return Promise.resolve()
      }
      if (resolvedSponsorId && resolvedSponsorId !== sponsorId.trim()) {
        setSponsorId(resolvedSponsorId)
      }
      const completion = (async () => {
        const endOverlay = beginBlockingOverlay()
        try {
          const paymentItems = await normalizeOverlayPaymentItemsBeforeSubmit(
            getProgramRegistrationOverlayRecord(),
            [
              {
                valuesKey: 'generalRegistration.wageInfo.paymentItemValues',
                labelsKey: 'generalRegistration.wageInfo.paymentItemLabels',
              },
              { valuesKey: 'economyRegistration.wageInfo.paymentItemValues' },
            ]
          )
          if (Object.keys(paymentItems.patch).length > 0) {
            patchProgramRegistrationOverlay(paymentItems.patch)
          }
          if (paymentItems.clearedKeys.length > 0) {
            showAlert(PAYMENT_ITEM_RESELECT_ALERT)
            return
          }
          const registrationSnapshotArgs = {
            id: registrationPendingSnapshotId(programRegistrationFormVariant),
            participant,
            programType,
            variant: programRegistrationFormVariant,
            sponsorId: resolvedSponsorId || undefined,
            title: resolveProgramTitleKo() || undefined,
            sessionRoundType,
            educationScheduleMode,
            educationScheduleLines:
              programType === 'schedule' && sessionRoundType === 'multi'
                ? []
                : readGeneralRegistrationOverlayScheduleLines(),
            scheduleCurriculumDetailCount: scheduleCurriculumDetailCount,
            editorExtras: {
              educationFormScheduleDetail,
              participationScheduleDetail,
              ipsScheduleDetail,
              curriculumSessionCount,
              curriculumChartSessionCount,
              scheduleCurriculumPreEducation:
                programRegistrationFormVariant === 'trainedTeachers'
                  ? trainedTeachersTeacherTrainingEnabled
                  : scheduleCurriculumPreEducation,
              participantOrganization: participant.organization,
              teacherTrainingEnabled:
                programRegistrationFormVariant === 'trainedTeachers'
                  ? trainedTeachersTeacherTrainingEnabled
                  : undefined,
            },
          } as const

          const { shouldUseRegistrationCreateFormBindings } =
            await import('@/features/program/general/lib/registration-create-form-bindings-capabilities')
          const usesRemoteFormBindings =
            shouldUseRegistrationCreateFormBindings() &&
            (programRegistrationFormVariant === 'general' ||
              programRegistrationFormVariant === 'trainedTeachers' ||
              programRegistrationFormVariant === 'economy') &&
            usesRegistrationWizardDraft &&
            registrationWizardProgramType != null &&
            isRemoteCreate

          let preparedFormBindings:
            | import('@/features/program/general/lib/build-registration-create-form-bindings').RegistrationCreateFormBindingsPayload
            | null
            | undefined

          const snapshotFromRegistration = () => {
            if (programRegistrationFormVariant === 'trainedTeachers') {
              const fromRhf = buildTrainedTeachersWizardCreateProgram(registrationSnapshotArgs.id)
              if (fromRhf == null) {
                throw new Error('trainedTeachers registration RHF is not mounted')
              }
              return fromRhf
            }
            if (programRegistrationFormVariant === 'economy') {
              // C11: CREATE는 운영 기간 없이 만들지 않는다(1/1~12/31 대체 금지).
              const fromRhf = buildCompanySchoolWizardCreateProgram(registrationSnapshotArgs.id, {
                requireOperationRange: true,
              })
              if (fromRhf == null) {
                throw new Error('companySchool registration RHF is not mounted')
              }
              return fromRhf
            }
            return (
              buildGeneralWizardCreateProgram(registrationSnapshotArgs.id) ??
              buildGeneralProgramListRowFromRegistrationSnapshot(registrationSnapshotArgs)
            )
          }

          if (usesRemoteFormBindings && templateCode) {
            const program = snapshotFromRegistration()
            // R2: 일반은 CREATE 빌더와 같은 overlay 객체, 1사1교는 RHF 직렬화, TT는 없음
            const csRhfForFormVersion =
              programRegistrationFormVariant === 'economy'
                ? peekCompanySchoolRegistrationRhf()
                : null
            const overlay = resolveRegistrationFormVersionOverlay({
              variant: programRegistrationFormVariant,
              createProgramOverlay:
                programRegistrationFormVariant === 'general'
                  ? program.registrationOverlay
                  : undefined,
              companySchoolOverlay: csRhfForFormVersion
                ? serializeCompanySchoolRegistrationForFormVersion(csRhfForFormVersion.getValues())
                : null,
              readStoreOverlay: getProgramRegistrationOverlayRecord,
            })
            const editorState = buildProgramRegistrationEditorState({
              participant,
              programType,
              sessionRoundType,
              educationFormScheduleDetail,
              participationScheduleDetail,
              ipsScheduleDetail,
              curriculumSessionCount,
              curriculumChartSessionCount,
              scheduleCurriculumDetailCount,
              scheduleCurriculumGroupCount,
              scheduleCurriculumPreEducation,
              trainedTeachersTeacherTrainingEnabled,
              educationScheduleMode,
              sponsorId: resolvedSponsorId,
              sponsorContactId:
                sponsorContactId.trim() ||
                readRegistrationOverlaySponsorContactId(programRegistrationFormVariant),
              programTitleKo: resolveProgramTitleKo(),
              activeParagraphId,
            })
            const { prepareRegistrationCreateFormBindings } =
              await import('@/features/program/general/lib/prepare-registration-create-form-bindings')
            let operationalOverrides = options?.operationalOverrides
            if (programRegistrationFormVariant === 'trainedTeachers') {
              const { createSeedDraftForOperationalCatalogId } = await import(
                '@/features/program/general/lib/registration-operational-form-drafts'
              )
              const { loadRegistrationWizardFormDraft } = await import(
                '@/features/program/general/lib/registration-wizard-form-draft'
              )
              const { trainedTeachersRecruitEditorState } = await import(
                '@/features/program/trained-teachers/lib/recruit-form-state'
              )
              const { serializeTrainedTeachersRecruitmentForFormVersion } = await import(
                '@/features/program/trained-teachers/lib/registration-rhf-recruitment'
              )
              const { serializeTrainedTeachersApplicationForFormVersion } = await import(
                '@/features/program/trained-teachers/lib/registration-rhf-application'
              )
              const { trainedTeachersApplicationEditorState } = await import(
                '@/features/program/trained-teachers/lib/application-form-state'
              )
              const ttRhf = peekTrainedTeachersRegistrationRhf()
              const canonical = ttRhf
                ? buildTrainedTeachersCanonicalFromRhf({
                    id: registrationSnapshotArgs.id,
                    values: ttRhf.getValues(),
                  })
                : importLegacyOverlayToTrainedTeachersCanonical({
                    id: registrationSnapshotArgs.id,
                    editor: {
                      educationStructure: programType,
                      sessionRound: sessionRoundType,
                      educationFormScheduleDetail,
                      participationScheduleDetail,
                      ipsScheduleDetail,
                      curriculumSessionCount,
                      curriculumChartSessionCount,
                      scheduleCurriculumDetailCount,
                      scheduleCurriculumGroupCount,
                      educationScheduleMode,
                      teacherTrainingEnabled: trainedTeachersTeacherTrainingEnabled,
                      participant,
                    },
                    overlay: getProgramRegistrationOverlayRecord(),
                  })
              const recruitSaved = registrationWizardProgramType
                ? await loadRegistrationWizardFormDraft({
                    programType: registrationWizardProgramType,
                    templateCode: 'recruitment-trained-teachers',
                  })
                : null
              const applicationSaved = registrationWizardProgramType
                ? await loadRegistrationWizardFormDraft({
                    programType: registrationWizardProgramType,
                    templateCode: 'application-trained-teachers',
                  })
                : null
              const recruitDraft =
                recruitSaved?.draft ??
                createSeedDraftForOperationalCatalogId('recruitment-trained-teachers')
              const applicationDraft =
                applicationSaved?.draft ??
                createSeedDraftForOperationalCatalogId('application-trained-teachers')
              operationalOverrides = [
                ...(operationalOverrides ?? []),
                ...(recruitDraft
                  ? [
                      {
                        templateCode: 'recruitment-trained-teachers',
                        draft: recruitDraft,
                        overlay: serializeTrainedTeachersRecruitmentForFormVersion(
                          canonical.recruit
                        ),
                        editorState: trainedTeachersRecruitEditorState(canonical.recruit),
                      },
                    ]
                  : []),
                ...(applicationDraft
                  ? [
                      {
                        templateCode: 'application-trained-teachers',
                        draft: applicationDraft,
                        overlay: serializeTrainedTeachersApplicationForFormVersion(
                          canonical.application
                        ),
                        editorState: trainedTeachersApplicationEditorState(canonical.application),
                      },
                    ]
                  : []),
              ]
            }
            if (programRegistrationFormVariant === 'economy') {
              const { createSeedDraftForOperationalCatalogId } = await import(
                '@/features/program/general/lib/registration-operational-form-drafts'
              )
              const { loadRegistrationWizardFormDraft } = await import(
                '@/features/program/general/lib/registration-wizard-form-draft'
              )
              const csRhf = peekCompanySchoolRegistrationRhf()
              const live = csRhf
                ? csRhf.getValues()
                : null
              const imported = live == null ? importLegacyOverlayToCompanySchoolCanonical({}) : null
              const recruitState = live?.recruitment ?? imported?.recruit
              const applicationState = withEmptyCompanySchoolApplicationPreferredSchedule(
                live?.application ??
                  imported?.application ??
                  emptyCompanySchoolApplicationFormState()
              )
              const recruitSaved = registrationWizardProgramType
                ? await loadRegistrationWizardFormDraft({
                    programType: registrationWizardProgramType,
                    templateCode: 'recruitment-economy',
                  })
                : null
              const applicationSaved = registrationWizardProgramType
                ? await loadRegistrationWizardFormDraft({
                    programType: registrationWizardProgramType,
                    templateCode: 'application-economy',
                  })
                : null
              const recruitDraft =
                recruitSaved?.draft ??
                createSeedDraftForOperationalCatalogId('recruitment-economy')
              const sessionApplication = (operationalOverrides ?? []).find(
                item =>
                  item.templateCode === 'application-economy' && item.draft.paragraphs.length > 0
              )
              const applicationDraft =
                sessionApplication?.draft ??
                applicationSaved?.draft ??
                createSeedDraftForOperationalCatalogId('application-economy')
              operationalOverrides = [...(operationalOverrides ?? [])]
              if (recruitState != null && recruitDraft != null) {
                operationalOverrides.push({
                  templateCode: 'recruitment-economy',
                  draft: recruitDraft,
                  overlay: serializeCompanySchoolRecruitmentForFormVersion(recruitState),
                  editorState: companySchoolRecruitEditorState(recruitState),
                })
              }
              if (applicationState != null && applicationDraft != null) {
                operationalOverrides = operationalOverrides.filter(
                  item => item.templateCode !== 'application-economy'
                )
                operationalOverrides.push({
                  templateCode: 'application-economy',
                  draft: applicationDraft,
                  overlay: serializeCompanySchoolApplicationForFormVersion(applicationState),
                  editorState:
                    sessionApplication?.editorState ??
                    companySchoolApplicationEditorState(applicationState),
                })
              }
            }
            preparedFormBindings = await prepareRegistrationCreateFormBindings({
              program,
              registration: { templateCode, draft, overlay, editorState },
              operationalOverrides,
            })
          } else {
            // 로컬(비 remote) 등록 — 서버 draft-owned 양식 PUT 없이 템플릿 초안만 저장한다.
            await persistTemplateDraftIfNeeded()
          }

          const programForCreate = snapshotFromRegistration()
          await logProgramRegistrationCreatePayload({
            program: programForCreate,
            variant: programRegistrationFormVariant,
            preparedFormBindings: preparedFormBindings ?? null,
            stepLabel: '등록 완료',
          })

          const createdProgram = await persistGeneralProgramRegistration({
            draft,
            participant,
            programType,
            variant: programRegistrationFormVariant,
            sponsorId: resolvedSponsorId || undefined,
            title: resolveProgramTitleKo() || undefined,
            sessionRoundType,
            educationScheduleMode,
            educationScheduleLines: registrationSnapshotArgs.educationScheduleLines,
            scheduleCurriculumDetailCount: scheduleCurriculumDetailCount,
            editorExtras: registrationSnapshotArgs.editorExtras,
            preparedFormBindings,
            programOverride:
              programRegistrationFormVariant === 'general' ||
              programRegistrationFormVariant === 'trainedTeachers' ||
              programRegistrationFormVariant === 'economy'
                ? programForCreate
                : undefined,
          })
          resetProgramRegistrationOverlay()
          onRegistrationSaved(createdProgram)
        } catch (error) {
          const dateAlert = isProgramDateOutsideOpenPeriodError(error)
            ? resolveProgramDateOutsideOpenPeriodAlert(error)
            : null
          if (dateAlert) {
            if (!isGlobalApiErrorAlertShown(error)) {
              showAlert({ title: dateAlert.title, content: dateAlert.content })
              publishProgramOperationDateFocus(dateAlert.focus)
            }
          } else {
            showAlert({
              title: '등록 실패',
              content:
                error instanceof CompanySchoolOperationRangeRequiredError
                  ? error.message
                  : getGeneralProgramApiErrorMessage(
                      error,
                      '프로그램 등록 중 오류가 발생했습니다. 다시 시도해 주세요.'
                    ),
            })
          }
        } finally {
          endOverlay()
          completionPromiseRef.current = null
        }
      })()
      completionPromiseRef.current = completion
      return completion
    },
    [
      buildGeneralWizardCreateProgram,
      buildTrainedTeachersWizardCreateProgram,
      buildCompanySchoolWizardCreateProgram,
      curriculumChartSessionCount,
      curriculumSessionCount,
      draft,
      educationFormScheduleDetail,
      educationScheduleMode,
      handleSave,
      ipsScheduleDetail,
      onRegistrationSaved,
      participant,
      participationScheduleDetail,
      persistTemplateDraftIfNeeded,
      programRegistrationFormVariant,
      programType,
      resolveProgramTitleKo,
      scheduleCurriculumDetailCount,
      scheduleCurriculumPreEducation,
      scheduleCurriculumGroupCount,
      sessionRoundType,
      showAlert,
      sponsorContactId,
      sponsorId,
      activeParagraphId,
      registrationWizardProgramType,
      templateCode,
      trainedTeachersTeacherTrainingEnabled,
      usesRegistrationWizardDraft,
    ]
  )

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  /** 필수 필드 진단 reason — 콘솔 디버깅용 (`null`=완료, general·economy·trainedTeachers) */
  const getIncompleteRequiredFieldsReason = useCallback((): string | null => {
    if (programRegistrationFormVariant === 'economy') {
      const rhf = peekCompanySchoolRegistrationRhf()
      if (rhf != null) {
        return describeIncompleteCompanySchoolRegistrationRhfRequiredFields(
          rhf.getValues(),
          participant
        )
      }
      return describeIncompleteEconomyProgramRegistrationRequiredFields(
        getProgramRegistrationOverlayRecord(),
        participant
      )
    }
    const overlay = getProgramRegistrationOverlayRecord()
    const resolvedSponsorId =
      sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
    const resolvedContactId =
      sponsorContactId.trim() ||
      readRegistrationOverlaySponsorContactId(programRegistrationFormVariant)
    if (programRegistrationFormVariant === 'trainedTeachers') {
      const ttRhf = peekTrainedTeachersRegistrationRhf()
      if (ttRhf != null) {
        return describeIncompleteTrainedTeachersRegistrationRhfRequiredFields(ttRhf.getValues())
      }
      return describeIncompleteTrainedTeachersProgramRegistrationRequiredFields(overlay, {
        participant,
        programType,
        sessionRoundType,
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail,
        curriculumSessionCount,
        curriculumChartSessionCount,
        scheduleCurriculumDetailCount,
        scheduleCurriculumGroupCount,
        teacherTrainingEnabled: trainedTeachersTeacherTrainingEnabled,
        educationScheduleMode,
        sponsorId: resolvedSponsorId,
        sponsorContactId: resolvedContactId,
        programTitleKo: resolveProgramTitleKo(),
      })
    }
    if (programRegistrationFormVariant !== 'general') return null
    const ctx = generalRequiredFieldContext()
    const rhf = peekGeneralRegistrationWizardRhf()
    if (rhf != null) {
      return listIncompleteRegistrationWizardRequiredFields(rhf.getValues(), ctx)[0] ?? null
    }
    return describeIncompleteGeneralProgramRegistrationRequiredFields(overlay, ctx)
  }, [
    curriculumChartSessionCount,
    curriculumSessionCount,
    educationFormScheduleDetail,
    educationScheduleMode,
    generalRequiredFieldContext,
    ipsScheduleDetail,
    participant,
    participationScheduleDetail,
    programRegistrationFormVariant,
    programType,
    resolveProgramTitleKo,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation,
    sessionRoundType,
    sponsorContactId,
    sponsorId,
    trainedTeachersTeacherTrainingEnabled,
  ])

  const hasIncompleteRequiredFields = useCallback(() => {
    if (programRegistrationFormVariant === 'economy') {
      const rhf = peekCompanySchoolRegistrationRhf()
      if (rhf != null) {
        return hasIncompleteCompanySchoolRegistrationRhfRequiredFields(rhf.getValues(), participant)
      }
      return getIncompleteRequiredFieldsReason() != null
    }
    if (programRegistrationFormVariant === 'general') {
      const rhf = peekGeneralRegistrationWizardRhf()
      if (rhf != null) {
        return hasIncompleteRegistrationWizardRequiredFields(
          rhf.getValues(),
          generalRequiredFieldContext()
        )
      }
    }
    if (
      programRegistrationFormVariant !== 'general' &&
      programRegistrationFormVariant !== 'trainedTeachers'
    ) {
      return false
    }
    return getIncompleteRequiredFieldsReason() != null
  }, [
    generalRequiredFieldContext,
    getIncompleteRequiredFieldsReason,
    participant,
    programRegistrationFormVariant,
  ])

  const listIncompleteRequiredFieldKeys = useCallback((): string[] => {
    if (programRegistrationFormVariant === 'economy') {
      const rhf = peekCompanySchoolRegistrationRhf()
      if (rhf != null) {
        return listIncompleteCompanySchoolRegistrationRhfRequiredFields(rhf.getValues(), participant)
      }
      return listIncompleteEconomyProgramRegistrationRequiredFields(
        getProgramRegistrationOverlayRecord(),
        participant
      )
    }
    const overlay = getProgramRegistrationOverlayRecord()
    const resolvedSponsorId =
      sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
    const resolvedContactId =
      sponsorContactId.trim() ||
      readRegistrationOverlaySponsorContactId(programRegistrationFormVariant)
    if (programRegistrationFormVariant === 'trainedTeachers') {
      const ttRhf = peekTrainedTeachersRegistrationRhf()
      if (ttRhf != null) {
        return listIncompleteTrainedTeachersRegistrationRhfRequiredFieldReasons(ttRhf.getValues())
      }
      return listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons(overlay, {
        participant,
        programType,
        sessionRoundType,
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail,
        curriculumSessionCount,
        curriculumChartSessionCount,
        scheduleCurriculumDetailCount,
        scheduleCurriculumGroupCount,
        teacherTrainingEnabled: trainedTeachersTeacherTrainingEnabled,
        educationScheduleMode,
        sponsorId: resolvedSponsorId,
        sponsorContactId: resolvedContactId,
        programTitleKo: resolveProgramTitleKo(),
      })
    }
    if (programRegistrationFormVariant !== 'general') return []
    const ctx = generalRequiredFieldContext()
    const rhf = peekGeneralRegistrationWizardRhf()
    if (rhf != null) {
      return listIncompleteRegistrationWizardRequiredFields(rhf.getValues(), ctx)
    }
    return listIncompleteGeneralProgramRegistrationRequiredFields(overlay, {
      ...ctx,
      requireBasicInfoRadioSelection: usesRegistrationWizardDraft,
    })
  }, [
    curriculumChartSessionCount,
    curriculumSessionCount,
    educationFormScheduleDetail,
    educationScheduleMode,
    generalRequiredFieldContext,
    ipsScheduleDetail,
    participant,
    participationScheduleDetail,
    programRegistrationFormVariant,
    programType,
    resolveProgramTitleKo,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation,
    sessionRoundType,
    sponsorContactId,
    sponsorId,
    trainedTeachersTeacherTrainingEnabled,
    usesRegistrationWizardDraft,
  ])

  const hasCurriculumMultiDateScheduleCountMismatchOnDraft = useCallback(() => {
    if (
      programRegistrationFormVariant !== 'general' &&
      programRegistrationFormVariant !== 'trainedTeachers'
    ) {
      return false
    }
    const overlay = getProgramRegistrationOverlayRecord()
    const resolvedSponsorId =
      sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
    const resolvedContactId =
      sponsorContactId.trim() ||
      readRegistrationOverlaySponsorContactId(programRegistrationFormVariant)
    if (programRegistrationFormVariant === 'trainedTeachers') {
      const ttRhf = peekTrainedTeachersRegistrationRhf()
      if (ttRhf != null) {
        return hasTrainedTeachersRegistrationRhfCurriculumScheduleCountMismatch(ttRhf.getValues())
      }
      return hasCurriculumMultiDateScheduleCountMismatch(
        normalizeRegistrationOverlayForApply(overlay, 'trainedTeachers'),
        {
          participant,
          programType,
          sessionRoundType,
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail,
          curriculumSessionCount,
          curriculumChartSessionCount,
          scheduleCurriculumDetailCount,
          scheduleCurriculumGroupCount,
          scheduleCurriculumPreEducation: trainedTeachersTeacherTrainingEnabled,
          educationScheduleMode,
          sponsorId: resolvedSponsorId,
          sponsorContactId: resolvedContactId,
          programTitleKo: resolveProgramTitleKo(),
          omitKpiAndWage: true,
          allowEmptySponsor: true,
          preEducationDisplayMode: 'replaceFirst',
        }
      )
    }
    const ctx = generalRequiredFieldContext()
    const rhf = peekGeneralRegistrationWizardRhf()
    if (rhf != null) {
      return hasRegistrationWizardCurriculumScheduleCountMismatch(rhf.getValues(), ctx)
    }
    return hasCurriculumMultiDateScheduleCountMismatch(overlay, ctx)
  }, [
    curriculumChartSessionCount,
    curriculumSessionCount,
    educationFormScheduleDetail,
    educationScheduleMode,
    generalRequiredFieldContext,
    ipsScheduleDetail,
    participant,
    participationScheduleDetail,
    programRegistrationFormVariant,
    programType,
    resolveProgramTitleKo,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation,
    sessionRoundType,
    sponsorContactId,
    sponsorId,
    trainedTeachersTeacherTrainingEnabled,
  ])

  return {
    draft,
    programRegistrationFormVariant,
    isDraftLoading,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: isStructureLocked ? seedParagraphIds : undefined,
    pinnedTop,
    sortableMiddle,
    pinnedBottom,
    handleSelectCard,
    onReorderMiddle,
    onTitleNumberingChange,
    updateParagraph,
    middleParagraphActions,
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
    handlePreview,
    handleSave,
    handleCompleteRegistration,
    buildCurrentProgramSnapshot,
    logCurrentRegistrationPayload,
    applyDevAutofill,
    onSelectSingleItemListItem,
    paragraphBodyOptions,
    participant,
    programType,
    sessionRoundType,
    educationScheduleMode,
    curriculumSessionCount,
    curriculumChartSessionCount,
    hasIncompleteRequiredFields,
    listIncompleteRequiredFieldKeys,
    hasCurriculumMultiDateScheduleCountMismatch: hasCurriculumMultiDateScheduleCountMismatchOnDraft,
    getIncompleteRequiredFieldsReason,
    resolveProgramTitleKo,
  }
}

export type ProgramRegistrationEditorViewModel = ReturnType<typeof useProgramRegistrationEditor>
