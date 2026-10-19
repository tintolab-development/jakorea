import {
  TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS,
  TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_LABELS,
  type TrainedTeachersRegistrationDevAutofillCaseId,
} from '@/features/program/trained-teachers/lib/registration-dev-autofill-cases'
import { RegistrationDevAutofillButton } from '@/features/program/shared/ui/registration/registration-dev-autofill-button'
import { CmsSelect } from '@/shared/ui/cms-select'

type TrainedTeachersDevAutofillToolbarProps = {
  caseId: TrainedTeachersRegistrationDevAutofillCaseId
  onCaseIdChange: (caseId: TrainedTeachersRegistrationDevAutofillCaseId) => void
  onAutofill: (caseId: TrainedTeachersRegistrationDevAutofillCaseId) => void | Promise<void>
}

/** 교육받은 교사 등록 — DEV 7개 기본 케이스 자동입력. */
export function TrainedTeachersDevAutofillToolbar({
  caseId,
  onCaseIdChange,
  onAutofill,
}: TrainedTeachersDevAutofillToolbarProps) {
  if (!import.meta.env.DEV) return null

  return (
    <div className="trained-teachers-dev-autofill-toolbar" style={{ display: 'flex', gap: 8 }}>
      <CmsSelect
        aria-label="교육받은 교사 개발용 자동입력 케이스"
        style={{ minWidth: 300 }}
        value={String(caseId)}
        options={TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS.map(id => ({
          value: String(id),
          label: TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_LABELS[id],
        }))}
        onChange={value => {
          const next = Number(value) as TrainedTeachersRegistrationDevAutofillCaseId
          if (TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS.includes(next)) {
            onCaseIdChange(next)
          }
        }}
      />
      <RegistrationDevAutofillButton onClick={() => void onAutofill(caseId)} />
    </div>
  )
}
