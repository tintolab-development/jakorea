import { useNavigate } from 'react-router-dom'
import { PFButton, PFText } from '@/shared/ui'
import { HISTORY_CTA_PRIMARY, HISTORY_CTA_SECONDARY } from '../lib/constants'
import { CTA_PHOTO_URL } from '../lib/mock-data'
import styles from './cta-section.module.css'

export function CtaSection() {
  const navigate = useNavigate()

  return (
    <section className={styles.section} aria-labelledby="history-cta-title">
      <div className={styles.copy}>
        <PFText as="h2" id="history-cta-title" typo="page-title-sm" color="black" className={styles.title}>
          청소년이 가진
          <br />
          무한한 잠재력을 믿습니다
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="neutral-cool-700" className={styles.body}>
          JA Korea는 앞으로도 청소년이 실제 삶과 연결된 교육을 통해 스스로 선택하고 도전할 수
          있도록 돕겠습니다. 학교, 기업, 강사, 봉사자, 지역사회 등 다양한 교육 파트너와 협력해 더
          많은 청소년에게 배움의 기회를 전하겠습니다.
        </PFText>
      </div>

      <div className={styles.media}>
        <img
          className={styles.photo}
          src={CTA_PHOTO_URL}
          alt="함께 웃고 있는 여러 명의 어린이"
        />
      </div>

      <div className={styles.actions}>
        <PFButton
          size="xlarge"
          variant="primary"
          className={styles.button}
          onClick={() => navigate(HISTORY_CTA_PRIMARY.href)}
        >
          {HISTORY_CTA_PRIMARY.label}
        </PFButton>
        <PFButton
          size="xlarge"
          variant="secondary"
          className={styles.button}
          onClick={() => navigate(HISTORY_CTA_SECONDARY.href)}
        >
          {HISTORY_CTA_SECONDARY.label}
        </PFButton>
      </div>
    </section>
  )
}
