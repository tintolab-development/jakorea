/**
 * Portal ApplicationFormResponse.form → WritingFormDraft.
 * draftAnswers 를 문단 필드에 병합한다.
 */

import {
  fieldCellValueToPlainText,
  normalizeWritingFormDraft,
  resolveHorizontalTableCellPlainText,
  type HorizontalTableParagraph,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { migrateProgramParticipantApplicationParagraphs } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { resolveApplicationAnswerKey } from './application-answer-key.ts'
import { isApplicationTeamInfoParagraphId } from './apply-form-paragraph-ids.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 제출 시 백엔드는 runtime hidden 문항 키가 answers에 있으면
 * "Hidden runtime form question cannot be submitted" → OPERATION_NOT_ALLOWED.
 * 렌더 장식은 단락을 지우지 않고 hidden / runtimeHidden, runtimeContext.hiddenQuestionKeys 만 찍는다.
 */
function isRuntimeHiddenParagraph(paragraph: object): boolean {
  const row = paragraph as Record<string, unknown>
  return row.hidden === true || row.runtimeHidden === true
}

function addStringList(target: Set<string>, value: unknown) {
  if (!Array.isArray(value)) return
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) target.add(item.trim())
  }
}

export function collectRuntimeHiddenAnswerKeys(form: unknown): Set<string> {
  const hidden = new Set<string>()
  const document = coerceApplicationFormDocument(form)
  if (!document) return hidden

  const runtime = document.runtimeContext
  if (isRecord(runtime)) {
    addStringList(hidden, runtime.hiddenQuestionKeys)
    const audience = runtime.audienceApplication
    if (isRecord(audience)) addStringList(hidden, audience.hiddenQuestionKeys)
  }

  const paragraphs = document.paragraphs
  if (!Array.isArray(paragraphs)) return hidden
  for (const paragraph of paragraphs) {
    if (!isRecord(paragraph) || !isRuntimeHiddenParagraph(paragraph)) continue
    if (isDisplayOnlyApplicationParagraph(paragraph)) continue
    const key = resolveApplicationAnswerKey(paragraph)
    if (key) hidden.add(key)
    if (typeof paragraph.id === 'string' && paragraph.id.trim()) hidden.add(paragraph.id.trim())
  }
  return hidden
}

/** CMS 「단락 추가」 설명글·고정 문구 — 숨김 문항으로 제출만 막고 화면에는 남긴다. */
function isDisplayOnlyApplicationParagraph(paragraph: Record<string, unknown>): boolean {
  if (paragraph.kind === 'description') return true
  return (
    paragraph.kind === 'single_item' && paragraph.variant === 'agreement_explanation_text'
  )
}

const NESTED_FORM_KEYS = [
  'schemaJson',
  'schema',
  'schema_json',
  'publishedForm',
  'publishedSchema',
  'writingForm',
  'document',
  'form',
  'data',
] as const

function paragraphCount(document: Record<string, unknown>): number {
  return Array.isArray(document.paragraphs) ? document.paragraphs.length : -1
}

function displayOnlyParagraphCount(document: Record<string, unknown>): number {
  if (!Array.isArray(document.paragraphs)) return 0
  return document.paragraphs.filter(
    paragraph => isRecord(paragraph) && isDisplayOnlyApplicationParagraph(paragraph),
  ).length
}

function filledParagraphContentScore(document: Record<string, unknown>): number {
  if (!Array.isArray(document.paragraphs)) return 0
  let score = 0
  for (const paragraph of document.paragraphs) {
    if (!isRecord(paragraph)) continue
    if (typeof paragraph.paragraphTitle === 'string') score += paragraph.paragraphTitle.trim().length
    if (typeof paragraph.bodyText === 'string') score += paragraph.bodyText.trim().length
    if (typeof paragraph.paragraphDescription === 'string') {
      score += paragraph.paragraphDescription.trim().length
    }
    if (paragraph.variant !== 'horizontal_table') continue
    const table = paragraph as unknown as HorizontalTableParagraph
    const rowCount = Math.max(1, table.dataRows?.length ?? 0, table.fieldDataRows?.length ?? 0)
    const colCount = Math.max(1, table.columnHeaders?.length ?? 0)
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
        score += resolveHorizontalTableCellPlainText(table, rowIndex, colIndex).trim().length
      }
    }
  }
  return score
}

/** CMS 등록본이 중첩 schemaJson 에만 있을 때 — 문단 수, 그다음 채워진 셀을 고른다. */
function pickRicherFormDocument(
  current: Record<string, unknown> | null,
  next: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!next) return current
  if (!current) return next
  const currentCount = paragraphCount(current)
  const nextCount = paragraphCount(next)
  if (nextCount > currentCount) return next
  if (nextCount < currentCount) return current
  if (displayOnlyParagraphCount(next) > displayOnlyParagraphCount(current)) return next
  if (filledParagraphContentScore(next) > filledParagraphContentScore(current)) return next
  return current
}

function mergeFilledHorizontalTable(
  current: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  if (current.variant !== 'horizontal_table' || extra.variant !== 'horizontal_table') {
    return current
  }
  const currentTable = current as unknown as HorizontalTableParagraph
  const extraTable = extra as unknown as HorizontalTableParagraph
  const rowCount = Math.max(
    currentTable.dataRows?.length ?? 0,
    currentTable.fieldDataRows?.length ?? 0,
    extraTable.dataRows?.length ?? 0,
    extraTable.fieldDataRows?.length ?? 0,
    1,
  )
  const colCount = Math.max(
    currentTable.columnHeaders?.length ?? 0,
    extraTable.columnHeaders?.length ?? 0,
    1,
  )
  const fieldDataRows = Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) => {
      const currentCell = currentTable.fieldDataRows?.[rowIndex]?.[colIndex]
      const extraCell = extraTable.fieldDataRows?.[rowIndex]?.[colIndex]
      const currentText = fieldCellValueToPlainText(currentCell)
      const extraText = fieldCellValueToPlainText(extraCell)
      if (extraText.trim().length > currentText.trim().length) {
        return extraCell ?? currentCell ?? { kind: 'text' as const, value: extraText }
      }
      return currentCell ?? extraCell ?? { kind: 'text' as const, value: currentText }
    }),
  )
  const dataRows = Array.from({ length: rowCount }, (_, rowIndex) =>
    Array.from({ length: colCount }, (_, colIndex) => {
      const currentText = currentTable.dataRows?.[rowIndex]?.[colIndex] ?? ''
      const extraText = extraTable.dataRows?.[rowIndex]?.[colIndex] ?? ''
      return extraText.trim().length > currentText.trim().length ? extraText : currentText
    }),
  )
  return { ...current, fieldDataRows, dataRows }
}

function mergeFilledParagraphContent(
  primary: Record<string, unknown>,
  extras: readonly Record<string, unknown>[],
): Record<string, unknown> {
  const extraById = new Map<string, Record<string, unknown>>()
  for (const extra of extras) {
    if (extra === primary || !Array.isArray(extra.paragraphs)) continue
    for (const paragraph of extra.paragraphs) {
      if (!isRecord(paragraph) || typeof paragraph.id !== 'string' || !paragraph.id.trim()) continue
      const existing = extraById.get(paragraph.id)
      extraById.set(paragraph.id, existing ? mergeFilledHorizontalTable(existing, paragraph) : paragraph)
    }
  }
  if (!Array.isArray(primary.paragraphs) || extraById.size === 0) return primary
  return {
    ...primary,
    paragraphs: primary.paragraphs.map(paragraph => {
      if (!isRecord(paragraph) || typeof paragraph.id !== 'string') return paragraph
      const extra = extraById.get(paragraph.id)
      return extra ? mergeFilledHorizontalTable(paragraph, extra) : paragraph
    }),
  }
}

function collectApplicationFormDocuments(
  form: unknown,
  depth: number,
  collected: Record<string, unknown>[],
): void {
  if (!form || depth > 4) return
  if (typeof form === 'string' && form.trim()) {
    try {
      collectApplicationFormDocuments(JSON.parse(form), depth + 1, collected)
    } catch {
      return
    }
    return
  }
  if (Array.isArray(form) && form.length > 0 && isRecord(form[0]) && 'kind' in form[0]) {
    collectApplicationFormDocuments({ paragraphs: form }, depth + 1, collected)
    return
  }
  if (!isRecord(form)) return
  if (Array.isArray(form.paragraphs) && form.paragraphs.length > 0) {
    collected.push(form)
  }
  for (const key of NESTED_FORM_KEYS) {
    const nested = form[key]
    if (nested == null) continue
    collectApplicationFormDocuments(nested, depth + 1, collected)
  }
}

/** form 이 schemaJson 래퍼·중첩 객체여도 paragraphs 문서로 정규화. */
export function coerceApplicationFormDocument(form: unknown): Record<string, unknown> | null {
  const documents: Record<string, unknown>[] = []
  collectApplicationFormDocuments(form, 0, documents)
  if (documents.length === 0) return null
  let best: Record<string, unknown> | null = documents[0] ?? null
  for (const document of documents.slice(1)) {
    best = pickRicherFormDocument(best, document)
  }
  return best && paragraphCount(best) > 0 ? mergeFilledParagraphContent(best, documents) : null
}

function mergeAnswerIntoParagraph(
  paragraph: WritingFormParagraph,
  answer: unknown,
): WritingFormParagraph {
  if (answer == null) return paragraph

  if (typeof answer === 'string') {
    if (paragraph.kind === 'single_item' && paragraph.variant === 'short_essay') {
      return { ...paragraph, bodyText: answer }
    }
    return paragraph
  }

  if (Array.isArray(answer)) {
    if (
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'multiple_choice' &&
      answer.every(item => typeof item === 'string')
    ) {
      return { ...paragraph, selectedPreviewMultipleIds: answer as string[] }
    }
    return paragraph
  }

  if (!isRecord(answer)) return paragraph

  let next: WritingFormParagraph = paragraph
  if (
    'bottomConsent' in answer &&
    (answer.bottomConsent === 'agree' || answer.bottomConsent === 'disagree') &&
    'showBottomConsent' in next
  ) {
    next = { ...next, bottomConsent: answer.bottomConsent }
  }
  if (
    typeof answer.bodyText === 'string' &&
    next.kind === 'single_item' &&
    next.variant === 'short_essay'
  ) {
    next = { ...next, bodyText: answer.bodyText }
  }
  if (
    Array.isArray(answer.selectedPreviewMultipleIds) &&
    next.kind === 'single_item' &&
    next.variant === 'multiple_choice' &&
    answer.selectedPreviewMultipleIds.every(item => typeof item === 'string')
  ) {
    next = {
      ...next,
      selectedPreviewMultipleIds: answer.selectedPreviewMultipleIds as string[],
    }
  }
  return next
}

export function uniqueWritingFormParagraphsById(
  paragraphs: readonly WritingFormParagraph[],
): WritingFormParagraph[] {
  const seen = new Set<string>()
  const unique: WritingFormParagraph[] = []
  for (const paragraph of paragraphs) {
    if (seen.has(paragraph.id)) continue
    seen.add(paragraph.id)
    unique.push(paragraph)
  }
  return unique
}

function revealIndividualTeamInfoParagraph(paragraph: WritingFormParagraph): WritingFormParagraph {
  if (!isApplicationTeamInfoParagraphId(paragraph.id)) return paragraph
  return {
    ...paragraph,
    requiredMark: true,
    answerRequired: true,
    hidden: false,
    runtimeHidden: false,
  } as unknown as WritingFormParagraph
}

/**
 * CMS 개인 신청 미리보기와 맞춤: 동일 id 중복 제거, 봉사자 면접 단락 제거, 팀 정보 숨김 플래그 해제.
 */
export function prepareIndividualApplicationDraft(draft: WritingFormDraft): WritingFormDraft {
  const migrated = migrateProgramParticipantApplicationParagraphs({
    ...draft,
    paragraphs: uniqueWritingFormParagraphsById(draft.paragraphs),
  })
  return {
    ...migrated,
    paragraphs: migrated.paragraphs.map(revealIndividualTeamInfoParagraph),
  }
}

export function writingFormDraftFromApplicationForm(
  form: unknown,
  draftAnswers?: Record<string, unknown> | null,
): WritingFormDraft | null {
  const document = coerceApplicationFormDocument(form)
  if (!document) return null
  /**
   * CMS 미리보기와 같이 등록 단락은 그대로 둔다.
   * runtime hidden 은 제출 키에서만 제외한다 (`buildApplicationAnswersFromDraft`).
   */
  const normalized = normalizeWritingFormDraft(document as unknown as WritingFormDraft)
  const withAnswers =
    !draftAnswers || Object.keys(draftAnswers).length === 0
      ? normalized
      : {
          ...normalized,
          paragraphs: normalized.paragraphs.map(paragraph => {
            const key = resolveApplicationAnswerKey(paragraph)
            if (!key || !(key in draftAnswers)) return paragraph
            return mergeAnswerIntoParagraph(paragraph, draftAnswers[key])
          }),
        }
  return withAnswers
}

function extractParagraphAnswer(paragraph: WritingFormParagraph): unknown {
  if ('showBottomConsent' in paragraph && paragraph.showBottomConsent) {
    return { bottomConsent: paragraph.bottomConsent ?? null }
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'short_essay') {
    const items = paragraph.items ?? []
    if (items.length === 0) {
      return paragraph.bodyText ?? ''
    }
    return {
      bodyText: paragraph.bodyText ?? '',
      items: items.map(item => ({ id: item.id, bodyText: item.bodyText ?? '' })),
    }
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'multiple_choice') {
    return paragraph.selectedPreviewMultipleIds ?? []
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    /** 동의 없는 표(기본 정보 등) — 키가 빠지면 submit REQUIRED 실패 */
    return {
      fieldDataRows: 'fieldDataRows' in paragraph ? paragraph.fieldDataRows : [],
      dataRows: 'dataRows' in paragraph ? paragraph.dataRows : [],
    }
  }
  return undefined
}

function isRequiredParagraph(paragraph: WritingFormParagraph): boolean {
  if ('answerRequired' in paragraph && paragraph.answerRequired === true) return true
  if ('requiredMark' in paragraph && paragraph.requiredMark === true) return true
  return false
}

/** 제출용 answers — 문단 id(키 규칙) → 답 */
export function buildApplicationAnswersFromDraft(
  draft: WritingFormDraft,
  options?: {
    omitParagraphIds?: ReadonlySet<string>
    /** 문단 id → 덮어쓸 답 (예: preferred-schedule 블록) */
    overrides?: Record<string, unknown>
  },
): Record<string, unknown> {
  const omit = options?.omitParagraphIds
  const overrides = options?.overrides
  const answers: Record<string, unknown> = {}
  for (const paragraph of draft.paragraphs) {
    const key = resolveApplicationAnswerKey(paragraph)
    if (!key) continue
    if (isRuntimeHiddenParagraph(paragraph)) continue
    if (isDisplayOnlyApplicationParagraph(paragraph as unknown as Record<string, unknown>)) {
      continue
    }
    if (omit?.has(key) || omit?.has(paragraph.id)) continue
    if (overrides && key in overrides) {
      answers[key] = overrides[key]
      continue
    }
    const value = extractParagraphAnswer(paragraph)
    if (value !== undefined) {
      answers[key] = value
      continue
    }
    if (isRequiredParagraph(paragraph)) {
      answers[key] = {}
    }
  }
  if (overrides) {
    for (const [key, value] of Object.entries(overrides)) {
      if (omit?.has(key)) continue
      answers[key] = value
    }
  }
  return answers
}
