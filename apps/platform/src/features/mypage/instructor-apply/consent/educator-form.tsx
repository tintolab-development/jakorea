import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFFormSection, PFText } from '@/shared/ui'
import { ConsentWriteRadioGroup } from './consent-radio'
import { EDUCATOR_CLAUSES, EDUCATOR_CLOSING, EDUCATOR_INTRO } from './copy'
import type { EducatorConsentDraft } from './draft-persist'
import styles from './consent-form.module.css'

export function EducatorConsentForm({
  draft,
  onChange,
}: {
  draft: EducatorConsentDraft
  onChange: (next: EducatorConsentDraft) => void
}) {
  return (
    <>
      <PFFormSection id="educator-intro" title="JA Korea 교육진행자 서약서">
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {EDUCATOR_INTRO}
        </PFText>
      </PFFormSection>

      {EDUCATOR_CLAUSES.map((clause, index) => (
        <PFFormSection key={clause.title} id={`educator-clause-${index}`} title={clause.title} required>
          <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
            {clause.body}
          </PFText>
          <PFFormFieldTable>
            <PFFormFieldRow type="single">
              <PFFormField label="동의 여부" required>
                <ConsentWriteRadioGroup
                  name={`educator-clause-${index}`}
                  value={draft.clauses[index] ?? ''}
                  onChange={next => {
                    const clauses = [...draft.clauses] as EducatorConsentDraft['clauses']
                    clauses[index] = next
                    onChange({ ...draft, clauses })
                  }}
                />
              </PFFormField>
            </PFFormFieldRow>
          </PFFormFieldTable>
        </PFFormSection>
      ))}

      <PFFormSection id="educator-closing" title="위반 시 안내">
        <PFText as="p" typo="bd-md-rg" color="black" className={styles.prose}>
          {EDUCATOR_CLOSING}
        </PFText>
      </PFFormSection>
    </>
  )
}
