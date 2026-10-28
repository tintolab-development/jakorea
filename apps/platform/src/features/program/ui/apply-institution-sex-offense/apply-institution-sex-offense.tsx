import {
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormFieldValueText,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES,
  INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS,
  isSexOffenseInquiryMethod,
  shouldShowSexOffenseSiteFields,
} from '@jakorea/form-schema/program-application'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import hostStyles from '../apply-form-field-host.module.css'
import styles from './apply-institution-sex-offense.module.css'
import {
  applySexOffenseInquiryMethodChange,
  emptyInstitutionSexOffense,
  type ApplyInstitutionSexOffenseValues,
  type ApplySexOffenseSiteSubmission,
  type ApplySexOffenseSubmissionRequest,
} from './apply-institution-sex-offense-answers.ts'

export {
  applySexOffenseInquiryMethodChange,
  emptyInstitutionSexOffense,
  findIncompleteSexOffenseMessage,
  findIncompleteUjatSexOffenseWriteMessage,
  omitSexOffenseInquiryAnswersIfNotRequested,
  readSexOffenseSubmissionRequest,
  resolveApplySexOffenseInquiryCase,
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
  type ApplySexOffenseInquiryCase,
  type ApplySexOffenseInquiryMethod,
  type ApplySexOffenseSiteSubmission,
  type ApplySexOffenseSubmissionRequest,
} from './apply-institution-sex-offense-answers.ts'

type SubmissionProps = {
  value: ApplyInstitutionSexOffenseValues
  onChange: (next: ApplyInstitutionSexOffenseValues) => void
}

export function ApplyInstitutionSexOffenseSubmission({ value, onChange }: SubmissionProps) {
  return (
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <ApplyFormRadioGroup
        name="apply-sex-offense-submission"
        value={value.submissionRequest}
        options={INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS}
        onChange={next => {
          const submissionRequest = next as ApplySexOffenseSubmissionRequest
          if (submissionRequest === 'no_submit') {
            onChange({ ...emptyInstitutionSexOffense(), submissionRequest })
            return
          }
          onChange({ ...value, submissionRequest })
        }}
      />
    </div>
  )
}

export function ApplyInstitutionSexOffenseInquiry({ value, onChange }: SubmissionProps) {
  const showSiteFields = shouldShowSexOffenseSiteFields(value.inquiryMethod)

  return (
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldTable className={[styles.table, hostStyles.root].join(' ')}>
        <PFFormFieldRow type="single">
          <PFFormField label="조회 방식" fullWidth>
            <ApplyFormRadioGroup
              name="apply-sex-offense-inquiry"
              value={value.inquiryMethod}
              options={INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS}
              onChange={next => {
                if (!isSexOffenseInquiryMethod(next)) return
                onChange(applySexOffenseInquiryMethodChange(value, next))
              }}
            />
          </PFFormField>
        </PFFormFieldRow>
        {showSiteFields ? (
          <PFFormFieldRow type="double">
            <PFFormField label="사이트 제출 방식">
              <ApplyFormRadioGroup
                name="apply-sex-offense-site"
                value={value.siteSubmission}
                options={INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS}
                onChange={next =>
                  onChange({
                    ...value,
                    siteSubmission: next as ApplySexOffenseSiteSubmission,
                  })
                }
              />
            </PFFormField>
            <PFFormField label="성범죄 경력조회용 정보">
              <PFFormInlineRow>
                <PFFormInlineSegment>
                  <PFFormControlCluster>
                    <PFText as="span" typo="bd-md-md" color="neutral-cool-700">
                      ID
                    </PFText>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={120}
                      placeholder="기관 아이디"
                      value={value.institutionId}
                      onValueChange={next => onChange({ ...value, institutionId: next })}
                    />
                  </PFFormControlCluster>
                </PFFormInlineSegment>
                <PFFormInlineSeparator />
                <PFFormInlineSegment>
                  <PFFormControlCluster>
                    <PFText as="span" typo="bd-md-md" color="neutral-cool-700">
                      검증번호
                    </PFText>
                    <PFTextInput
                      variant="formPage"
                      size="large"
                      width={120}
                      placeholder="검증번호"
                      value={value.verificationNumber}
                      onValueChange={next => onChange({ ...value, verificationNumber: next })}
                    />
                  </PFFormControlCluster>
                </PFFormInlineSegment>
              </PFFormInlineRow>
            </PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
      <div className={styles.notes}>
        <ul className={styles.noteList}>
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES.map(note => (
            <PFFormFieldValueText key={note} as="li" className={styles.noteItem}>
              {note}
            </PFFormFieldValueText>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** UJAT 안내사항 작성 2/2 — 조회 방식 3 CASE + 안내 문구 */
export function ApplyInstitutionSexOffenseUjatWrite({ value, onChange }: SubmissionProps) {
  return (
    <ApplyInstitutionSexOffenseInquiry
      value={{ ...value, submissionRequest: value.submissionRequest || 'request' }}
      onChange={next => onChange({ ...next, submissionRequest: 'request' })}
    />
  )
}
