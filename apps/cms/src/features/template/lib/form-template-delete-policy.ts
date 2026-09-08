import { TEMPLATE_CODE_CATALOG } from '@/features/template/api/form-template-catalog'

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

/** 신규 등록(복제)로 생성된 `-copy-{timestamp}` templateCode */
export function isDuplicateWritingTemplateCode(
  templateCode: string | undefined | null
): boolean {
  if (templateCode == null) return false
  const code = templateCode.trim()
  if (code === '') return false
  return /-copy(?:-\d+)?$/i.test(code)
}

/** 단락 구조·본문 편집 잠금 여부 — 고정 카탈로그 양식만 true */
export function isWritingFormTemplateStructureLocked(
  target: WritingFormTemplateStructureLockTarget
): boolean {
  if (target.forceUserEditable === true) return false
  if (target.systemTemplate === false) return false
  if (isDuplicateWritingTemplateCode(target.templateCode)) return false
  if (target.systemTemplate === true) return true
  return isCatalogFixedWritingFormTemplateCode(target.templateCode)
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
  const base = sourceTemplateCode.trim().replace(/-copy(?:-\d+)?$/i, '')
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
