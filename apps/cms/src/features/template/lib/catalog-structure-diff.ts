export const CATALOG_STRUCTURE_IMMUTABLE_MESSAGE =
  '카탈로그 원본 양식의 구조는 변경하거나 게시할 수 없습니다. 기존 항목의 기본 내용은 저장할 수 있습니다.'

export const FORM_CATALOG_VERSION_IMMUTABLE = 'FORM_CATALOG_VERSION_IMMUTABLE'

/** 기존 항목의 문구·기본값·미리보기 선택만 허용. `paragraphTitle`은 포함하지 않는다. */
const CONTENT_KEYS = new Set([
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

function childContext(key: string, context: WalkContext): WalkContext {
  if (key === 'fieldDataRows') return { inFieldDataRows: true, inDataRows: false }
  if (key === 'dataRows') return { inFieldDataRows: false, inDataRows: true }
  return context
}

function isContentKey(key: string, context: WalkContext): boolean {
  if (CONTENT_KEYS.has(key)) return true
  return context.inFieldDataRows && key === 'value'
}

function sameIdSequence(before: unknown[], after: unknown[]): boolean {
  if (before.length !== after.length) return false
  for (let index = 0; index < before.length; index += 1) {
    if (nodeId(before[index]) !== nodeId(after[index])) return false
  }
  return true
}

function structuresEqual(before: unknown, after: unknown, context: WalkContext): boolean {
  if (Object.is(before, after)) return true
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
    const beforeKeys = Object.keys(before)
    for (const key of beforeKeys) {
      if (isContentKey(key, context)) continue
      if (!(key in after)) return false
      if (!structuresEqual(before[key], after[key], childContext(key, context))) return false
    }
    for (const key of Object.keys(after)) {
      if (after[key] === undefined) continue
      if (key in before || isContentKey(key, context) || EDITOR_ONLY_KEYS.has(key)) continue
      return false
    }
    return true
  }
  return false
}

/** 허용된 기본 내용 경로를 제외하고 구조가 바뀌었는지 본다. 속성 순서는 무시하고 배열 순서는 비교한다. */
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
      next[key] = mergeContent(baseline[key], editor[key], childContext(key, context))
    }
    return next
  }
  return cloneJson(baseline)
}

/** baseline 구조를 유지하고, 허용된 기본 내용만 editor 값으로 덮는다. */
export function applyCatalogAllowedContent<T>(baseline: T, editor: T): T {
  return mergeContent(baseline, editor, ROOT_CONTEXT) as T
}

function contentEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function mergeUnedited(
  current: unknown,
  published: unknown,
  seed: unknown,
  context: WalkContext
): unknown {
  if (context.inDataRows && typeof current === 'string' && typeof published === 'string') {
    const seedText = typeof seed === 'string' ? seed : current
    return contentEqual(current, seedText) ? published : current
  }
  if (Array.isArray(current) && Array.isArray(published) && Array.isArray(seed)) {
    const identified =
      isIdentifiedObjectArray(current) &&
      isIdentifiedObjectArray(published) &&
      isIdentifiedObjectArray(seed) &&
      sameIdSequence(current, published) &&
      sameIdSequence(current, seed)
    if (identified || (current.length === published.length && current.length === seed.length)) {
      return current.map((item, index) =>
        mergeUnedited(item, published[index], seed[index], context)
      )
    }
    return cloneJson(current)
  }
  if (isRecord(current) && isRecord(published) && isRecord(seed)) {
    const next: Record<string, unknown> = {}
    for (const key of Object.keys(current)) {
      if (isContentKey(key, context)) {
        const currentValue = current[key]
        const seedValue = key in seed ? seed[key] : currentValue
        next[key] =
          key in published && contentEqual(currentValue, seedValue)
            ? cloneJson(published[key])
            : cloneJson(currentValue)
        continue
      }
      next[key] = mergeUnedited(
        current[key],
        published[key],
        seed[key],
        childContext(key, context)
      )
    }
    return next
  }
  return cloneJson(current)
}

/**
 * 아직 편집하지 않은 기본 내용만 게시 원본 값으로 채운다.
 * `current`가 `seed`와 같은 내용이면 published 값을 쓰고, 이미 다른 값이면 current를 유지한다.
 */
export function applyUneditedCatalogContent<T>(current: T, published: T, seed: T = current): T {
  return mergeUnedited(current, published, seed, ROOT_CONTEXT) as T
}
