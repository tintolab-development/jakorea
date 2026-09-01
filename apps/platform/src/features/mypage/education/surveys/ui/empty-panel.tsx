import illustCrossUrl from '@/shared/assets/illustration/illust-cross.svg'
import { PFText } from '@/shared/ui'
import styles from './empty-panel.module.css'

export type EducationSurveyEmptyKind = 'survey' | 'satisfaction'

const COPY: Record<
  EducationSurveyEmptyKind,
  { title: string; description: string }
> = {
  survey: {
    title: '진행 중인 설문조사가 없어요',
    description: '참여할 프로그램의 설문조사가 생기면 이곳에서 확인할 수 있어요',
  },
  satisfaction: {
    title: '진행 중인 만족도조사가 없어요',
    description: '참여할 프로그램의 만족도조사가 생기면 이곳에서 확인할 수 있어요',
  },
}

type EducationSurveyEmptyPanelProps = {
  kind: EducationSurveyEmptyKind
}

export function EducationSurveyEmptyPanel({ kind }: EducationSurveyEmptyPanelProps) {
  const copy = COPY[kind]

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
            {copy.description}
          </PFText>
        </div>
      </div>
    </div>
  )
}
