import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
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
  createApplicantRecruitFormIndividualDraft,
  APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/applicant-recruit-form-individual-draft'
import {
  createApplicantRecruitFormInstitutionDraft,
  APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/applicant-recruit-form-institution-draft'
import {
  createUjatRecruitFormInstitutionDraft,
  UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-recruit-form-institution-draft'
import {
  createRecruitFormInstructorDraft,
  RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/recruit-form-instructor-draft'
import {
  createRecruitFormVolunteerDraft,
  RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/recruit-form-volunteer-draft'
import {
  createUjatRecruitFormVolunteerDraft,
  UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-recruit-form-volunteer-draft'
import {
  createUjatProgramApplicationFormInstitutionDraft,
  UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-application-form-institution-draft'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import {
  createGeminiVisitingTrainingApplicationFormInstructorDraft,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/gemini-visiting-training-application-form-instructor-draft'
import {
  createGeminiVisitingTrainingApplicationFormInstitutionDraft,
  GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import {
  createProgramApplicationFormInstitutionDraft,
  PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-institution-draft'
import {
  createProgramApplicationFormEconomyDraft,
  PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-economy-draft'
import {
  createProgramApplicationFormInstructorDraft,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-instructor-draft'
import {
  createProgramApplicationFormVolunteerDraft,
  PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-volunteer-draft'
import {
  createProgramParticipantApplicationDraft,
  PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-individual-draft'
import {
  normalizeWritingFormDraft,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import { getTemplateIdForParticipantApplicationVariant } from '@/features/template/lib/participant-application-template-id'
import {
  loadWritingFormTemplateSave,
  persistWritingFormTemplateSave,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  loadUjatRecruitInstitutionTemplateSave,
  loadUjatRecruitVolunteerTemplateSave,
  persistUjatRecruitInstitutionTemplateSave,
  persistUjatRecruitVolunteerTemplateSave,
} from '@/features/program/ujat/lib/ujat-recruit-template-local-save'
import {
  getUjatRecruitInstitutionOverlayRecord,
  replaceUjatRecruitInstitutionOverlay,
  resetUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayRecord,
  replaceUjatRecruitVolunteerOverlay,
  resetUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import { useInstitutionApplicationFormVisibilityVersion } from '@/features/program/general/lib/institution-application-form-visibility'
import {
  getInstitutionApplicationFormHiddenParagraphIds,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { getVolunteerApplicationFormHiddenParagraphIds } from '@/features/program/general/lib/volunteer-application-form-visibility'

function useParticipantApplicationMiddleActions(
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

export type ProgramParticipantApplicationEditorVariant =
  | 'individual'
  | 'institution'
  | 'economy-application-institution'
  | 'gemini-application-institution'
  | 'gemini-application-instructor'
  | 'ujat-application-institution'
  | 'ujat-application-volunteer'
  | 'applicant-recruit-institution'
  | 'ujat-recruit-institution'
  | 'applicant-recruit-individual'
  | 'recruit-instructor'
  | 'recruit-volunteer'
  | 'ujat-recruit-volunteer'
  | 'instructor'
  | 'volunteer'

export type UseProgramParticipantApplicationEditorOptions = {
  ujatRecruitParagraphProps?: import('@/features/program/ujat/ui/detail-modal/info/ujat-recruit-paragraph-props').UjatRecruitParagraphProps
  /** 프로그램 등록 마법사 — 참여자 유형이 학교/기관일 때만 모집 최대값 필드 노출 */
  participantOrganization?: boolean
  /**
   * 프로그램 상세 신청 양식 수정 등 — 기관 일정 단락에 템플릿 힌트 대신
   * 등록·모집 설정 연동 본문 노출
   */
  programLinkedInstitutionApplicationForm?: boolean
}

export function useProgramParticipantApplicationEditor(
  active: boolean,
  previewHeaderTitle: string,
  variant: ProgramParticipantApplicationEditorVariant = 'individual',
  editorOptions?: UseProgramParticipantApplicationEditorOptions
) {
  const seedParagraphIds = useMemo(() => {
    if (variant === 'institution') return PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'economy-application-institution')
      return PROGRAM_APPLICATION_FORM_ECONOMY_SEED_PARAGRAPH_IDS
    if (variant === 'gemini-application-institution')
      return GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'gemini-application-instructor')
      return GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-application-institution')
      return UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-application-volunteer')
      return UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    if (variant === 'applicant-recruit-institution')
      return APPLICANT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-recruit-institution')
      return UJAT_RECRUIT_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'applicant-recruit-individual')
      return APPLICANT_RECRUIT_FORM_INDIVIDUAL_SEED_PARAGRAPH_IDS
    if (variant === 'recruit-instructor') return RECRUIT_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS
    if (variant === 'recruit-volunteer') return RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-recruit-volunteer') return UJAT_RECRUIT_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    if (variant === 'instructor') return PROGRAM_APPLICATION_FORM_INSTRUCTOR_SEED_PARAGRAPH_IDS
    if (variant === 'volunteer') return PROGRAM_APPLICATION_FORM_VOLUNTEER_SEED_PARAGRAPH_IDS
    return PROGRAM_PARTICIPANT_APPLICATION_SEED_PARAGRAPH_IDS
  }, [variant])

  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(createProgramParticipantApplicationDraft())
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(
    () =>
      normalizeWritingFormDraft(createProgramParticipantApplicationDraft()).paragraphs[0]?.id ??
      null
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [ujatGradeApplicationBlockIds, setUjatGradeApplicationBlockIds] = useState<string[]>(() => [
    crypto.randomUUID(),
  ])
  const [ujatApplicationGradeByBlockId, setUjatApplicationGradeByBlockId] = useState<
    Record<string, string | undefined>
  >({})
  const [ujatGradeClassTimeBlockIds, setUjatGradeClassTimeBlockIds] = useState<string[]>(() => [
    crypto.randomUUID(),
  ])
  const [volunteerExceptionScheduleCount, setVolunteerExceptionScheduleCount] = useState(0)
  const [ujatVolunteerApplicationType, setUjatVolunteerApplicationType] = useState<
    'new' | 'ujat-graduate'
  >('ujat-graduate')

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const createSeedDraft = useCallback((): WritingFormDraft => {
    if (variant === 'institution') return createProgramApplicationFormInstitutionDraft()
    if (variant === 'economy-application-institution')
      return createProgramApplicationFormEconomyDraft()
    if (variant === 'gemini-application-institution')
      return createGeminiVisitingTrainingApplicationFormInstitutionDraft()
    if (variant === 'gemini-application-instructor')
      return createGeminiVisitingTrainingApplicationFormInstructorDraft()
    if (variant === 'ujat-application-institution')
      return createUjatProgramApplicationFormInstitutionDraft()
    if (variant === 'ujat-application-volunteer')
      return createUjatProgramApplicationFormVolunteerDraft()
    if (variant === 'applicant-recruit-institution')
      return createApplicantRecruitFormInstitutionDraft()
    if (variant === 'ujat-recruit-institution') return createUjatRecruitFormInstitutionDraft()
    if (variant === 'applicant-recruit-individual')
      return createApplicantRecruitFormIndividualDraft()
    if (variant === 'recruit-instructor') return createRecruitFormInstructorDraft()
    if (variant === 'recruit-volunteer') return createRecruitFormVolunteerDraft()
    if (variant === 'ujat-recruit-volunteer') return createUjatRecruitFormVolunteerDraft()
    if (variant === 'instructor') return createProgramApplicationFormInstructorDraft()
    if (variant === 'volunteer') return createProgramApplicationFormVolunteerDraft()
    return createProgramParticipantApplicationDraft()
  }, [variant])

  useEffect(() => {
    if (!active) return
    /* eslint-disable react-hooks/set-state-in-effect -- 풀페이지 미리보기 열림과 동기화해 시드·저장본을 반영 */
    const applyDraft = (next: WritingFormDraft) => {
      const normalized = normalizeWritingFormDraft(next)
      setDraft(normalized)
      setActiveParagraphId(normalized.paragraphs[0]?.id ?? null)
      setSingleItemListActiveItemId(null)
    }

    if (variant === 'ujat-recruit-institution') {
      const saved = loadUjatRecruitInstitutionTemplateSave()
      if (saved) {
        applyDraft(saved.draft)
        replaceUjatRecruitInstitutionOverlay(saved.overlay ?? {})
      } else {
        resetUjatRecruitInstitutionOverlay()
        applyDraft(createUjatRecruitFormInstitutionDraft())
      }
    } else if (variant === 'ujat-recruit-volunteer') {
      const saved = loadUjatRecruitVolunteerTemplateSave()
      if (saved) {
        applyDraft(saved.draft)
        replaceUjatRecruitVolunteerOverlay(saved.overlay ?? {})
      } else {
        resetUjatRecruitVolunteerOverlay()
        applyDraft(createUjatRecruitFormVolunteerDraft())
      }
    } else {
      const templateId = getTemplateIdForParticipantApplicationVariant(variant)
      const saved = loadWritingFormTemplateSave(templateId)
      if (saved?.draft) {
        applyDraft(saved.draft)
        const count = saved.editorState?.volunteerExceptionScheduleCount
        if (typeof count === 'number' && Number.isFinite(count)) {
          setVolunteerExceptionScheduleCount(Math.max(0, Math.floor(count)))
        }
        const appType = saved.editorState?.ujatVolunteerApplicationType
        if (appType === 'new' || appType === 'ujat-graduate') {
          setUjatVolunteerApplicationType(appType)
        }
      } else {
        applyDraft(createSeedDraft())
        if (variant === 'ujat-application-volunteer') {
          setUjatVolunteerApplicationType('ujat-graduate')
        }
      }
    }

    if (variant === 'ujat-application-institution') {
      setUjatGradeApplicationBlockIds([crypto.randomUUID()])
      setUjatApplicationGradeByBlockId({})
      setUjatGradeClassTimeBlockIds([crypto.randomUUID()])
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active, createSeedDraft, variant])

  useEffect(() => {
    if (!active) {
      if (variant === 'ujat-recruit-institution') resetUjatRecruitInstitutionOverlay()
      if (variant === 'ujat-recruit-volunteer') resetUjatRecruitVolunteerOverlay()
      closeWritingUserPreview()
    }
  }, [active, closeWritingUserPreview, variant])

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

  const middleParagraphActions = useParticipantApplicationMiddleActions(
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

  const onApplicationGradeByBlockChange = useCallback(
    (blockId: string, grade: string | undefined) => {
      setUjatApplicationGradeByBlockId(prev => ({ ...prev, [blockId]: grade }))
    },
    []
  )

  const onAddUjatGradeApplicationBlock = useCallback(() => {
    setUjatGradeApplicationBlockIds(ids => [...ids, crypto.randomUUID()])
  }, [])

  const onRemoveUjatGradeApplicationBlockAtIndex = useCallback((index: number) => {
    if (index < 1) return
    setUjatGradeApplicationBlockIds(prev => {
      if (prev.length <= 1 || index < 0 || index >= prev.length) return prev
      const removedId = prev[index]
      if (removedId != null) {
        setUjatApplicationGradeByBlockId(g => {
          const next = { ...g }
          delete next[removedId]
          return next
        })
      }
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const onAddUjatGradeClassTimeBlock = useCallback(() => {
    setUjatGradeClassTimeBlockIds(ids => [...ids, crypto.randomUUID()])
  }, [])

  const onRemoveUjatGradeClassTimeBlockAtIndex = useCallback((index: number) => {
    if (index < 1) return
    setUjatGradeClassTimeBlockIds(prev => {
      if (prev.length <= 1 || index < 0 || index >= prev.length) return prev
      return prev.filter((_, i) => i !== index)
    })
  }, [])

  const applicationGradeValuesForClassTime = useMemo(() => {
    const vals = Object.values(ujatApplicationGradeByBlockId).filter(
      (v): v is string => typeof v === 'string' && v.length > 0
    )
    const uniq = [...new Set(vals)]
    uniq.sort((a, b) => Number(a) - Number(b))
    return uniq
  }, [ujatApplicationGradeByBlockId])

  const ujatProgramApplicationGradeInfo = useMemo(
    () =>
      variant === 'ujat-application-institution'
        ? {
            applicationGradeBlockIds: ujatGradeApplicationBlockIds,
            applicationGradeByBlockId: ujatApplicationGradeByBlockId,
            onApplicationGradeByBlockChange: onApplicationGradeByBlockChange,
            onAddApplicationGrade: onAddUjatGradeApplicationBlock,
            onRemoveApplicationGradeAtIndex: onRemoveUjatGradeApplicationBlockAtIndex,
          }
        : undefined,
    [
      variant,
      ujatGradeApplicationBlockIds,
      ujatApplicationGradeByBlockId,
      onApplicationGradeByBlockChange,
      onAddUjatGradeApplicationBlock,
      onRemoveUjatGradeApplicationBlockAtIndex,
    ]
  )

  const ujatProgramApplicationGradeClassTime = useMemo(
    () =>
      variant === 'ujat-application-institution'
        ? {
            classTimeBlockIds: ujatGradeClassTimeBlockIds,
            onAddClassTimeBlock: onAddUjatGradeClassTimeBlock,
            onRemoveClassTimeBlockAtIndex: onRemoveUjatGradeClassTimeBlockAtIndex,
            applicationGradeValuesForClassTime,
          }
        : undefined,
    [
      variant,
      ujatGradeClassTimeBlockIds,
      onAddUjatGradeClassTimeBlock,
      onRemoveUjatGradeClassTimeBlockAtIndex,
      applicationGradeValuesForClassTime,
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

  const programApplicationFormInstructorOptions = useMemo(
    () => ({ enabled: variant === 'instructor' }),
    [variant]
  )
  const onAddVolunteerExceptionSchedule = useCallback(() => {
    setVolunteerExceptionScheduleCount(prev => prev + 1)
  }, [])
  const [volunteerInterviewExcludeNone, setVolunteerInterviewExcludeNone] = useState(false)
  const onVolunteerInterviewExclusionChange = useCallback(
    (state: { excludeNone: boolean }) => {
      setVolunteerInterviewExcludeNone(state.excludeNone)
    },
    []
  )

  const programApplicationFormVolunteerOptions = useMemo(
    () =>
      variant === 'volunteer' ||
      variant === 'recruit-volunteer' ||
      variant === 'ujat-recruit-volunteer'
        ? {
            enabled: true as const,
            exceptionScheduleCount: volunteerExceptionScheduleCount,
            exceptionScheduleAddDisabled: volunteerInterviewExcludeNone,
            onAddExceptionSchedule: onAddVolunteerExceptionSchedule,
            onCommonExclusionChange: onVolunteerInterviewExclusionChange,
          }
        : {
            enabled: false as const,
            exceptionScheduleCount: 0,
            exceptionScheduleAddDisabled: false,
            onAddExceptionSchedule: () => {},
            onCommonExclusionChange: undefined,
          },
    [
      variant,
      volunteerExceptionScheduleCount,
      volunteerInterviewExcludeNone,
      onAddVolunteerExceptionSchedule,
      onVolunteerInterviewExclusionChange,
    ]
  )

  const institutionApplicationBridge = useInstitutionApplicationProgramBridge()
  const institutionApplicationFormVisibilityVersion = useInstitutionApplicationFormVisibilityVersion()
  const institutionApplicationHiddenParagraphIds = useMemo(() => {
    if (variant !== 'institution') return undefined
    return getInstitutionApplicationFormHiddenParagraphIds(institutionApplicationBridge)
  }, [variant, institutionApplicationBridge, institutionApplicationFormVisibilityVersion])

  const volunteerApplicationHiddenParagraphIds = useMemo(() => {
    if (variant !== 'volunteer') return undefined
    return getVolunteerApplicationFormHiddenParagraphIds(draft.paragraphs)
  }, [variant, draft.paragraphs])

  const ujatProgramApplicationFormVolunteerOptions = useMemo(
    () =>
      variant === 'ujat-application-volunteer'
        ? {
            enabled: true as const,
            applicationType: ujatVolunteerApplicationType,
            onApplicationTypeChange: setUjatVolunteerApplicationType,
          }
        : {
            enabled: false as const,
            applicationType: 'ujat-graduate' as const,
            onApplicationTypeChange: () => {},
          },
    [variant, ujatVolunteerApplicationType]
  )

  const writingPreviewSession = useMemo(
    () => ({
      draft,
      updateParagraph,
      headerTitle: previewHeaderTitle,
      editorKind: 'horizontal_table' as const,
      paragraphBodyOptions: {
        structureLockedParagraphIds: seedParagraphIds,
        structureLockedAuthoringChoicePreview: true,
        programApplicationFormInstitution: variant === 'institution',
        programApplicationFormEconomyInstitution: variant === 'economy-application-institution',
        programApplicationFormGeminiInstitution: variant === 'gemini-application-institution',
        programApplicationFormGeminiInstructor: variant === 'gemini-application-instructor',
        ujatProgramApplicationFormInstitution: variant === 'ujat-application-institution',
        ujatProgramApplicationFormVolunteer: ujatProgramApplicationFormVolunteerOptions,
        hiddenParagraphIds: (() => {
          if (
            variant === 'ujat-application-volunteer' &&
            ujatVolunteerApplicationType === 'new'
          ) {
            return new Set([UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm])
          }
          if (variant === 'volunteer') return volunteerApplicationHiddenParagraphIds
          return institutionApplicationHiddenParagraphIds
        })(),
        ujatProgramApplicationGradeInfo,
        ujatProgramApplicationGradeClassTime,
        applicantRecruitFormInstitution: variant === 'applicant-recruit-institution',
        showInstitutionApplicationLimits:
          variant === 'applicant-recruit-institution' &&
          (editorOptions?.participantOrganization ?? true),
        applicantRecruitFormIndividual: variant === 'applicant-recruit-individual',
        recruitFormInstructor: variant === 'recruit-instructor',
        recruitFormVolunteer: variant === 'recruit-volunteer',
        ujatRecruitParagraphProps: editorOptions?.ujatRecruitParagraphProps,
        programApplicationFormIndividual: variant === 'individual',
        programApplicationFormInstructor: programApplicationFormInstructorOptions,
        programApplicationFormVolunteer: programApplicationFormVolunteerOptions,
        programLinkedInstitutionApplicationForm:
          editorOptions?.programLinkedInstitutionApplicationForm === true,
      },
    }),
    [
      draft,
      previewHeaderTitle,
      programApplicationFormInstructorOptions,
      programApplicationFormVolunteerOptions,
      ujatProgramApplicationFormVolunteerOptions,
      editorOptions?.ujatRecruitParagraphProps,
      editorOptions?.participantOrganization,
      editorOptions?.programLinkedInstitutionApplicationForm,
      seedParagraphIds,
      updateParagraph,
      ujatVolunteerApplicationType,
      variant,
      ujatProgramApplicationGradeInfo,
      ujatProgramApplicationGradeClassTime,
      institutionApplicationHiddenParagraphIds,
      volunteerApplicationHiddenParagraphIds,
    ]
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
    try {
      if (variant === 'ujat-recruit-institution') {
        persistUjatRecruitInstitutionTemplateSave({
          draft,
          overlay: { ...getUjatRecruitInstitutionOverlayRecord() },
        })
        return
      }
      if (variant === 'ujat-recruit-volunteer') {
        persistUjatRecruitVolunteerTemplateSave({
          draft,
          overlay: { ...getUjatRecruitVolunteerOverlayRecord() },
        })
        return
      }
      const templateId = getTemplateIdForParticipantApplicationVariant(variant)
      const editorState: Record<string, unknown> = {}
      if (variant === 'volunteer' || variant === 'recruit-volunteer') {
        editorState.volunteerExceptionScheduleCount = volunteerExceptionScheduleCount
      }
      if (variant === 'ujat-application-volunteer') {
        editorState.ujatVolunteerApplicationType = ujatVolunteerApplicationType
      }
      persistWritingFormTemplateSave({
        templateId,
        draft,
        editorState: Object.keys(editorState).length > 0 ? editorState : undefined,
      })
    } catch {
      // API 연동 전 — localStorage 실패 시 무시
    }
  }, [draft, ujatVolunteerApplicationType, variant, volunteerExceptionScheduleCount])

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
    programApplicationFormInstructorOptions,
    programApplicationFormVolunteerOptions,
    ujatVolunteerApplicationType,
    setUjatVolunteerApplicationType,
    ujatProgramApplicationGradeInfo,
    ujatProgramApplicationGradeClassTime,
    ujatRecruitParagraphProps: editorOptions?.ujatRecruitParagraphProps,
    programLinkedInstitutionApplicationForm:
      editorOptions?.programLinkedInstitutionApplicationForm === true,
    institutionApplicationHiddenParagraphIds,
    volunteerApplicationHiddenParagraphIds,
  }
}

export type ProgramParticipantApplicationEditorViewModel = ReturnType<
  typeof useProgramParticipantApplicationEditor
>
