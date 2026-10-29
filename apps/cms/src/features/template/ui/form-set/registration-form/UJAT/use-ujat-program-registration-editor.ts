import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTemplateWritingPreview } from '@/features/template/context/template-writing-preview-context'
import { getFormNavDisplayLine } from '@/features/template/lib/form-title-numbering'
import { EMPTY_WRITING_FORM_DRAFT } from '@/features/template/lib/empty-writing-form-draft'
import { forceParagraphTitleRequired } from '@/features/template/lib/paragraph-required-mark'
import { useFormTemplateSaveFeedback } from '@/features/template/lib/form-template-save-feedback'
import {
  isCatalogOriginalWritingTemplate,
  isWritingFormTemplateStructureLocked,
} from '@/features/template/lib/form-template-delete-policy'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  createUjatProgramRegistrationDraft,
  UJAT_PROGRAM_REGISTRATION_IDS,
  UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/ujat-program-registration-draft'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'
import {
  normalizeWritingFormDraft,
  type FormTitleNumberingStyle,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { useTableRowSelectionState } from '@/features/template/ui/form-editor/hooks/use-table-row-selection-state'
import {
  getUjatProgramRegistrationOverlayRecord,
  resetUjatProgramRegistrationOverlay,
  setUjatProgramRegistrationOverlayScope,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  typedDetailFromUjatBasicInfo,
  typedDetailFromUjatOverlay,
  type UjatTypedDetail,
} from '@/features/program/ujat/api/typed-detail-client'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { mergeDevAutofillSparse } from '@/features/program/shared/lib/merge-dev-autofill-sparse'
import {
  createUjatBasicInfoFormDefaults,
  ujatBasicInfoFormValuesFromLegacyOverlay,
} from '@/features/program/ujat/lib/ujat-basic-info-form'
import {
  loadUjatRegistrationTemplateSave,
  persistUjatRegistrationTemplateSave,
} from '@/features/program/ujat/lib/ujat-registration-template-local-save'

export const UJAT_PROGRAM_REGISTRATION_TEMPLATE_CODE = 'registration-ujat' as const

/** 시드 단락 타이틀 필수(*) — 필드 라벨이 아니라 단락 제목 (`answerRequired`) */

const EMPTY_UJAT_TYPED_DETAIL: UjatTypedDetail = {
  schemaVersion: 1,
  halfPlans: [],
  common: null,
  revision: null,
}

function withForcedUjatRegistrationSeedTitleRequired(draft: WritingFormDraft): WritingFormDraft {
  let changed = false
  const paragraphs = draft.paragraphs.map(paragraph => {
    let next = paragraph
    if (
      paragraph.id === UJAT_PROGRAM_REGISTRATION_IDS[0] &&
      paragraph.paragraphDescription.trim() === ''
    ) {
      next = { ...next, paragraphDescription: UJAT_REGISTRATION_SECTION_META.basic.description }
    }
    if (UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(next.id)) {
      const forced = forceParagraphTitleRequired(next)
      if (forced !== next) next = forced
    }
    if (next !== paragraph) changed = true
    return next
  })
  return changed ? { ...draft, paragraphs } : draft
}

export type UseUjatProgramRegistrationEditorOptions = {
  /** 템플릿 관리 저장 확인 후 (편집 모달 닫기·목록 복귀) */
  onTemplateDraftSaveConfirmed?: () => void
  /** 템플릿 관리 복제본은 고유 코드로 조회·저장 */
  templateCode?: string
  systemTemplate?: boolean
  forceUserEditable?: boolean
  /** true면 임시저장 복원 없이 시드로 시작 (신규 등록) */
  skipDraftRestore?: boolean
  /** 프로그램 등록 임시저장 — localStorage만 (`localOnlyDraftPersistence`). 양식 관리는 remote SSOT. */
  localOnlyDraftPersistence?: boolean
  /** 등록 위저드 — 양식 초안은 localStorage(registration-wizard:UJAT:*) 전용, CREATE 후 프로그램 전용 COPY로 적용 */
  registrationWizardProgramType?: string
}

export function useUjatProgramRegistrationEditor(
  active: boolean,
  previewHeaderTitle: string,
  options?: UseUjatProgramRegistrationEditorOptions
) {
  const onTemplateDraftSaveConfirmed = options?.onTemplateDraftSaveConfirmed
  const skipDraftRestore = options?.skipDraftRestore === true
  const localOnlyDraftPersistence = options?.localOnlyDraftPersistence === true
  const registrationWizardProgramType = options?.registrationWizardProgramType
  const usesRegistrationWizardDraft =
    registrationWizardProgramType != null && registrationWizardProgramType !== ''
  const templateCode = options?.templateCode?.trim() || UJAT_PROGRAM_REGISTRATION_TEMPLATE_CODE
  const isStructureLocked = isWritingFormTemplateStructureLocked({
    templateCode,
    systemTemplate: options?.systemTemplate,
    forceUserEditable: options?.forceUserEditable,
  })
  const isTemplateManagementSave = onTemplateDraftSaveConfirmed != null
  const { showSaveSuccess, showSaveFailure } = useFormTemplateSaveFeedback()

  const {
    openWritingUserPreview,
    syncWritingUserPreviewSession,
    closeWritingUserPreview,
    isWritingUserPreviewOpen,
  } = useTemplateWritingPreview()

  const [draft, setDraft] = useState<WritingFormDraft>(() => EMPTY_WRITING_FORM_DRAFT)
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null)
  const [singleItemListActiveItemId, setSingleItemListActiveItemId] = useState<string | null>(null)
  const [isDraftLoading, setIsDraftLoading] = useState(() => active)
  // Legacy registration overlay is retained only as an opaque compatibility snapshot. It is
  // never hydrated into the live store when the registration Wizard uses Typed RHF.
  const legacyOverlayRef = useRef<Record<string, unknown>>({})
  const basicInfoForm = useForm<ProgramDetailEditFormValues>({
    defaultValues: createUjatBasicInfoFormDefaults(),
    shouldUnregister: false,
  })
  const educationScheduleForm = useForm<UjatTypedDetail>({
    defaultValues: EMPTY_UJAT_TYPED_DETAIL,
    shouldUnregister: false,
  })
  const basicInfoValues = useWatch({ control: basicInfoForm.control }) as ProgramDetailEditFormValues

  if (active && !usesRegistrationWizardDraft) {
    setUjatProgramRegistrationOverlayScope(templateCode)
  }

  const resetToSeed = useCallback(() => {
    legacyOverlayRef.current = {}
    if (!usesRegistrationWizardDraft) resetUjatProgramRegistrationOverlay()
    basicInfoForm.reset(createUjatBasicInfoFormDefaults())
    educationScheduleForm.reset(EMPTY_UJAT_TYPED_DETAIL)
    const next = withForcedUjatRegistrationSeedTitleRequired(
      normalizeWritingFormDraft(createUjatProgramRegistrationDraft())
    )
    setDraft(next)
    setActiveParagraphId(next.paragraphs[0]?.id ?? null)
    setSingleItemListActiveItemId(null)
  }, [basicInfoForm, educationScheduleForm, usesRegistrationWizardDraft])

  useEffect(() => {
    if (!active) {
      setIsDraftLoading(false)
      return
    }

    let cancelled = false
    if (!usesRegistrationWizardDraft) {
      setUjatProgramRegistrationOverlayScope(templateCode)
      resetUjatProgramRegistrationOverlay()
    }

    /**
     * C9: 등록 위저드(신규)만 — 저장본이 없을 때 게시 CATALOG 기본 내용을 미편집 필드에 채운다.
     * 비동기 응답이 늦어도 현재 draft(사용자 편집)를 기준으로 합쳐 덮어쓰지 않는다.
     */
    const applyPublishedCatalogDefaults = () => {
      if (!usesRegistrationWizardDraft) return
      void import('@/features/template/lib/published-catalog-defaults').then(async defaults => {
        const published = await defaults.loadPublishedCatalogDraft(templateCode)
        if (cancelled || published == null) return
        const seed = withForcedUjatRegistrationSeedTitleRequired(
          normalizeWritingFormDraft(createUjatProgramRegistrationDraft())
        )
        setDraft(current =>
          withForcedUjatRegistrationSeedTitleRequired(
            normalizeWritingFormDraft(
              defaults.mergePublishedCatalogDefaults({
                current,
                seed,
                published,
                templateCode,
              })
            )
          )
        )
        setActiveParagraphId(prev => prev ?? seed.paragraphs[0]?.id ?? null)
      })
    }

    if (skipDraftRestore) {
      setIsDraftLoading(false)
      resetToSeed()
      applyPublishedCatalogDefaults()
      return () => {
        cancelled = true
      }
    }

    setIsDraftLoading(true)
    setDraft(EMPTY_WRITING_FORM_DRAFT)
    setActiveParagraphId(null)

      const loadDraft =
        usesRegistrationWizardDraft && !localOnlyDraftPersistence
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
          legacyOverlayRef.current = saved.overlay ?? {}
          const savedBasicInfo = saved.editorState?.ujatBasicInfo
          basicInfoForm.reset(
            savedBasicInfo && typeof savedBasicInfo === 'object'
              ? (savedBasicInfo as ProgramDetailEditFormValues)
              : ujatBasicInfoFormValuesFromLegacyOverlay(saved.overlay ?? {})
          )
          educationScheduleForm.reset(
            saved.editorState?.ujatEducationSchedule &&
              typeof saved.editorState.ujatEducationSchedule === 'object'
              ? (saved.editorState.ujatEducationSchedule as UjatTypedDetail)
              : typedDetailFromUjatOverlay(saved.overlay ?? {})
          )
          const next = withForcedUjatRegistrationSeedTitleRequired(
            normalizeWritingFormDraft(saved.draft)
          )
          setDraft(next)
          setActiveParagraphId(next.paragraphs[0]?.id ?? null)
          setSingleItemListActiveItemId(null)
          return
        }

        const legacy = localOnlyDraftPersistence ? loadUjatRegistrationTemplateSave() : null
        legacyOverlayRef.current = legacy?.overlay ?? {}
        basicInfoForm.reset(ujatBasicInfoFormValuesFromLegacyOverlay(legacy?.overlay ?? {}))
        educationScheduleForm.reset(typedDetailFromUjatOverlay(legacy?.overlay ?? {}))
        const next = withForcedUjatRegistrationSeedTitleRequired(
          normalizeWritingFormDraft(legacy?.draft ?? createUjatProgramRegistrationDraft())
        )
        setDraft(next)
        setActiveParagraphId(next.paragraphs[0]?.id ?? null)
        setSingleItemListActiveItemId(null)
        if (legacy?.draft == null) applyPublishedCatalogDefaults()
      })
      .finally(() => {
        if (!cancelled) setIsDraftLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    active,
    localOnlyDraftPersistence,
    registrationWizardProgramType,
    resetToSeed,
    skipDraftRestore,
    templateCode,
    usesRegistrationWizardDraft,
    basicInfoForm,
    educationScheduleForm,
  ])

  useEffect(() => {
    if (!active) {
      if (!usesRegistrationWizardDraft) resetUjatProgramRegistrationOverlay()
      closeWritingUserPreview()
    }
  }, [active, closeWritingUserPreview, usesRegistrationWizardDraft])

  useEffect(() => {
    if (!active || !usesRegistrationWizardDraft) return

    const handleDevAutofillComplete = (event: Event) => {
      const detail =
        event instanceof CustomEvent && event.detail != null && typeof event.detail === 'object'
          ? event.detail
          : {}
      const typedEducationSchedule =
        'typedEducationSchedule' in detail ? detail.typedEducationSchedule : null
      const typedBasicInfo = 'typedBasicInfo' in detail ? detail.typedBasicInfo : null
      basicInfoForm.reset(
        mergeDevAutofillSparse(
          basicInfoForm.getValues() as Record<string, unknown>,
          (typedBasicInfo != null && typeof typedBasicInfo === 'object'
            ? typedBasicInfo
            : ujatBasicInfoFormValuesFromLegacyOverlay(legacyOverlayRef.current)) as Record<
            string,
            unknown
          >
        ) as ProgramDetailEditFormValues
      )
      educationScheduleForm.reset(
        mergeDevAutofillSparse(
          educationScheduleForm.getValues() as Record<string, unknown>,
          (typedEducationSchedule != null && typeof typedEducationSchedule === 'object'
            ? typedEducationSchedule
            : typedDetailFromUjatOverlay(legacyOverlayRef.current)) as Record<string, unknown>
        ) as UjatTypedDetail
      )
    }

    window.addEventListener('cms:registration-dev-autofill-complete', handleDevAutofillComplete)
    return () => {
      window.removeEventListener(
        'cms:registration-dev-autofill-complete',
        handleDevAutofillComplete
      )
    }
  }, [active, basicInfoForm, educationScheduleForm, usesRegistrationWizardDraft])

  const updateParagraph = useCallback(
    (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => {
      setDraft(prev => ({
        ...prev,
        paragraphs: prev.paragraphs.map(p => {
          if (p.id !== id) return p
          let next = updater(p)
          if (UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS.has(id)) {
            next = { ...next, requiredMark: true, answerRequired: true } as WritingFormParagraph
          }
          return next
        }),
      }))
    },
    []
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

  const paragraphBodyOptions = useMemo(
    () => ({
      ujatProgramRegistration: true,
      ujatProgramRegistrationBasicInfoForm: basicInfoForm,
      ujatProgramRegistrationBasicInfoOverlayFree: usesRegistrationWizardDraft,
      ujatProgramRegistrationEducationScheduleForm: educationScheduleForm,
      structureLockedAuthoringChoicePreview: true,
      catalogOriginalParagraphTitleLocked:
        isTemplateManagementSave &&
        isCatalogOriginalWritingTemplate({
          templateCode,
          systemTemplate: options?.systemTemplate,
        })
          ? true
          : undefined,
    }),
    [
      basicInfoForm,
      educationScheduleForm,
      isTemplateManagementSave,
      options?.systemTemplate,
      templateCode,
      usesRegistrationWizardDraft,
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

  const getTypedDetail = useCallback(
    () => typedDetailFromUjatBasicInfo(basicInfoForm.getValues(), educationScheduleForm.getValues()),
    [basicInfoForm, educationScheduleForm]
  )

  const persistDraft = useCallback(async () => {
    const overlay = usesRegistrationWizardDraft
      ? { ...legacyOverlayRef.current }
      : { ...getUjatProgramRegistrationOverlayRecord() }
    const basicInfo = usesRegistrationWizardDraft ? basicInfoForm.getValues() : undefined
    const editorState =
      basicInfo == null
        ? { ujatEducationSchedule: educationScheduleForm.getValues() }
        : {
            ujatBasicInfo: basicInfo,
            ujatEducationSchedule: educationScheduleForm.getValues(),
          }
    if (localOnlyDraftPersistence) {
      await persistWritingFormTemplateDraft({
        templateId: templateCode,
        draft,
        overlay,
        editorState,
        localOnly: true,
      })
      persistUjatRegistrationTemplateSave({ draft, overlay })
      return { draft, overlay, basicInfo, typedDetail: getTypedDetail() }
    }
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
      if (localOnlyDraftPersistence) {
        persistUjatRegistrationTemplateSave({ draft, overlay })
      } else {
        const { clearUjatRegistrationTemplateLocalStorage } = await import(
          '@/features/program/ujat/lib/ujat-registration-template-local-save'
        )
        clearUjatRegistrationTemplateLocalStorage()
      }
    }
    return { draft, overlay, basicInfo, typedDetail: getTypedDetail() }
  }, [
    basicInfoForm,
    draft,
    localOnlyDraftPersistence,
    registrationWizardProgramType,
    templateCode,
    usesRegistrationWizardDraft,
    educationScheduleForm,
    getTypedDetail,
  ])

  const handleSave = useCallback((options?: { silent?: boolean }) => {
    return (async () => {
      try {
        await persistDraft()
        if (options?.silent) return
        if (isTemplateManagementSave) {
          showSaveSuccess(onTemplateDraftSaveConfirmed)
        }
      } catch (error) {
        console.debug('ujatProgramRegistrationEditor save failed', error)
        if (options?.silent) throw error
        if (isTemplateManagementSave) {
          showSaveFailure(error)
        }
      }
    })()
  }, [
    isTemplateManagementSave,
    onTemplateDraftSaveConfirmed,
    showSaveFailure,
    showSaveSuccess,
    persistDraft,
  ])

  return {
    draft,
    isDraftLoading,
    activeParagraphId,
    singleItemListActiveItemId,
    structureLockedParagraphIds: isStructureLocked
      ? (UJAT_PROGRAM_REGISTRATION_SEED_PARAGRAPH_IDS as ReadonlySet<string>)
      : undefined,
    pinnedTop,
    sortableMiddle,
    pinnedBottom,
    handleSelectCard,
    onReorderMiddle,
    onTitleNumberingChange,
    updateParagraph,
    horizontalTableRowSelectionsByParagraphId,
    verticalTableBodyRowSelection,
    activeHorizontalTableRowSelection,
    onHorizontalTableRowSelectionChange,
    onVerticalTableBodyRowSelectionChange,
    focusHorizontalTableBodyRow,
    focusVerticalTableBodyRow,
    handlePreview,
    handleSave,
    persistDraft,
    onSelectSingleItemListItem: (paragraphId: string, itemId: string | null) => {
      setActiveParagraphId(paragraphId)
      setSingleItemListActiveItemId(itemId)
    },
    paragraphBodyOptions,
    basicInfoForm,
    basicInfoValues,
    educationScheduleForm,
    educationScheduleValues: educationScheduleForm.getValues(),
    getTypedDetail,
  }
}

export type UjatProgramRegistrationEditorViewModel = ReturnType<
  typeof useUjatProgramRegistrationEditor
>
