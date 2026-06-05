import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
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
  ProgramRegistrationScheduleDetailKind,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { resolveProgramRegistrationCurriculumEditDescription } from '@/features/template/lib/program-registration-curriculum-description'
import { buildProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/registration-form/general/paragraph-config'
import { persistGeneralRegistrationFormLocal } from '@/features/program/general/lib/registration-local-save'

export type ProgramRegistrationParticipantSelection = {
  individual: boolean
  organization: boolean
  teacherInstructor: boolean
  volunteer: boolean
}

function useProgramRegistrationMiddleActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>,
  seedParagraphIds: ReadonlySet<string>
) {
  const appendBasicTitleParagraph = useCallback((paragraphId?: string) => {
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
  }, [setDraft, setActiveParagraphId])

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
  onRegistrationSaved?: () => void
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
  const seedParagraphIds = useMemo(
    () => getProgramRegistrationSeedParagraphIds(programRegistrationFormVariant),
    [programRegistrationFormVariant]
  )

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(createProgramRegistrationDraft(programRegistrationFormVariant))
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() =>
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
  const [sessionRoundType, setSessionRoundType] = useState<ProgramRegistrationSessionRoundType>('single')
  const [educationFormScheduleDetail, setEducationFormScheduleDetail] =
    useState<ProgramRegistrationScheduleDetailKind>('common')
  const [participationScheduleDetail, setParticipationScheduleDetail] =
    useState<ProgramRegistrationScheduleDetailKind>('common')
  const [ipsScheduleDetail, setIpsScheduleDetail] = useState<ProgramRegistrationScheduleDetailKind>('common')
  const [curriculumSessionCount, setCurriculumSessionCount] = useState(2)
  const [curriculumChartSessionCount, setCurriculumChartSessionCount] = useState(2)
  const [scheduleCurriculumDetailCount, setScheduleCurriculumDetailCount] = useState(2)
  const [scheduleCurriculumGroupCount, setScheduleCurriculumGroupCount] = useState(2)
  const [scheduleCurriculumPreEducation, setScheduleCurriculumPreEducation] = useState(false)

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  useEffect(() => {
    if (!active || programRegistrationFormVariant !== 'general') return
    patchInstitutionApplicationProgramBridge({
      educationStructure: programType,
      sessionRound: sessionRoundType,
    })
  }, [active, programRegistrationFormVariant, programType, sessionRoundType])

  useEffect(() => {
    if (!active) return
    const next = normalizeWritingFormDraft(createProgramRegistrationDraft(programRegistrationFormVariant))
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
    setParticipant(
      programRegistrationFormVariant === 'economy'
        ? { individual: false, organization: true, teacherInstructor: true, volunteer: false }
        : { individual: true, organization: false, teacherInstructor: false, volunteer: false }
    )
    setSessionRoundType('single')
    setEducationFormScheduleDetail('common')
    setParticipationScheduleDetail('common')
    setIpsScheduleDetail('common')
    setCurriculumSessionCount(restrictCurriculumSessionStructure ? 1 : 2)
    setCurriculumChartSessionCount(restrictCurriculumSessionStructure ? 1 : 2)
    setProgramType('curriculum')
    setScheduleCurriculumDetailCount(2)
    setScheduleCurriculumGroupCount(2)
    setScheduleCurriculumPreEducation(false)
  }, [active, programRegistrationFormVariant, restrictCurriculumSessionStructure])

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
      if (checked) return { ...prev, individual: true, organization: false }
      setParticipationScheduleDetail('common')
      return { ...prev, individual: false, organization: true }
    })
  }, [])

  const onOrganizationChange = useCallback((checked: boolean) => {
    setParticipant(prev => {
      if (checked) {
        setParticipationScheduleDetail('common')
        return { ...prev, individual: false, organization: true }
      }
      return { ...prev, individual: true, organization: false }
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
      const defaultCount = restrictCurriculumSessionStructure ? 1 : 2
      if (value === 'multi') setCurriculumSessionCount(defaultCount)
      if (value === 'single') setCurriculumChartSessionCount(defaultCount)

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

  const onEducationFormScheduleDetailChange = useCallback((value: ProgramRegistrationScheduleDetailKind) => {
    setEducationFormScheduleDetail(value)
  }, [])

  const onParticipationScheduleDetailChange = useCallback((value: ProgramRegistrationScheduleDetailKind) => {
    setParticipationScheduleDetail(value)
  }, [])

  const onIpsScheduleDetailChange = useCallback((value: ProgramRegistrationScheduleDetailKind) => {
    setIpsScheduleDetail(value)
  }, [])

  const onAddCurriculumSession = useCallback(() => {
    if (restrictCurriculumSessionStructure) return
    setCurriculumSessionCount(c => c + 1)
  }, [restrictCurriculumSessionStructure])

  const onAddCurriculumChartSession = useCallback(() => {
    if (restrictCurriculumSessionStructure) return
    setCurriculumChartSessionCount(c =>
      Math.min(c + 1, GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT)
    )
  }, [restrictCurriculumSessionStructure])

  const onDeleteCurriculumChartSession = useCallback(
    (chartIndex: number) => {
      if (restrictCurriculumSessionStructure || chartIndex <= 1) return
      setCurriculumChartSessionCount(c => Math.max(1, c - 1))
    },
    [restrictCurriculumSessionStructure]
  )

  const onProgramTypeChange = useCallback((next: ProgramRegistrationType) => {
    if (programRegistrationFormVariant === 'economy' && next !== 'curriculum') return
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
  }, [programRegistrationFormVariant])

  const onAddScheduleCurriculumDetail = useCallback(() => {
    setScheduleCurriculumDetailCount(c => Math.min(c + 1, 99))
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
        curriculumSessionCount: restrictCurriculumSessionStructure
          ? 1
          : curriculumSessionCount,
        onAddCurriculumSession,
        curriculumChartSessionCount: restrictCurriculumSessionStructure
          ? 1
          : curriculumChartSessionCount,
        onAddCurriculumChartSession,
        onDeleteCurriculumChartSession,
        restrictCurriculumSessionStructure,
        programRegistrationFormVariant,
        scheduleCurriculumDetailCount,
        onAddScheduleCurriculumDetail,
        scheduleCurriculumGroupCount,
        onAddScheduleCurriculumGroup,
        onDeleteScheduleCurriculumGroup,
        scheduleCurriculumPreEducation,
        onScheduleCurriculumPreEducationChange,
      }),
    [
      curriculumChartSessionCount,
      curriculumSessionCount,
      educationFormScheduleDetail,
      ipsScheduleDetail,
      onAddCurriculumChartSession,
      onDeleteCurriculumChartSession,
      onAddCurriculumSession,
      onAddScheduleCurriculumDetail,
      onAddScheduleCurriculumGroup,
      onDeleteScheduleCurriculumGroup,
      onScheduleCurriculumPreEducationChange,
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
      sessionRoundType,
      restrictCurriculumSessionStructure,
      programRegistrationFormVariant,
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

  const handleSave = useCallback(() => {
    if (programRegistrationFormVariant !== 'general' || !onRegistrationSaved) return
    try {
      persistGeneralRegistrationFormLocal({
        draft,
        participant,
        programType,
      })
      onRegistrationSaved()
    } catch (error) {
      console.debug('programRegistrationEditor save failed', error)
    }
  }, [draft, onRegistrationSaved, participant, programRegistrationFormVariant, programType])

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
    onSelectSingleItemListItem,
    paragraphBodyOptions,
    participant,
    programType,
    sessionRoundType,
  }
}

export type ProgramRegistrationEditorViewModel = ReturnType<typeof useProgramRegistrationEditor>
