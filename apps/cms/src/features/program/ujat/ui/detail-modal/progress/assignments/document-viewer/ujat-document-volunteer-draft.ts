import {
  createUjatEducationJournalIssuanceDraft,
  createUjatEducationPlanIssuanceDraft,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormResponseAnswerResponse } from '@/shared/api/generated/forms-surveys/schemas/formResponseAnswerResponse'
import type { UjatDocumentViewerDocType } from './ujat-document-viewer-types'

function parseAnswerDisplayText(answer: FormResponseAnswerResponse): string {
  const display = answer.answerDisplayText?.trim()
  if (display) return display
  const raw = answer.answerValueJson?.trim()
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed === 'string') return parsed
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>
      if (typeof record.text === 'string') return record.text
      if (typeof record.bodyText === 'string') return record.bodyText
      if (typeof record.value === 'string') return record.value
    }
  } catch {
    return raw
  }
  return raw
}

function buildAnswerTextByKey(
  answers: readonly FormResponseAnswerResponse[] | null | undefined
): Map<string, string> {
  const map = new Map<string, string>()
  for (const answer of answers ?? []) {
    const key = answer.questionKeySnapshot?.trim()
    if (!key) continue
    const text = parseAnswerDisplayText(answer)
    if (text === '') continue
    map.set(key, text)
  }
  return map
}

function applyAnswerTextToParagraph(
  paragraph: WritingFormParagraph,
  answersByKey: Map<string, string>
): WritingFormParagraph {
  const paragraphText = answersByKey.get(paragraph.id)
  const next: WritingFormParagraph = { ...paragraph }

  if (
    'bodyText' in next &&
    typeof next.bodyText === 'string' &&
    paragraphText != null
  ) {
    next.bodyText = paragraphText
  }

  if ('items' in next && Array.isArray(next.items)) {
    const items = next.items as Array<Record<string, unknown>>
    ;(next as { items: Array<Record<string, unknown>> }).items = items.map(item => {
      if (!item || typeof item !== 'object' || !('id' in item)) return item
      const itemId = String(item.id ?? '')
      const itemText =
        answersByKey.get(itemId) ?? (itemId === paragraph.id ? paragraphText : undefined)
      if (itemText == null || typeof item.bodyText !== 'string') return item
      return { ...item, bodyText: itemText }
    })
  }

  // 학년·반 등 단락 필드가 answer key로 오면 동일 키로만 채운다 (기관명 추정 invent 금지)
  if ('grade' in next && typeof next.grade === 'string') {
    const grade = answersByKey.get(`${paragraph.id}.grade`) ?? answersByKey.get('grade')
    if (grade != null) next.grade = grade
  }
  if ('classSection' in next && typeof next.classSection === 'string') {
    const classSection =
      answersByKey.get(`${paragraph.id}.classSection`) ?? answersByKey.get('classSection')
    if (classSection != null) next.classSection = classSection
  }
  if ('schoolDisplayFallback' in next && typeof next.schoolDisplayFallback === 'string') {
    const school =
      answersByKey.get(`${paragraph.id}.schoolDisplayFallback`) ??
      answersByKey.get('schoolDisplayFallback') ??
      answersByKey.get('institutionName')
    if (school != null) next.schoolDisplayFallback = school
  }
  if ('prepDate' in next && typeof next.prepDate === 'string') {
    const prepDate = answersByKey.get(`${paragraph.id}.prepDate`) ?? answersByKey.get('prepDate')
    if (prepDate != null) next.prepDate = prepDate
  }
  if ('sessionDate' in next && typeof next.sessionDate === 'string') {
    const sessionDate =
      answersByKey.get(`${paragraph.id}.sessionDate`) ?? answersByKey.get('sessionDate')
    if (sessionDate != null) next.sessionDate = sessionDate
  }

  return next
}

/**
 * 제출 form_response answers로 발급 양식 단락을 채운다.
 * 답변이 없는 필드는 비운 채 두고, 목록 row·기관명으로 invent 하지 않는다.
 */
export function createSubmittedDocumentDraft(params: {
  docType: UjatDocumentViewerDocType
  answers?: readonly FormResponseAnswerResponse[] | null
}): WritingFormDraft {
  const base =
    params.docType === 'plan'
      ? createUjatEducationPlanIssuanceDraft()
      : createUjatEducationJournalIssuanceDraft()
  const answersByKey = buildAnswerTextByKey(params.answers)
  return {
    ...base,
    paragraphs: base.paragraphs.map(paragraph =>
      applyAnswerTextToParagraph(paragraph, answersByKey)
    ),
  }
}
