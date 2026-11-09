import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './economy-application-choice.css'

const ECONOMY_REGISTRATION_SPONSOR_ALL_VALUE = '__all__'
const PARTNER_RADIO_FALLBACK_LABEL = '결연 금융회사명'
const PARTNER_RADIO_USER_WRITE_HINT = '프로그램 후원사 명이 노출됩니다.'

function resolveUsableSponsorId(sponsorId: string | undefined): string | undefined {
  const trimmed = sponsorId?.trim()
  if (!trimmed || trimmed === ECONOMY_REGISTRATION_SPONSOR_ALL_VALUE) return undefined
  return trimmed
}

/** 1사1교 프로그램 참여자 신청 폼 — 결연 금융 회사명 */
export function EconomyProgramApplicationLessonReplyParagraph({
  isTemplateAuthoringMode = false,
  sponsorId,
  sponsorDisplayName,
}: {
  isTemplateAuthoringMode?: boolean
  sponsorId?: string
  sponsorDisplayName?: string
} = {}) {
  const [companyType, setCompanyType] = useGeneralApplicationOverlayKv<string>(
    'application.economy.lessonReply.companyType',
    'partner'
  )
  const [customCompanyName, setCustomCompanyName] = useGeneralApplicationOverlayKv<string>(
    'application.economy.lessonReply.customCompanyName',
    ''
  )
  const [registrationSponsorId] = useProgramRegistrationOverlayKv<string>(
    'economyRegistration.basicInfo.sponsorId',
    ''
  )

  const resolvedSponsorId =
    resolveUsableSponsorId(sponsorId) ?? resolveUsableSponsorId(registrationSponsorId)
  const sponsorNameFromId = useSponsorNameById(resolvedSponsorId, Boolean(resolvedSponsorId))
  const linkedSponsorName = sponsorDisplayName?.trim() || sponsorNameFromId?.trim() || undefined
  const partnerRadioLabel = isTemplateAuthoringMode
    ? PARTNER_RADIO_FALLBACK_LABEL
    : linkedSponsorName || PARTNER_RADIO_USER_WRITE_HINT
  const isCustomCompanyType = companyType === 'custom'

  return (
    <div className="program-registration-paragraph">
      <CmsRadioGroup
        className="economy-application-choice"
        size="medium"
        value={companyType}
        onChange={event => setCompanyType(event.target.value)}
      >
        <CmsRadio value="partner">
          {!isTemplateAuthoringMode && !linkedSponsorName ? (
            <span className="form-editor-template-field-hint-text">{partnerRadioLabel}</span>
          ) : (
            partnerRadioLabel
          )}
        </CmsRadio>
        <CmsRadio value="none">미결연</CmsRadio>
        <div className="economy-application-choice__other">
          <CmsRadio value="custom" aria-label="기타" />
          <CmsInput
            className="economy-application-choice__other-input"
            inputSize="small"
            placeholder="기타"
            disabled={!isCustomCompanyType}
            value={customCompanyName}
            onChange={e => setCustomCompanyName(e.target.value)}
          />
        </div>
      </CmsRadioGroup>
    </div>
  )
}
