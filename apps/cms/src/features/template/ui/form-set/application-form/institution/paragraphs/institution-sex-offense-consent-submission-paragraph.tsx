import {
  getInstitutionSexOffenseConsentSubmissionRequest,
  patchInstitutionSexOffenseConsentSubmissionRequest,
  useInstitutionApplicationFormVisibilityVersion,
  type InstitutionSexOffenseConsentSubmissionRequest,
} from '@/features/program/general/lib/institution-application-form-visibility'
import { INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS } from '@/features/template/lib/institution-sex-offense-consent-field-definitions'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** 프로그램 참여자 신청 폼 (학교) — 성범죄 경력 조회 동의서 제출 요청 */
export function ProgramApplicationFormInstitutionSexOffenseConsentSubmissionParagraph() {
  const visibilityVersion = useInstitutionApplicationFormVisibilityVersion()
  void visibilityVersion
  const submissionRequest = getInstitutionSexOffenseConsentSubmissionRequest()

  return (
    <div className="program-application-form-institution__paragraph">
      <CmsRadioGroup
        size="large"
        value={submissionRequest}
        onChange={event =>
          patchInstitutionSexOffenseConsentSubmissionRequest(
            event.target.value as InstitutionSexOffenseConsentSubmissionRequest
          )
        }
        style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
      >
        {INSTITUTION_SEX_OFFENSE_CONSENT_SUBMISSION_OPTIONS.map(option => (
          <CmsRadio key={option.value} value={option.value}>
            {option.label}
          </CmsRadio>
        ))}
      </CmsRadioGroup>
    </div>
  )
}
