export const CATALOG_STRUCTURE_IMMUTABLE_MESSAGE =
  '카탈로그 원본 양식의 구조는 변경하거나 게시할 수 없습니다. 기존 항목의 기본 내용은 저장할 수 있습니다.'

export const FORM_CATALOG_VERSION_IMMUTABLE = 'FORM_CATALOG_VERSION_IMMUTABLE'

/**
 * CATALOG 원본에서 수정 가능한 기존 항목 값(변경 정책 2).
 * `fieldDataRows[].value`·`dataRows` 셀 문자열은 위치 컨텍스트로 따로 판정한다.
 * `paragraphTitle`·필수·옵션·검증·조건부·바인딩 키는 포함하지 않는다.
 */
export const CATALOG_CONTENT_KEYS: ReadonlySet<string> = new Set([
  'paragraphDescription',
  'bodyText',
  'bottomText',
  'placeholder',
  'helpText',
  'description',
  'defaultValue',
  'defaultValues',
  'initialValue',
  'selectedPreviewSingleId',
  'selectedPreviewMultipleIds',
])

/**
 * 에디터 normalize가 baseline에 없는 키를 붙이는 경우.
 * baseline에 같은 키가 있으면 구조로 비교한다.
 */
const EDITOR_ONLY_KEYS = new Set(['maxLength', 'participatesInTitleNumbering', 'schemaVersion'])

/** extensionJson 중 내용 값 수정이 허용되는 최상위 영역 */
export const CATALOG_EXTENSION_CONTENT_SECTIONS = ['overlay', 'editorState', 'uiState'] as const

/**
 * extensionJson 내용 영역 안에서도 구조로 보는 키.
 * 항목 추가·삭제·순서, ID, 필드 타입, 필수, 옵션 구조, 검증, 조건부 노출, 바인딩 키, paragraphTitle.
 */
const EXTENSION_STRUCTURE_KEYS = new Set([
  'id',
  'paragraphId',
  'fieldId',
  'itemId',
  'kind',
  'type',
  'fieldType',
  'variant',
  'required',
  'requiredMark',
  'answerRequired',
  'options',
  'choices',
  'choiceOptions',
  'validation',
  'validations',
  'validationRules',
  'visibility',
  'visibleWhen',
  'condition',
  'conditions',
  'conditional',
  'conditionalDisplay',
  'binding',
  'bindings',
  'bindingKey',
  'paragraphs',
  'paragraphOrder',
  'order',
  'paragraphTitle',
])

type WalkContext = {
  inFieldDataRows: boolean
  inDataRows: boolean
}

const ROOT_CONTEXT: WalkContext = { inFieldDataRows: false, inDataRows: false }

export class CatalogStructureImmutableError extends Error {
  readonly code = FORM_CATALOG_VERSION_IMMUTABLE

  constructor(message = CATALOG_STRUCTURE_IMMUTABLE_MESSAGE) {
    super(message)
    this.name = 'CatalogStructureImmutableError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function nodeId(value: unknown): string | null {
  if (!isRecord(value)) return null
  const id = value.id
  return typeof id === 'string' && id.trim() !== '' ? id : null
}

function isIdentifiedObjectArray(value: unknown[]): boolean {
  return value.length > 0 && value.every(item => nodeId(item) != null)
}

function cloneJson<T>(value: T): T {
  if (value === undefined) return value
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * `fieldDataRows`/`dataRows` 바로 아래(행 배열 → 셀)까지만 셀 컨텍스트를 유지한다.
 * 셀 객체 안의 다른 키(options 등)로 내려가면 다시 구조 컨텍스트가 된다.
 */
function childContext(key: string): WalkContext {
  if (key === 'fieldDataRows') return { inFieldDataRows: true, inDataRows: false }
  if (key === 'dataRows') return { inFieldDataRows: false, inDataRows: true }
  return ROOT_CONTEXT
}

function isContentKey(key: string, context: WalkContext): boolean {
  if (CATALOG_CONTENT_KEYS.has(key)) return true
  return context.inFieldDataRows && key === 'value'
}

function sameIdSequence(before: unknown[], after: unknown[]): boolean {
  if (before.length !== after.length) return false
  for (let index = 0; index < before.length; index += 1) {
    if (nodeId(before[index]) !== nodeId(after[index])) return false
  }
  return true
}

/** null·키 없음·빈 배열·빈 객체는 같은 "값 없음"으로 본다. */
function isAbsentLike(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (Array.isArray(value)) return value.length === 0
  if (isRecord(value)) return Object.keys(value).every(key => value[key] === undefined)
  return false
}

const NUMERIC_TEXT = /^-?\d+(?:\.\d+)?$/

/** 숫자 ↔ 숫자 문자열 직렬화 차이 */
function numericEquivalent(left: unknown, right: unknown): boolean {
  if (typeof left === 'number' && typeof right === 'string') {
    const text = right.trim()
    return NUMERIC_TEXT.test(text) && Number(text) === left
  }
  if (typeof left === 'string' && typeof right === 'number') return numericEquivalent(right, left)
  return false
}

function semanticallyEqualScalar(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true
  if (isAbsentLike(left) && isAbsentLike(right)) return true
  return numericEquivalent(left, right)
}

function structuresEqual(before: unknown, after: unknown, context: WalkContext): boolean {
  if (semanticallyEqualScalar(before, after)) return true
  if (context.inDataRows && typeof before === 'string' && typeof after === 'string') return true
  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after)) return false
    if (isIdentifiedObjectArray(before) || isIdentifiedObjectArray(after)) {
      if (!isIdentifiedObjectArray(before) || !isIdentifiedObjectArray(after)) return false
      if (!sameIdSequence(before, after)) return false
      return before.every((item, index) => structuresEqual(item, after[index], context))
    }
    if (before.length !== after.length) return false
    return before.every((item, index) => structuresEqual(item, after[index], context))
  }
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of keys) {
      if (isContentKey(key, context)) continue
      if (EDITOR_ONLY_KEYS.has(key) && before[key] === undefined) continue
      if (!structuresEqual(before[key], after[key], childContext(key))) return false
    }
    return true
  }
  return false
}

/**
 * 허용된 기본 내용 경로를 제외하고 구조가 바뀌었는지 본다.
 * 속성 순서는 무시하고 배열 순서는 비교한다. null↔키 없음, []↔키 없음, 숫자↔숫자 문자열은 같은 값으로 본다.
 */
export function catalogStructureChanged(before: unknown, after: unknown): boolean {
  return !structuresEqual(before, after, ROOT_CONTEXT)
}

function mergeContent(baseline: unknown, editor: unknown, context: WalkContext): unknown {
  if (context.inDataRows && typeof baseline === 'string' && typeof editor === 'string') {
    return editor
  }
  if (Array.isArray(baseline) && Array.isArray(editor)) {
    if (isIdentifiedObjectArray(baseline) && isIdentifiedObjectArray(editor) && sameIdSequence(baseline, editor)) {
      return baseline.map((item, index) => mergeContent(item, editor[index], context))
    }
    if (
      !isIdentifiedObjectArray(baseline) &&
      !isIdentifiedObjectArray(editor) &&
      baseline.length === editor.length
    ) {
      return baseline.map((item, index) => mergeContent(item, editor[index], context))
    }
    return cloneJson(baseline)
  }
  if (isRecord(baseline) && isRecord(editor)) {
    const next: Record<string, unknown> = {}
    for (const key of Object.keys(baseline)) {
      if (isContentKey(key, context)) {
        next[key] = key in editor ? cloneJson(editor[key]) : cloneJson(baseline[key])
        continue
      }
      next[key] = mergeContent(baseline[key], editor[key], childContext(key))
    }
    // baseline에 키가 없던 허용 내용 값(예: 처음 입력한 placeholder)도 보존한다.
    for (const key of Object.keys(editor)) {
      if (key in baseline || editor[key] === undefined) continue
      if (isContentKey(key, context)) next[key] = cloneJson(editor[key])
    }
    return next
  }
  return cloneJson(baseline)
}

/** baseline 구조를 유지하고, 허용된 기본 내용만 editor 값으로 덮는다. */
export function applyCatalogAllowedContent<T>(baseline: T, editor: T): T {
  return mergeContent(baseline, editor, ROOT_CONTEXT) as T
}

function extensionValuesEqual(before: unknown, after: unknown): boolean {
  if (semanticallyEqualScalar(before, after)) return true
  if (Array.isArray(before) && Array.isArray(after)) {
    return (
      before.length === after.length &&
      before.every((item, index) => extensionValuesEqual(item, after[index]))
    )
  }
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of keys) {
      if (!extensionValuesEqual(before[key], after[key])) return false
    }
    return true
  }
  return false
}

function containsExtensionStructureKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsExtensionStructureKey)
  if (!isRecord(value)) return false
  return Object.keys(value).some(
    key =>
      (EXTENSION_STRUCTURE_KEYS.has(key) && !isAbsentLike(value[key])) ||
      containsExtensionStructureKey(value[key])
  )
}

function isPrimitive(value: unknown): boolean {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value)
}

function extensionContentOnly(before: unknown, after: unknown): boolean {
  if (semanticallyEqualScalar(before, after)) return true
  // 기존 값 제거(내용 지우기) — 구조 키가 들어 있던 값이면 구조 삭제로 본다.
  if (isAbsentLike(after)) return !containsExtensionStructureKey(before)
  // 새 값 추가 — 구조 키가 들어 있지 않은 내용 값만 허용한다.
  if (isAbsentLike(before)) return !containsExtensionStructureKey(after)
  if (isPrimitive(before) && isPrimitive(after)) return true
  if (Array.isArray(before) || Array.isArray(after)) {
    if (!Array.isArray(before) || !Array.isArray(after)) return false
    if (isIdentifiedObjectArray(before) || isIdentifiedObjectArray(after)) {
      if (!isIdentifiedObjectArray(before) || !isIdentifiedObjectArray(after)) return false
      if (!sameIdSequence(before, after)) return false
      return before.every((item, index) => extensionContentOnly(item, after[index]))
    }
    // 원시값 목록(선택값·기본값 목록 등)은 내용으로 본다.
    if (before.every(isPrimitive) && after.every(isPrimitive)) return true
    if (before.length !== after.length) return false
    return before.every((item, index) => extensionContentOnly(item, after[index]))
  }
  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const key of keys) {
      if (EXTENSION_STRUCTURE_KEYS.has(key)) {
        if (!extensionValuesEqual(before[key], after[key])) return false
        continue
      }
      if (!extensionContentOnly(before[key], after[key])) return false
    }
    return true
  }
  // 객체 ↔ 원시값 등 타입 변경
  return false
}

/**
 * extensionJson 구조 변경 여부(C5).
 * overlay/editorState/uiState 안의 내용 값만 바뀌면 false.
 * 그 밖의 최상위 키 변경, 구조 키(ID·타입·필수·옵션·검증·조건부·바인딩·순서·paragraphTitle) 변경,
 * 객체/배열/원시값 타입 변경, ID 배열의 추가·삭제·순서 변경은 true.
 */
export function catalogExtensionStructureChanged(before: unknown, after: unknown): boolean {
  const beforeRecord = isRecord(before) ? before : {}
  const afterRecord = isRecord(after) ? after : {}
  const sections = new Set<string>(CATALOG_EXTENSION_CONTENT_SECTIONS)
  const keys = new Set([...Object.keys(beforeRecord), ...Object.keys(afterRecord)])
  for (const key of keys) {
    if (sections.has(key)) {
      const left = beforeRecord[key]
      const right = afterRecord[key]
      if (!isAbsentLike(left) && !isRecord(left)) return true
      if (!isAbsentLike(right) && !isRecord(right)) return true
      if (!extensionContentOnly(left ?? {}, right ?? {})) return true
      continue
    }
    if (!extensionValuesEqual(beforeRecord[key], afterRecord[key])) return true
  }
  return false
}

function contentEqual(left: unknown, right: unknown): boolean {
  if (semanticallyEqualScalar(left, right)) return true
  return JSON.stringify(left) === JSON.stringify(right)
}

export type CatalogDefaultsMismatch = {
  /** 예: paragraphs[id=p1].fieldDataRows */
  path: string
  reason: 'id-sequence' | 'length' | 'type'
}

function arrayItemPath(path: string, item: unknown, index: number): string {
  const id = nodeId(item)
  return id != null ? `${path}[id=${id}]` : `${path}[${index}]`
}

function findById(items: unknown[], id: string | null): unknown {
  if (id == null) return undefined
  return items.find(item => nodeId(item) === id)
}

function mergeUnedited(
  current: unknown,
  published: unknown,
  seed: unknown,
  context: WalkContext,
  path: string,
  mismatches: CatalogDefaultsMismatch[]
): unknown {
  if (context.inDataRows && typeof current === 'string' && typeof published === 'string') {
    const seedText = typeof seed === 'string' ? seed : current
    return contentEqual(current, seedText) ? published : current
  }
  if (Array.isArray(current)) {
    if (published === undefined) return cloneJson(current)
    if (!Array.isArray(published)) {
      mismatches.push({ path, reason: 'type' })
      return cloneJson(current)
    }
    const seedItems = Array.isArray(seed) ? seed : current
    const allIdentified =
      isIdentifiedObjectArray(current) &&
      isIdentifiedObjectArray(published) &&
      isIdentifiedObjectArray(seedItems)
    if (allIdentified) {
      if (!sameIdSequence(current, published) || !sameIdSequence(current, seedItems)) {
        mismatches.push({ path, reason: 'id-sequence' })
      }
      // 순서·ID는 current 그대로. 같은 ID끼리만 기본 내용을 채운다.
      return current.map((item, index) => {
        const id = nodeId(item)
        const publishedItem = findById(published, id)
        const seedItem = findById(seedItems, id)
        if (publishedItem === undefined || seedItem === undefined) return cloneJson(item)
        return mergeUnedited(
          item,
          publishedItem,
          seedItem,
          context,
          arrayItemPath(path, item, index),
          mismatches
        )
      })
    }
    if (current.length === published.length && current.length === seedItems.length) {
      return current.map((item, index) =>
        mergeUnedited(
          item,
          published[index],
          seedItems[index],
          context,
          arrayItemPath(path, item, index),
          mismatches
        )
      )
    }
    mismatches.push({ path, reason: 'length' })
    return cloneJson(current)
  }
  if (isRecord(current)) {
    if (published === undefined) return cloneJson(current)
    if (!isRecord(published)) {
      mismatches.push({ path, reason: 'type' })
      return cloneJson(current)
    }
    const seedRecord = isRecord(seed) ? seed : current
    const next: Record<string, unknown> = {}
    for (const key of Object.keys(current)) {
      if (isContentKey(key, context)) {
        const currentValue = current[key]
        const seedValue = key in seedRecord ? seedRecord[key] : currentValue
        next[key] =
          key in published && contentEqual(currentValue, seedValue)
            ? cloneJson(published[key])
            : cloneJson(currentValue)
        continue
      }
      next[key] = mergeUnedited(
        current[key],
        published[key],
        seedRecord[key],
        childContext(key),
        path === '' ? key : `${path}.${key}`,
        mismatches
      )
    }
    return next
  }
  return cloneJson(current)
}

/**
 * 아직 편집하지 않은 기본 내용만 게시 원본 값으로 채우고, 구조 불일치 경로를 함께 돌려준다.
 * 항목 순서·ID·구조는 항상 `current`를 유지한다(C6).
 */
export function applyUneditedCatalogContentWithReport<T>(
  current: T,
  published: T,
  seed: T = current
): { value: T; mismatches: CatalogDefaultsMismatch[] } {
  const mismatches: CatalogDefaultsMismatch[] = []
  const value = mergeUnedited(current, published, seed, ROOT_CONTEXT, '', mismatches) as T
  return { value, mismatches }
}

/**
 * 아직 편집하지 않은 기본 내용만 게시 원본 값으로 채운다.
 * `current`가 `seed`와 같은 내용이면 published 값을 쓰고, 이미 다른 값이면 current를 유지한다.
 */
export function applyUneditedCatalogContent<T>(current: T, published: T, seed: T = current): T {
  return applyUneditedCatalogContentWithReport(current, published, seed).value
}
