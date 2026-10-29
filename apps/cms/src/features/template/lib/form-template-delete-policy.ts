import { TEMPLATE_CODE_CATALOG } from '@/features/template/api/form-template-catalog'
import { lookupWritingTemplateRegistry } from '@/features/template/lib/lookup-writing-template-registry'

const DELETE_AVAILABLE_ACTIONS = new Set(['DELETE', 'delete', 'REMOVE', 'remove'])

export type FormTemplateDeleteTarget = {
  id: string
  systemTemplate?: boolean
  availableActions?: readonly string[]
  deletable?: boolean
}

export type WritingFormTemplateStructureLockTarget = {
  templateCode?: string | null
  /** forms-surveys 목록 API — false면 사용자 생성(복제) 템플릿 */
  systemTemplate?: boolean
  /** 목록·상세 `baseTemplateCode`. 원본은 자기 자신. */
  baseTemplateCode?: string | null
  /** 신규 등록 직후 URL 플래그 — catalog code여도 편집 허용 */
  forceUserEditable?: boolean
}

/** 양식 목록에 고정 등록된 카탈로그 templateCode */
export function isCatalogFixedWritingFormTemplateCode(
  templateCode: string | undefined | null
): boolean {
  if (templateCode == null) return false
  const code = templateCode.trim()
  if (code === '') return false
  return TEMPLATE_CODE_CATALOG[code] != null
}

const WRITING_TEMPLATE_DERIVED_SUFFIX = /-(?:copy(?:-\d+)?|custom-\d+)$/i

/**
 * 카탈로그 원본 code.
 * `apiBaseTemplateCode`가 있으면 그걸 쓰고, 없으면 레거시 `-copy-` / `-custom-NN` 접미사만 뗀다.
 */
export function resolveWritingFormBaseTemplateCode(
  templateCode: string,
  apiBaseTemplateCode?: string | null
): string {
  const explicit = apiBaseTemplateCode?.trim()
  if (explicit != null && explicit !== '') return explicit
  return templateCode.trim().replace(WRITING_TEMPLATE_DERIVED_SUFFIX, '')
}

/** @deprecated `resolveWritingFormBaseTemplateCode` 사용 */
export function stripWritingTemplateCopySuffix(templateCode: string): string {
  return resolveWritingFormBaseTemplateCode(templateCode)
}

/** 사용자 복제·직접 등록으로 보이는 derived templateCode */
export function isDuplicateWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  if (templateCode == null) return false
  const code = templateCode.trim()
  if (code === '') return false
  return WRITING_TEMPLATE_DERIVED_SUFFIX.test(code)
}

const PROGRAM_SCOPED_OPERATIONAL_CATEGORIES = new Set(['REGISTRATION'])

/** 신청 카탈로그 및 복제본 — 기존 단락은 등록 화면과 같은 잠금 */
export function isApplicationWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  const raw = templateCode?.trim() ?? ''
  if (raw === '') return false
  return resolveWritingFormBaseTemplateCode(raw).startsWith('application-')
}

/** 모집 카탈로그 및 복제본 — 구조 고정, 내용 입력만 */
export function isRecruitmentWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  const raw = templateCode?.trim() ?? ''
  if (raw === '') return false
  return resolveWritingFormBaseTemplateCode(raw).startsWith('recruitment-')
}

/** 모집·신청 카탈로그 및 그 복사본 */
export function isRecruitmentOrApplicationWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  const raw = templateCode?.trim() ?? ''
  if (raw === '') return false
  const base = resolveWritingFormBaseTemplateCode(raw)
  return base.startsWith('recruitment-') || base.startsWith('application-')
}

/**
 * 등록·모집 시스템 양식 PUT — BE `FORM_SCHEMA_IMMUTABLE`.
 * 에디터 draft 전체 schemaJson은 보내지 않고, 시드 구조 + 허용 카피만 schemaJson으로 보낸다(`operational-form-schema-copy-merge`).
 */
export function shouldOmitImmutableFormSchemaJson(
  templateCode: string | undefined | null
): boolean {
  const code = templateCode?.trim() ?? ''
  if (code === '') return false
  if (code.startsWith('registration-')) return true
  if (isRecruitmentWritingTemplateCode(code)) return true
  // BE 카탈로그 시드에 없는 normalize 필드(maxLength 등)가 붙으면 FORM_SCHEMA_IMMUTABLE
  return resolveWritingFormBaseTemplateCode(code) === 'application-participant-individual'
}

/**
 * 프로그램 등록 전용 운영 양식(등록 copy).
 * 양식 관리 등록 섹션은 **카탈로그 고정 code만** 노출한다.
 * 모집·신청 사용자 복제는 목록에 노출한다. 설문/동의 사용자 복제는 유지.
 */
export function isProgramScopedOperationalWritingTemplate(item: {
  templateCode?: string | null
  category?: string | null
}): boolean {
  const code = item.templateCode?.trim() ?? ''
  if (code === '') return false
  if (isCatalogFixedWritingFormTemplateCode(code)) return false

  const category = (item.category ?? '').trim().toUpperCase()
  const resolved =
    category ||
    (code.startsWith('registration-')
      ? 'REGISTRATION'
      : code.startsWith('recruitment-')
        ? 'RECRUITMENT'
        : code.startsWith('application-')
          ? 'APPLICATION'
          : '')
  return PROGRAM_SCOPED_OPERATIONAL_CATEGORIES.has(resolved)
}

/**
 * BE V41 레거시 CATALOG 시드(`use_yn=false`, `source_template_id` null).
 * FE 카탈로그 목록(TEMPLATE_CODE_CATALOG)에는 없지만 BE는 CATALOG 원본으로 409를 낸다.
 * `use_yn=false`를 원본 아님으로 해석하지 않는다(C3). 목록 노출에는 쓰지 않는다.
 */
export const BE_LEGACY_CATALOG_ORIGINAL_WRITING_TEMPLATE_CODES: ReadonlySet<string> = new Set([
  'registration-trained-teacher',
  'recruitment-trained-teacher-organization',
  'application-trained-teacher-participant',
  'application-trained-teacher-organization',
])

export type CatalogOriginalIdentityInput = {
  templateCode?: string | null
  baseTemplateCode?: string | null
  systemTemplate?: boolean | null
  /** BE `template_scope` — DTO에 노출되면 이 값으로만 판정한다. */
  templateScope?: string | null
  /** BE `source_template_id` — CATALOG 원본은 null */
  sourceTemplateId?: number | string | null
}

function resolveKnownTemplateScope(input: CatalogOriginalIdentityInput): string | null {
  const scope = input.templateScope?.trim().toUpperCase() ?? ''
  return scope === '' ? null : scope
}

function hasSourceTemplateId(value: number | string | null | undefined): boolean {
  if (value == null) return false
  return String(value).trim() !== ''
}

/**
 * CATALOG 원본 — BE 기준 `template_scope=CATALOG && source_template_id null`.
 * DTO에 templateScope가 아직 없으면 systemTemplate·baseTemplateCode·카탈로그 고정 코드(+BE 레거시 시드 코드)로 판별한다.
 */
export function isCatalogOriginalWritingTemplate(input: CatalogOriginalIdentityInput): boolean {
  const scope = resolveKnownTemplateScope(input)
  if (scope != null) return scope === 'CATALOG' && !hasSourceTemplateId(input.sourceTemplateId)
  const code = input.templateCode?.trim() ?? ''
  if (code === '') return false
  if (
    !isCatalogFixedWritingFormTemplateCode(code) &&
    !BE_LEGACY_CATALOG_ORIGINAL_WRITING_TEMPLATE_CODES.has(code)
  ) {
    return false
  }
  if (isDuplicateWritingTemplateCode(code)) return false
  if (input.systemTemplate === false) return false
  const base = input.baseTemplateCode?.trim()
  if (base != null && base !== '' && base !== code) return false
  return true
}

/** 프로그램 전용 복사본. CATALOG 원본이 아니면 derived·systemTemplate false·다른 baseTemplateCode. */
export function isProgramDedicatedWritingTemplate(input: CatalogOriginalIdentityInput): boolean {
  const scope = resolveKnownTemplateScope(input)
  if (scope != null) return !isCatalogOriginalWritingTemplate(input)
  const code = input.templateCode?.trim() ?? ''
  if (code === '') return false
  if (isCatalogOriginalWritingTemplate(input)) return false
  if (input.systemTemplate === false) return true
  if (isDuplicateWritingTemplateCode(code)) return true
  const base = input.baseTemplateCode?.trim()
  return base != null && base !== '' && base !== code
}

/** 단락 구조 잠금 — 모집·신청(복제본 포함)은 항상 잠금. 신청은 등록 화면과 같은 부분 편집. */
export function isWritingFormTemplateStructureLocked(
  target: WritingFormTemplateStructureLockTarget
): boolean {
  if (isRecruitmentWritingTemplateCode(target.templateCode)) return true
  if (isApplicationWritingTemplateCode(target.templateCode)) return true
  if (target.forceUserEditable === true) return false
  if (
    isCatalogOriginalWritingTemplate({
      templateCode: target.templateCode,
      baseTemplateCode: target.baseTemplateCode,
      systemTemplate: target.systemTemplate,
    })
  ) {
    return true
  }
  const templateCode = target.templateCode?.trim() ?? ''
  const catalogOriginal = isCatalogFixedWritingFormTemplateCode(templateCode)
  if (
    catalogOriginal &&
    isRecruitmentOrApplicationWritingTemplateCode(templateCode) &&
    target.systemTemplate !== false
  ) {
    return true
  }
  if (templateCode !== '') {
    const registryEntry = lookupWritingTemplateRegistry(templateCode)
    if (registryEntry?.category === 'survey') return false
  }
  if (target.systemTemplate === false) return false
  if (isDuplicateWritingTemplateCode(target.templateCode)) return false
  if (target.systemTemplate === true) return true
  return catalogOriginal
}

/** 신청은 lock이어도 순서 변경 가능. 모집은 lock이면 불가. */
export function canReorderParticipantApplicationParagraphs(options: {
  structureLocked: boolean
  recruitmentForm: boolean
}): boolean {
  return !(options.recruitmentForm && options.structureLocked)
}

/** 목록 row 기준 — 사용자 생성(복제·직접 등록) 템플릿 */
export function isUserCreatedWritingFormTemplateRow(
  row: { id: string; systemTemplate?: boolean; creator?: string } | null | undefined
): boolean {
  if (row == null) return false
  if (row.systemTemplate === false) return true
  if (row.creator === '사용자 생성') return true
  return isDuplicateWritingTemplateCode(row.id)
}

export function buildLocalDuplicateWritingTemplateCode(sourceTemplateCode: string): string {
  const base = resolveWritingFormBaseTemplateCode(sourceTemplateCode)
  return `${base}-copy-${Date.now()}`
}

/** 사용자 추가 생성 템플릿 — API `systemTemplate=false` 또는 카탈로그 외 code */
export function resolveWritingFormTemplateDeletable(target: FormTemplateDeleteTarget): boolean {
  if (target.deletable != null) return target.deletable
  if (target.systemTemplate === true) return false
  if (target.systemTemplate === false) return true
  if (
    target.availableActions?.some(action => DELETE_AVAILABLE_ACTIONS.has(action)) === true
  ) {
    return true
  }
  return TEMPLATE_CODE_CATALOG[target.id] == null
}

export function shouldShowWritingFormTemplateDeleteButton(
  target: FormTemplateDeleteTarget | null | undefined,
  remoteApiEnabled: boolean
): boolean {
  if (!remoteApiEnabled || target == null) return false
  return resolveWritingFormTemplateDeletable(target)
}
