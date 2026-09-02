import { TEMPLATE_CODE_CATALOG } from '@/features/template/api/form-template-catalog'

const DELETE_AVAILABLE_ACTIONS = new Set(['DELETE', 'delete', 'REMOVE', 'remove'])

export type FormTemplateDeleteTarget = {
  id: string
  systemTemplate?: boolean
  availableActions?: readonly string[]
  deletable?: boolean
}

/** 사용자 추가 생성 템플릿 — API `systemTemplate=false` 또는 카탈로그 외 코드 */
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
