import {
  GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS,
  GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS,
  type GeneralRegistrationDevAutofillCaseId,
} from '@/features/program/general/lib/registration-dev-autofill-cases'
import { RegistrationDevAutofillButton } from '@/features/program/shared/ui/registration/registration-dev-autofill-button'
import { CmsSelect } from '@/shared/ui/cms-select'

type RegistrationGeneralDevAutofillToolbarProps = {
  caseId: GeneralRegistrationDevAutofillCaseId
  onCaseIdChange: (caseId: GeneralRegistrationDevAutofillCaseId) => void
  onAutofill: (caseId: GeneralRegistrationDevAutofillCaseId) => void | Promise<void>
}

/** 일반 프로그램 등록 — DEV 9케이스 자동입력 (체크된 교사/봉사자 모집·신청도 채움) */
export function RegistrationGeneralDevAutofillToolbar({
  caseId,
  onCaseIdChange,
  onAutofill,
}: RegistrationGeneralDevAutofillToolbarProps) {
  if (!import.meta.env.DEV) return null

  return (
    <div className="registration-general-dev-autofill-toolbar" style={{ display: 'flex', gap: 8 }}>
      <CmsSelect
        aria-label="개발용 자동입력 케이스"
        style={{ minWidth: 320 }}
        value={String(caseId)}
        options={GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS.map(id => ({
          value: String(id),
          label: GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[id],
        }))}
        onChange={value => {
          const next = Number(value) as GeneralRegistrationDevAutofillCaseId
          if (GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS.includes(next)) {
            onCaseIdChange(next)
          }
        }}
      />
      <RegistrationDevAutofillButton onClick={() => void onAutofill(caseId)} />
    </div>
  )
}
