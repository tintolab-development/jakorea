import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/paragraph/single-item/multiple-choice.css'

/** 1사1교 프로그램 참여자 신청 폼 — 결연 금융 회사명 */
export function EconomyProgramApplicationLessonReplyParagraph() {
  const [companyType, setCompanyType] = useGeneralApplicationOverlayKv<string>(
    'application.economy.lessonReply.companyType',
    'partner'
  )
  const [customCompanyName, setCustomCompanyName] = useGeneralApplicationOverlayKv<string>(
    'application.economy.lessonReply.customCompanyName',
    ''
  )

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
            <span className="multiple-choice-row__label">결연 금융회사명</span>
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
