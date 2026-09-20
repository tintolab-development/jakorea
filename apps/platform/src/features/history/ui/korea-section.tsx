import { PFText } from '@/shared/ui'
import { KOREA_PHOTO_URL, KOREA_TIMELINE_PERIODS } from '../lib/mock-data'
import { CopyLines } from './copy-break'
import { TimelinePanel } from './timeline-panel'
import styles from './korea-section.module.css'

export function KoreaSection() {
  return (
    <section className={styles.section} aria-labelledby="history-korea-title">
      <div className={styles.intro}>
        <PFText as="h2" id="history-korea-title" typo="hd-lg" color="black" className={styles.title}>
          <CopyLines
            pc={['전 세계가 함께하는 배움이', '2002년 한국의 교실에 닿았습니다']}
            mobile={['전 세계가 함께하는 배움이', '2002년 한국의 교실에', '닿았습니다']}
          />
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="black" className={styles.body}>
          <CopyLines
            pc={[
              '2002년 10월, 청소년 교육 NGO JA Korea가 설립됐습니다.',
              'JA Korea는 JA의 체험형 교육을 한국 학교 현장에 맞게 발전시키며 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 분야의 교육을',
              '제공해 왔습니다. 또한 JA Global Network가 공유하는 교육',
              '철학은 유지하면서, 한국이 마주한 현실과 학교 현장의 필요에 맞춰 새로운 콘텐츠를 개발 및 보급하고 있습니다.',
            ]}
            mobile={[
              '2002년 10월, 청소년 교육 NGO JA Korea가 설립됐습니다. JA Korea는 JA의 체험형 교육을 한국 학교 현장에 맞게 발전시키며 진로·취업, 경제·금융, 기업가정신, 디지털 리터러시 분야의 교육을 제공해 왔습니다.',
              '또한 JA Global Network가 공유하는 교육 철학은',
              '유지하면서, 한국이 마주한 현실과 학교 현장의 필요에 맞춰 새로운 콘텐츠를 개발 및 보급하고 있습니다.',
            ]}
          />
        </PFText>
      </div>

      <div className={styles.media}>
        <img
          className={styles.photo}
          src={KOREA_PHOTO_URL}
          alt="교실에서 함께 활동하는 JA Korea 교육 현장"
        />
      </div>

      <div className={styles.panel}>
        <TimelinePanel theme="light" periods={KOREA_TIMELINE_PERIODS} ariaLabel="JA Korea 국내 연혁 시대 구간" />
      </div>
    </section>
  )
}
