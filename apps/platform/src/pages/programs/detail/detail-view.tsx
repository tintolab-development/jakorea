import {
  PROGRAM_TAB_LABEL,
  ProgramApplyButton,
  ProgramBackButton,
  ProgramInfoBody,
  ProgramPoster,
  ProgramStatusBadges,
  type ProgramDetail,
} from '@/features/program'
import { resolveGeminiProgramOperatingPeriodLabel } from '@/features/program/lib/gemini-program-period-label'
import { PFFileDownload, PFText } from '@/shared/ui'
import shell from '../program-page-shell.module.css'
import styles from './page.module.css'

type ProgramDetailViewProps = {
  program: ProgramDetail
  onBackToList: () => void
  onApply: () => void
  applyChecking?: boolean
}

/**
 * 참여하기 프로그램 상세 본문 — 실제 상세 페이지와 CMS 모집 미리보기 번들이 함께 쓴다.
 * 모바일(Figma 6772-30311)은 포스터 썸네일·첨부를 header 안에, 신청하기를 하단 고정 바로 보여 준다(CSS 전환).
 */
export function ProgramDetailView({
  program,
  onBackToList,
  onApply,
  applyChecking,
}: ProgramDetailViewProps) {
  return (
    <section className={[shell.page, styles.page].join(' ')}>
      <div className={shell.inner}>
        <div className={styles.back}>
          <ProgramBackButton label="목록으로" onClick={onBackToList} />
        </div>

        <ProgramInfoBody
          program={program}
          variant="participate"
          showApplyCta
          onApply={onApply}
          applyChecking={applyChecking}
          header={
            <header className={styles.header}>
              <ProgramPoster
                detailImageUrl={program.detailImageUrl}
                thumbnailUrl={program.thumbnailUrl}
                className={styles.posterThumb}
              />
              <div className={styles.headerMain}>
                {program.categories.length > 0 ? (
                  <div className={styles.categories}>
                    {program.categories.map(tab => (
                      <PFText
                        key={tab}
                        as="span"
                        typo="hl-sm"
                        color="black"
                        className={styles.categoryLabel}
                      >
                        {PROGRAM_TAB_LABEL[tab]}
                      </PFText>
                    ))}
                  </div>
                ) : null}
                <PFText as="h1" typo="hd-lg" color="black" className={styles.title}>
                  {program.title}
                </PFText>
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <PFText
                      as="span"
                      typo="bd-lg-rg"
                      color="neutral-cool-600"
                      className={styles.metaLabel}
                    >
                      프로그램 운영 기간
                    </PFText>
                    <PFText as="span" typo="hl-sm" color="black" className={styles.metaValue}>
                      {resolveGeminiProgramOperatingPeriodLabel(program)}
                    </PFText>
                  </div>
                  <div className={styles.metaItem}>
                    <PFText
                      as="span"
                      typo="bd-lg-rg"
                      color="neutral-cool-600"
                      className={styles.metaLabel}
                    >
                      후원사
                    </PFText>
                    <PFText as="span" typo="hl-sm" color="black" className={styles.metaValue}>
                      {program.sponsor}
                    </PFText>
                  </div>
                </div>
              </div>
              {/* 상세에서는 모집 역할(강사 등) 배지를 숨긴다 — 목록·마이페이지는 그대로 */}
              <div className={styles.badges}>
                <ProgramStatusBadges
                  size="regular"
                  recruitmentStatus={program.recruitmentStatus}
                  educationTargetLabel={program.educationTargetLabel}
                  educationForm={program.educationForm}
                  educationFormLabel={program.educationFormLabel}
                  className={styles.badgeList}
                />
              </div>
              {program.attachments.length > 0 ? (
                <ul className={styles.mobileAttachments}>
                  {program.attachments.map(attachment => (
                    <li key={attachment.name}>
                      <PFFileDownload
                        fileName={attachment.name}
                        href={attachment.url}
                        className={styles.mobileAttachment}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </header>
          }
        />
      </div>

      <div className={styles.mobileApplyBar}>
        <ProgramApplyButton
          applicationPeriodLabel={program.applicationPeriodLabel}
          onApply={onApply}
          applyChecking={applyChecking}
          className={styles.mobileApplyButton}
        />
      </div>
    </section>
  )
}
