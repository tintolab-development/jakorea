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
  applyUjatSexOffenseWriteChoice,
  emptyInstitutionSexOffense,
  resolveUjatSexOffenseWriteChoice,
  type ApplyInstitutionSexOffenseValues,
  type ApplySexOffenseSiteSubmission,
  type ApplySexOffenseSubmissionRequest,
  type UjatSexOffenseWriteChoice,
} from './apply-institution-sex-offense-answers.ts'

export {
  applySexOffenseInquiryMethodChange,
  applyUjatSexOffenseWriteChoice,
  emptyInstitutionSexOffense,
  findIncompleteSexOffenseMessage,
  findIncompleteUjatSexOffenseWriteMessage,
  normalizeUjatSexOffenseWriteValues,
  omitSexOffenseInquiryAnswersIfNotRequested,
  readSexOffenseSubmissionRequest,
  resolveApplySexOffenseInquiryCase,
  resolveUjatSexOffenseWriteChoice,
  sexOffenseInquiryAnswerFromValues,
  sexOffenseSubmissionAnswerFromValues,
  sexOffenseValuesFromDraftAnswers,
  shouldShowSexOffenseInquiry,
  type ApplyInstitutionSexOffenseValues,
  type ApplySexOffenseInquiryCase,
  type ApplySexOffenseInquiryMethod,
  type ApplySexOffenseSiteSubmission,
  type ApplySexOffenseSubmissionRequest,
  type UjatSexOffenseWriteChoice,
} from './apply-institution-sex-offense-answers.ts'

const UJAT_SEX_OFFENSE_WRITE_OPTIONS = [
  { value: 'direct', label: '직접 제출' },
  { value: 'online', label: '온라인 제출' },
] as const

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

function SexOffenseCredentialFields({ value, onChange }: SubmissionProps) {
  return (
    <PFFormInlineRow>
      <PFFormInlineSegment>
        <PFFormControlCluster>
          <PFText as="span" typo="bd-md-sb" color="black">
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
          <PFText as="span" typo="bd-md-sb" color="black">
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
  )
}

/**
 * 신버전 조회 방식 단락 — JA 시스템 / 범죄경력회보서 사이트
 * (+ 사이트 제출 방식·ID·검증번호, INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES)
 */
export function ApplyInstitutionSexOffenseInquiry({ value, onChange }: SubmissionProps) {
  const showSiteFields = shouldShowSexOffenseSiteFields(value.inquiryMethod)

  return (
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldTable radius="rounded" className={[styles.table, hostStyles.root].join(' ')}>
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
              <SexOffenseCredentialFields value={value} onChange={onChange} />
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

/**
 * UJAT 안내사항·신청 — 사이트 제출 방식 한 줄.
 * 직접 → inquiryMethod=ja_system / 온라인 → criminal_record_site + online + 자격정보.
 */
export function ApplyInstitutionSexOffenseUjatWrite({ value, onChange }: SubmissionProps) {
  const choice = resolveUjatSexOffenseWriteChoice(value)
  const showCredentials = choice === 'online'

  return (
    <div className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldTable radius="rounded" className={[styles.table, hostStyles.root].join(' ')}>
        <PFFormFieldRow type={showCredentials ? 'double' : 'single'}>
          <PFFormField label="사이트 제출 방식" fullWidth={!showCredentials}>
            <ApplyFormRadioGroup
              name="apply-sex-offense-ujat-write"
              value={choice}
              options={UJAT_SEX_OFFENSE_WRITE_OPTIONS}
              onChange={next => {
                if (next !== 'direct' && next !== 'online') return
                onChange(applyUjatSexOffenseWriteChoice(value, next as UjatSexOffenseWriteChoice))
              }}
            />
          </PFFormField>
          {showCredentials ? (
            <PFFormField label="성범죄 경력조회용 정보">
              <SexOffenseCredentialFields
                value={{ ...value, submissionRequest: value.submissionRequest || 'request' }}
                onChange={next => onChange({ ...next, submissionRequest: 'request' })}
              />
            </PFFormField>
          ) : null}
        </PFFormFieldRow>
      </PFFormFieldTable>
    </div>
  )
}
