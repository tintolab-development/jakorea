import {
  getMockProgramById,
  getProgramIdFromPath,
  ProgramBackButton,
  ProgramStatusBadges,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
} from '@/features/program'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import downloadIconUrl from '@/shared/assets/icons/download.svg'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function ProgramDetailPage() {
  const programId = getProgramIdFromPath()
  const program = programId ? getMockProgramById(programId) : undefined
  const searchParams = new URLSearchParams(window.location.search)
  const fromPath = searchParams.get('from')

  if (!program) {
    return (
      <section className={styles.page}>
        <PFText as="p" typo="hd-md" color="black">
          프로그램을 찾을 수 없어요
        </PFText>
        <PFButton variant="secondary" onClick={() => window.location.assign(PROGRAMS_PATH)}>
          목록으로
        </PFButton>
      </section>
    )
  }

  const handleBackToList = () => {
    window.location.assign(fromPath ?? PROGRAMS_PATH)
  }

  const handleApply = () => {
    const applyPath = programApplyPath(program.id)
    if (!getDevAuthLoggedIn()) {
      window.location.assign(programApplyRequiredPath(program.id))
      return
    }

    window.location.assign(applyPath)
  }

  return (
    <section className={styles.page}>
      <div className={styles.back}>
        <ProgramBackButton label="목록으로" onClick={handleBackToList} />
      </div>

      <div className={styles.body}>
        <article className={styles.detail}>
          <header className={styles.header}>
            <div className={styles.headerMain}>
              <PFText as="span" typo="hl-sm" color="black">
                {program.categoryLabel}
              </PFText>
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
              />
            </div>
          </header>

          <p className={styles.summary}>
            <PFText as="span" typo="bd-lg-rg" color="black">
              {program.summary}
            </PFText>
          </p>

          <section className={styles.basicInfo}>
            <PFText as="h2" typo="hl-sm" color="black">
              기본정보
            </PFText>
            <div className={styles.infoFields}>
              <div className={styles.infoItem}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  사업 분야
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  {program.businessFieldLabel}
                </PFText>
              </div>
              <div className={styles.infoItem}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  교육 형태
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  {program.educationFormLabel}
                </PFText>
              </div>
              <div className={styles.infoItem}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  교육대상
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  {program.educationTargetGroupLabel}
                </PFText>
              </div>
              <div className={styles.infoItem}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  교육 대상 상세
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  {program.educationTargetDetailLabel}
                </PFText>
              </div>
              <div className={styles.infoItem}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  교육 장소
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  {program.educationVenueLabel}
                </PFText>
              </div>
            </div>
            {program.sessions.length > 0 ? (
              <ul className={styles.sessions}>
                {program.sessions.map(session => (
                  <li key={`${session.sessionLabel}-${session.title}`} className={styles.session}>
                    <PFText as="p" typo="bd-md-sb" color="black" className={styles.sessionTitle}>
                      <span className={styles.sessionLabel}>{session.sessionLabel}</span>{' '}
                      {session.title}
                    </PFText>
                    <PFText as="p" typo="bd-md-rg" color="black">
                      {session.description}
                    </PFText>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section className={styles.detailContent}>
            <PFText as="h2" typo="hl-sm" color="black">
              세부내용
            </PFText>

            <div className={styles.detailContentBody}>
              <div className={styles.recruitmentCard}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  {program.recruitmentPhaseGroupLabel}
                </PFText>
                <div className={styles.recruitmentList}>
                  {program.recruitmentPhases.map(phase => (
                    <div key={phase.label} className={styles.infoBlock}>
                      <PFText as="span" typo="bd-md-sb" color="black">
                        {phase.label}
                      </PFText>
                      <PFText as="span" typo="bd-md-md" color="black">
                        {phase.value}
                      </PFText>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.schedules}>
                {program.educationSchedules.map(schedule => (
                  <div key={schedule.label} className={styles.scheduleCard}>
                    <PFText as="span" typo="bd-md-sb" color="black">
                      {schedule.label}
                    </PFText>
                    <PFText as="span" typo="bd-md-md" color="black">
                      {schedule.value}
                    </PFText>
                  </div>
                ))}
              </div>

              <div className={styles.extraSections}>
                {program.extraSections.map(section => (
                  <section key={section.title} className={styles.extraSection}>
                    <PFText as="h3" typo="bd-sm-rg" color="neutral-cool-600">
                      {section.title}
                    </PFText>
                    <PFText as="p" typo="bd-md-md" color="black" className={styles.extraSectionBody}>
                      {section.body}
                    </PFText>
                  </section>
                ))}
              </div>

              <div className={styles.applicationMethod}>
                <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
                  {program.applicationMethodLabel}
                </PFText>
                <PFText as="span" typo="bd-lg-sb" color="black">
                  {program.applicationMethodValue}
                </PFText>
              </div>
            </div>
          </section>
        </article>

        <aside className={styles.media}>
          <div className={styles.banner}>
            <img className={styles.bannerImage} src={program.thumbnailUrl} alt="" />
          </div>

          <button
            type="button"
            className={styles.applyButton}
            disabled={!program.isRecruiting}
            onClick={handleApply}
          >
            <span className={styles.applyCopy}>
              <PFText as="span" typo="bd-lg-sb" color="white">
                신청하기
              </PFText>
              <PFText as="span" typo="bd-sm-rg" color="white">
                {program.applicationPeriodLabel}
              </PFText>
            </span>
            <img
              className={styles.applyArrow}
              src={arrowRightWhite16Url}
              alt=""
              width={16}
              height={16}
            />
          </button>

          {program.attachments.length > 0 ? (
            <ul className={styles.attachments}>
              {program.attachments.map(attachment => (
                <li key={attachment.name}>
                  <a className={styles.attachment} href={attachment.url} download>
                    <span className={`typo-bd-sm-md ${styles.attachmentName}`}>{attachment.name}</span>
                    <img
                      className={styles.attachmentIcon}
                      src={downloadIconUrl}
                      alt=""
                      width={16}
                      height={16}
                    />
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </aside>
      </div>
    </section>
  )
}
