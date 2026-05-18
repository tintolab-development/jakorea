import { useCallback, useMemo } from 'react'
import {
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_JOURNAL_SEED_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS,
  UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
  type WritingFormDraft,
} from '@/features/template/model/writing-form-draft.schema'
import { useWritingFormEditorWithUserPreview } from '@/features/template/hooks/use-writing-form-editor-with-user-preview'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export type UjatEducationIssuanceVariant = 'plan' | 'journal'

const UJAT_ISSUANCE_CONFIG: Record<
  UjatEducationIssuanceVariant,
  {
    createDraft: () => WritingFormDraft
    defaultActiveParagraphId: string
    structureLockedParagraphIds: Set<string>
    previewHeaderTitle: string
  }
> = {
  plan: {
    createDraft: createUjatEducationPlanIssuanceDraft,
    defaultActiveParagraphId: UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.title,
    structureLockedParagraphIds: UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS,
    previewHeaderTitle: 'UJAT 교육계획서',
  },
  journal: {
    createDraft: createUjatEducationJournalIssuanceDraft,
    defaultActiveParagraphId: UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.title,
    structureLockedParagraphIds: UJAT_EDUCATION_JOURNAL_SEED_PARAGRAPH_IDS,
    previewHeaderTitle: 'UJAT 교육일지',
  },
}

/**
 * 발급 양식 > UJAT 교육계획서 / 교육일지 — 단락 편집·미리보기(설문 에디터 공통 훅)
 */
export function useUjatEducationIssuanceEditor(active: boolean, variant: UjatEducationIssuanceVariant) {
  const cfg = UJAT_ISSUANCE_CONFIG[variant]
  const getInitialDraft = useCallback(() => cfg.createDraft(), [cfg])
  const getDefaultActiveParagraphId = useCallback(
    (_draft: WritingFormDraft) => cfg.defaultActiveParagraphId,
    [cfg]
  )
  const onSave = useCallback(() => {
    }, [])

  const previewParagraphBodyOptions = useMemo((): RenderFormParagraphBodyOptions | undefined => {
    if (variant !== 'journal') return undefined
    return {
      ujatJournalEducationInfoAutofill: {
        institutionName: UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
      },
    }
  }, [variant])

  const base = useWritingFormEditorWithUserPreview({
    open: active,
    getInitialDraft,
    getDefaultActiveParagraphId,
    previewHeaderTitle: cfg.previewHeaderTitle,
    editorKind: 'survey',
    previewParagraphBodyOptions,
    onSave,
  })

  return {
    ...base,
    structureLockedParagraphIds: cfg.structureLockedParagraphIds,
  }
}

/** `useUjatEducationIssuanceEditor(active, 'plan')`과 동일 */
export function useUjatEducationPlanIssuanceEditor(active: boolean) {
  return useUjatEducationIssuanceEditor(active, 'plan')
}

export type UjatEducationPlanIssuanceEditorViewModel = ReturnType<
  typeof useUjatEducationPlanIssuanceEditor
>

export type UjatEducationIssuanceEditorViewModel = ReturnType<typeof useUjatEducationIssuanceEditor>
