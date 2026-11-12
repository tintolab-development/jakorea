import { Fragment, type ReactNode } from 'react'
import { RichTextViewer } from '@/shared/rich-text'
import { PFText } from '@/shared/ui'
import type { ProgramDetail, ProgramEventSchedule, ProgramSession } from '../../model/types'
import { isHtmlContent } from '../../lib/html-body'
import { curriculumSessionTitle } from '../../lib/curriculum-session-title'
import type { ProgramInfoVariant } from './program-info-aside'
import { ProgramInfoPeriodSponsor } from './program-info-period-sponsor'
import styles from './program-info-body.module.css'
// 라벨 | 값 세로 구분선 — 마이페이지 신청 내역 `PipeSeparatedInlineText`와 같은 클래스 재사용
import pipeStyles from '@/features/mypage/education/applications/ui/pipe-separated-inline-text.module.css'

type ProgramInfoDetailProps = {
  program: ProgramDetail
  /** 참여하기 상세 header 등 — article 상단에 슬롯 */
  header?: ReactNode
  /** 교육·봉사현황 상세처럼 참여하기 header를 쓰지 않을 때 운영 기간·후원사 노출 */
  showPeriodSponsor?: boolean
  /** `participate`: 참여하기 상세 Figma(11001-199634 / 6772-30311) 전용 스타일 */
  variant?: ProgramInfoVariant
  className?: string
}

/** 매퍼가 `이름, Tel : …, E-mail : …`로 합친 문의처를 항목별로 나눈다 (Tel/E-mail 접두 앞 쉼표만). */
function splitContactParts(value: string): string[] {
  return value
    .split(/,\s*(?=(?:Tel|E-mail) : )/)
    .map(part => part.trim())
    .filter(Boolean)
}

function progressMetaLines(
  row: Pick<
    ProgramSession,
    | 'educationFormLabel'
    | 'participationMethodLabel'
    | 'assignmentPeriod'
    | 'educationPlaceLabel'
  >
) {
  return [
    row.educationFormLabel?.trim()
      ? { label: '교육 형태', value: row.educationFormLabel.trim() }
      : null,
    row.participationMethodLabel?.trim()
      ? { label: '참여 방식', value: row.participationMethodLabel.trim() }
      : null,
    row.assignmentPeriod?.trim()
      ? { label: '과제 기간', value: row.assignmentPeriod.trim() }
      : null,
    row.educationPlaceLabel?.trim()
      ? { label: '교육 장소', value: row.educationPlaceLabel.trim(), divided: true }
      : null,
  ].filter(
    (line): line is { label: string; value: string; divided?: boolean } => line != null
  )
}

function ProgressMeta({
  row,
}: {
  row: Pick<
    ProgramSession | ProgramEventSchedule,
    'educationFormLabel' | 'participationMethodLabel' | 'assignmentPeriod' | 'educationPlaceLabel'
  >
}) {
  const lines = progressMetaLines(row)
  if (lines.length === 0) return null
  return (
    <div className={styles.sessionMeta}>
      {lines.map(line =>
        line.divided ? (
          <PFText
            key={line.label}
            as="p"
            typo="bd-sm-rg"
            color="neutral-cool-600"
            className={`${pipeStyles.root} ${styles.sessionMetaDivided}`}
          >
            <span>{line.label}</span>
            <span className={pipeStyles.divider} aria-hidden="true" />
            <span>{line.value}</span>
          </PFText>
        ) : (
          <PFText key={line.label} as="p" typo="bd-sm-rg" color="neutral-cool-600">
            {line.label} {line.value}
          </PFText>
        )
      )}
    </div>
  )
}

function resolveBasicInfoFields(program: ProgramDetail) {
  const fields =
    program.basicInfoFields.length > 0
      ? program.basicInfoFields
      : [
          { label: '사업 분야', value: program.businessFieldLabel },
          { label: '교육 형태', value: program.educationFormLabel },
          { label: '교육 대상', value: program.educationTargetGroupLabel },
          { label: '교육 대상 상세', value: program.educationTargetDetailLabel },
          { label: '교육 장소', value: program.educationVenueLabel },
        ]

  return fields.filter(field => field.value.trim().length > 0)
}

function EventScheduleList({ events }: { events: readonly ProgramEventSchedule[] }) {
  if (events.length === 0) return null
  return (
    <div className={styles.curriculumBlock}>
      <ul className={styles.sessions} aria-label="행사·세부 일정">
        {events.map(event => (
          <li
            key={`${event.scheduleLabel}-${event.name}-${event.dateLabel}`}
            className={styles.session}
          >
            <PFText
              as="p"
              typo="bd-md-sb"
              color="black"
              className={`${styles.sessionTitle} ${styles.fieldValue}`}
            >
              <span className={styles.sessionLabel}>{event.scheduleLabel}</span>
              {event.name ? <span>{` ${event.name}`}</span> : null}
            </PFText>
            {event.dateLabel && event.dateLabel !== '-' ? (
              <PFText as="p" typo="bd-md-rg" color="black" className={styles.fieldValue}>
                {event.dateLabel}
              </PFText>
            ) : null}
            <ProgressMeta row={event} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ProgramInfoDetail({
  program,
  header,
  showPeriodSponsor = false,
  variant = 'default',
  className,
}: ProgramInfoDetailProps) {
  const isParticipate = variant === 'participate'
  const basicInfoFields = resolveBasicInfoFields(program)
  const showUjatTermSchedulesInDetail =
    program.detailCase === 'ujat-participant' || program.detailCase === 'ujat-volunteer'
  const hasCurriculumBlock =
    program.sessions.length > 0 ||
    (!showUjatTermSchedulesInDetail && program.eventSchedules.length > 0)
  const hasBasicInfoSection = basicInfoFields.length > 0 || hasCurriculumBlock
  const applicationMethodValue = program.applicationMethodValue.trim()
  const hasDetailContent =
    program.recruitmentPhases.length > 0 ||
    program.educationSchedules.length > 0 ||
    program.extraSections.length > 0 ||
    Boolean(program.contactValue.trim()) ||
    Boolean(applicationMethodValue) ||
    (showUjatTermSchedulesInDetail && program.eventSchedules.length > 0)

  const contactParts = isParticipate ? splitContactParts(program.contactValue) : []

  const articleClassName = [styles.detail, isParticipate ? styles.participate : null, className]
    .filter(Boolean)
    .join(' ')

  return (
    <article className={articleClassName}>
      {header}
      {showPeriodSponsor ? <ProgramInfoPeriodSponsor program={program} /> : null}

      {program.summary.trim() ? (
        <div className={styles.summary}>
          <PFText as="p" typo="bd-lg-rg" color="black" className={styles.summaryText}>
            {program.summary}
          </PFText>
        </div>
      ) : null}

      {hasBasicInfoSection ? (
        <section className={styles.basicInfo}>
          <PFText as="h2" typo="hl-sm" color="black">
            기본정보
          </PFText>
          {basicInfoFields.length > 0 ? (
            <div className={styles.infoFields}>
              {basicInfoFields.map(field => (
                <div key={field.label} className={styles.infoItem}>
                  <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                    {field.label}
                  </PFText>
                  <PFText as="span" typo="bd-md-md" color="black" className={styles.fieldValue}>
                    {field.value}
                  </PFText>
                </div>
              ))}
            </div>
          ) : null}

          {program.sessions.length > 0 ? (
            <div className={styles.curriculumBlock}>
              <ul className={styles.sessions}>
                {program.sessions.map(session => {
                  const sessionTitle = curriculumSessionTitle(program, session)
                  return (
                    <li key={`${session.sessionLabel}-${session.title}`} className={styles.session}>
                      <PFText
                        as="p"
                        typo="bd-md-sb"
                        color="black"
                        className={`${styles.sessionTitle} ${styles.fieldValue}`}
                      >
                        <span className={styles.sessionLabel}>{session.sessionLabel}</span>
                        {sessionTitle ? <span>{` ${sessionTitle}`}</span> : null}
                      </PFText>
                      {session.dateLabel ? (
                        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                          {session.dateLabel}
                        </PFText>
                      ) : null}
                      {session.description.trim() ? (
                        <PFText
                          as="p"
                          typo={isParticipate ? 'bd-md-md' : 'bd-md-rg'}
                          color="black"
                          className={styles.fieldValue}
                        >
                          {session.description}
                        </PFText>
                      ) : null}
                      <ProgressMeta row={session} />
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {!showUjatTermSchedulesInDetail ? (
            <EventScheduleList events={program.eventSchedules} />
          ) : null}
        </section>
      ) : null}

      {hasDetailContent ? (
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
                  {program.recruitmentPhases.map((phase, index) => (
                    <div key={`${phase.label}-${index}`} className={styles.infoBlock}>
                      <PFText as="span" typo="bd-md-sb" color="black" className={styles.fieldValue}>
                        {phase.label}
                      </PFText>
                      <PFText as="span" typo="bd-md-md" color="black" className={styles.fieldValue}>
                        {phase.value}
                      </PFText>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {showUjatTermSchedulesInDetail ? (
              <EventScheduleList events={program.eventSchedules} />
            ) : null}

            {program.educationSchedules.length > 0 ? (
              <div className={styles.schedules}>
                {program.educationSchedules.map(schedule => (
                  <div key={schedule.label} className={styles.scheduleCard}>
                    <PFText as="span" typo="bd-md-sb" color="black" className={styles.fieldValue}>
                      {schedule.label}
                    </PFText>
                    <PFText as="span" typo="bd-md-md" color="black" className={styles.fieldValue}>
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
                    {section.bodyFormat === 'html' ? (
                      <RichTextViewer
                        content={section.body}
                        contentFormat="html"
                        maxHeight="none"
                        className={styles.extraSectionRichText}
                      />
                    ) : (
                      <PFText
                        as="p"
                        typo="bd-md-md"
                        color="black"
                        className={`${styles.extraSectionBody} ${styles.fieldValue}`}
                      >
                        {section.body}
                      </PFText>
                    )}
                  </section>
                ))}
              </div>
            ) : null}

            {program.contactValue.trim() ? (
              <div className={styles.contact}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  문의처
                </PFText>
                {contactParts.length > 1 ? (
                  <PFText
                    as="span"
                    typo="bd-md-md"
                    color="black"
                    className={`${styles.contactParts} ${styles.fieldValue}`}
                  >
                    {contactParts.map((part, index) => (
                      <Fragment key={`${index}-${part}`}>
                        {index > 0 ? <span className={styles.contactDivider}>, </span> : null}
                        <span>{part}</span>
                      </Fragment>
                    ))}
                  </PFText>
                ) : (
                  <PFText as="span" typo="bd-md-md" color="black" className={styles.fieldValue}>
                    {program.contactValue}
                  </PFText>
                )}
              </div>
            ) : null}

            {applicationMethodValue ? (
              <div className={styles.applicationMethod}>
                <PFText
                  as="span"
                  typo="bd-md-md"
                  color="neutral-cool-600"
                  className={styles.applicationMethodLabel}
                >
                  {program.applicationMethodLabel}
                </PFText>
                {isHtmlContent(applicationMethodValue) ? (
                  <RichTextViewer
                    content={applicationMethodValue}
                    contentFormat="html"
                    maxHeight="none"
                    className={styles.extraSectionRichText}
                  />
                ) : (
                  <PFText
                    as="span"
                    typo="bd-lg-sb"
                    color="black"
                    className={`${styles.applicationMethodValue} ${styles.fieldValue}`}
                  >
                    {applicationMethodValue}
                  </PFText>
                )}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </article>
  )
}
