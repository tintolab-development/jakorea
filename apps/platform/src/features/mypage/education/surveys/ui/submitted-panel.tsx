import illustCheckUrl from '@/shared/assets/illustration/illust-check.svg'
import { PFText } from '@/shared/ui'
import type { EducationSurveySeedKind } from '../lib/seed-survey-draft'
import emptyStyles from './empty-panel.module.css'

const SUBMITTED_COPY: Record<EducationSurveySeedKind, string> = {
  survey: '설문을 제출했어요',
  satisfaction: '만족도조사를 제출했어요',
}

type EducationSurveySubmittedPanelProps = {
  kind: EducationSurveySeedKind
  /** 목록+본문 2열일 때 full-bleed shell 생략 */
  layout?: 'full' | 'inline'
}

/** 설문·만족도 — 제출 완료(양식 render 실패 시에도 동일 안내). */
export function EducationSurveySubmittedPanel({
  kind,
  layout = 'full',
}: EducationSurveySubmittedPanelProps) {
  const content = (
    <div className={emptyStyles.content}>
      <img
        className={emptyStyles.illustration}
        src={illustCheckUrl}
        alt=""
        width={100}
        height={100}
        aria-hidden="true"
      />
      <div className={emptyStyles.text}>
        <PFText as="p" typo="hl-lg" color="black" className={emptyStyles.title}>
          {SUBMITTED_COPY[kind]}
        </PFText>
      </div>
    </div>
  )

  if (layout === 'inline') {
    return content
  }

  return <div className={emptyStyles.shell}>{content}</div>
}
