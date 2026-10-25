import {
  PROGRAM_TAB_LABEL,
  ProgramBackButton,
  ProgramInfoBody,
  ProgramStatusBadges,
  type ProgramDetail,
} from '@/features/program'
import { PFText } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'

type ProgramDetailViewProps = {
  program: ProgramDetail
  onBackToList: () => void
  onApply: () => void
  applyChecking?: boolean
  applyBlockedReason?: string | null
}

/** 참여하기 프로그램 상세 본문 — 실제 상세 페이지와 CMS 모집 미리보기 번들이 함께 쓴다. */
export function ProgramDetailView({
  program,
  onBackToList,
  onApply,
  applyChecking,
  applyBlockedReason,
}: ProgramDetailViewProps) {
  return (
    <section className={[shell.page, styles.page].join(' ')}>
      <div className={shell.inner}>
        <div className={styles.back}>
          <ProgramBackButton label="목록으로" onClick={onBackToList} />
        </div>

        <ProgramInfoBody
          program={program}
          showApplyCta
          onApply={onApply}
          applyChecking={applyChecking}
          applyBlockedReason={applyBlockedReason}
          header={
            <header className={styles.header}>
              <div className={styles.headerMain}>
                {program.categories.length > 0 ? (
                  <div className={styles.categories}>
                    {program.categories.map(tab => (
                      <PFText key={tab} as="span" typo="hl-sm" color="black">
                        {PROGRAM_TAB_LABEL[tab]}
                      </PFText>
                    ))}
                  </div>
                ) : null}
                <PFText as="h1" typo="page-title" color="black" className={styles.title}>
                  {program.title}
                </PFText>
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                      프로그램 운영 기간
                    </PFText>
                    <PFText as="span" typo="hl-sm" color="black">
                      {program.operatingPeriodLabel}
                    </PFText>
                  </div>
                  <div className={styles.metaItem}>
                    <PFText as="span" typo="bd-lg-rg" color="neutral-cool-600">
                      후원사
                    </PFText>
                    <PFText as="span" typo="hl-sm" color="black">
                      {program.sponsor}
                    </PFText>
                  </div>
                </div>
              </div>
              <div className={styles.badges}>
                <ProgramStatusBadges
                  recruitmentStatus={program.recruitmentStatus}
                  educationTargetLabel={program.educationTargetLabel}
                  educationForm={program.educationForm}
                  educationFormLabel={program.educationFormLabel}
                  recruitmentRoleLabel={program.recruitmentRoleLabel}
                />
              </div>
            </header>
          }
        />
      </div>
    </section>
  )
}
