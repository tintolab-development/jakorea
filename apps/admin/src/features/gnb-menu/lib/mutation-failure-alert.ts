/**
 * GNB 메뉴 저장 실패 알림 — 대메뉴(섹션)명·원인 명시
 * @see apps/admin/.cursor/rules/data/mutation-failure-alert.mdc
 */

import {
  type AdminMutationAlert,
  readApiErrorCode,
  readApiErrorMessage,
} from '@/shared/lib/api-error-message'
import { mapAdminMutationAlert } from '@/shared/ui'

export const GNB_MENU_NAME_MAX_LENGTH = 100

export type GnbMenuSaveAction = 'save' | 'toggle' | 'reorder'

const ACTION_COPY: Record<GnbMenuSaveAction, { title: string; content: string }> = {
  save: { title: '저장 실패', content: '하위 메뉴명·사용 여부·순서를 저장하지 못했습니다.' },
  toggle: { title: '사용 여부 변경 실패', content: '사용 여부를 변경하지 못했습니다.' },
  reorder: { title: '순서 변경 실패', content: '노출 순서를 저장하지 못했습니다.' },
}

export function gnbMenuMutationFailureAlert(
  error: unknown,
  sectionLabel: string,
  action: GnbMenuSaveAction
): AdminMutationAlert {
  const common = mapAdminMutationAlert(error)
  if (common) return common

  const copy = ACTION_COPY[action]
  const code = readApiErrorCode(error) ?? ''
  const message = readApiErrorMessage(error) ?? ''
  if (/VALIDATION|displayName|size must be|maxLength/i.test(`${code} ${message}`)) {
    return {
      title: copy.title,
      content: `[${sectionLabel}] 하위 메뉴명은 1자 이상 ${GNB_MENU_NAME_MAX_LENGTH}자 이하로 입력해 주세요.`,
    }
  }
  return {
    title: copy.title,
    content: `[${sectionLabel}] ${copy.content} 다시 시도해 주세요.`,
  }
}
