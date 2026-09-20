import { PFText } from '@/shared/ui'
import year1919Url from '../image/illustration/year-1919.svg'
import { CopyLines } from './copy-break'
import styles from './origin-section.module.css'

export function OriginSection() {
  return (
    <section className={styles.section} aria-labelledby="history-origin-title">
      <img
        className={styles.yearMark}
        src={year1919Url}
        alt=""
        aria-hidden="true"
        width={995}
        height={342}
      />
      <div className={styles.copy}>
        <div className={styles.headings}>
          <PFText as="p" typo="hd-lg" color="white" className={styles.english}>
            A WORLD OF POSSIBILITIES
          </PFText>
          <PFText as="h2" id="history-origin-title" typo="hd-lg" color="white" className={styles.korean}>
            청소년을 위한 100년의 여정
          </PFText>
        </div>
        <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
          <CopyLines
            pc={[
              '처음 JA의 교육은 학생들이 비즈니스 자원봉사자들의 지도 아래 직접 기업을',
              '운영해보는 방과후 프로그램(Company Program)으로 시작했습니다.',
              '그리고 100년이 지난 오늘날, JA는 100여 개 회원국으로 구성된 네트워크를 통해 매년',
              '2천만 명 이상의 청소년에게 진로·취업, 경제·금융, 기업가정신 교육을 제공하고 있습니다.',
              '',
              '규모와 교육의 방식은 달라졌지만, 모든 청소년에게 자신의 미래와 공동체를 변화시킬',
              '무한한 가능성이 있다는 믿음은 변함없이 이어지고 있습니다.',
            ]}
            mobile={[
              '처음 JA의 교육은 학생들이 비즈니스 자원봉사자들의 지도 아래 직접 기업을 운영해보는 방과후 프로그램(Company Program)으로 시작했습니다.',
              '그리고 100년이 지난 오늘날, JA는 100여 개',
              '회원국으로 구성된 네트워크를 통해 매년',
              '2천만 명 이상의 청소년에게 진로·취업, 경제·금융,',
              '기업가정신 교육을 제공하고 있습니다.',
              '',
              '규모와 교육의 방식은 달라졌지만, 모든 청소년에게',
              '자신의 미래와 공동체를 변화시킬 무한한',
              '가능성이 있다는 믿음은 변함없이 이어지고 있습니다.',
            ]}
          />
        </PFText>
      </div>
    </section>
  )
}
