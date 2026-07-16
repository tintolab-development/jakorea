import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  applyGeneralParticipantAudienceSelection,
  shouldResetParticipationScheduleDetailForAudience,
} from '@/features/program/general/lib/participant-audience-selection'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import {
  createAgreementExplanationTextParagraphForInsert,
  duplicateMiddleParagraph,
  insertMiddleParagraphAfter,
  pickActiveParagraphIdAfterMiddleDelete,
  removeMiddleParagraph,
} from '@/features/template/lib/writing-form-middle-paragraph-mutations'
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
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { resolveProgramRegistrationCurriculumEditDescription } from '@/features/template/lib/program-registration-curriculum-description'
import { buildProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/registration-form/general/paragraph-config'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseCompanySchoolRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { persistGeneralProgramRegistration } from '@/features/program/general/lib/registration-local-save'
import type { Program } from '@/types/domain'
import {
  applyProgramRegistrationEditorState,
  buildProgramRegistrationEditorState,
  type ProgramRegistrationEditorState,
} from '@/features/template/lib/program-registration-editor-state'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import { useCmsAlert } from '@/shared/ui'

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
    trainedTeachersTeacherTrainingEnabled: true,
    educationScheduleMode: getDefaultEducationScheduleMode(variant),
    sponsorId: '',
    sponsorContactId: '',
    activeParagraphId: null,
  }
}

function useProgramRegistrationMiddleActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>,
  seedParagraphIds: ReadonlySet<string>
) {
  const appendBasicTitleParagraph = useCallback(
    (paragraphId?: string) => {
      const newId = crypto.randomUUID()
      const insert = createAgreementExplanationTextParagraphForInsert(newId)
      let inserted = false
      setDraft(prev => {
        const targetId = paragraphId ?? prev.paragraphs[prev.paragraphs.length - 1]?.id
        if (targetId == null) return prev
        const next = insertMiddleParagraphAfter(prev.paragraphs, targetId, insert)
        if (next == null) return prev
        inserted = true
        return { ...prev, paragraphs: next }
      })
      if (inserted) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId]
  )

  const onAddAfter = useCallback(
    (paragraphId: string) => {
      appendBasicTitleParagraph(paragraphId)
    },
    [appendBasicTitleParagraph]
  )

  const onDuplicate = useCallback(
    (paragraphId: string) => {
      if (seedParagraphIds.has(paragraphId)) {
        return
      }
      const newId = crypto.randomUUID()
      let duplicated = false
      setDraft(prev => {
        const next = duplicateMiddleParagraph(prev.paragraphs, paragraphId, newId)
        if (next == null) {
          return prev
        }
        duplicated = true
        return { ...prev, paragraphs: next }
      })
      if (duplicated) setActiveParagraphId(newId)
    },
    [setDraft, setActiveParagraphId, seedParagraphIds]
  )

  const onDelete = useCallback(
    (paragraphId: string) => {
      if (seedParagraphIds.has(paragraphId)) {
        return
      }
      let nextActive: string | null = null
      setDraft(prev => {
        const next = removeMiddleParagraph(prev.paragraphs, paragraphId)
        if (next == null) {
          return prev
        }
        nextActive = pickActiveParagraphIdAfterMiddleDelete(prev.paragraphs, paragraphId)
        return { ...prev, paragraphs: next }
      })
      if (nextActive != null) setActiveParagraphId(nextActive)
    },
    [setDraft, setActiveParagraphId, seedParagraphIds]
  )

  return useMemo(
    () => ({
      onAddAfter,
      onDuplicate,
      onDelete,
      appendBasicTitleParagraph,
    }),
    [appendBasicTitleParagraph, onAddAfter, onDelete, onDuplicate]
  )
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

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(createProgramRegistrationDraft(programRegistrationFormVariant))
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    () =>
      normalizeWritingFormDraft(createProgramRegistrationDraft(programRegistrationFormVariant))
        .paragraphs[0]?.id ?? null
  )
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
    useState(true)
  const defaultEducationScheduleMode: ProgramRegistrationEducationScheduleMode =
    getDefaultEducationScheduleMode(programRegistrationFormVariant)
  const [educationScheduleMode, setEducationScheduleMode] =
    useState<ProgramRegistrationEducationScheduleMode>(defaultEducationScheduleMode)
  const [sponsorId, setSponsorId] = useState('')
  const [sponsorContactId, setSponsorContactId] = useState('')

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  useEffect(() => {
    if (!active) return
    if (programRegistrationFormVariant === 'general') {
      patchInstitutionApplicationProgramBridge({
        educationStructure: programType,
        sessionRound: sessionRoundType,
        educationScheduleMode,
      })
      return
    }
    if (programRegistrationFormVariant === 'trainedTeachers') {
      patchInstitutionApplicationProgramBridge({
        preEducationNoticeRequired: true,
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode,
      })
      return
    }
    patchInstitutionApplicationProgramBridge({
      preEducationNoticeRequired: true,
      maxScheduleCount: 2,
      maxSessionsPerDay: 2,
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
    })
  }, [active, programRegistrationFormVariant, programType, sessionRoundType, educationScheduleMode])

  const applyEditorStateSnapshot = useCallback((state: ProgramRegistrationEditorState) => {
    setParticipant(state.participant)
    setProgramType(state.programType)
    setSessionRoundType(state.sessionRoundType)
    setEducationFormScheduleDetail(state.educationFormScheduleDetail)
    setParticipationScheduleDetail(state.participationScheduleDetail)
    setIpsScheduleDetail(state.ipsScheduleDetail)
    setCurriculumSessionCount(state.curriculumSessionCount)
    setCurriculumChartSessionCount(state.curriculumChartSessionCount)
    setScheduleCurriculumDetailCount(state.scheduleCurriculumDetailCount)
    setScheduleCurriculumGroupCount(state.scheduleCurriculumGroupCount)
    setScheduleCurriculumPreEducation(state.scheduleCurriculumPreEducation)
    setTrainedTeachersTeacherTrainingEnabled(state.trainedTeachersTeacherTrainingEnabled)
    setEducationScheduleMode(state.educationScheduleMode)
    setSponsorId(state.sponsorId ?? '')
    setSponsorContactId(state.sponsorContactId ?? '')
  }, [])

  const resetRegistrationEditorToSeed = useCallback(() => {
    const next = normalizeWritingFormDraft(
      createProgramRegistrationDraft(programRegistrationFormVariant)
    )
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
    applyEditorStateSnapshot(
      createDefaultRegistrationEditorState(programRegistrationFormVariant)
    )
  }, [applyEditorStateSnapshot, programRegistrationFormVariant])

  useEffect(() => {
    if (!active) return

    if (usesTemplateDraftApi && templateCode) {
      let cancelled = false
      const defaults = createDefaultRegistrationEditorState(programRegistrationFormVariant)

      void loadWritingFormTemplateDraft(templateCode).then(saved => {
        if (cancelled) return
        if (saved?.draft) {
          const normalized = normalizeWritingFormDraft(saved.draft)
          setDraft(normalized)
          const restored = applyProgramRegistrationEditorState(saved.editorState, defaults)
          applyEditorStateSnapshot(restored)
          setActiveParagraphId(
            restored.activeParagraphId ?? normalized.paragraphs[0]?.id ?? null
          )
          setSingleItemListActiveItemId(null)
          return
        }
        resetRegistrationEditorToSeed()
      })

      return () => {
        cancelled = true
      }
    }

    resetRegistrationEditorToSeed()
  }, [
    active,
    applyEditorStateSnapshot,
    programRegistrationFormVariant,
    resetRegistrationEditorToSeed,
    templateCode,
    usesTemplateDraftApi,
  ])

  useEffect(() => {
    if (!active) closeWritingUserPreview()
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

  const onReorderMiddle = useCallback((dragId: string, overId: string) => {
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
  }, [])

  const onTitleNumberingChange = useCallback((style: FormTitleNumberingStyle) => {
    setDraft(prev => ({
      ...prev,
      formSettings: { ...prev.formSettings, titleNumbering: style },
    }))
  }, [])

  const middleParagraphActions = useProgramRegistrationMiddleActions(
    setDraft,
    setActiveParagraphId,
    seedParagraphIds
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

  const onIndividualChange = useCallback((checked: boolean) => {
    setParticipant(prev => {
      const next = applyGeneralParticipantAudienceSelection('individual', checked)
      if (shouldResetParticipationScheduleDetailForAudience(next)) {
        setParticipationScheduleDetail('common')
      }
      return { ...prev, individual: next.individual, organization: next.organization }
    })
  }, [])

  const onOrganizationChange = useCallback((checked: boolean) => {
    setParticipant(prev => {
      const next = applyGeneralParticipantAudienceSelection('organization', checked)
      if (shouldResetParticipationScheduleDetailForAudience(next)) {
        setParticipationScheduleDetail('common')
      }
      return { ...prev, individual: next.individual, organization: next.organization }
    })
  }, [])

  const onTeacherInstructorChange = useCallback((checked: boolean) => {
    setParticipant(prev => ({ ...prev, teacherInstructor: checked }))
  }, [])

  const onVolunteerChange = useCallback((checked: boolean) => {
    setParticipant(prev => ({ ...prev, volunteer: checked }))
  }, [])

  const onSessionRoundTypeChange = useCallback(
    (value: ProgramRegistrationSessionRoundType) => {
      setSessionRoundType(value)
      if (value === 'multi') setCurriculumSessionCount(1)
      if (value === 'single') setCurriculumChartSessionCount(1)

      if (programRegistrationFormVariant !== 'general') return
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== PROGRAM_REGISTRATION_IDS.educationCurriculum) return p
          if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return p
          const ht = p as HorizontalTableParagraph
          if (programType === 'schedule') return p
          return {
            ...ht,
            paragraphDescription: resolveProgramRegistrationCurriculumEditDescription(value),
          }
        }),
      }))
    },
    [programRegistrationFormVariant, programType, restrictCurriculumSessionStructure]
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
      if (programRegistrationFormVariant !== 'general' && next !== 'curriculum') return
      setProgramType(next)
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== PROGRAM_REGISTRATION_IDS.educationCurriculum) return p
          if (p.kind !== 'single_item' || p.variant !== 'horizontal_table') return p
          const ht = p as HorizontalTableParagraph
          if (next === 'schedule') {
            return {
              ...ht,
              paragraphTitle: '교육 진행 (일정형)',
              paragraphDescription: '',
            }
          }
          return {
            ...ht,
            paragraphTitle: '교육 진행 (커리큘럼)',
            paragraphDescription:
              programRegistrationFormVariant === 'general'
                ? resolveProgramRegistrationCurriculumEditDescription(sessionRoundType)
                : '',
          }
        }),
      }))
    },
    [programRegistrationFormVariant]
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
  }, [])

  const onSponsorContactIdChange = useCallback((next: string) => {
    setSponsorContactId(next)
  }, [])

  const paragraphBodyOptions = useMemo(
    () =>
      buildProgramRegistrationParagraphBodyOptions({
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
        ...(programRegistrationFormVariant === 'general'
          ? {
              sponsorId,
              onSponsorIdChange,
              sponsorContactId,
              onSponsorContactIdChange,
            }
          : {}),
      }),
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
      sponsorId,
      onSponsorIdChange,
      sponsorContactId,
      onSponsorContactIdChange,
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
    await persistWritingFormTemplateDraft({
      templateId: templateCode,
      draft,
      editorState: buildProgramRegistrationEditorState({
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
        sponsorId,
        sponsorContactId,
        activeParagraphId,
      }),
    })
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
    scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation,
    sessionRoundType,
    sponsorContactId,
    sponsorId,
    templateCode,
    trainedTeachersTeacherTrainingEnabled,
    usesTemplateDraftApi,
  ])

  /** 중간 저장 — template draft만. 프로그램 POST는 handleCompleteRegistration에서만. */
  const handleSave = useCallback(async () => {
    try {
      await persistTemplateDraftIfNeeded()
      if (onRegistrationSaved) {
        if (usesTemplateDraftApi) {
          showAlert({
            title: '저장',
            content: '작성 중인 양식이 저장되었습니다.',
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
      showAlert({
        title: '저장 실패',
        content: '양식 저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    }
  }, [
    onRegistrationSaved,
    onTemplateDraftSaveConfirmed,
    persistTemplateDraftIfNeeded,
    showAlert,
    usesTemplateDraftApi,
  ])

  /** 등록 완료 — 프로그램 생성 POST 1회 */
  const handleCompleteRegistration = useCallback((): Promise<void> => {
    if (completionPromiseRef.current) return completionPromiseRef.current
    if (!onRegistrationSaved) {
      return Promise.resolve(handleSave())
    }
    const isRemoteCreate =
      (programRegistrationFormVariant === 'general' && shouldUseGeneralProgramsRemoteApi()) ||
      (programRegistrationFormVariant === 'economy' && shouldUseCompanySchoolRemoteApi()) ||
      (programRegistrationFormVariant === 'trainedTeachers' &&
        shouldUseTrainedTeacherProgramsRemoteApi())
    if (isRemoteCreate && !sponsorId.trim()) {
      showAlert({
        title: '등록 실패',
        content: '후원사를 선택한 뒤 다시 등록해 주세요.',
      })
      return Promise.resolve()
    }
    const completion = (async () => {
      try {
        await persistTemplateDraftIfNeeded()
        const createdProgram = await persistGeneralProgramRegistration({
          draft,
          participant,
          programType,
          variant: programRegistrationFormVariant,
          sponsorId: sponsorId.trim() || undefined,
        })
        onRegistrationSaved(createdProgram)
      } catch (error) {
        console.debug('programRegistrationEditor complete registration failed', error)
        showAlert({
          title: '등록 실패',
          content: getGeneralProgramApiErrorMessage(
            error,
            '프로그램 등록 중 오류가 발생했습니다. 다시 시도해 주세요.'
          ),
        })
      } finally {
        completionPromiseRef.current = null
      }
    })()
    completionPromiseRef.current = completion
    return completion
  }, [
    draft,
    handleSave,
    onRegistrationSaved,
    participant,
    persistTemplateDraftIfNeeded,
    programRegistrationFormVariant,
    programType,
    showAlert,
    sponsorId,
  ])

  const onSelectSingleItemListItem = useCallback((paragraphId: string, itemId: string | null) => {
    setActiveParagraphId(paragraphId)
    setSingleItemListActiveItemId(itemId)
  }, [])

  return {
    draft,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: seedParagraphIds,
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
    onSelectSingleItemListItem,
    paragraphBodyOptions,
    participant,
    programType,
    sessionRoundType,
    educationScheduleMode,
  }
}

export type ProgramRegistrationEditorViewModel = ReturnType<typeof useProgramRegistrationEditor>
