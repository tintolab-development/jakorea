import {
  EDUCATION_TEACHER_DELIVERY_STATUS_LABEL,
  type EducationTeacherAssignmentTextbook,
} from '../../model/types'
import openBookIconUrl from '@/shared/assets/icons/open-book.svg'
import { PFText } from '@/shared/ui'
import styles from './textbook-info-card.module.css'

export type TeacherTextbookInfoCardProps = {
  textbook: EducationTeacherAssignmentTextbook
}

export function TeacherTextbookInfoCard({ textbook }: TeacherTextbookInfoCardProps) {
  const deliveryLabel = EDUCATION_TEACHER_DELIVERY_STATUS_LABEL[textbook.deliveryStatus]

  return (
    <div className={styles.card}>
      <div className={styles.main}>
        <img
          className={styles.icon}
          src={openBookIconUrl}
          alt=""
          width={30}
          height={30}
          aria-hidden="true"
        />
        <div className={styles.copy}>
          <PFText as="span" typo="bd-lg-sb" color="primary-800" className={styles.title}>
            {textbook.title}
          </PFText>
          <span className={styles.qty}>
            <PFText as="span" typo="bd-sm-md" color="neutral-warm-500" className={styles.kit}>
              {textbook.kitCountLabel}
            </PFText>
            <PFText as="span" typo="bd-sm-md" className={styles.volume}>
              {textbook.volumeCountLabel}
            </PFText>
          </span>
        </div>
      </div>
      <PFText as="span" typo="bd-sm-sb" color="white" className={styles.deliveryTag}>
        {deliveryLabel}
      </PFText>
    </div>
  )
}
