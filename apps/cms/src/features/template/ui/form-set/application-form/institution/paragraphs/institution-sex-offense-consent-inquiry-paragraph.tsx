import { useEffect } from 'react'
import {
  patchInstitutionSexOffenseConsentInquiryMethod,
  patchInstitutionSexOffenseConsentSiteSubmission,
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
  useInstitutionApplicationFormVisibilityVersion,
  type InstitutionSexOffenseConsentInquiryMethod,
  type InstitutionSexOffenseConsentSiteSubmission,
} from '@/features/program/general/lib/institution-application-form-visibility'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  DEFAULT_SEX_OFFENSE_INQUIRY_METHOD,
  DEFAULT_SEX_OFFENSE_SITE_SUBMISSION,
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS,
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES,
  INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS,
  isSexOffenseInquiryMethod,
  isSexOffenseSiteSubmission,
  shouldShowSexOffenseSiteFields,
} from '@/features/template/lib/institution-sex-offense-consent-field-definitions'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './institution-sex-offense-consent-inquiry-paragraph.css'

const nowrapSpanStyle = { whiteSpace: 'nowrap' as const, flexShrink: 0 as const }

const inlineRowStyle = {
  flexWrap: 'nowrap' as const,
  alignItems: 'center' as const,
  minWidth: 0,
  width: '100%' as const,
}

/** 프로그램 참여자 신청 폼 (학교) — 성범죄 경력 조회 동의서 조회 방식 */
export function ProgramApplicationFormInstitutionSexOffenseConsentInquiryParagraph({
  choiceDisplayOnly = false,
}: {
  /** 프로그램 등록 — disabled 스킨 없이 미선택·입력 불가 */
  choiceDisplayOnly?: boolean
} = {}) {
  const visibilityVersion = useInstitutionApplicationFormVisibilityVersion()
  void visibilityVersion
  const [inquiryMethod, setInquiryMethod] = useGeneralApplicationOverlayKv<string>(
    'application.institution.sexOffense.inquiryMethod',
    DEFAULT_SEX_OFFENSE_INQUIRY_METHOD
  )
  const [siteSubmission, setSiteSubmission] = useGeneralApplicationOverlayKv<string>(
    'application.institution.sexOffense.siteSubmission',
    ''
  )
  const [institutionId, setInstitutionId] = useGeneralApplicationOverlayKv(
    'application.institution.sexOffense.institutionId',
    ''
  )
  const [verificationNumber, setVerificationNumber] = useGeneralApplicationOverlayKv(
    'application.institution.sexOffense.verificationNumber',
    ''
  )

  const resolvedInquiryMethod = isSexOffenseInquiryMethod(inquiryMethod)
    ? inquiryMethod
    : DEFAULT_SEX_OFFENSE_INQUIRY_METHOD
  const showSiteFields = shouldShowSexOffenseSiteFields(resolvedInquiryMethod)

  useEffect(() => {
    if (choiceDisplayOnly) return
    if (!isSexOffenseInquiryMethod(inquiryMethod)) {
      setInquiryMethod(DEFAULT_SEX_OFFENSE_INQUIRY_METHOD)
    }
    patchInstitutionSexOffenseConsentInquiryMethod(
      (isSexOffenseInquiryMethod(inquiryMethod)
        ? inquiryMethod
        : DEFAULT_SEX_OFFENSE_INQUIRY_METHOD) as InstitutionSexOffenseConsentInquiryMethod
    )
  }, [choiceDisplayOnly, inquiryMethod, setInquiryMethod])

  useEffect(() => {
    if (choiceDisplayOnly) return
    if (!showSiteFields) return
    if (!isSexOffenseSiteSubmission(siteSubmission)) {
      setSiteSubmission(DEFAULT_SEX_OFFENSE_SITE_SUBMISSION)
      return
    }
    patchInstitutionSexOffenseConsentSiteSubmission(
      siteSubmission as InstitutionSexOffenseConsentSiteSubmission
    )
  }, [choiceDisplayOnly, setSiteSubmission, showSiteFields, siteSubmission])

  if (!shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) {
    return null
  }

  const displayInquiryMethod = choiceDisplayOnly ? resolvedInquiryMethod : inquiryMethod
  const displaySiteSubmission = choiceDisplayOnly
    ? undefined
    : isSexOffenseSiteSubmission(siteSubmission)
      ? siteSubmission
      : DEFAULT_SEX_OFFENSE_SITE_SUBMISSION
  const displayInstitutionId = choiceDisplayOnly ? '' : institutionId
  const displayVerificationNumber = choiceDisplayOnly ? '' : verificationNumber
  const lockStyle = choiceDisplayOnly ? { pointerEvents: 'none' as const } : undefined

  const inquiryMethodField = (
    <DetailInfoForm.Field
      label="조회 방식"
      fullRow
      edit={
        <CmsRadioGroup
          size="medium"
          value={displayInquiryMethod}
          onChange={event => {
            if (choiceDisplayOnly) return
            const next = event.target.value
            if (!isSexOffenseInquiryMethod(next) || next === inquiryMethod) return
            setInquiryMethod(next)
            if (next === 'ja_system') {
              setSiteSubmission('')
              setInstitutionId('')
              setVerificationNumber('')
              return
            }
            setSiteSubmission(DEFAULT_SEX_OFFENSE_SITE_SUBMISSION)
            setInstitutionId('')
            setVerificationNumber('')
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
        >
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_METHOD_OPTIONS.map(option => (
            <CmsRadio size="medium" key={option.value} value={option.value}>
              {option.label}
            </CmsRadio>
          ))}
        </CmsRadioGroup>
      }
      view="-"
    />
  )

  const siteSubmissionField = (
    <DetailInfoForm.Field
      label="사이트 제출 방식"
      edit={
        <CmsRadioGroup
          size="medium"
          value={displaySiteSubmission}
          onChange={event => {
            if (choiceDisplayOnly) return
            setSiteSubmission(event.target.value)
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
        >
          {INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS.map(option => (
            <CmsRadio size="medium" key={option.value} value={option.value}>
              {option.label}
            </CmsRadio>
          ))}
        </CmsRadioGroup>
      }
      view="-"
    />
  )

  const credentialsField = (
    <DetailInfoForm.Field
      label="성범죄 경력조회용 정보"
      edit={
        <div
          className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
          style={inlineRowStyle}
        >
          <span style={nowrapSpanStyle}>ID</span>
          <CmsInput
            inputSize="small"
            placeholder="기관 아이디"
            width={120}
            value={displayInstitutionId}
            readOnly={choiceDisplayOnly}
            onChange={event => {
              if (choiceDisplayOnly) return
              setInstitutionId(event.target.value)
            }}
          />
          <DetailInfoForm.InputsSeparator />
          <span style={nowrapSpanStyle}>검증번호</span>
          <CmsInput
            inputSize="small"
            placeholder="검증번호"
            width={120}
            value={displayVerificationNumber}
            readOnly={choiceDisplayOnly}
            onChange={event => {
              if (choiceDisplayOnly) return
              setVerificationNumber(event.target.value)
            }}
          />
        </div>
      }
      view="-"
    />
  )

  return (
    <div className="program-application-form-institution__paragraph" style={lockStyle}>
      <DetailInfoForm title="" hideHeader mode="edit" className="program-registration-paragraph">
        <DetailInfoForm.Row type="single">{inquiryMethodField}</DetailInfoForm.Row>
        {showSiteFields ? (
          <DetailInfoForm.Row type="double">
            {siteSubmissionField}
            {credentialsField}
          </DetailInfoForm.Row>
        ) : null}
      </DetailInfoForm>
      <div className="institution-sex-offense-inquiry__notes">
        <ol className="institution-sex-offense-inquiry__note-list">
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES.map(note => (
            <li key={note}>{note}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}
