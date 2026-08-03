import {
  getProgramIdFromPath,
  ProgramBackButton,
  ProgramStatusBadges,
  programApplyPath,
  programApplyRequiredPath,
  PROGRAMS_PATH,
  useMockProgramById,
} from '@/features/program'
import { downloadProgramAttachment } from '@/features/program/lib/attachment-download'
import arrowRightWhite16Url from '@/shared/assets/icons/arrow-right-white-16.svg'
import downloadIconUrl from '@/shared/assets/icons/download.svg'
import { getDevAuthLoggedIn } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './page.module.css'

export function ProgramDetailPage() {
  const programId = getProgramIdFromPath()
  const { program, isLoading } = useMockProgramById(programId)
  const searchParams = new URLSearchParams(window.location.search)
  const fromPath = searchParams.get('from')

  if (isLoading && !program) {
    return null
  }

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

  /** 상세는 고해상 우선, 없으면 목록용 썸네일 폴백 */
  const detailBannerUrl =
    program.detailImageUrl?.trim() || program.thumbnailUrl?.trim() || ''
  const hasDetailImage = Boolean(detailBannerUrl)

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
                recruitmentRoleLabel={program.recruitmentRoleLabel}
              />
            </div>
          </header>

          {/* 소개 문구가 없어도 배지↔기본정보 간 동일 간격 영역을 유지 */}
          <div className={styles.summary}>
            {program.summary.trim() ? (
              <PFText as="p" typo="bd-lg-rg" color="black" className={styles.summaryText}>
                {program.summary}
              </PFText>
            ) : null}
          </div>

          <section className={styles.basicInfo}>
            <PFText as="h2" typo="hl-sm" color="black">
              기본정보
            </PFText>
            <div className={styles.infoFields}>
              {(program.basicInfoFields.length > 0
                ? program.basicInfoFields
                : [
                    { label: '사업 분야', value: program.businessFieldLabel },
                    { label: '교육 형태', value: program.educationFormLabel },
                    { label: '교육대상', value: program.educationTargetGroupLabel },
                    {
                      label: '교육 대상 상세',
                      value: program.educationTargetDetailLabel,
                    },
                    { label: '교육 장소', value: program.educationVenueLabel },
                  ]
              ).map(field => (
                <div key={field.label} className={styles.infoItem}>
                  <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                    {field.label}
                  </PFText>
                  <PFText as="span" typo="bd-md-md" color="black">
                    {field.value}
                  </PFText>
                </div>
              ))}
            </div>
            {program.sessions.length > 0 ? (
              <ul className={styles.sessions}>
                {program.sessions.map(session => (
                  <li key={`${session.sessionLabel}-${session.title}`} className={styles.session}>
                    <PFText as="p" typo="bd-md-sb" color="black" className={styles.sessionTitle}>
                      <span className={styles.sessionLabel}>{session.sessionLabel}</span>{' '}
                      {session.title}
                    </PFText>
                    {session.dateLabel ? (
                      <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                        {session.dateLabel}
                      </PFText>
                    ) : null}
                    <PFText as="p" typo="bd-md-rg" color="black">
                      {session.description}
                    </PFText>
                  </li>
                ))}
              </ul>
            ) : null}
            {program.eventSchedules.length > 0 ? (
              <ul className={styles.sessions} aria-label="행사·세부 일정">
                {program.eventSchedules.map(event => (
                  <li
                    key={`${event.scheduleLabel}-${event.name}-${event.dateLabel}`}
                    className={styles.session}
                  >
                    <PFText as="p" typo="bd-md-sb" color="black" className={styles.sessionTitle}>
                      <span className={styles.sessionLabel}>{event.scheduleLabel}</span>
                      {event.name ? ` ${event.name}` : ''}
                    </PFText>
                    {event.dateLabel && event.dateLabel !== '-' ? (
                      <PFText as="p" typo="bd-md-rg" color="black">
                        {event.dateLabel}
                      </PFText>
                    ) : null}
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
              {program.recruitmentPhases.length > 0 ? (
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
              ) : null}

              {program.educationSchedules.length > 0 ? (
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
              ) : null}

              {program.extraSections.length > 0 ? (
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
              ) : null}

              {program.applicationMethodValue.trim() ? (
                <div className={styles.applicationMethod}>
                  <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
                    {program.applicationMethodLabel}
                  </PFText>
                  <PFText as="span" typo="bd-lg-sb" color="black">
                    {program.applicationMethodValue}
                  </PFText>
                </div>
              ) : null}
            </div>
          </section>
        </article>

        <aside className={styles.media}>
          <div
            className={[
              styles.banner,
              hasDetailImage ? styles.bannerHasImage : styles.bannerNoImage,
            ].join(' ')}
          >
            {hasDetailImage ? (
              <img className={styles.bannerImage} src={detailBannerUrl} alt="" />
            ) : null}
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
                  <a
                    className={styles.attachment}
                    href={attachment.url}
                    download={attachment.name}
                    onClick={event => {
                      event.preventDefault()
                      downloadProgramAttachment(attachment.name, attachment.url)
                    }}
                  >
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
