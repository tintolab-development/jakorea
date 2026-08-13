import type { TableBottomConsent } from '@/features/template/model/writing-form-draft.schema'

/** 동의서 작성(fill) — bottomConsent 미선택 시 `agree` 폴백 금지 (Ant Radio undefined → 1번 선택처럼 보임) */
export function resolveTableBottomConsentRadioValue(
  bottomConsent: TableBottomConsent | undefined,
  options: { consentFillMode?: boolean; interactive?: boolean }
): TableBottomConsent | null {
  if (bottomConsent != null) return bottomConsent
  if (options.consentFillMode || options.interactive) return null
  return 'agree'
}
