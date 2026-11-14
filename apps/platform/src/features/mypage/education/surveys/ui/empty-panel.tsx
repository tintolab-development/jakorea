import illustCrossUrl from '@/shared/assets/illustration/illust-cross.svg'
import { PFText } from '@/shared/ui'
import styles from './empty-panel.module.css'

export type EducationSurveyEmptyKind = 'survey' | 'satisfaction'

const COPY: Record<
  EducationSurveyEmptyKind,
  { title: string; description: string }
> = {
  survey: {
    title: '아직 진행할 설문조사가 없어요',
    description: '참여할 프로그램의 설문조사가 생기면 이곳에서 확인할 수 있어요',
  },
  satisfaction: {
    title: '아직 진행할 만족도조사가 없어요',
    description: '참여할 프로그램의 만족도조사가 생기면 이곳에서 확인할 수 있어요',
  },
}

type EducationSurveyEmptyPanelProps = {
  kind: EducationSurveyEmptyKind
  /** API 목록이 비었지만 신청 건에 미응답 설문이 있다고 표시될 때 */
  pendingMismatchHint?: boolean
}

export function EducationSurveyEmptyPanel({
  kind,
  pendingMismatchHint = false,
}: EducationSurveyEmptyPanelProps) {
  const copy = COPY[kind]
  const description =
    pendingMismatchHint
      ? '설문이 등록되어 있으나 이 신청 건과 연결되지 않았을 수 있습니다. CMS에서 설문 대상을 「전체」로 등록했는지 확인하거나, 잠시 후 다시 시도해 주세요.'
      : copy.description

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <img
          className={styles.illustration}
          src={illustCrossUrl}
          alt=""
          width={100}
          height={100}
          aria-hidden="true"
        />
        <div className={styles.text}>
          <PFText as="p" typo="hl-lg" color="black" className={styles.title}>
            {copy.title}
          </PFText>
          <PFText as="p" typo="bd-md-md" color="neutral-cool-500" className={styles.description}>
            {description}
          </PFText>
        </div>
      </div>
    </div>
  )
}
