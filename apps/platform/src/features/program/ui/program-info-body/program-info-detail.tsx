import type { ReactNode } from 'react'
import { RichTextViewer } from '@/shared/rich-text'
import { PFText } from '@/shared/ui'
import type { ProgramDetail, ProgramEventSchedule, ProgramSession } from '../../model/types'
import { isHtmlContent } from '../../lib/html-body'
import { ProgramInfoPeriodSponsor } from './program-info-period-sponsor'
import styles from './program-info-body.module.css'

type ProgramInfoDetailProps = {
  program: ProgramDetail
  /** 참여하기 상세 header 등 — article 상단에 슬롯 */
  header?: ReactNode
  /** 교육·봉사현황 상세처럼 참여하기 header를 쓰지 않을 때 운영 기간·후원사 노출 */
  showPeriodSponsor?: boolean
  className?: string
}

function progressMetaLines(
  row: Pick<
    ProgramSession,
    | 'educationFormLabel'
    | 'participationMethodLabel'
    | 'assignmentPeriod'
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
  ].filter((line): line is { label: string; value: string } => line != null)
}

function ProgressMeta({
  row,
}: {
  row: Pick<
    ProgramSession | ProgramEventSchedule,
    'educationFormLabel' | 'participationMethodLabel' | 'assignmentPeriod'
  >
}) {
  const lines = progressMetaLines(row)
  if (lines.length === 0) return null
  return (
    <div className={styles.sessionMeta}>
      {lines.map(line => (
        <PFText key={line.label} as="p" typo="bd-sm-rg" color="neutral-cool-600">
          {line.label} {line.value}
        </PFText>
      ))}
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

function curriculumSessionTitle(program: ProgramDetail, title: string): string {
  const value = title.trim()
  if (!value || program.educationStructure !== 'curriculum' || program.sessionRound !== 'multi') {
    return value
  }

  const sessionNumber = value.replace(/차시\s*$/, '').trim()
  return sessionNumber ? `${sessionNumber}차시` : ''
}

export function ProgramInfoDetail({
  program,
  header,
  showPeriodSponsor = false,
  className,
}: ProgramInfoDetailProps) {
  const basicInfoFields = resolveBasicInfoFields(program)
  const hasCurriculumBlock = program.sessions.length > 0 || program.eventSchedules.length > 0
  const hasBasicInfoSection = basicInfoFields.length > 0 || hasCurriculumBlock
  const applicationMethodValue = program.applicationMethodValue.trim()
  const geminiTrainingRequestPeriodLabel =
    program.detailCase === 'gemini' ? (program.geminiTrainingRequestPeriodLabel ?? '').trim() : ''
  const hasDetailContent =
    program.recruitmentPhases.length > 0 ||
    Boolean(geminiTrainingRequestPeriodLabel) ||
    program.educationSchedules.length > 0 ||
    program.extraSections.length > 0 ||
    Boolean(program.contactValue.trim())

  const articleClassName = [styles.detail, className].filter(Boolean).join(' ')

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
                  <PFText as="span" typo="bd-md-md" color="black">
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
                  const sessionTitle = curriculumSessionTitle(program, session.title)
                  return (
                    <li key={`${session.sessionLabel}-${session.title}`} className={styles.session}>
                      <PFText as="p" typo="bd-md-sb" color="black" className={styles.sessionTitle}>
                        <span className={styles.sessionLabel}>{session.sessionLabel}</span>
                        {sessionTitle ? ` ${sessionTitle}` : ''}
                      </PFText>
                      {session.dateLabel ? (
                        <PFText as="p" typo="bd-sm-rg" color="neutral-cool-600">
                          {session.dateLabel}
                        </PFText>
                      ) : null}
                      {session.description.trim() ? (
                        <PFText as="p" typo="bd-md-rg" color="black">
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

          {program.eventSchedules.length > 0 ? (
            <div className={styles.curriculumBlock}>
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
                    <ProgressMeta row={event} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {hasDetailContent ? (
        <section className={styles.detailContent}>
          <PFText as="h2" typo="hl-sm" color="black">
            세부내용
          </PFText>

          <div className={styles.detailContentBody}>
            {program.recruitmentPhases.length > 0 || geminiTrainingRequestPeriodLabel ? (
              <div className={styles.recruitmentCard}>
                <PFText as="span" typo="bd-sm-rg" color="neutral-cool-600">
                  {program.recruitmentPhaseGroupLabel}
                </PFText>
                {program.recruitmentPhases.length > 0 ? (
                  <div className={styles.recruitmentList}>
                    {program.recruitmentPhases.map((phase, index) => (
                      <div key={`${phase.label}-${index}`} className={styles.infoBlock}>
                        <PFText as="span" typo="bd-md-sb" color="black">
                          {phase.label}
                        </PFText>
                        <PFText as="span" typo="bd-md-md" color="black">
                          {phase.value}
                        </PFText>
                      </div>
                    ))}
                  </div>
                ) : null}
                {geminiTrainingRequestPeriodLabel ? (
                  <div className={styles.infoBlock}>
                    <PFText as="span" typo="bd-md-sb" color="black">
                      연수 요청 가능 기간
                    </PFText>
                    <PFText as="span" typo="bd-md-md" color="black">
                      {geminiTrainingRequestPeriodLabel}
                    </PFText>
                  </div>
                ) : null}
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
                        className={styles.extraSectionBody}
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
                <PFText as="span" typo="bd-md-md" color="black">
                  {program.contactValue}
                </PFText>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {applicationMethodValue ? (
        <div className={styles.applicationMethod}>
          <PFText as="span" typo="bd-md-md" color="neutral-cool-600">
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
            <PFText as="span" typo="bd-lg-sb" color="black">
              {applicationMethodValue}
            </PFText>
          )}
        </div>
      ) : null}
    </article>
  )
}
