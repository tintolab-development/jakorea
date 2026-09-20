import { PFText } from '@/shared/ui'
import { EXPANSION_PHOTO_URL, WORLD_TIMELINE_PERIODS } from '../lib/mock-data'
import { CopyLines } from './copy-break'
import { TimelinePanel } from './timeline-panel'
import styles from './expansion-section.module.css'

export function ExpansionSection() {
  return (
    <section className={styles.section} aria-labelledby="history-expansion-title">
      <div className={styles.intro}>
        <PFText as="h2" id="history-expansion-title" typo="hd-lg" color="white" className={styles.title}>
          세상이 바뀔 때마다
          <br />
          JA의 교육도 진화했습니다.
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
          <CopyLines
            pc={[
              '새로운 산업이 등장하고 일하는 방식이 바뀔 때마다 청소년에게',
              '필요한 역량도 달라졌습니다. JA는 교육의 대상과 방법, 활동 지역을 끊임없이 확장해 왔습니다. 그러나 청소년에게 경험을 제공하고',
              '스스로 미래를 만들어 갈 힘을 길러준다는 원칙은 한 세기 넘게',
              '이어지고 있습니다.',
            ]}
            mobile={[
              '새로운 산업이 등장하고 일하는 방식이 바뀔 때마다',
              '청소년에게 필요한 역량도 달라졌습니다. JA는 교육의 대상과 방법, 활동 지역을 끊임없이 확장해 왔습니다. 그러나 청소년에게 경험을 제공하고 스스로 미래를',
              '만들어 갈 힘을 길러준다는 원칙은 한 세기 넘게',
              '이어지고 있습니다.',
            ]}
          />
        </PFText>
      </div>

      <div className={styles.media}>
        <img
          className={styles.photo}
          src={EXPANSION_PHOTO_URL}
          alt="테이블에 둘러앉아 함께 활동하는 JA 청소년들"
        />
      </div>

      <div className={styles.panel}>
        <TimelinePanel theme="dark" periods={WORLD_TIMELINE_PERIODS} ariaLabel="세계 JA 연혁 시대 구간" />
      </div>
    </section>
  )
}
