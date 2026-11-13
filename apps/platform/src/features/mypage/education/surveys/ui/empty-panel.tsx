import illustCrossUrl from '@/shared/assets/illustration/illust-cross.svg'
import illustQuotationUrl from '@/shared/assets/illustration/illust-quotation-no-bg.svg'
import { PFText } from '@/shared/ui'
import styles from './empty-panel.module.css'

export type EducationSurveyEmptyKind = 'survey' | 'satisfaction'

/**
 * Figma 02-4 설문조사 · 02-5 만족도조사 빈 상태 2종.
 * - 진행중: 「02. 진행 중인 …가 없음」 X 아이콘 + 제목 + 부제
 * - 그 외(진행 완료·진행 중 포기 등): 「01. 등록된 …가 없음」 따옴표 아이콘 + 제목만
 */
const COPY: Record<
  EducationSurveyEmptyKind,
  { inProgressTitle: string; inProgressDescription: string; idleTitle: string }
> = {
  survey: {
    inProgressTitle: '진행 중인 설문조사가 없어요',
    inProgressDescription: '참여할 설문조사가 생기면 이곳에서 확인할 수 있어요',
    idleTitle: '아직 진행할 설문조사가 없어요',
  },
  satisfaction: {
    inProgressTitle: '진행 중인 만족도조사가 없어요',
    inProgressDescription: '참여할 프로그램의 만족도조사가 생기면 이곳에서 확인할 수 있어요',
    idleTitle: '아직 진행할 만족도조사가 없어요',
  },
}

type EducationSurveyEmptyPanelProps = {
  kind: EducationSurveyEmptyKind
  /** API 목록이 비었지만 신청 건에 미응답 설문이 있다고 표시될 때 */
  pendingMismatchHint?: boolean
  /** 신청 건 진행 상태가 진행중(`in_progress`)이면 true — 「진행 중인 …가 없음」 시안 */
  inProgress?: boolean
}

export function EducationSurveyEmptyPanel({
  kind,
  pendingMismatchHint = false,
  inProgress = false,
}: EducationSurveyEmptyPanelProps) {
  const copy = COPY[kind]
  const title = inProgress ? copy.inProgressTitle : copy.idleTitle
  const description = pendingMismatchHint
    ? '설문이 등록되어 있으나 이 신청 건과 연결되지 않았을 수 있습니다. CMS에서 설문 대상을 「전체」로 등록했는지 확인하거나, 잠시 후 다시 시도해 주세요.'
    : inProgress
      ? copy.inProgressDescription
      : null

  return (
    <div className={styles.shell}>
      <div className={styles.content}>
        <img
          className={styles.illustration}
          src={inProgress ? illustCrossUrl : illustQuotationUrl}
          alt=""
          width={100}
          height={100}
          aria-hidden="true"
        />
        <div className={styles.text}>
          <PFText as="p" typo="hl-lg" color="black" className={styles.title}>
            {title}
          </PFText>
          {description ? (
            <PFText as="p" typo="bd-md-md" color="neutral-cool-500" className={styles.description}>
              {description}
            </PFText>
          ) : null}
        </div>
      </div>
    </div>
  )
}
