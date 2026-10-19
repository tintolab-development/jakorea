import { useEffect } from 'react'
import {
  patchInstitutionSexOffenseConsentInquiryMethod,
  patchInstitutionSexOffenseConsentSiteSubmission,
  shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph,
  type InstitutionSexOffenseConsentSiteSubmission,
} from '@/features/program/general/lib/institution-application-form-visibility'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_CAUTION,
  INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES,
  INSTITUTION_SEX_OFFENSE_CONSENT_SITE_SUBMISSION_OPTIONS,
} from '@/features/template/lib/institution-sex-offense-consent-field-definitions'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './institution-sex-offense-consent-inquiry-paragraph.css'

/** 조회 방식 선택 항목 제거 — 저장 값은 범죄경력회보서 사이트 이용으로 고정 */
const FIXED_INQUIRY_METHOD = 'criminal_record_site'

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
  const [inquiryMethod, setInquiryMethod] = useGeneralApplicationOverlayKv<string>(
    'application.institution.sexOffense.inquiryMethod',
    FIXED_INQUIRY_METHOD
  )
  const [siteSubmission, setSiteSubmission] = useGeneralApplicationOverlayKv<string>(
    'application.institution.sexOffense.siteSubmission',
    'online'
  )
  const [institutionId, setInstitutionId] = useGeneralApplicationOverlayKv(
    'application.institution.sexOffense.institutionId',
    ''
  )
  const [verificationNumber, setVerificationNumber] = useGeneralApplicationOverlayKv(
    'application.institution.sexOffense.verificationNumber',
    ''
  )

  useEffect(() => {
    if (inquiryMethod !== FIXED_INQUIRY_METHOD) setInquiryMethod(FIXED_INQUIRY_METHOD)
    patchInstitutionSexOffenseConsentInquiryMethod(FIXED_INQUIRY_METHOD)
  }, [inquiryMethod, setInquiryMethod])

  useEffect(() => {
    patchInstitutionSexOffenseConsentSiteSubmission(
      siteSubmission as InstitutionSexOffenseConsentSiteSubmission
    )
  }, [siteSubmission])

  if (!shouldShowInstitutionApplicationSexOffenseConsentInquiryParagraph()) {
    return null
  }

  const showOnlineCredentials = siteSubmission === 'online'
  const displaySiteSubmission = choiceDisplayOnly ? undefined : siteSubmission
  const displayInstitutionId = choiceDisplayOnly ? '' : institutionId
  const displayVerificationNumber = choiceDisplayOnly ? '' : verificationNumber
  const lockStyle = choiceDisplayOnly ? { pointerEvents: 'none' as const } : undefined

  const siteSubmissionField = (
    <DetailInfoForm.Field
      label="사이트 제출 방식"
      fullRow={!showOnlineCredentials}
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

  return (
    <div className="program-application-form-institution__paragraph" style={lockStyle}>
      <DetailInfoForm title="" hideHeader mode="edit" className="program-registration-paragraph">
        {showOnlineCredentials ? (
          <DetailInfoForm.Row type="double">
            {siteSubmissionField}
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
          </DetailInfoForm.Row>
        ) : (
          <DetailInfoForm.Row type="single">{siteSubmissionField}</DetailInfoForm.Row>
        )}
      </DetailInfoForm>
      <div className="institution-sex-offense-inquiry__notes">
        <ul className="institution-sex-offense-inquiry__note-list">
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_NOTES.map(note => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="institution-sex-offense-inquiry__caution">
          {INSTITUTION_SEX_OFFENSE_CONSENT_INQUIRY_CAUTION}
        </p>
      </div>
    </div>
  )
}
