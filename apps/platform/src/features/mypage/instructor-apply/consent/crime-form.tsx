import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFFormSection, PFText } from '@/shared/ui'
import { ConsentWriteRadioGroup } from './consent-radio'
import { CRIME_FOOTER, CRIME_INTRO } from './copy'
import type { CrimeConsentDraft } from './draft-persist'
import styles from './consent-form.module.css'

export function CrimeConsentForm({
  draft,
  onChange,
}: {
  draft: CrimeConsentDraft
  onChange: (next: CrimeConsentDraft) => void
}) {
  return (
    <PFFormSection id="crime-consent" title="성범죄 경력 조회 동의" required>
      <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
        {CRIME_INTRO}
      </PFText>
      <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600" className={styles.prose}>
        {CRIME_FOOTER}
      </PFText>
      <PFFormFieldTable>
        <PFFormFieldRow type="single">
          <PFFormField label="동의 여부" required>
            <ConsentWriteRadioGroup
              name="crime-consent"
              value={draft.consent}
              onChange={next => onChange({ ...draft, consent: next })}
            />
          </PFFormField>
        </PFFormFieldRow>
      </PFFormFieldTable>
    </PFFormSection>
  )
}
