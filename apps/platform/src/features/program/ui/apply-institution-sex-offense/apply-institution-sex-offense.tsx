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

const SUBMISSION_OPTIONS = [
  { value: 'request', label: '동의서 제출 요청' },
  { value: 'no_submit', label: '동의서 미제출' },
] as const

const INQUIRY_METHOD_OPTIONS = [
  { value: 'ja_system', label: 'JA 시스템 내에서 동의서 확인' },
  { value: 'criminal_record_site', label: '범죄경력회보서 사이트 이용' },
] as const

const SITE_SUBMISSION_OPTIONS = [
  { value: 'direct', label: '직접 제출' },
  { value: 'online', label: '온라인 제출' },
] as const

export function emptyInstitutionSexOffense(): ApplyInstitutionSexOffenseValues {
  return {
    submissionRequest: 'request',
    inquiryMethod: 'criminal_record_site',
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
  if (values.inquiryMethod !== 'criminal_record_site') return null
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
    inquiryMethod: values.inquiryMethod,
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
    inquiryMethod:
      inq?.inquiryMethod === 'ja_system' ? 'ja_system' : empty.inquiryMethod,
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
        options={SUBMISSION_OPTIONS}
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
  const showSiteFields = value.inquiryMethod === 'criminal_record_site'
  const showOnlineCredentials = showSiteFields && value.siteSubmission === 'online'

  return (
    <PFFormFieldTable className={styles.root}>
      <PFFormFieldRow type={showSiteFields ? 'double' : 'single'}>
        <PFFormField label="조회 방식" fullWidth={!showSiteFields}>
          <ApplyFormRadioGroup
            name="apply-sex-offense-inquiry"
            value={value.inquiryMethod}
            options={INQUIRY_METHOD_OPTIONS}
            onChange={next =>
              onChange({
                ...value,
                inquiryMethod: next as ApplySexOffenseInquiryMethod,
              })
            }
          />
        </PFFormField>
        {showSiteFields ? (
          <PFFormField label="사이트 제출 방식">
            <ApplyFormRadioGroup
              name="apply-sex-offense-site"
              value={value.siteSubmission}
              options={SITE_SUBMISSION_OPTIONS}
              onChange={next =>
                onChange({
                  ...value,
                  siteSubmission: next as ApplySexOffenseSiteSubmission,
                })
              }
            />
          </PFFormField>
        ) : null}
      </PFFormFieldRow>

      {showOnlineCredentials ? (
        <PFFormFieldRow type="single">
          <PFFormField label="성범죄 경력조회용 정보" fullWidth>
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
        </PFFormFieldRow>
      ) : null}
    </PFFormFieldTable>
  )
}
