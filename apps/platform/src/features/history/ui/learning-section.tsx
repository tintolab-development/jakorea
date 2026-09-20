import { PFText } from '@/shared/ui'
import patternLeftUrl from '../image/illustration/pattern-learning-left.svg'
import patternRightUrl from '../image/illustration/pattern-learning-right.svg'
import { LEARNING_PHOTO_URL } from '../lib/mock-data'
import { CopyLines } from './copy-break'
import styles from './learning-section.module.css'

export function LearningSection() {
  return (
    <section className={styles.section} aria-labelledby="history-learning-title">
      <img
        className={styles.patternLeft}
        src={patternLeftUrl}
        alt=""
        aria-hidden="true"
        width={580}
        height={580}
      />
      <img
        className={styles.patternRight}
        src={patternRightUrl}
        alt=""
        aria-hidden="true"
        width={640}
        height={638}
      />

      <div className={styles.inner}>
        <div className={styles.intro}>
          <div className={styles.headings}>
            <PFText as="p" typo="hl-sm" color="inherit" className={styles.eyebrow}>
              LEARNING BY DOING
            </PFText>
            <PFText as="h2" id="history-learning-title" typo="page-title" color="white" className={styles.title}>
              배움에서 실천으로
            </PFText>
          </div>
          <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
            <CopyLines
              pc={[
                '1919년 미국에서 8세부터 12세까지의 어린이에게 비즈니스를 가르치는 방과후교실이 시작됐습니다.',
                '이 조직은 이듬해 Junior Achievement라는 이름을 갖게 되었습니다.',
                '',
                '1929년 JA에 참여한 청소년들은 실제 상품과 서비스를 판매하는 회사를 만들기 시작했습니다.',
                '교실에서 경제를 배우는 데 그치지 않고, 직접 아이디어를 내고 자금을 마련하며 상품을 생산하고',
                '판매하면서 경제가 움직이는 방식을 배웠습니다.',
              ]}
              mobile={[
                '1919년 미국에서 8세부터 12세까지의 어린이에게',
                '비즈니스를 가르치는 방과후교실이 시작됐습니다.',
                '이 조직은 이듬해 Junior Achievement라는 이름을 갖게 되었습니다.',
                '',
                '1929년 JA에 참여한 청소년들은 실제 상품과 서비스를 판매하는 회사를 만들기 시작했습니다.',
                '교실에서 경제를 배우는 데 그치지 않고, 직접 아이디어를 내고 자금을 마련하며 상품을 생산하고',
                '판매하면서 경제가 움직이는 방식을 배웠습니다.',
              ]}
            />
          </PFText>
        </div>

        <div className={styles.media}>
          <img
            className={styles.photo}
            src={LEARNING_PHOTO_URL}
            alt="방과후 교실에서 기계를 다루며 배우는 청소년들"
          />
        </div>

        <div className={styles.outro}>
          <PFText as="p" typo="bd-lg-rg" color="white" className={styles.body}>
            이 때 자리 잡은 Learning by Doing, ‘직접 해보며 배우는 교육’은 지금까지도 JA의 체험형
            교육으로 이어지고 있습니다. 청소년은 팀을 이뤄 자신의 아이디어를 실제 행동으로 옮깁니다.
            <br />
            결과가 기대와 달라도 방법을 바꿔 다시 시도합니다. 이 과정에서 지식을 습득하는 것은 물론,
            도전하는 태도와 책임감, 회복력, 문제해결 능력을 함께 키웁니다.
          </PFText>
          <PFText as="p" typo="hl-lg" color="white" className={styles.emphasis}>
            직접 해보는 경험이{' '}
            <br className={styles.emphasisBreak} />
            스스로를 믿는 힘이 됩니다.
          </PFText>
        </div>
      </div>
    </section>
  )
}
