/**
 * Portal ApplicationFormResponse.form → WritingFormDraft.
 * draftAnswers 를 문단 필드에 병합한다.
 */

import {
  fieldCellValueToPlainText,
  normalizeVerticalTableParagraph,
  normalizeWritingFormDraft,
  resolveHorizontalTableCellPlainText,
  type HorizontalTableParagraph,
  type VerticalTableParagraph,
  type VerticalTableRow,
  type WritingFormDraft,
  type WritingFormParagraph,
} from '@jakorea/form-schema/writing-form'
import { migrateProgramParticipantApplicationParagraphs } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import { resolveApplicationAnswerKey } from './application-answer-key.ts'
import {
  isApplicationSexOffenseInquiryParagraphId,
  isApplicationTeamInfoParagraphId,
  isPortalDynamicOptionArrayParagraphId,
} from './apply-form-paragraph-ids.ts'

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

export type RuntimeConditionalQuestion = {
  questionKey: string
  dependsOnQuestionKey: string
  /** 있으면 의존 답 객체의 이 필드 값으로 판정한다. 값은 대문자로 비교한다. */
  dependsOnField?: string
  visibleValues: ReadonlySet<string>
  hiddenValues: ReadonlySet<string>
}

function normalizeConditionValue(value: unknown): string {
  return value == null ? '' : String(value).trim().toUpperCase()
}

function conditionValueSet(value: unknown): Set<string> {
  const out = new Set<string>()
  if (!Array.isArray(value)) return out
  for (const item of value) {
    const normalized = normalizeConditionValue(item)
    if (normalized) out.add(normalized)
  }
  return out
}

function collectAudienceRuntimeConditionalQuestions(
  runtime: unknown
): RuntimeConditionalQuestion[] {
  if (!isRecord(runtime)) return []
  const audience = runtime.audienceApplication
  if (!isRecord(audience) || !isRecord(audience.conditionalQuestions)) return []
  const out: RuntimeConditionalQuestion[] = []
  for (const [questionKey, raw] of Object.entries(audience.conditionalQuestions)) {
    if (!isRecord(raw) || typeof raw.dependsOnQuestionKey !== 'string') continue
    out.push({
      questionKey,
      dependsOnQuestionKey: raw.dependsOnQuestionKey,
      dependsOnField: typeof raw.dependsOnField === 'string' ? raw.dependsOnField : undefined,
      visibleValues: conditionValueSet(raw.visibleValues),
      hiddenValues: conditionValueSet(raw.hiddenValues),
    })
  }
  return out
}

function isSexOffenseRequestedRuntimeCondition(condition: Record<string, unknown>): boolean {
  return String(condition.conditionKind ?? '').trim().toUpperCase() === 'SEX_OFFENSE_CONSENT_REQUESTED'
}

/** 단락 `runtimeCondition` — audienceApplication.conditionalQuestions 가 없어도 본다. */
function collectParagraphRuntimeConditionalQuestions(
  paragraphs: unknown
): RuntimeConditionalQuestion[] {
  if (!Array.isArray(paragraphs)) return []
  const out: RuntimeConditionalQuestion[] = []
  for (const paragraph of paragraphs) {
    if (!isRecord(paragraph) || typeof paragraph.id !== 'string' || !paragraph.id.trim()) continue
    const condition = paragraph.runtimeCondition
    if (!isRecord(condition) || typeof condition.dependsOnQuestionKey !== 'string') continue
    const questionKey = paragraph.id.trim()
    const sexOffenseCondition = isSexOffenseRequestedRuntimeCondition(condition)
    if (
      !sexOffenseCondition &&
      !isApplicationSexOffenseInquiryParagraphId(questionKey)
    ) {
      continue
    }
    out.push({
      questionKey,
      dependsOnQuestionKey: condition.dependsOnQuestionKey.trim(),
      dependsOnField: 'submissionRequest',
      visibleValues: new Set(['REQUEST']),
      hiddenValues: new Set(['NO_SUBMIT']),
    })
  }
  return out
}

/** `runtimeContext.audienceApplication.conditionalQuestions` + 단락 `runtimeCondition` */
export function collectRuntimeConditionalQuestions(form: unknown): RuntimeConditionalQuestion[] {
  const document = coerceApplicationFormDocument(form)
  const byKey = new Map<string, RuntimeConditionalQuestion>()
  for (const item of collectAudienceRuntimeConditionalQuestions(document?.runtimeContext)) {
    byKey.set(item.questionKey, item)
  }
  for (const item of collectParagraphRuntimeConditionalQuestions(document?.paragraphs)) {
    byKey.set(item.questionKey, item)
  }
  return [...byKey.values()]
}

/**
 * BE `ProgramApplicationAudienceRuntimeValidator.state` 와 동일 판정 —
 * 의존 문항 답에 visible 값이 하나라도 있으면 노출, 없고 hidden 값이 있으면 숨김, 그 외 미정(노출).
 */
export function collectConditionallyHiddenAnswerKeys(
  conditionals: readonly RuntimeConditionalQuestion[],
  answers: Readonly<Record<string, unknown>>,
): Set<string> {
  const hidden = new Set<string>()
  for (const conditional of conditionals) {
    const raw = answers[conditional.dependsOnQuestionKey]
    if (raw == null) continue
    const field = conditional.dependsOnField
    const compared =
      field && raw && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)[field]
        : raw
    if (field && (compared == null || compared === '')) continue
    const values = (Array.isArray(compared) ? compared : [compared]).map(normalizeConditionValue)
    if (values.some(value => conditional.visibleValues.has(value))) continue
    if (values.some(value => conditional.hiddenValues.has(value))) {
      hidden.add(conditional.questionKey)
    }
  }
  return hidden
}

/** 서버는 숨김 문항 키가 있기만 해도(빈 값 포함) 거절하므로 키째 제거한다. */
export function omitRuntimeHiddenAnswers(
  answers: Record<string, unknown>,
  hiddenKeys: ReadonlySet<string>,
  conditionals: readonly RuntimeConditionalQuestion[] = [],
): Record<string, unknown> {
  const conditionallyHidden = collectConditionallyHiddenAnswerKeys(conditionals, answers)
  return Object.fromEntries(
    Object.entries(answers).filter(
      ([key]) => !hiddenKeys.has(key) && !conditionallyHidden.has(key),
    ),
  )
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
    if (paragraph.variant === 'vertical_table') {
      const table = paragraph as unknown as VerticalTableParagraph
      for (const row of table.rows ?? []) {
        for (const cell of row.cells ?? []) score += String(cell ?? '').trim().length
        if (typeof row.dateTimeStage0AuxTime === 'string') {
          score += row.dateTimeStage0AuxTime.trim().length
        }
        if (typeof row.dateTimeStage1Time === 'string') {
          score += row.dateTimeStage1Time.trim().length
        }
      }
      continue
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
function scoreRuntimeContext(runtime: unknown): number {
  if (!isRecord(runtime)) return 0
  let score = 0
  const audience = runtime.audienceApplication
  if (isRecord(audience) && isRecord(audience.dynamicQuestions)) {
    for (const value of Object.values(audience.dynamicQuestions)) {
      if (!isRecord(value)) continue
      const count = value.optionCount
      if (typeof count === 'number' && Number.isFinite(count)) score += count
      if (value.resolved === true) score += 0.5
    }
  }
  if (Array.isArray(runtime.hiddenQuestionKeys)) score += runtime.hiddenQuestionKeys.length * 0.01
  if (isRecord(audience) && Array.isArray(audience.hiddenQuestionKeys)) {
    score += audience.hiddenQuestionKeys.length * 0.01
  }
  return score
}

function pickBestRuntimeContext(candidates: readonly unknown[]): unknown | undefined {
  let best: unknown | undefined
  let bestScore = -1
  for (const candidate of candidates) {
    const score = scoreRuntimeContext(candidate)
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  }
  return best
}

function collectRuntimeContextCandidates(form: unknown, depth: number, collected: unknown[]): void {
  if (!form || depth > 4) return
  if (typeof form === 'string' && form.trim()) {
    try {
      collectRuntimeContextCandidates(JSON.parse(form), depth + 1, collected)
    } catch {
      return
    }
    return
  }
  if (!isRecord(form)) return
  if (form.runtimeContext != null) collected.push(form.runtimeContext)
  for (const key of NESTED_FORM_KEYS) {
    const nested = form[key]
    if (nested == null) continue
    collectRuntimeContextCandidates(nested, depth + 1, collected)
  }
}

/**
 * Portal form-binding SSOT: `response.form.runtimeContext` (envelope 최상위만 보면 비어 보일 수 있음).
 */
export function resolvePortalApplicationFormRuntimeContext(formBinding: unknown): unknown | undefined {
  const candidates: unknown[] = []
  collectRuntimeContextCandidates(formBinding, 0, candidates)
  return pickBestRuntimeContext(candidates)
}

function attachBestRuntimeContext(
  document: Record<string, unknown>,
  formBindingRoot: unknown,
): Record<string, unknown> {
  const candidates: unknown[] = []
  collectRuntimeContextCandidates(formBindingRoot, 0, candidates)
  if (document.runtimeContext != null) candidates.push(document.runtimeContext)
  const best = pickBestRuntimeContext(candidates)
  if (!best) return document
  return { ...document, runtimeContext: best }
}

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

function mergeFilledVerticalTable(
  current: VerticalTableParagraph,
  extra: VerticalTableParagraph,
): VerticalTableParagraph {
  const currentTable = normalizeVerticalTableParagraph(current)
  const extraTable = normalizeVerticalTableParagraph(extra)
  const rowCount = Math.max(currentTable.rows.length, extraTable.rows.length, 1)
  const rows = Array.from({ length: rowCount }, (_, rowIndex) => {
    const currentRow = currentTable.rows[rowIndex]
    const extraRow = extraTable.rows[rowIndex]
    if (!extraRow) return currentRow ?? extraRow
    if (!currentRow) return extraRow
    const stageCount: 1 | 2 = currentRow.stageCount === 2 || extraRow.stageCount === 2 ? 2 : 1
    const mergedCells = Array.from({ length: stageCount }, (_, stageIdx) => {
      const currentText = currentRow.cells[stageIdx] ?? ''
      const extraText = extraRow.cells[stageIdx] ?? ''
      return extraText.trim().length > currentText.trim().length ? extraText : currentText
    })
    const mergedHeaders = Array.from({ length: stageCount }, (_, stageIdx) => {
      const currentHeader = currentRow.headers[stageIdx] ?? ''
      const extraHeader = extraRow.headers[stageIdx] ?? ''
      return extraHeader.trim().length > currentHeader.trim().length ? extraHeader : currentHeader
    })
    const mergedMultiple = Array.from({ length: stageCount }, (_, stageIdx) => {
      const currentSelected = currentRow.choiceMultipleSelections?.[stageIdx] ?? []
      const extraSelected = extraRow.choiceMultipleSelections?.[stageIdx] ?? []
      return extraSelected.length > currentSelected.length ? extraSelected : currentSelected
    })
    const currentTime0 = currentRow.dateTimeStage0AuxTime ?? ''
    const extraTime0 = extraRow.dateTimeStage0AuxTime ?? ''
    const currentTime1 = currentRow.dateTimeStage1Time ?? ''
    const extraTime1 = extraRow.dateTimeStage1Time ?? ''
    const kinds = extraRow.stageKinds ?? currentRow.stageKinds
    const dateTimeStage0AuxTime =
      extraTime0.trim().length > currentTime0.trim().length ? extraTime0 : currentTime0
    const dateTimeStage1Time =
      extraTime1.trim().length > currentTime1.trim().length ? extraTime1 : currentTime1
    if (stageCount === 2) {
      const row: VerticalTableRow = {
        stageCount: 2,
        headers: [mergedHeaders[0] ?? '', mergedHeaders[1] ?? ''],
        cells: [mergedCells[0] ?? '', mergedCells[1] ?? ''],
        choiceMultipleSelections: [mergedMultiple[0] ?? [], mergedMultiple[1] ?? []],
        dateTimeStage0AuxTime,
        dateTimeStage1Time,
      }
      if (kinds && kinds.length >= 2 && kinds[0] != null && kinds[1] != null) {
        row.stageKinds = [kinds[0], kinds[1]]
      }
      return row
    }
    const row: VerticalTableRow = {
      stageCount: 1,
      headers: [mergedHeaders[0] ?? ''],
      cells: [mergedCells[0] ?? ''],
      choiceMultipleSelections: [mergedMultiple[0] ?? []],
      dateTimeStage0AuxTime,
      dateTimeStage1Time,
    }
    if (kinds && kinds.length >= 1 && kinds[0] != null) {
      row.stageKinds = [kinds[0]]
    }
    return row
  })
  return normalizeVerticalTableParagraph({
    ...currentTable,
    rows,
    bottomConsent: extraTable.bottomConsent ?? currentTable.bottomConsent,
    bottomText:
      extraTable.bottomText.trim().length > currentTable.bottomText.trim().length
        ? extraTable.bottomText
        : currentTable.bottomText,
  })
}

function mergeFilledParagraph(
  current: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  if (current.variant === 'horizontal_table' && extra.variant === 'horizontal_table') {
    return mergeFilledHorizontalTable(current, extra)
  }
  if (current.variant === 'vertical_table' && extra.variant === 'vertical_table') {
    return mergeFilledVerticalTable(
      current as unknown as VerticalTableParagraph,
      extra as unknown as VerticalTableParagraph,
    ) as unknown as Record<string, unknown>
  }
  return current
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
      extraById.set(paragraph.id, existing ? mergeFilledParagraph(existing, paragraph) : paragraph)
    }
  }
  if (!Array.isArray(primary.paragraphs) || extraById.size === 0) return primary
  return {
    ...primary,
    paragraphs: primary.paragraphs.map(paragraph => {
      if (!isRecord(paragraph) || typeof paragraph.id !== 'string') return paragraph
      const extra = extraById.get(paragraph.id)
      return extra ? mergeFilledParagraph(paragraph, extra) : paragraph
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
  if (!best || paragraphCount(best) <= 0) return null
  const merged = mergeFilledParagraphContent(best, documents)
  return attachBestRuntimeContext(merged, form)
}

/** form-binding 문단의 런타임 선택지·플래그를 draft 문단 id에 병합한다. */
export function mergeApplicationBindingRuntimeParagraphs(
  draft: WritingFormDraft,
  formBinding: unknown,
): WritingFormDraft {
  const document = coerceApplicationFormDocument(formBinding)
  if (!document || !Array.isArray(document.paragraphs)) return draft
  const bindingById = new Map<string, Record<string, unknown>>()
  for (const paragraph of document.paragraphs) {
    if (!isRecord(paragraph) || typeof paragraph.id !== 'string' || !paragraph.id.trim()) continue
    bindingById.set(paragraph.id.trim(), paragraph)
  }
  if (bindingById.size === 0) return draft
  const merged = draft.paragraphs.map(paragraph => {
    const binding = bindingById.get(paragraph.id)
    if (!binding) return paragraph
    return { ...paragraph, ...binding } as WritingFormParagraph
  })
  const mergedIds = new Set(merged.map(paragraph => paragraph.id))
  const appended = document.paragraphs.flatMap(paragraph => {
    if (!isRecord(paragraph) || typeof paragraph.id !== 'string' || !paragraph.id.trim()) {
      return []
    }
    return mergedIds.has(paragraph.id.trim()) ? [] : [paragraph as unknown as WritingFormParagraph]
  })
  return appended.length > 0 ? { ...draft, paragraphs: [...merged, ...appended] } : { ...draft, paragraphs: merged }
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
    if (
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'multiple_choice' &&
      !paragraph.allowMultiple &&
      paragraph.items.some(item => item.id === answer)
    ) {
      return { ...paragraph, selectedPreviewSingleId: answer }
    }
    return paragraph
  }

  if (Array.isArray(answer)) {
    if (
      paragraph.kind === 'single_item' &&
      paragraph.variant === 'multiple_choice' &&
      answer.every(item => typeof item === 'string')
    ) {
      if (!paragraph.allowMultiple) {
        const selected = (answer as string[]).find(id => paragraph.items.some(item => item.id === id))
        return selected ? { ...paragraph, selectedPreviewSingleId: selected } : paragraph
      }
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
  if (next.kind === 'single_item' && next.variant === 'vertical_table') {
    const extraRows = Array.isArray(answer.rows) ? answer.rows : undefined
    if (extraRows != null || 'bottomConsent' in answer) {
      next = mergeFilledVerticalTable(next, {
        ...next,
        ...(extraRows != null ? { rows: extraRows } : {}),
        ...('bottomConsent' in answer
          ? { bottomConsent: answer.bottomConsent as VerticalTableParagraph['bottomConsent'] }
          : {}),
      } as VerticalTableParagraph)
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
 * `keepParagraphIds` — 면접 있는 프로그램에서 BE가 슬롯 선택지를 붙인 개인 면접 단락은 제거하지 않는다.
 */
export function prepareIndividualApplicationDraft(
  draft: WritingFormDraft,
  options?: { keepParagraphIds?: ReadonlySet<string> },
): WritingFormDraft {
  const unique = uniqueWritingFormParagraphsById(draft.paragraphs)
  const migrated = migrateProgramParticipantApplicationParagraphs({ ...draft, paragraphs: unique })
  const keep = options?.keepParagraphIds
  const migratedIds = new Set(migrated.paragraphs.map(paragraph => paragraph.id))
  const paragraphs =
    keep && keep.size > 0
      ? unique.flatMap(paragraph => {
          if (migratedIds.has(paragraph.id)) {
            const next = migrated.paragraphs.find(row => row.id === paragraph.id)
            return next ? [next] : []
          }
          return keep.has(paragraph.id) ? [paragraph] : []
        })
      : migrated.paragraphs
  return {
    ...migrated,
    paragraphs: paragraphs.map(revealIndividualTeamInfoParagraph),
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
    /** BE는 제3자 동의 등 표 본문(`fieldDataRows`)과 하단 동의를 함께 검증한다. */
    if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
      return {
        fieldDataRows: 'fieldDataRows' in paragraph ? paragraph.fieldDataRows : [],
        dataRows: 'dataRows' in paragraph ? paragraph.dataRows : [],
        bottomConsent: paragraph.bottomConsent ?? null,
      }
    }
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
    /** 단일 선택은 라디오가 `selectedPreviewSingleId`에 쓴다. 서버는 선택지 값 하나를 받는다. */
    if (!paragraph.allowMultiple) return paragraph.selectedPreviewSingleId ?? null
    return paragraph.selectedPreviewMultipleIds ?? []
  }
  if (isApplicationSexOffenseInquiryParagraphId(paragraph.id)) {
    /** sidecar 조회 방식 — 표 fieldDataRows 를 answers로 보내지 않는다. */
    return undefined
  }
  if (isPortalDynamicOptionArrayParagraphId(paragraph.id)) {
    if (!hasDynamicOptionArrayState(paragraph)) return undefined
    /** 면접·봉사 일정 placeholder — BE는 option id 문자열 배열만 받는다. */
    if ('selectedPreviewMultipleIds' in paragraph) {
      return paragraph.selectedPreviewMultipleIds ?? []
    }
    if ('selectedPreviewSingleId' in paragraph && paragraph.selectedPreviewSingleId) {
      return [paragraph.selectedPreviewSingleId]
    }
    return []
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'horizontal_table') {
    /** 동의 없는 표(기본 정보 등) — 키가 빠지면 submit REQUIRED 실패 */
    return {
      fieldDataRows: 'fieldDataRows' in paragraph ? paragraph.fieldDataRows : [],
      dataRows: 'dataRows' in paragraph ? paragraph.dataRows : [],
    }
  }
  if (paragraph.kind === 'single_item' && paragraph.variant === 'vertical_table') {
    return {
      rows: paragraph.rows,
      bottomConsent: paragraph.showBottomConsent ? (paragraph.bottomConsent ?? null) : undefined,
    }
  }
  return undefined
}

/** CMS seed placeholder에는 동적 선택지 답변 키를 만들지 않는다. */
function hasDynamicOptionArrayState(paragraph: WritingFormParagraph): boolean {
  const row = paragraph as unknown as Record<string, unknown>
  if ('selectedPreviewMultipleIds' in row || 'selectedPreviewSingleId' in row) return true
  if (row.runtimeResolved === true) return true
  if (typeof row.runtimeInputMode === 'string' && row.runtimeInputMode.trim().length > 0) {
    return true
  }
  return (
    (Array.isArray(row.items) && row.items.length > 0) ||
    (Array.isArray(row.options) && row.options.length > 0)
  )
}

export function isRequiredParagraph(paragraph: WritingFormParagraph): boolean {
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
    if (isRequiredParagraph(paragraph) && !isPortalDynamicOptionArrayParagraphId(paragraph.id)) {
      if (isApplicationSexOffenseInquiryParagraphId(paragraph.id)) continue
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
