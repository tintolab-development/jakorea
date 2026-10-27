import illustCrossUrl from '@/shared/assets/illustration/illust-cross.svg'
import { PFText } from '@/shared/ui'
import {
  portalFormSubmissionPeriodBlockMessage,
  type PortalFormSubmissionPeriodBlockReason,
} from '../lib/portal-form-submission-period'
import emptyStyles from './empty-panel.module.css'

type EducationSurveyPeriodEndedPanelProps = {
  reason: PortalFormSubmissionPeriodBlockReason
  /** 목록+본문 2열일 때 full-bleed shell 생략 */
  layout?: 'full' | 'inline'
}

/** 설문조사 탭 — 작성 기간 종료(또는 시작 전). 만족도조사 empty 패널과 동일 레이아웃, 부가 설명 없음. */
export function EducationSurveyPeriodEndedPanel({
  reason,
  layout = 'full',
}: EducationSurveyPeriodEndedPanelProps) {
  const title = portalFormSubmissionPeriodBlockMessage(reason, 'survey')

  const content = (
    <div className={emptyStyles.content}>
      <img
        className={emptyStyles.illustration}
        src={illustCrossUrl}
        alt=""
        width={100}
        height={100}
        aria-hidden="true"
      />
      <div className={emptyStyles.text}>
        <PFText as="p" typo="hl-lg" color="black" className={emptyStyles.title}>
          {title}
        </PFText>
      </div>
    </div>
  )

  if (layout === 'inline') {
    return content
  }

  return <div className={emptyStyles.shell}>{content}</div>
}
