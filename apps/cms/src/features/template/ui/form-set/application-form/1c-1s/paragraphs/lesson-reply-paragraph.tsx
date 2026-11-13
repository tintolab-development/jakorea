import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './economy-application-choice.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

const ECONOMY_REGISTRATION_SPONSOR_ALL_VALUE = '__all__'
const PARTNER_RADIO_FALLBACK_LABEL = '결연 금융회사명'
/** 템플릿 관리 시안(16268:599865) — 첫 라디오 라벨 */
const PARTNER_RADIO_TEMPLATE_MANAGEMENT_LABEL = '후원사명'
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
  /** 템플릿 관리 시안(16268:599865) — 라디오 미선택, 첫 항목 「후원사명」 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [companyType, setCompanyType] = useGeneralApplicationOverlayKv<string>(
    'application.economy.lessonReply.companyType',
    isTemplateManagementScreen ? '' : 'partner'
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
  const partnerRadioLabel = isTemplateManagementScreen
    ? PARTNER_RADIO_TEMPLATE_MANAGEMENT_LABEL
    : isTemplateAuthoringMode
      ? PARTNER_RADIO_FALLBACK_LABEL
      : linkedSponsorName || PARTNER_RADIO_USER_WRITE_HINT
  const isCustomCompanyType = companyType === 'custom'

  return (
    <div className="program-registration-paragraph">
      <CmsRadioGroup
        className="economy-application-choice"
        size="medium"
        value={companyType === '' ? undefined : companyType}
        onChange={event => setCompanyType(event.target.value)}
      >
        <CmsRadio value="partner">
          {!isTemplateManagementScreen && !isTemplateAuthoringMode && !linkedSponsorName ? (
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
