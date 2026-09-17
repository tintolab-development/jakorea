import {
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
  type SessionPlanShortEssayParagraph,
  type UjatJournalEducationInfoParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { UjatDocumentViewerTarget } from './ujat-document-viewer-types'

function fillSessionParagraph(
  paragraph: WritingFormParagraph,
  _sessionIndex: number
): WritingFormParagraph {
  if (
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'session_plan_short_essay'
  ) {
    return paragraph
  }
  const p = paragraph as SessionPlanShortEssayParagraph
  const updatedItems = (p.items ?? []).map(item => ({ ...item, bodyText: item.bodyText ?? '' }))
  return { ...p, items: updatedItems, bodyText: '' }
}

function fillJournalEducationInfoParagraph(
  paragraph: WritingFormParagraph,
  target: UjatDocumentViewerTarget
): WritingFormParagraph {
  if (
    paragraph.kind !== 'single_item' ||
    paragraph.variant !== 'ujat_journal_education_info'
  ) {
    return paragraph
  }
  const p = paragraph as UjatJournalEducationInfoParagraph
  const classParts = target.assignedClass.match(/(\d+)학년\s*(\d+)반/)
  return {
    ...p,
    schoolDisplayFallback: target.institutionName,
    grade: classParts ? classParts[1] : '',
    classSection: classParts ? classParts[2] : '',
    prepDate: '',
    sessionDate: '',
  }
}

function fillShortEssayParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (paragraph.kind !== 'single_item' || paragraph.variant !== 'short_essay') return paragraph
  const p = paragraph as Extract<WritingFormParagraph, { variant: 'short_essay' }>
  const updatedItems = (p.items ?? []).map(item => ({
    ...item,
    bodyText: item.bodyText ?? '',
  }))
  return { ...p, items: updatedItems }
}

function fillParagraphs(
  paragraphs: WritingFormParagraph[],
  target: UjatDocumentViewerTarget,
  sessionIdMap: Record<string, number>
): WritingFormParagraph[] {
  return paragraphs.map(p => {
    const sessionIdx = sessionIdMap[p.id]
    if (sessionIdx !== undefined) {
      return fillSessionParagraph(p, sessionIdx)
    }
    if (p.kind === 'single_item' && p.variant === 'ujat_journal_education_info') {
      return fillJournalEducationInfoParagraph(p, target)
    }
    if (p.kind === 'single_item' && p.variant === 'short_essay') {
      return fillShortEssayParagraph(p)
    }
    return p
  })
}

const PLAN_SESSION_ID_MAP: Record<string, number> = {
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session1]: 0,
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session2]: 1,
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session3]: 2,
  [UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session4]: 3,
}

const JOURNAL_SESSION_ID_MAP: Record<string, number> = {
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session1]: 0,
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session2]: 1,
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session3]: 2,
  [UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session4]: 3,
}

export function createVolunteerFilledPlanDraft(target: UjatDocumentViewerTarget): WritingFormDraft {
  const base = createUjatEducationPlanIssuanceDraft()
  return {
    ...base,
    paragraphs: fillParagraphs(base.paragraphs, target, PLAN_SESSION_ID_MAP),
  }
}

export function createVolunteerFilledJournalDraft(
  target: UjatDocumentViewerTarget
): WritingFormDraft {
  const base = createUjatEducationJournalIssuanceDraft()
  return {
    ...base,
    paragraphs: fillParagraphs(base.paragraphs, target, JOURNAL_SESSION_ID_MAP),
  }
}

export function createVolunteerFilledDraft(target: UjatDocumentViewerTarget): WritingFormDraft {
  return target.docType === 'plan'
    ? createVolunteerFilledPlanDraft(target)
    : createVolunteerFilledJournalDraft(target)
}
