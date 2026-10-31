import type { TitleWithPeriodParagraph } from '@jakorea/form-schema/writing-form'
import illustCheckTransparentUrl from '@/shared/assets/illustration/illust-check-transparent.png'
import { PFButton, PFText } from '@/shared/ui'
import type { EducationSurveySeedKind } from '../lib/seed-survey-draft'
import { EducationSurveyHeader } from './survey-header'
import styles from './submitted-panel.module.css'

const SUBMITTED_COPY: Record<
  EducationSurveySeedKind,
  { title: string; description: string }
> = {
  survey: {
    title: '설문조사가 완료되었어요.',
    description: '설문 응답이 제출되었어요. 참여해 주셔서 감사합니다.',
  },
  satisfaction: {
    title: '만족도조사가 완료되었어요.',
    description:
      '소중한 의견을 보내주셔서 감사합니다.\n응답해 주신 내용은 더 나은 프로그램을 만드는 데 참고하겠습니다.',
  },
}

type EducationSurveySubmittedPanelProps = {
  kind: EducationSurveySeedKind
  titleParagraph?: TitleWithPeriodParagraph
  surveyCreatedAt?: string | null
  canRewrite: boolean
  onRewrite: () => void
}

/** 설문·만족도 — 제출 완료(양식 render 실패 시에도 동일 안내). */
export function EducationSurveySubmittedPanel({
  kind,
  titleParagraph,
  surveyCreatedAt,
  canRewrite,
  onRewrite,
}: EducationSurveySubmittedPanelProps) {
  const copy = SUBMITTED_COPY[kind]

  return (
    <>
      {titleParagraph ? (
        <EducationSurveyHeader paragraph={titleParagraph} surveyCreatedAt={surveyCreatedAt} />
      ) : null}
      <div className={styles.stack}>
        <div className={styles.complete}>
          <div className={styles.illustrationWrap}>
            <img
              className={styles.illustration}
              src={illustCheckTransparentUrl}
              alt=""
              width={120}
              height={120}
              aria-hidden="true"
            />
          </div>
          <PFText as="p" typo="hl-lg" color="black" className={styles.title}>
            {copy.title}
          </PFText>
          <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
            {copy.description}
          </PFText>
        </div>
        <PFButton
          size="xlarge"
          variant="tertiary"
          width={240}
          type="button"
          className={styles.rewriteButton}
          disabled={!canRewrite}
          onClick={() => {
            if (!canRewrite) return
            onRewrite()
          }}
        >
          다시 작성하기
        </PFButton>
      </div>
    </>
  )
}
