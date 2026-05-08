import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { message } from 'antd'
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
  createProgramApplicationFormInstitutionDraft,
  PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-application-form-institution-draft'
import {
  createProgramApplicationFormInstructorDraft,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS,
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
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  verticalTableAddRow,
  type FormTitleNumberingStyle,
  type VerticalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/use-table-row-selection-state'

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
        message.warning('기본 단락은 복제할 수 없습니다.')
        return
      }
      const newId = crypto.randomUUID()
      let duplicated = false
      setDraft(prev => {
        const next = duplicateMiddleParagraph(prev.paragraphs, paragraphId, newId)
        if (next == null) {
          message.warning('이 단락은 복제할 수 없습니다.')
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
        message.warning('기본 단락은 삭제할 수 없습니다.')
        return
      }
      let nextActive: string | null = null
      setDraft(prev => {
        const next = removeMiddleParagraph(prev.paragraphs, paragraphId)
        if (next == null) {
          message.warning('중간 단락은 최소 1개 이상 유지해야 합니다.')
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
  | 'ujat-application-institution'
  | 'applicant-recruit-institution'
  | 'ujat-recruit-institution'
  | 'applicant-recruit-individual'
  | 'recruit-instructor'
  | 'recruit-volunteer'
  | 'ujat-recruit-volunteer'
  | 'instructor'
  | 'volunteer'

function renumberInstructorUnavailableDateRows(p: VerticalTableParagraph): VerticalTableParagraph {
  return {
    ...p,
    rows: p.rows.map((r, i) => {
      const label = `강의 불가 일정 ${String(i + 1).padStart(2, '0')}`
      if (r.stageCount === 2) {
        return { ...r, headers: [label, r.headers[1] ?? ''] as [string, string] }
      }
      return { ...r, headers: [label] as [string] }
    }),
  }
}

export function useProgramParticipantApplicationEditor(
  active: boolean,
  previewHeaderTitle: string,
  variant: ProgramParticipantApplicationEditorVariant = 'individual'
) {
  const seedParagraphIds = useMemo(() => {
    if (variant === 'institution') return PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
    if (variant === 'ujat-application-institution')
      return UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_SEED_PARAGRAPH_IDS
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
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() =>
    normalizeWritingFormDraft(createProgramParticipantApplicationDraft()).paragraphs[0]?.id ?? null
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  useEffect(() => {
    if (!active) return
    /* eslint-disable react-hooks/set-state-in-effect -- 풀페이지 미리보기 열림과 동기화해 시드 초안을 리셋 */
    const next = normalizeWritingFormDraft(
      variant === 'institution'
        ? createProgramApplicationFormInstitutionDraft()
        : variant === 'ujat-application-institution'
          ? createUjatProgramApplicationFormInstitutionDraft()
        : variant === 'applicant-recruit-institution'
          ? createApplicantRecruitFormInstitutionDraft()
          : variant === 'ujat-recruit-institution'
            ? createUjatRecruitFormInstitutionDraft()
          : variant === 'applicant-recruit-individual'
            ? createApplicantRecruitFormIndividualDraft()
        : variant === 'recruit-instructor'
          ? createRecruitFormInstructorDraft()
          : variant === 'recruit-volunteer'
            ? createRecruitFormVolunteerDraft()
          : variant === 'ujat-recruit-volunteer'
            ? createUjatRecruitFormVolunteerDraft()
            : variant === 'instructor'
              ? createProgramApplicationFormInstructorDraft()
              : variant === 'volunteer'
                ? createProgramApplicationFormVolunteerDraft()
                : createProgramParticipantApplicationDraft()
    )
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [active, variant])

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

  const onAddUnavailableDateRow = useCallback(() => {
    setDraft(prev => ({
      ...prev,
      paragraphs: prev.paragraphs.map(p => {
        if (p.id !== PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.unavailableDates) return p
        if (p.kind !== 'single_item' || p.variant !== 'vertical_table') return p
        const vt = p as VerticalTableParagraph
        const added = verticalTableAddRow(vt)
        return normalizeVerticalTableParagraph(renumberInstructorUnavailableDateRows(added))
      }),
    }))
  }, [])

  const programApplicationFormInstructorOptions = useMemo(
    () =>
      variant === 'instructor'
        ? {
            enabled: true as const,
            onAddUnavailableDateRow,
            disableUnavailableDateRowAddButton: true,
            authoringUnavailableDatesExampleRowOnly: true,
          }
        : {
            enabled: false as const,
            onAddUnavailableDateRow: () => {},
            disableUnavailableDateRowAddButton: false,
            authoringUnavailableDatesExampleRowOnly: false,
          },
    [variant, onAddUnavailableDateRow]
  )
  const programApplicationFormVolunteerOptions = useMemo(
    () =>
      variant === 'volunteer' || variant === 'recruit-volunteer'
        ? { enabled: true as const }
        : { enabled: false as const },
    [variant]
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
        applicantRecruitFormInstitution: variant === 'applicant-recruit-institution',
        applicantRecruitFormIndividual: variant === 'applicant-recruit-individual',
        recruitFormInstructor: variant === 'recruit-instructor',
        recruitFormVolunteer: variant === 'recruit-volunteer',
        programApplicationFormIndividual: variant === 'individual',
        programApplicationFormInstructor: programApplicationFormInstructorOptions,
        programApplicationFormVolunteer: programApplicationFormVolunteerOptions,
      },
    }),
    [
      draft,
      previewHeaderTitle,
      programApplicationFormInstructorOptions,
      programApplicationFormVolunteerOptions,
      seedParagraphIds,
      updateParagraph,
      variant,
    ]
  )

  useEffect(() => {
    if (!isWritingUserPreviewOpen) return
    syncWritingUserPreviewSession(writingPreviewSession)
  }, [isWritingUserPreviewOpen, syncWritingUserPreviewSession, writingPreviewSession])

  const handlePreview = useCallback(() => {
    openWritingUserPreview(writingPreviewSession)
  }, [openWritingUserPreview, writingPreviewSession])

  const handleSave = useCallback(() => {
    message.success('저장 API 연동 전입니다.')
  }, [])

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
  }
}

export type ProgramParticipantApplicationEditorViewModel = ReturnType<
  typeof useProgramParticipantApplicationEditor
>
