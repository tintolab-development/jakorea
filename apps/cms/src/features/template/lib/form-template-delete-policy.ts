import { TEMPLATE_CODE_CATALOG } from '@/features/template/api/form-template-catalog'
import { lookupTemplateRegistry } from '@/features/template/model/template-registry/template-registry'

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

const WRITING_TEMPLATE_COPY_SUFFIX = /-copy(?:-\d+)?$/i

/** 복제 suffix(`-copy`, `-copy-123`)를 떼 카탈로그 base code를 얻는다. */
export function stripWritingTemplateCopySuffix(templateCode: string): string {
  return templateCode.trim().replace(WRITING_TEMPLATE_COPY_SUFFIX, '')
}

/** 신규 등록(복제)로 생성된 `-copy-{timestamp}` templateCode */
export function isDuplicateWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  if (templateCode == null) return false
  const code = templateCode.trim()
  if (code === '') return false
  return WRITING_TEMPLATE_COPY_SUFFIX.test(code)
}

const PROGRAM_SCOPED_OPERATIONAL_CATEGORIES = new Set(['REGISTRATION'])

/** 모집·신청 카탈로그 및 그 복사본 (`-copy`, `-copy-123`) */
export function isRecruitmentOrApplicationWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  const raw = templateCode?.trim() ?? ''
  if (raw === '') return false
  const base = stripWritingTemplateCopySuffix(raw)
  return base.startsWith('recruitment-') || base.startsWith('application-')
}

/**
 * 등록·모집 시스템 양식 PUT — BE `FORM_SCHEMA_IMMUTABLE`.
 * 일정형 제목 등 표시용 schema 변경은 보내지 않고 extensionJson만 갱신한다.
 */
export function shouldOmitImmutableFormSchemaJson(
  templateCode: string | undefined | null
): boolean {
  const code = templateCode?.trim() ?? ''
  if (code === '') return false
  return code.startsWith('registration-') || code.startsWith('recruitment-')
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

/** 단락 구조 잠금 — 모집·신청(복사본 포함)은 항상 잠금. 설문은 제외. 동의 복사는 해제. */
export function isWritingFormTemplateStructureLocked(
  target: WritingFormTemplateStructureLockTarget
): boolean {
  if (isRecruitmentOrApplicationWritingTemplateCode(target.templateCode)) return true
  if (target.forceUserEditable === true) return false
  const templateCode = target.templateCode?.trim()
  if (templateCode != null && templateCode !== '') {
    const registryEntry = lookupTemplateRegistry(templateCode)
    if (registryEntry?.category === 'survey') return false
  }
  if (target.systemTemplate === false) return false
  if (isDuplicateWritingTemplateCode(target.templateCode)) return false
  if (target.systemTemplate === true) return true
  return isCatalogFixedWritingFormTemplateCode(target.templateCode)
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
  const base = stripWritingTemplateCopySuffix(sourceTemplateCode)
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
