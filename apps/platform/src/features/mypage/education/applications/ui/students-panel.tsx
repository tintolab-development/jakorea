import { PFText } from '@/shared/ui'
import styles from './students-panel.module.css'

export type EducationStudentsPanelProps = {
  /** 포기 이후 회차 비노출용 — 현재 mock placeholder에서는 미사용 */
  lastParticipatedSession?: number
}

/** 교사회원 교육현황 — 학생 명단 탭 (목록 API 연동 전 placeholder) */
export function EducationStudentsPanel(_props: EducationStudentsPanelProps) {
  return (
    <div className={styles.panel}>
      <PFText as="h2" typo="hl-sm" color="black" className={styles.title}>
        학생 명단
      </PFText>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
        등록된 학생 명단이 없습니다.
      </PFText>
    </div>
  )
}
