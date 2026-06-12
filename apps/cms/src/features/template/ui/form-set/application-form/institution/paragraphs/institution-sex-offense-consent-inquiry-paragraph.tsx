import { useState } from 'react'
import { shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph } from '@/features/program/general/lib/institution-application-form-visibility'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS,
} from '@/features/template/lib/institution-sex-offense-consent-field-definitions'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const nowrapSpanStyle = { whiteSpace: 'nowrap' as const, flexShrink: 0 as const }

const inlineRowStyle = {
  flexWrap: 'nowrap' as const,
  alignItems: 'center' as const,
  minWidth: 0,
  width: '100%' as const,
}

/** 프로그램 참여자 신청 폼 (학교) — 성범죄 경력 조회 동의서 조회 방식 */
export function ProgramApplicationFormInstitutionSexOffenseConsentInquiryParagraph() {
  const [inquiryMethod, setInquiryMethod] = useState<string>('criminal_record_site')
  const [siteSubmission, setSiteSubmission] = useState<string>('online')
  const [institutionId, setInstitutionId] = useState('')
  const [verificationNumber, setVerificationNumber] = useState('')

  if (!shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) {
    return null
  }

  const showSiteSubmissionFields = inquiryMethod === 'criminal_record_site'
  const showOnlineCredentials = showSiteSubmissionFields && siteSubmission === 'online'

  return (
    <div className="program-application-form-institution__paragraph">
      <DetailInfoForm title="" hideHeader mode="edit" className="program-registration-paragraph">
        {showSiteSubmissionFields ? (
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="조회 방식"
              edit={
                <CmsRadioGroup
                  size="large"
                  value={inquiryMethod}
                  onChange={event => setInquiryMethod(event.target.value)}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS.map(option => (
                    <CmsRadio key={option.value} value={option.value}>
                      {option.label}
                    </CmsRadio>
                  ))}
                </CmsRadioGroup>
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="사이트 제출 방식"
              edit={
                <CmsRadioGroup
                  size="large"
                  value={siteSubmission}
                  onChange={event => setSiteSubmission(event.target.value)}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  {INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS.map(option => (
                    <CmsRadio key={option.value} value={option.value}>
                      {option.label}
                    </CmsRadio>
                  ))}
                </CmsRadioGroup>
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="조회 방식"
              fullRow
              edit={
                <CmsRadioGroup
                  size="large"
                  value={inquiryMethod}
                  onChange={event => setInquiryMethod(event.target.value)}
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
                >
                  {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS.map(option => (
                    <CmsRadio key={option.value} value={option.value}>
                      {option.label}
                    </CmsRadio>
                  ))}
                </CmsRadioGroup>
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )}

        {showOnlineCredentials ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="성범죄 경력조회용 정보"
              fullRow
              edit={
                <div
                  className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
                  style={inlineRowStyle}
                >
                  <span style={nowrapSpanStyle}>ID</span>
                  <CmsInput
                    inputSize="medium"
                    placeholder="기관 아이디"
                    width={120}
                    value={institutionId}
                    onChange={event => setInstitutionId(event.target.value)}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <span style={nowrapSpanStyle}>검증번호</span>
                  <CmsInput
                    inputSize="medium"
                    placeholder="검증번호"
                    width={120}
                    value={verificationNumber}
                    onChange={event => setVerificationNumber(event.target.value)}
                  />
                </div>
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : null}
      </DetailInfoForm>
    </div>
  )
}
