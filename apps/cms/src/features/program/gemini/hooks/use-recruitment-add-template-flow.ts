import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { applyRegistrationStepTemplateChange } from '@/features/program/shared/lib/step-template-apply'
import {
  getSelectedOperationalTemplateCode,
  getRegistrationStepTemplateSelections,
  isDefaultOperationalTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import {
  beginRegistrationWizardVisit,
  commitRegistrationWizardVisit,
  endRegistrationWizardVisit,
} from '@/features/program/general/lib/registration-wizard-visit'
import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { useWritingFormSections } from '@/features/template/hooks/use-writing-form-sections'
import { useProgramParticipantApplicationEditor } from '@/features/template/hooks/use-program-participant-application-editor'
import {
  lookupWritingTemplateRegistry,
  resolveWritingTemplateDisplayName,
} from '@/features/template/lib/lookup-writing-template-registry'
import { GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS } from '@/features/template/model/gemini-visiting-training-recruit-form-draft'
import type { TemplateEditorVm } from '@/features/template/ui/template-renderers/template-renderer-types'
import { resolveTemplateEditorPanels } from '@/features/template/ui/template-renderers/resolve-template-editor-panels'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  getGeminiRecruitOverlayVersion,
  resetAllGeminiRecruitOverlay,
  subscribeGeminiRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/gemini/gemini-recruit-overlay-sync'
import {
  getGeneralRecruitOverlayVersion,
  subscribeGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX,
  replaceRecruitDetailInfoIntoGeneralStore,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import { resetAllOperationalOverlayStores } from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE,
  GEMINI_RECRUITMENT_STEP_KEY,
  GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE,
} from '../lib/recruitment/add-template'
import { buildGeminiRecruitmentDevAutofillSnapshot } from '../lib/recruitment/dev-autofill'
import {
  createDefaultGeminiRecruitmentAddFormSnapshot,
  loadGeminiRecruitmentAddDraft,
  normalizeGeminiRecruitmentAddFormSnapshot,
} from '../lib/recruitment/add-local-save'
import {
  buildGeminiRecruitmentSnapshotFromOverlay,
  isGeminiRecruitmentInstitutionComplete,
  seedGeminiRecruitmentOverlaysFromSnapshot,
} from '../lib/recruitment/snapshot-from-overlay'

function subscribeRecruitOverlays(onStoreChange: () => void): () => void {
  const unsubGemini = subscribeGeminiRecruitOverlay(onStoreChange)
  const unsubDetail = subscribeGeneralRecruitOverlay(onStoreChange)
  return () => {
    unsubGemini()
    unsubDetail()
  }
}

function overlayStoreVersion(): number {
  return getGeminiRecruitOverlayVersion() + getGeneralRecruitOverlayVersion()
}

function resetGeminiRecruitmentWizardMemory(): void {
  resetAllGeminiRecruitOverlay()
  replaceRecruitDetailInfoIntoGeneralStore(
    undefined,
    RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.gemini,
    GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE
  )
}

export function useGeminiRecruitmentAddTemplateFlow(
  open: boolean,
  options?: { skipDraftRestore?: boolean }
) {
  const skipDraftRestore = options?.skipDraftRestore === true
  const { sections: writingFormSections } = useWritingFormSections()
  const [stepTemplateByKey, setStepTemplateByKey] = useState<Record<string, string>>({})
  const [wizardDraftRevision, setWizardDraftRevision] = useState(0)
  const continueSeededRef = useRef(false)
  const baselineRef = useRef('')

  const selectedTemplateCode =
    stepTemplateByKey[GEMINI_RECRUITMENT_STEP_KEY] ??
    getSelectedOperationalTemplateCode(
      GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE,
      GEMINI_RECRUITMENT_STEP_KEY,
      GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE
    )

  const stepTemplateName = useMemo(
    () => resolveWritingTemplateDisplayName(selectedTemplateCode),
    [selectedTemplateCode, writingFormSections]
  )

  const isDefaultStepTemplate = isDefaultOperationalTemplateSelection(
    selectedTemplateCode,
    GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE
  )

  const participantVm = useProgramParticipantApplicationEditor(
    open,
    stepTemplateName,
    'gemini-recruit',
    {
      registrationWizardProgramType: GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE,
      registrationWizardOpen: open,
      skipDraftRestore,
      templateCode: selectedTemplateCode,
      wizardDraftRevision,
    }
  )

  const overlayVersion = useSyncExternalStore(
    subscribeRecruitOverlays,
    overlayStoreVersion,
    overlayStoreVersion
  )

  const buildSaveSnapshot = useCallback(() => {
    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
    return buildGeminiRecruitmentSnapshotFromOverlay(participantVm.draft)
  }, [participantVm.draft, overlayVersion])

  const isRegisterReady = useMemo(
    () =>
      open &&
      !participantVm.isDraftLoading &&
      isGeminiRecruitmentInstitutionComplete(buildSaveSnapshot()),
    [buildSaveSnapshot, open, participantVm.isDraftLoading]
  )

  const isDirty = useMemo(() => {
    if (!open || participantVm.isDraftLoading) return false
    return JSON.stringify(buildSaveSnapshot()) !== baselineRef.current
  }, [buildSaveSnapshot, open, participantVm.isDraftLoading])

  const markSavedBaseline = useCallback(() => {
    baselineRef.current = JSON.stringify(buildSaveSnapshot())
    commitRegistrationWizardVisit(GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE)
  }, [buildSaveSnapshot])

  const applyParagraphDescriptions = useCallback(
    (institution: string, detail: string) => {
      participantVm.updateParagraph(GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.recruitInfo, current =>
        current.kind === 'single_item' && current.variant === 'horizontal_table'
          ? { ...current, paragraphDescription: institution }
          : current
      )
      participantVm.updateParagraph(GEMINI_VISITING_TRAINING_RECRUIT_FORM_IDS.detailInfo, current =>
        current.kind === 'single_item' && current.variant === 'horizontal_table'
          ? { ...current, paragraphDescription: detail }
          : current
      )
    },
    [participantVm]
  )

  useEffect(() => {
    if (!open) return
    beginRegistrationWizardVisit(GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE)
    setStepTemplateByKey(
      getRegistrationStepTemplateSelections(GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE)
    )
    continueSeededRef.current = false
    return () => {
      endRegistrationWizardVisit(
        GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE,
        resetGeminiRecruitmentWizardMemory
      )
    }
  }, [open])

  useEffect(() => {
    if (!open || participantVm.isDraftLoading) return
    if (skipDraftRestore) {
      baselineRef.current = JSON.stringify(
        normalizeGeminiRecruitmentAddFormSnapshot(createDefaultGeminiRecruitmentAddFormSnapshot())
      )
      return
    }
    if (continueSeededRef.current) return
    continueSeededRef.current = true
    const saved = loadGeminiRecruitmentAddDraft()
    if (saved?.form) {
      seedGeminiRecruitmentOverlaysFromSnapshot(saved.form, selectedTemplateCode)
      applyParagraphDescriptions(
        saved.form.institutionSectionDescription,
        saved.form.detailSectionDescription
      )
      baselineRef.current = JSON.stringify(normalizeGeminiRecruitmentAddFormSnapshot(saved.form))
      return
    }
    baselineRef.current = JSON.stringify(buildSaveSnapshot())
  }, [
    applyParagraphDescriptions,
    buildSaveSnapshot,
    open,
    participantVm.isDraftLoading,
    selectedTemplateCode,
    skipDraftRestore,
  ])

  const selectStepTemplate = useCallback(
    async (next: {
      id: string
      latestVersionId?: number
      baseTemplateCode?: string
      apiTemplateId?: number
    }) => {
      const result = await applyRegistrationStepTemplateChange({
        programType: GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE,
        stepKey: GEMINI_RECRUITMENT_STEP_KEY,
        previousCode: selectedTemplateCode,
        nextCode: next.id,
        defaultCode: GEMINI_RECRUITMENT_DEFAULT_TEMPLATE_CODE,
        latestVersionId: next.latestVersionId,
        baseTemplateCode: next.baseTemplateCode,
        apiTemplateId: next.apiTemplateId,
      })
      if (result === 'unchanged') return
      setStepTemplateByKey(
        getRegistrationStepTemplateSelections(GEMINI_RECRUITMENT_WIZARD_PROGRAM_TYPE)
      )
      setWizardDraftRevision(value => value + 1)
    },
    [selectedTemplateCode]
  )

  const applyDevAutofill = useCallback(() => {
    if (!import.meta.env.DEV) return
    const snapshot = buildGeminiRecruitmentDevAutofillSnapshot()
    seedGeminiRecruitmentOverlaysFromSnapshot(snapshot, selectedTemplateCode)
    applyParagraphDescriptions(
      snapshot.institutionSectionDescription,
      snapshot.detailSectionDescription
    )
  }, [applyParagraphDescriptions, selectedTemplateCode])

  const registryEntry = useMemo(
    () =>
      lookupWritingTemplateRegistry(selectedTemplateCode, {
        baseTemplateCode: getFormTemplateVersionCacheEntry(selectedTemplateCode)?.baseTemplateCode,
      }),
    [selectedTemplateCode]
  )

  const editorVm = useMemo((): TemplateEditorVm => {
    return {
      registryEntry,
      isProgramRegistration: false,
      isUjatProgramRegistration: false,
      isParticipantApplication: true,
      isWritingSurveyList: false,
      isDraftLoading: participantVm.isDraftLoading,
      programParticipantApplicationVm: participantVm,
      surveyTableRowSelection: participantVm,
      handleSave: participantVm.handleSave,
    } as unknown as TemplateEditorVm
  }, [participantVm, registryEntry])

  const panels = useMemo(
    () =>
      resolveTemplateEditorPanels({
        registryEntry,
        editorVm,
        generic: {
          orderedLeftContentConfig: [],
          activeCardId: null,
          setActiveCardId: () => {},
          applyOrderedCards: () => {},
          rightNavigationConfig: { sectionTitle: '커스텀 필드', items: [] },
        },
      }),
    [editorVm, registryEntry]
  )

  return {
    isDraftLoading: participantVm.isDraftLoading,
    stepTemplateName,
    isDefaultStepTemplate,
    selectedTemplateCode,
    wizardDraftRevision,
    selectStepTemplate,
    panels,
    buildSaveSnapshot,
    isDirty,
    isRegisterReady,
    markSavedBaseline,
    applyDevAutofill,
  }
}

export function resetGeminiRecruitmentAddTemplateStoresForTests(): void {
  resetAllOperationalOverlayStores()
  resetGeminiRecruitmentWizardMemory()
}
