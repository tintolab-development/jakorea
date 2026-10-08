import {
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_CAUTION,
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES,
  INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS,
} from '@jakorea/form-schema/program-application'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import styles from './apply-institution-sex-offense.module.css'

/** CMS `application.institution.sexOffense.*` 와 동일 */
export type ApplySexOffenseSubmissionRequest = 'request' | 'no_submit'
export type ApplySexOffenseInquiryMethod = 'ja_system' | 'criminal_record_site'
export type ApplySexOffenseSiteSubmission = 'direct' | 'online'

export type ApplyInstitutionSexOffenseValues = {
  submissionRequest: ApplySexOffenseSubmissionRequest
  inquiryMethod: ApplySexOffenseInquiryMethod
  siteSubmission: ApplySexOffenseSiteSubmission
  institutionId: string
  verificationNumber: string
}

/** 조회 방식 선택 항목 제거 — 저장 값은 범죄경력회보서 사이트 이용으로 고정 */
const FIXED_INQUIRY_METHOD: ApplySexOffenseInquiryMethod = 'criminal_record_site'

export function emptyInstitutionSexOffense(): ApplyInstitutionSexOffenseValues {
  return {
    submissionRequest: 'request',
    inquiryMethod: FIXED_INQUIRY_METHOD,
    siteSubmission: 'online',
    institutionId: '',
    verificationNumber: '',
  }
}

export function shouldShowSexOffenseInquiry(
  values: ApplyInstitutionSexOffenseValues,
): boolean {
  return values.submissionRequest === 'request'
}

export function findIncompleteSexOffenseMessage(
  values: ApplyInstitutionSexOffenseValues,
): string | null {
  if (values.submissionRequest !== 'request') return null
  if (values.siteSubmission !== 'online') return null
  if (!values.institutionId.trim()) return '성범죄 경력조회 기관 아이디를 입력해 주세요.'
  if (!values.verificationNumber.trim()) return '성범죄 경력조회 검증번호를 입력해 주세요.'
  return null
}

export function sexOffenseSubmissionAnswerFromValues(
  values: ApplyInstitutionSexOffenseValues,
): Record<string, unknown> {
  return { submissionRequest: values.submissionRequest }
}

export function sexOffenseInquiryAnswerFromValues(
  values: ApplyInstitutionSexOffenseValues,
): Record<string, unknown> {
  return {
    inquiryMethod: FIXED_INQUIRY_METHOD,
    siteSubmission: values.siteSubmission,
    institutionId: values.institutionId.trim(),
    verificationNumber: values.verificationNumber.trim(),
  }
}

export function sexOffenseValuesFromDraftAnswers(
  submission: unknown,
  inquiry: unknown,
): ApplyInstitutionSexOffenseValues | null {
  const empty = emptyInstitutionSexOffense()
  const sub = submission && typeof submission === 'object' && !Array.isArray(submission)
    ? (submission as Record<string, unknown>)
    : null
  const inq = inquiry && typeof inquiry === 'object' && !Array.isArray(inquiry)
    ? (inquiry as Record<string, unknown>)
    : null
  if (!sub && !inq) return null
  return {
    ...empty,
    submissionRequest:
      sub?.submissionRequest === 'no_submit' ? 'no_submit' : empty.submissionRequest,
    inquiryMethod: FIXED_INQUIRY_METHOD,
    siteSubmission: inq?.siteSubmission === 'direct' ? 'direct' : empty.siteSubmission,
    institutionId: typeof inq?.institutionId === 'string' ? inq.institutionId : '',
    verificationNumber:
      typeof inq?.verificationNumber === 'string' ? inq.verificationNumber : '',
  }
}

type SubmissionProps = {
  value: ApplyInstitutionSexOffenseValues
  onChange: (next: ApplyInstitutionSexOffenseValues) => void
}

export function ApplyInstitutionSexOffenseSubmission({ value, onChange }: SubmissionProps) {
  return (
    <div className={styles.root}>
      <ApplyFormRadioGroup
        name="apply-sex-offense-submission"
        value={value.submissionRequest}
        options={INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS}
        onChange={next =>
          onChange({
            ...value,
            submissionRequest: next as ApplySexOffenseSubmissionRequest,
          })
        }
      />
    </div>
  )
}

export function ApplyInstitutionSexOffenseInquiry({ value, onChange }: SubmissionProps) {
  const showOnlineCredentials = value.siteSubmission === 'online'

  return (
    <div className={styles.root}>
      <PFFormFieldTable>
        <PFFormFieldRow type={showOnlineCredentials ? 'double' : 'single'}>
          <PFFormField label="사이트 제출 방식" fullWidth={!showOnlineCredentials}>
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
          {showOnlineCredentials ? (
            <PFFormField label="성범죄 경력조회용 정보">
              <PFFormInlineRow>
                <PFFormInlineSegment>
                  <PFFormControlCluster>
                    <PFText as="span" typo="bd-md-rg" color="neutral-cool-700">
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
                    <PFText as="span" typo="bd-md-rg" color="neutral-cool-700">
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
          ) : null}
        </PFFormFieldRow>
      </PFFormFieldTable>
      <div className={styles.notes}>
        <ul className={styles.noteList}>
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES.map(note => (
            <PFText key={note} as="li" typo="bd-sm-rg" color="neutral-cool-700">
              {note}
            </PFText>
          ))}
        </ul>
        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-700">
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_CAUTION}
        </PFText>
      </div>
    </div>
  )
}
