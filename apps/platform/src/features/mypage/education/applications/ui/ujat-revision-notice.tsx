import { PFText } from '@/shared/ui'
import styles from './ujat-revision-notice.module.css'

export const UJAT_REVISION_NOTICE_HEADLINE =
  '작성된 내용에 수정사항이 있어요. 수정사항을 확인하고 내용을 보완해 다시 신청해 주세요.'

type UjatRevisionNoticeProps = {
  reason?: string | null
}

export function UjatRevisionNotice({ reason }: UjatRevisionNoticeProps) {
  const display = reason?.trim() || '-'

  return (
    <aside className={styles.notice} aria-label="수정사항 안내">
      <PFText as="p" typo="hl-sm" color="black" className={styles.headline}>
        {UJAT_REVISION_NOTICE_HEADLINE}
      </PFText>
      <div className={styles.reason}>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.reasonLabel}>
          수정사항
        </PFText>
        <PFText as="p" typo="bd-md-md" color="black" className={styles.reasonBody}>
          {display}
        </PFText>
      </div>
    </aside>
  )
}
