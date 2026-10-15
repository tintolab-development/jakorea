import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  startTransition,
} from 'react'
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
  resolveProgramRegistrationCurriculumEditDescription,
  resolveProgramRegistrationScheduleCurriculumEditDescription,
} from '@/features/template/lib/program-registration-curriculum-description'
import { buildProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/registration-form/general/paragraph-config'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import {
  buildGeneralProgramListRowFromRegistrationSnapshot,
  registrationPendingSnapshotId,
  persistGeneralProgramRegistration,
} from '@/features/program/general/lib/registration-local-save'
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
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
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
import {
  describeIncompleteGeneralProgramRegistrationRequiredFields,
  listIncompleteGeneralProgramRegistrationRequiredFields,
} from '@/features/program/general/lib/registration-required-fields'
import {
  describeIncompleteTrainedTeachersProgramRegistrationRequiredFields,
  listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons,
} from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import {
  describeIncompleteEconomyProgramRegistrationRequiredFields,
  listIncompleteEconomyProgramRegistrationRequiredFields,
  hasIncompleteEconomyRegistrationFromStore,
} from '@/features/program/general/lib/economy-program-registration-required-fields'
import { applyDevProgramRegistrationAutofill } from '@/features/program/shared/lib/apply-dev-program-registration-autofill'
import type { GeneralRegistrationDevAutofillCaseId } from '@/features/program/general/lib/registration-dev-autofill-cases'
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

const GENERAL_BASIC_INFO_LOCK_NOTICE =
  PROGRAM_REGISTRATION_GENERAL_SECTION_META.basicInfo.editDescription

function withRegistrationBasicInfoDescriptionForVariant(
  draft: WritingFormDraft,
  variant: ProgramRegistrationFormVariant
): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    if (paragraph.id !== PROGRAM_REGISTRATION_IDS.basicInfo) return paragraph
    const current = paragraph.paragraphDescription.trim()
    if (variant === 'general') {
      if (current !== '') return paragraph
      changed = true
      return { ...paragraph, paragraphDescription: GENERAL_BASIC_INFO_LOCK_NOTICE }
    }
    if (current !== GENERAL_BASIC_INFO_LOCK_NOTICE) return paragraph
    changed = true
    return { ...paragraph, paragraphDescription: '' }
  })
  return changed ? { ...draft, paragraphs } : draft
}

function filterProgramRegistrationDraftForVariant(
  draft: WritingFormDraft,
  variant: ProgramRegistrationFormVariant
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
  return withRegistrationBasicInfoDescriptionForVariant(filtered, variant)
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
  const usesGeneralRegistrationControlledFields =
    programRegistrationFormVariant === 'general' && !restrictCurriculumSessionStructure

  const resolveProgramTitleKo = useCallback(
    () => readStoredRegistrationProgramTitleKo(programRegistrationFormVariant, programTitleKo),
    [programTitleKo, programRegistrationFormVariant]
  )

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const applyEditorStateSnapshot = useCallback((state: ProgramRegistrationEditorState) => {
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
    patchRegistrationOverlayProgramTitleKo(
      programRegistrationFormVariant,
      state.programTitleKo ?? ''
    )
  }, [programRegistrationFormVariant])

  const resetRegistrationEditorToSeed = useCallback(() => {
    resetProgramRegistrationOverlay()
    const seeded = filterProgramRegistrationDraftForVariant(
      normalizeWritingFormDraft(createProgramRegistrationDraft(programRegistrationFormVariant)),
      programRegistrationFormVariant
    )
    const next =
      programRegistrationFormVariant === 'economy'
        ? withForcedProgramRegistrationSeedTitleRequired(seeded, seedParagraphIds)
        : seeded
    startTransition(() => {
      setDraft(next)
      setActiveParagraphId(next.paragraphs[0]?.id ?? null)
      setSingleItemListActiveItemId(null)
      applyEditorStateSnapshot(
        createDefaultRegistrationEditorState(programRegistrationFormVariant)
      )
    })
  }, [applyEditorStateSnapshot, programRegistrationFormVariant, seedParagraphIds])

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
              variant
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
    },
    [programRegistrationFormVariant]
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
    },
    [programRegistrationFormVariant]
  )

  const onSessionRoundTypeChange = useCallback(
    (value: ProgramRegistrationSessionRoundType) => {
      setSessionRoundType(value)
      if (value === 'multi') setCurriculumSessionCount(1)
      if (value === 'single') setCurriculumChartSessionCount(1)

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
              : resolveProgramRegistrationCurriculumEditDescription(value),
        })
      )
    },
    [
      educationFormScheduleDetail,
      ipsScheduleDetail,
      participant.organization,
      participationScheduleDetail,
      programRegistrationFormVariant,
      programType,
      restrictCurriculumSessionStructure,
    ]
  )

  const onEducationFormScheduleDetailChange = useCallback(
    (value: ProgramRegistrationScheduleDetailKind) => {
      setEducationFormScheduleDetail(value)
    },
    []
  )

  const onParticipationScheduleDetailChange = useCallback(
    (value: ProgramRegistrationScheduleDetailKind) => {
      setParticipationScheduleDetail(value)
    },
    []
  )

  const onIpsScheduleDetailChange = useCallback((value: ProgramRegistrationScheduleDetailKind) => {
    setIpsScheduleDetail(value)
  }, [])

  const onAddCurriculumSession = useCallback(() => {
    if (restrictCurriculumSessionStructure) return
    setCurriculumSessionCount(c => c + 1)
  }, [restrictCurriculumSessionStructure])

  const onDeleteCurriculumSession = useCallback(
    (_roundIndex: number) => {
      if (restrictCurriculumSessionStructure) return
      setCurriculumSessionCount(c => Math.max(1, c - 1))
    },
    [restrictCurriculumSessionStructure]
  )

  const onAddCurriculumChartSession = useCallback(() => {
    if (
      restrictCurriculumSessionStructure &&
      programRegistrationFormVariant !== 'trainedTeachers'
    ) {
      return
    }
    setCurriculumChartSessionCount(c =>
      Math.min(c + 1, GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT)
    )
  }, [programRegistrationFormVariant, restrictCurriculumSessionStructure])

  const onDeleteCurriculumChartSession = useCallback(
    (chartIndex: number) => {
      if (
        (restrictCurriculumSessionStructure &&
          programRegistrationFormVariant !== 'trainedTeachers') ||
        chartIndex <= 1
      ) {
        return
      }
      setCurriculumChartSessionCount(c => Math.max(1, c - 1))
    },
    [programRegistrationFormVariant, restrictCurriculumSessionStructure]
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
      setDraft(prev =>
        patchEducationCurriculumParagraph(prev, {
          paragraphTitle:
            next === 'schedule' ? '교육 진행 (일정형)' : '교육 진행 (커리큘럼)',
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
                ? resolveProgramRegistrationCurriculumEditDescription(sessionRoundType)
                : '차시 별 정보를 입력해 주세요',
        })
      )
    },
    [
      educationFormScheduleDetail,
      ipsScheduleDetail,
      participant.organization,
      participationScheduleDetail,
      programRegistrationFormVariant,
      sessionRoundType,
    ]
  )

  const onAddScheduleCurriculumDetail = useCallback(() => {
    setScheduleCurriculumDetailCount(c => Math.min(c + 1, 99))
  }, [])

  const onDeleteScheduleCurriculumDetail = useCallback((_detailIndex: number) => {
    setScheduleCurriculumDetailCount(c => Math.max(1, c - 1))
  }, [])

  const onAddScheduleCurriculumGroup = useCallback(() => {
    setScheduleCurriculumGroupCount(c =>
      Math.min(c + 1, PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT)
    )
  }, [])

  const onDeleteScheduleCurriculumGroup = useCallback((_groupIndex: number) => {
    setScheduleCurriculumGroupCount(c => Math.max(1, c - 1))
  }, [])

  const onScheduleCurriculumPreEducationChange = useCallback((checked: boolean) => {
    setScheduleCurriculumPreEducation(checked)
  }, [])

  const onTrainedTeachersTeacherTrainingEnabledChange = useCallback((checked: boolean) => {
    setTrainedTeachersTeacherTrainingEnabled(checked)
    setScheduleCurriculumPreEducation(checked)
  }, [])

  const onEducationScheduleModeChange = useCallback(
    (value: ProgramRegistrationEducationScheduleMode) => {
      setEducationScheduleMode(value)
    },
    []
  )

  const onSponsorIdChange = useCallback((next: string) => {
    setSponsorId(next)
    setSponsorContactId('')
    patchProgramRegistrationOverlay({
      [GENERAL_REGISTRATION_OVERLAY_SPONSOR_ID_KEY]: next,
      [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: '',
    })
  }, [])

  const onSponsorContactIdChange = useCallback((next: string) => {
    setSponsorContactId(next)
    const contactSelectValue = next.trim()
    patchProgramRegistrationOverlay({
      [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_ID_KEY]: contactSelectValue,
      [GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]: contactSelectValue
        ? [contactSelectValue]
        : [],
    })
  }, [])

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
            restrictCurriculumSessionStructure && programRegistrationFormVariant !== 'trainedTeachers'
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
          ...(usesGeneralRegistrationControlledFields
            ? {
                sponsorId,
                onSponsorIdChange,
                sponsorContactId,
                onSponsorContactIdChange,
              }
            : {}),
        },
        {
          hiddenParagraphIds:
            programRegistrationFormVariant === 'trainedTeachers'
              ? new Set<string>([PROGRAM_REGISTRATION_IDS.businessKpi])
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
      usesGeneralRegistrationControlledFields,
      ...(usesGeneralRegistrationControlledFields
        ? [
            sponsorId,
            onSponsorIdChange,
            sponsorContactId,
            onSponsorContactIdChange,
          ]
        : []),
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
    const overlay = { ...getProgramRegistrationOverlayRecord() }
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
      const { persistRegistrationWizardFormDraft } = await import(
        '@/features/program/general/lib/registration-wizard-form-draft'
      )
      await persistRegistrationWizardFormDraft({
        programType: registrationWizardProgramType!,
        templateCode,
        draft,
        overlay,
        editorState,
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
      const resolvedSponsorId =
        sponsorId.trim() || readRegistrationOverlaySponsorId(variant)
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
            variant === 'trainedTeachers'
              ? trainedTeachersTeacherTrainingEnabled
              : undefined,
        },
      })
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
    async (caseId?: GeneralRegistrationDevAutofillCaseId) => {
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
        programRegistrationFormVariant === 'general' && caseId != null ? { caseId } : undefined
      )
      setProgramTitleKo(patch.programTitleKo)
      if (patch.sponsorId) setSponsorId(patch.sponsorId)
      if (patch.sponsorContactId) setSponsorContactId(patch.sponsorContactId)
      if (programRegistrationFormVariant === 'general' && (patch.sponsorId || patch.sponsorContactId)) {
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
      if (nextLayout != null && programRegistrationFormVariant === 'general') {
        setCurriculumSessionCount(nextLayout.curriculumSessionCount)
        setCurriculumChartSessionCount(nextLayout.curriculumChartSessionCount)
        setScheduleCurriculumDetailCount(nextLayout.scheduleCurriculumDetailCount)
        setScheduleCurriculumGroupCount(nextLayout.scheduleCurriculumGroupCount)
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
                ? resolveProgramRegistrationCurriculumEditDescription(typeSettings.sessionRoundType)
                : '차시 별 정보를 입력해 주세요',
        })
      )
      if (programRegistrationFormVariant === 'general') {
        syncInstitutionApplicationBridgeForRegistrationWizard({
          registrationFormVariant: 'general',
          programType: nextProgramType,
          sessionRound: typeSettings.sessionRoundType,
          educationScheduleMode: typeSettings.educationScheduleMode,
          recruitTemplateCode: 'recruitment-participant-school',
        })
      }
    },
    [
    curriculumChartSessionCount,
    curriculumSessionCount,
    participant,
    programRegistrationFormVariant,
    programType,
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    sessionRoundType,
    trainedTeachersTeacherTrainingEnabled,
  ])

  /** 등록 완료 — 프로그램 생성 POST 1회 */
  const handleCompleteRegistration = useCallback((
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
      sponsorId.trim() || readRegistrationOverlaySponsorId(programRegistrationFormVariant)
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

        const { shouldUseRegistrationCreateFormBindings } = await import(
          '@/features/program/general/lib/registration-create-form-bindings-capabilities'
        )
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

        if (usesRemoteFormBindings && templateCode) {
          const program = buildGeneralProgramListRowFromRegistrationSnapshot(registrationSnapshotArgs)
          const overlay = { ...getProgramRegistrationOverlayRecord() }
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
          const { prepareRegistrationCreateFormBindings } = await import(
            '@/features/program/general/lib/prepare-registration-create-form-bindings'
          )
          preparedFormBindings = await prepareRegistrationCreateFormBindings({
            program,
            registration: { templateCode, draft, overlay, editorState },
            operationalOverrides: options?.operationalOverrides,
          })
        } else {
          await persistTemplateDraftIfNeeded()
          if (usesRegistrationWizardDraft && registrationWizardProgramType) {
            const program = buildGeneralProgramListRowFromRegistrationSnapshot(registrationSnapshotArgs)
            const { persistRegistrationOperationalOverlaySnapshots } = await import(
              '@/features/program/general/lib/registration-operational-form-drafts'
            )
            await persistRegistrationOperationalOverlaySnapshots(program)
          }
        }

        const programForCreate = buildGeneralProgramListRowFromRegistrationSnapshot({
          ...registrationSnapshotArgs,
          id: registrationSnapshotArgs.id,
        })
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
        })
        resetProgramRegistrationOverlay()
        onRegistrationSaved(createdProgram)
      } catch (error) {
        showAlert({
          title: '등록 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '프로그램 등록 중 오류가 발생했습니다. 다시 시도해 주세요.'
          ),
        })
      } finally {
        endOverlay()
        completionPromiseRef.current = null
      }
    })()
    completionPromiseRef.current = completion
    return completion
  }, [
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
  ])

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  /** 필수 필드 진단 reason — 콘솔 디버깅용 (`null`=완료, general·economy·trainedTeachers) */
  const getIncompleteRequiredFieldsReason = useCallback((): string | null => {
    if (programRegistrationFormVariant === 'economy') {
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
    return describeIncompleteGeneralProgramRegistrationRequiredFields(overlay, {
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
    })
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
    trainedTeachersTeacherTrainingEnabled,
  ])

  const hasIncompleteRequiredFields = useCallback(() => {
    if (programRegistrationFormVariant === 'economy') {
      return hasIncompleteEconomyRegistrationFromStore(participant)
    }
    if (
      programRegistrationFormVariant !== 'general' &&
      programRegistrationFormVariant !== 'trainedTeachers'
    ) {
      return false
    }
    return getIncompleteRequiredFieldsReason() != null
  }, [getIncompleteRequiredFieldsReason, participant, programRegistrationFormVariant])

  const listIncompleteRequiredFieldKeys = useCallback((): string[] => {
    if (programRegistrationFormVariant === 'economy') {
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
    return listIncompleteGeneralProgramRegistrationRequiredFields(overlay, {
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
    })
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
    hasIncompleteRequiredFields,
    listIncompleteRequiredFieldKeys,
    getIncompleteRequiredFieldsReason,
    resolveProgramTitleKo,
  }
}

export type ProgramRegistrationEditorViewModel = ReturnType<typeof useProgramRegistrationEditor>
