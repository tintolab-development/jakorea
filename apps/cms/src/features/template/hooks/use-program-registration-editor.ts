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
  createProgramRegistrationDraft,
  PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/program-registration-draft'
import {
  normalizeWritingFormDraft,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/use-table-row-selection-state'
import type { ProgramRegistrationType } from '@/features/template/ui/form-set/program-registration-form/paragraph-body'
import { buildProgramRegistrationParagraphBodyOptions } from '@/features/template/ui/form-set/program-registration-form/paragraph-config'

type ProgramRegistrationParticipantState = {
  individual: boolean
  organization: boolean
}

function enforceSeedParagraphRequired(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (!PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(paragraph.id)) return paragraph
  return {
    ...paragraph,
    requiredMark: true,
    answerRequired: true,
  } as WritingFormParagraph
}

function useProgramRegistrationMiddleActions(
  setDraft: Dispatch<SetStateAction<WritingFormDraft>>,
  setActiveParagraphId: Dispatch<SetStateAction<string | null>>
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
      if (PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(paragraphId)) {
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
    [setDraft, setActiveParagraphId]
  )

  const onDelete = useCallback(
    (paragraphId: string) => {
      if (PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(paragraphId)) {
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
    [setDraft, setActiveParagraphId]
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

export function useProgramRegistrationEditor(active: boolean, previewHeaderTitle: string) {
  const [draft, setDraft] = useState<WritingFormDraft>(() =>
    normalizeWritingFormDraft(createProgramRegistrationDraft())
  )
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(() =>
    normalizeWritingFormDraft(createProgramRegistrationDraft()).paragraphs[0]?.id ?? null
  )
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [participant, setParticipant] = useState<ProgramRegistrationParticipantState>({
    individual: true,
    organization: false,
  })
  const [programType] = useState<ProgramRegistrationType>('curriculum')

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  useEffect(() => {
    if (!active) return
    const next = normalizeWritingFormDraft(createProgramRegistrationDraft())
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
    setParticipant({ individual: true, organization: false })
  }, [active])

  useEffect(() => {
    if (!active) closeWritingUserPreview()
  }, [active, closeWritingUserPreview])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p =>
          p.id === id ? enforceSeedParagraphRequired(updater(p)) : p
        ),
      }))
    },
    []
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

  const middleParagraphActions = useProgramRegistrationMiddleActions(setDraft, setActiveParagraphId)

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
      if (checked) return { individual: true, organization: false }
      return { ...prev, individual: false }
    })
  }, [])

  const onOrganizationChange = useCallback((checked: boolean) => {
    setParticipant(prev => {
      if (checked) return { individual: false, organization: true }
      return { ...prev, organization: false }
    })
  }, [])

  const paragraphBodyOptions = useMemo(
    () =>
      buildProgramRegistrationParagraphBodyOptions({
        participant,
        programType,
        onIndividualChange,
        onOrganizationChange,
      }),
    [onIndividualChange, onOrganizationChange, participant, programType]
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
    structureLockedParagraphIds: PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS,
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
  }
}

export type ProgramRegistrationEditorViewModel = ReturnType<typeof useProgramRegistrationEditor>
