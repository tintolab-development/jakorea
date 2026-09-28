import type { TableBottomConsent } from '@/features/template/model/writing-form-draft.schema'

/** 동의서 작성(fill) — bottomConsent 미선택 시 `agree` 폴백 금지 (Ant Radio undefined → 1번 선택처럼 보임) */
export function resolveTableBottomConsentRadioValue(
  bottomConsent: TableBottomConsent | undefined,
  options: {
    consentFillMode?: boolean
    interactive?: boolean
    /** 프로그램 등록 등 — 저장값과 무관하게 미선택·일반 스킨 표시 */
    displayOnly?: boolean
  }
): TableBottomConsent | null {
  if (options.displayOnly) return null
  if (bottomConsent != null) return bottomConsent
  if (options.consentFillMode || options.interactive) return null
  return 'agree'
}
