import { useSponsorNameById } from '@/features/sponsor/hooks/use-sponsor-name-by-id'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-editor/form-editor.css'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

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
  const linkedSponsorName =
    sponsorDisplayName?.trim() || sponsorNameFromId?.trim() || undefined
  const partnerRadioLabel = isTemplateAuthoringMode
    ? PARTNER_RADIO_FALLBACK_LABEL
    : linkedSponsorName || PARTNER_RADIO_USER_WRITE_HINT
  const isCustomCompanyType = companyType === 'custom'

  return (
    <div className="program-registration-paragraph">
      <div className="multiple-choice-body">
        <CmsRadioGroup
          className="multiple-choice-radio-group"
          value={companyType}
          onChange={event => setCompanyType(event.target.value)}
        >
          <div className="multiple-choice-row">
            <CmsRadio value="partner" />
            <span
              className={
                !isTemplateAuthoringMode && !linkedSponsorName
                  ? 'form-editor-template-field-hint-text'
                  : 'multiple-choice-row__label'
              }
            >
              {partnerRadioLabel}
            </span>
          </div>
          <div className="multiple-choice-row">
            <CmsRadio value="none" />
            <span className="multiple-choice-row__label">미결연</span>
          </div>
          <div
            className="multiple-choice-row"
            style={{ alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
          >
            <CmsRadio value="custom" />
            <span className="multiple-choice-row__label" style={{ flexShrink: 0 }}>
              기타
            </span>
            <CmsInput
              inputSize="small"
              width={200}
              placeholder="기타"
              disabled={!isCustomCompanyType}
              style={{ flexShrink: 0, marginLeft: 4 }}
              value={customCompanyName}
              onChange={e => setCustomCompanyName(e.target.value)}
            />
          </div>
        </CmsRadioGroup>
      </div>
    </div>
  )
}
